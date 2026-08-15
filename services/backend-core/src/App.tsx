import React, { useEffect, useState } from 'react';
import { TelemetryChart } from './components/TelemetryChart';

interface CropZone {
  id: string;
  name: string;
  cropType: string;
}

interface TelemetryPoint {
  timestamp: string;
  moisture: number;
  temperature: number;
}

export default function App() {
  const [zones, setZones] = useState<CropZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [pumpActive, setPumpActive] = useState(false);
  const [pumpMessage, setPumpMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const CRITICAL_MOISTURE_THRESHOLD = 45;
  const currentMoisture = telemetryHistory.length > 0 ? telemetryHistory[telemetryHistory.length - 1].moisture : null;
  const currentTemp = telemetryHistory.length > 0 ? telemetryHistory[telemetryHistory.length - 1].temperature : null;
  const isLowMoisture = currentMoisture !== null && currentMoisture < CRITICAL_MOISTURE_THRESHOLD;

  // Fetch initial pump status and crop zones
  useEffect(() => {
    fetch('http://localhost:4000/api/crop-zones')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const uniqueZones = data.filter(
            (zone, index, self) => index === self.findIndex((z) => z.name === zone.name)
          );
          setZones(uniqueZones);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('http://localhost:4000/api/pump/status')
      .then((res) => res.json())
      .then((data) => setPumpActive(data.active))
      .catch((err) => console.error('Error fetching pump status:', err));
  }, []);

  // SSE Stream
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8000/api/telemetry/stream');

    eventSource.onmessage = (event) => {
      const newPoint: TelemetryPoint = JSON.parse(event.data);
      setTelemetryHistory((prev) => [...prev.slice(-14), newPoint]);
    };

    return () => eventSource.close();
  }, []);

  // Handle Relay Control POST Request
  const handleTogglePump = async (targetState: boolean) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/pump/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: targetState }),
      });

      const data = await res.json();
      if (data.success) {
        setPumpActive(data.pumpStatus.active);
        setPumpMessage(
          targetState
            ? 'HTTP POST 200: Relay signal sent! Water pump activated.'
            : 'HTTP POST 200: Relay signal sent! Water pump deactivated.'
        );
        setTimeout(() => setPumpMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to command pump relay:', err);
      setPumpMessage('Error sending relay signal to Backend Core.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-emerald-400 flex items-center gap-2">
            Smart Agri Telemetry Dashboard
          </h1>
          <p className="text-slate-400 text-sm">Real-time IoT Sensor Monitoring & Control Platform</p>
        </div>
        
        {currentMoisture !== null && (
          <div className="flex gap-4 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm">
            <div>
              <span className="text-slate-400">Moisture: </span>
              <span className={currentMoisture < CRITICAL_MOISTURE_THRESHOLD ? "text-red-400 font-bold" : "text-blue-400 font-bold"}>
                {currentMoisture}%
              </span>
            </div>
            <div>
              <span className="text-slate-400">Temp: </span>
              <span className="text-orange-400 font-bold">{currentTemp}°C</span>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {/* Dynamic Alert Banner */}
        {isLowMoisture && !pumpActive && (
          <div className="bg-red-950/80 border border-red-800 text-red-200 p-5 rounded-xl shadow-lg flex justify-between items-center animate-pulse">
            <div>
              <h3 className="text-lg font-bold text-red-400">CRITICAL: Low Soil Moisture Detected!</h3>
              <p className="text-sm text-red-300/80">
                Current moisture is <span className="font-bold">{currentMoisture}%</span> (Threshold: {CRITICAL_MOISTURE_THRESHOLD}%).
              </p>
            </div>
            <button
              disabled={isSubmitting}
              onClick={() => handleTogglePump(true)}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-lg shadow transition duration-200"
            >
              {isSubmitting ? 'Sending Request...' : 'Start Irrigation Pump'}
            </button>
          </div>
        )}

        {/* Pump Active Card */}
        {pumpActive && (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 p-5 rounded-xl shadow-lg flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-emerald-400">Irrigation System Active</h3>
              <p className="text-sm text-emerald-300/80">Hardware relay state: ON. Hydrating field...</p>
            </div>
            <button
              disabled={isSubmitting}
              onClick={() => handleTogglePump(false)}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-lg shadow transition duration-200"
            >
              {isSubmitting ? 'Sending Request...' : 'Stop Pump'}
            </button>
          </div>
        )}

        {/* Status Toast */}
        {pumpMessage && (
          <div className="bg-blue-900/90 border border-blue-700 text-blue-200 px-4 py-2 rounded-lg text-sm">
            {pumpMessage}
          </div>
        )}

        {/* Telemetry Chart */}
        <TelemetryChart data={telemetryHistory} />

        {/* Crop Zones List */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-200">Active Crop Zones</h2>
          {loading ? (
            <p className="text-slate-400">Loading crop zones...</p>
          ) : zones.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {zones.map((zone) => (
                <div key={zone.id} className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/50">
                  <h3 className="font-bold text-emerald-300">{zone.name}</h3>
                  <p className="text-xs text-slate-400">Crop: {zone.cropType}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No active crop zones found.</p>
          )}
        </section>
      </main>
    </div>
  );
}
