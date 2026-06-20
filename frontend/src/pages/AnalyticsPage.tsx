import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { format } from 'date-fns';
import { api } from '../api/client';
import { useDevices } from '../context/DeviceContext';
import { Download, BarChart2, BrainCircuit } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';
import PredictiveInsightsCard from '../components/PredictiveInsightsCard';

const COLORS = ['#E27D60', '#8FBC8F', '#556B6B', '#2E8B57', '#C38D9E', '#E8A87C'];

export default function AnalyticsPage() {
  const { devices } = useDevices();
  const { success, error } = useToast();
  const [data, setData] = useState<{series: any[], devices: Record<string, string>} | null>(null);
  const [loading, setLoading] = useState(true);

  // Export form state
  const [exportDevice, setExportDevice] = useState<string>('');
  const [exportInterval, setExportInterval] = useState('hour');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (devices.length > 0 && !exportDevice) {
      setExportDevice(devices[0].id);
    }
  }, [devices]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const result = await api.getAnalyticsCompare();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExport = async () => {
    if (!exportDevice) return;
    setExporting(true);
    try {
      await api.exportTelemetry(exportDevice, exportInterval);
      success("Export downloaded successfully!");
    } catch (err) {
      console.error("Export failed", err);
      error("Export failed. Ensure data exists for this time range.");
    } finally {
      setExporting(false);
    }
  };

  const formatXAxisTick = (ts: string) => {
    if (!ts) return '';
    return format(new Date(ts), 'MMM d');
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-text-primary mb-2 flex items-center gap-3">
          <BarChart2 className="text-emerald-dark" size={32} />
          Advanced Analytics
        </h1>
        <p className="text-text-secondary font-medium">Compare telemetry across your fleet and export raw data.</p>
      </header>

      {/* Export Card */}
      <div className="organic-card p-6 border-border/50 animate-fade-in-up">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <Download size={20} className="text-emerald" />
          Export Telemetry Data
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-text-muted text-xs font-bold uppercase tracking-wider pl-1 mb-1 block">Device</label>
            <select 
              className="input-field py-2 w-full" 
              value={exportDevice} 
              onChange={e => setExportDevice(e.target.value)}
            >
              <option value="" disabled>Select a device</option>
              {devices.map(d => (
                <option key={d.id} value={d.id}>{d.name || 'Unnamed Device'}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="text-text-muted text-xs font-bold uppercase tracking-wider pl-1 mb-1 block">Interval</label>
            <select 
              className="input-field py-2 w-full" 
              value={exportInterval} 
              onChange={e => setExportInterval(e.target.value)}
            >
              <option value="raw">Raw (24h limit)</option>
              <option value="hour">Hourly (7d limit)</option>
              <option value="day">Daily (90d limit)</option>
            </select>
          </div>
          <button 
            onClick={handleExport} 
            disabled={exporting || !exportDevice}
            className="btn btn-primary py-2 px-6 h-[42px] whitespace-nowrap disabled:opacity-50 w-full sm:w-auto"
          >
            {exporting ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>
      </div>

      {/* Predictive Insights Card */}
      {exportDevice && (
        <PredictiveInsightsCard deviceId={exportDevice} />
      )}

      {/* Compare Chart */}
      <div className="organic-card p-6 border-border/50 h-[500px] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-lg font-bold text-text-primary mb-6">Cross-Device Temperature (°C)</h2>
        {loading ? (
          <Skeleton className="h-[350px] w-full" variant="rectangular" />
        ) : !data || !data.series.length ? (
          <div className="flex items-center justify-center h-[350px] text-text-muted border-2 border-dashed border-border rounded-2xl bg-background/50">
            No historical data available for comparison.
          </div>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grid-fade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--border-color)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--border-color)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="url(#grid-fade)" vertical={false} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="bucket" 
                  tickFormatter={formatXAxisTick}
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  labelFormatter={(ts) => format(new Date(ts as string), 'MMM d, yyyy')}
                  formatter={(value: any, name: string) => [Number(value).toFixed(1), data.devices[name] || name]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                
                {Object.keys(data.devices).map((deviceId, index) => (
                  <Line 
                    key={deviceId}
                    type="monotone" 
                    dataKey={deviceId} 
                    name={deviceId}
                    stroke={COLORS[index % COLORS.length]} 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
