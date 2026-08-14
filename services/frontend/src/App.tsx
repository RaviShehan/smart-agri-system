import { useEffect, useState } from 'react';
import axios from 'axios';
import { Sprout, Droplets, Thermometer, RefreshCw, Cpu, Activity } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface CropZone {
  id: string;
  name: string;
  cropType: string;
  devices: Device[];
}

interface Telemetry {
  moisture: number;
  temperature: number;
  timestamp: string;
}

export default function App() {
  const [cropZones, setCropZones] = useState<CropZone[]>([]);
  const [telemetryMap, setTelemetryMap] = useState<Record<string, Telemetry>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // 1. Fetch Crop Zones and their attached devices
      const zoneRes = await axios.get('http://localhost:4000/api/crop-zones');
      const zones: CropZone[] = zoneRes.data;
      setCropZones(zones);

      // 2. Fetch Latest Telemetry for each device
      const telemetryData: Record<string, Telemetry> = {};
      for (const zone of zones) {
        for (const device of zone.devices) {
          try {
            const telemRes = await axios.get(`http://localhost:4000/api/telemetry/${device.id}/latest`);
            if (telemRes.data) {
              telemetryData[device.id] = telemRes.data;
            }
          } catch (err) {
            console.error(`Telemetry missing for device ${device.id}`);
          }
        }
      }
      setTelemetryMap(telemetryData);
    } catch (error) {
      console.error('Error connecting to backend API', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh dashboard telemetry every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <header className="flex items-center justify-between pb-8 mb-8 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Sprout className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide">Smart Agri Telemetry Dashboard</h1>
            <p className="text-slate-400 text-sm">Real-time IoT Sensor Monitoring Platform</p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Sync Data
        </button>
      </header>

      {/* Main Content Grid */}
      {cropZones.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-800">
          <Activity className="w-12 h-12 mx-auto text-slate-600 mb-4 animate-pulse" />
          <p className="text-slate-400">Fetching crop zones from backend service...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cropZones.map((zone) => (
            <div key={zone.id} className="bg-slate-800/40 rounded-2xl border border-slate-800 p-6 backdrop-blur">
              {/* Zone Info */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">{zone.name}</h2>
                  <span className="inline-block mt-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
                    Crop: {zone.cropType}
                  </span>
                </div>
              </div>

              {/* Connected Devices */}
              <div className="space-y-4">
                {zone.devices.map((device) => {
                  const telem = telemetryMap[device.id];
                  const isMoistureLow = telem && telem.moisture < 40;

                  return (
                    <div key={device.id} className="bg-slate-900/60 rounded-xl p-5 border border-slate-800/80">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-slate-300 font-medium">
                          <Cpu className="w-4 h-4 text-emerald-400" />
                          <span>{device.name}</span>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-md">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Online
                        </span>
                      </div>

                      {/* Sensor Metrics */}
                      {telem ? (
                        <div className="grid grid-cols-2 gap-4">
                          {/* Soil Moisture */}
                          <div className={`p-4 rounded-lg border ${isMoistureLow ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-slate-800/60 border-slate-700/50 text-sky-400'}`}>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
                              <Droplets className="w-4 h-4 text-sky-400" />
                              Soil Moisture
                            </div>
                            <div className="text-2xl font-bold text-white">{telem.moisture}%</div>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                              {isMoistureLow ? '⚠️ Low Moisture Alert' : '✅ Optimal Range'}
                            </span>
                          </div>

                          {/* Temperature */}
                          <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/50 text-rose-400">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
                              <Thermometer className="w-4 h-4 text-rose-400" />
                              Ambient Temp
                            </div>
                            <div className="text-2xl font-bold text-white">{telem.temperature} °C</div>
                            <span className="text-[11px] text-slate-400 mt-1 block">Live Stream</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 py-2">Waiting for telemetry stream...</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}