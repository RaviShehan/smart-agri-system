import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface TelemetryDataPoint {
  timestamp: string;
  moisture: number;
  temperature: number;
}

interface Props {
  data: TelemetryDataPoint[];
}

export const TelemetryChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
        Telemetry Trends (Moisture & Temperature)
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="timestamp" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.5rem',
                color: '#f8fafc',
              }}
            />
            <Area
              type="monotone"
              dataKey="moisture"
              name="Moisture (%)"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMoisture)"
            />
            <Area
              type="monotone"
              dataKey="temperature"
              name="Temp (°C)"
              stroke="#f97316"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTemp)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
