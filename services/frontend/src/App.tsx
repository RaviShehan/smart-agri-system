import { useEffect, useState } from 'react';
import { TelemetryChart } from './components/TelemetryChart';

interface CropZone {
  id: string;
  name: string;
  cropType: string;
  moistureThreshold: number;
}

interface TelemetryPoint {
  timestamp: string;
  moisture: number;
  temperature: number;
}

interface AnalyticsPoint {
  date: string;
  avgMoisture: number;
  avgTemperature: number;
  totalReadings: number;
}

export default function App() {
  const [zones, setZones] = useState<CropZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsPoint[]>([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/crop-zones')
      .then((res) => {
        if (!res.ok) throw new Error(`Crop zones request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => setZones(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setZones([]);
      });
  }, []);

  useEffect(() => {
    const histUrl = selectedZoneId === 'all'
      ? 'http://localhost:4000/api/telemetry/history'
      : `http://localhost:4000/api/telemetry/history?zoneId=${selectedZoneId}`;

    fetch(histUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Telemetry history request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setTelemetryHistory(data.map((item: any) => ({
            timestamp: new Date(item.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            moisture: item.moisture,
            temperature: item.temperature
          })));
        } else {
          setTelemetryHistory([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setTelemetryHistory([]);
      });

    const analyticsUrl = selectedZoneId === 'all'
      ? 'http://localhost:4000/api/telemetry/analytics'
      : `http://localhost:4000/api/telemetry/analytics?zoneId=${selectedZoneId}`;

    fetch(analyticsUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Analytics request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => setAnalyticsData(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setAnalyticsData([]);
      });

    const streamUrl = selectedZoneId === 'all'
      ? 'http://localhost:8000/api/telemetry/stream'
      : `http://localhost:8000/api/telemetry/stream?zoneId=${selectedZoneId}`;
    const eventSource = new EventSource(streamUrl);
    eventSource.onmessage = (event) => {
      try {
        const point = JSON.parse(event.data);
        setTelemetryHistory((prev) => [...prev.slice(-14), point]);
      } catch (err) {
        console.error('SSE payload parse error', err);
      }
    };
    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [selectedZoneId]);

  const handleExportCSV = () => {
    const url = selectedZoneId === 'all'
      ? 'http://localhost:4000/api/telemetry/export-csv'
      : `http://localhost:4000/api/telemetry/export-csv?zoneId=${selectedZoneId}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-emerald-400">Smart Agri Telemetry Dashboard</h1>
          <p className="text-slate-400 text-sm">Real-Time Streams & Historical Analytics</p>
        </div>

        <div className="flex gap-4 items-center">
          <select
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-emerald-400 px-3 py-2 rounded-lg text-sm focus:outline-none"
          >
            <option value="all">All Crop Zones</option>
            {Array.isArray(zones) && zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            📥 Export CSV Report
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        <TelemetryChart data={telemetryHistory} />

        {/* Analytics Table */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-200">Daily Historical Aggregations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/80 text-emerald-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Avg Soil Moisture</th>
                  <th className="px-4 py-3">Avg Temperature</th>
                  <th className="px-4 py-3">Total Telemetry Samples</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(analyticsData) && analyticsData.length > 0 ? analyticsData.map((row) => (
                  <tr key={row.date} className="border-b border-slate-800 hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold">{row.date}</td>
                    <td className="px-4 py-3 text-blue-400 font-bold">{row.avgMoisture}%</td>
                    <td className="px-4 py-3 text-orange-400 font-bold">{row.avgTemperature}°C</td>
                    <td className="px-4 py-3 text-slate-400">{row.totalReadings} readings</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      Waiting for telemetry data...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
