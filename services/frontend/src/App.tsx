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

  const CRITICAL_MOISTURE_THRESHOLD = 45;
  const currentMoisture = telemetryHistory.length > 0 ? telemetryHistory[telemetryHistory.length - 1].moisture : null;
  const currentTemp = telemetryHistory.length > 0 ? telemetryHistory[telemetryHistory.length - 1].temperature : null;
  const isLowMoisture = currentMoisture !== null && currentMoisture < CRITICAL_MOISTURE_THRESHOLD;

  // Fetch Crop Zones
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
  }, []);

  // Live Chart Data Updates
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // If pump is active, simulate increasing moisture levels
      const newMoisture = pumpActive 
        ? Math.floor(Math.random() * (75 - 60 + 1)) + 60 
        : Math.floor(Math.random() * (60 - 35 + 1)) + 35;

      const newTemp = Math.floor(Math.random() * (32 - 22 + 1)) + 22;

      setTelemetryHistory((prev) => [
        ...prev.slice(-14),
        { timestamp: now, moisture: newMoisture, temperature: newTemp },
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, [pumpActive]);

  // Handle Pump Action
  const handleTogglePump = () => {
    if (!pumpActive) {
      setPumpActive(true);
      setPumpMessage('Water pump activated! Injecting moisture...');
      setTimeout(() => setPumpMessage(''), 5000);
    } else {
      setPumpActive(false);
      setPumpMessage('Water pump deactivated.');
      setTimeout(() => setPumpMessage(''), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-emerald-400 flex items-center gap-2">
            Smart Agri Telemetry Dashboard
          </h1>
          <p className="text-slate-400 text-sm">Real-time IoT Sensor Monitoring Platform</p>
        </div>
        
        {/* Current Metrics Summary */}
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
                Current moisture is <span className="font-bold">{currentMoisture}%</span> (Below critical threshold of {CRITICAL_MOISTURE_THRESHOLD}%). Immediate action required.
              </p>
            </div>
            <button
              onClick={handleTogglePump}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-lg shadow transition duration-200"
            >
              Start Irrigation Pump
            </button>
          </div>
        )}

        {/* Pump Active Status Card */}
        {pumpActive && (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 p-5 rounded-xl shadow-lg flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-emerald-400">Irrigation System Active</h3>
              <p className="text-sm text-emerald-300/80">
                Pump is running and restoring optimal soil hydration levels.
              </p>
            </div>
            <button
              onClick={handleTogglePump}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-lg shadow transition duration-200"
            >
              Stop Pump
            </button>
          </div>
        )}

        {/* Status Toast */}
        {pumpMessage && (
          <div className="bg-blue-900/90 border border-blue-700 text-blue-200 px-4 py-2 rounded-lg text-sm transition">
            {pumpMessage}
          </div>
        )}

        {/* Telemetry Chart Section */}
        <TelemetryChart data={telemetryHistory} />

        {/* Crop Zones List */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-200">Active Crop Zones</h2>
          {loading ? (
            <p className="text-slate-400">Fetching crop zones from backend service...</p>
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
