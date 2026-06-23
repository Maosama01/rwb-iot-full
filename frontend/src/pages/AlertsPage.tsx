import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Filter, Settings, CheckCircle } from 'lucide-react';
import { api } from '../api/client';
import { useDevices } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import ThresholdSettingsModal from '../components/ThresholdSettingsModal';

export default function AlertsPage() {
  const { selectedDevice } = useDevices();
  const { success, error } = useToast();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [severity, setSeverity] = useState('');
  const [metric, setMetric] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const limit = 20;

  const fetchAlerts = async () => {
    if (!selectedDevice) return;
    setLoading(true);
    try {
      const data = await api.listAlerts(selectedDevice.id, {
        limit,
        offset,
        severity: severity || undefined,
        metric: metric || undefined,
      });
      setAlerts(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedDevice, offset, severity, metric]);

  const handleAcknowledge = async (alertId: string) => {
    if (!selectedDevice) return;
    try {
      await api.acknowledgeAlert(selectedDevice.id, alertId);
      success('Alert acknowledged');
      // Refresh the list slightly to update the acknowledged status
      setAlerts((prev) => 
        prev.map(a => a.id === alertId ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() } : a)
      );
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      error('Failed to acknowledge alert');
    }
  };

  if (!selectedDevice) {
    return (
      <div className="organic-card p-16 text-center flex flex-col items-center justify-center border-dashed border-2 animate-fade-in">
        <div className="p-6 bg-background rounded-full text-text-muted mb-6">
          <Bell size={48} strokeWidth={1.5} />
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-2">No Device Selected</h3>
        <p className="text-text-secondary max-w-md mx-auto">Select a device from the Dashboard to view its alert history.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-text-primary tracking-tight mb-2 flex items-center gap-3">
            Alert History <Bell className="text-alert" size={32} />
          </h1>
          <p className="text-text-secondary font-medium">{selectedDevice.display_name} — {total} total recorded events</p>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="btn btn-secondary flex items-center gap-2 bg-white"
        >
          <Settings size={18} className="text-primary" />
          Alert Settings
        </button>
      </div>

      {/* Filters */}
      <div className="organic-card p-4 mb-6 flex flex-wrap items-center gap-4 bg-background/50 border-none">
        <div className="flex items-center gap-2 text-text-secondary font-semibold pl-2">
          <Filter size={18} /> Filters
        </div>
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 max-w-[200px]">
            <select
              className="input-field py-2"
              value={severity}
              onChange={(e) => { setSeverity(e.target.value); setOffset(0); }}
            >
              <option value="">All Severities</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div className="flex-1 max-w-[200px]">
            <select
              className="input-field py-2"
              value={metric}
              onChange={(e) => { setMetric(e.target.value); setOffset(0); }}
            >
              <option value="">All Metrics</option>
              <option value="temperature_c">Temperature</option>
              <option value="humidity_pct">Humidity</option>
              <option value="ph_level">pH</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="organic-card overflow-hidden">
        {loading ? (
          <div className="p-8 flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-background rounded-xl animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <AlertTriangle size={48} className="text-text-muted/30 mb-4" strokeWidth={1.5} />
            <p className="text-text-secondary font-medium">No alerts found matching your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-secondary">Severity</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-secondary">Metric</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-secondary">Value</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-secondary">Threshold</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-secondary">Message</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-secondary">Time</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-secondary text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-background/50 transition-colors">
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${a.severity === 'CRITICAL' ? 'bg-alert/10 text-alert-dark' : 'bg-[#f59e0b]/10 text-[#f59e0b]'}`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="p-4 text-text-primary font-medium">{a.metric.replace('_c', '').replace('_pct', '').replace('_ppm', '').replace('_', ' ')}</td>
                    <td className="p-4 text-text-primary font-mono">{Number(a.value).toFixed(1)}</td>
                    <td className="p-4 text-text-muted font-mono">{Number(a.threshold).toFixed(1)}</td>
                    <td className="p-4 text-text-secondary text-sm">{a.message}</td>
                    <td className="p-4 text-text-muted text-sm whitespace-nowrap">{format(new Date(a.created_at), 'MMM d, HH:mm')}</td>
                    <td className="p-4 text-right">
                      {a.acknowledged ? (
                        <div className="flex items-center justify-end gap-1 text-emerald font-medium text-xs">
                          <CheckCircle size={14} />
                          Ack'd
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleAcknowledge(a.id)}
                          className="px-3 py-1 bg-background hover:bg-border rounded-lg text-xs font-medium text-text-primary transition-colors border border-border"
                        >
                          Acknowledge
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="p-4 bg-background border-t border-border flex items-center justify-between">
            <button
              className="btn btn-secondary px-4 py-2 text-sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              Previous
            </button>
            <span className="text-sm font-medium text-text-secondary">
              Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
            </span>
            <button
              className="btn btn-secondary px-4 py-2 text-sm"
              disabled={offset + limit >= total}
              onClick={() => setOffset(offset + limit)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ThresholdSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        deviceId={selectedDevice.id}
      />
    </div>
  );
}
