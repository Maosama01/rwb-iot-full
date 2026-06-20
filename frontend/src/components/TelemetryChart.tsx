import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

const METRIC_CONFIG: Record<string, any> = {
  temperature: { key: 'temperature_c_avg', rawKey: 'temperature_c', color: '#E27D60', label: 'Temperature (°C)', yAxisId: 'left' },
  humidity: { key: 'humidity_pct_avg', rawKey: 'humidity_pct', color: '#8FBC8F', label: 'Humidity (%)', yAxisId: 'left' },
  co2: { key: 'co2_ppm_avg', rawKey: 'co2_ppm', color: '#556B6B', label: 'CO₂ (ppm)', yAxisId: 'right' },
  ph: { key: 'ph_level_avg', rawKey: 'ph_level', color: '#2E8B57', label: 'pH Level', yAxisId: 'left' },
};

function CustomTooltip({ active, payload, label, formatLabel }: any) {
  if (!active || !payload?.length) return null;
  const displayLabel = formatLabel ? formatLabel(label) : label;
  return (
    <div className="bg-white border border-border p-4 rounded-xl shadow-organic-md z-50">
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">{displayLabel}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-3 mb-1 last:mb-0">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
          <span className="text-text-secondary font-medium text-sm">{entry.name}:</span>
          <span className="text-text-primary font-bold text-sm">{Number(entry.value).toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

const TelemetryChart = ({ data = [], interval = 'hour', metrics = ['temperature', 'humidity'], height = 320 }: any) => {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted border-2 border-dashed border-border rounded-2xl bg-background/50">
        <p className="font-medium">No telemetry data available for this time range.</p>
      </div>
    );
  }

  const isRaw = interval === 'raw';
  const hasRightAxis = metrics.some((m: string) => METRIC_CONFIG[m]?.yAxisId === 'right');

  const chartData = data.map((point: any) => {
    const time = point.bucket || point.time;
    const entry: any = { timestamp: time };
    metrics.forEach((m: string) => {
      const cfg = METRIC_CONFIG[m];
      entry[cfg.label] = point[isRaw ? cfg.rawKey : cfg.key];
    });
    return entry;
  });

  const formatTooltipLabel = (ts: string) => {
    if (!ts) return '';
    if (interval === 'day') return format(new Date(ts), 'MMM d, yyyy');
    if (interval === 'hour') return format(new Date(ts), 'MMM d, HH:mm');
    return format(new Date(ts), 'HH:mm');
  };

  const formatXAxisTick = (ts: string) => {
    if (!ts) return '';
    if (interval === 'day') return format(new Date(ts), 'MMM d');
    if (interval === 'hour') return format(new Date(ts), 'MMM d, HH:mm');
    return format(new Date(ts), 'HH:mm');
  };

  return (
    <div className="w-full h-full animate-fade-in">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 8, right: hasRightAxis ? 8 : 24, left: -24, bottom: 0 }}>
          <defs>
            {metrics.map((m: string) => {
              const cfg = METRIC_CONFIG[m];
              return (
                <linearGradient key={m} id={`gradient-${m}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid stroke="rgba(47, 79, 79, 0.06)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxisTick}
            tick={{ fill: '#8F9B9B', fontSize: 11, fontWeight: 500 }}
            axisLine={{ stroke: 'rgba(47, 79, 79, 0.1)' }}
            tickLine={false}
            dy={10}
            minTickGap={60}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: '#8F9B9B', fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            dx={-10}
          />
          {hasRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#8F9B9B', fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dx={10}
            />
          )}
          <Tooltip content={<CustomTooltip formatLabel={formatTooltipLabel} />} />
          {metrics.map((m: string) => {
            const cfg = METRIC_CONFIG[m];
            return (
              <Area
                key={m}
                type="monotone"
                dataKey={cfg.label}
                yAxisId={cfg.yAxisId}
                stroke={cfg.color}
                strokeWidth={3}
                fill={`url(#gradient-${m})`}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: cfg.color }}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(TelemetryChart);
