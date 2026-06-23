import { useState, useEffect } from 'react';
import { Settings, X, Save } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

interface ThresholdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
}

const DEFAULT_THRESHOLDS = {
  temperature_c_max: 65.0,
  temperature_c_min: 15.0,
  humidity_pct_min: 40.0,
  humidity_pct_max: 75.0,
  ph_min: 5.5,
  ph_max: 8.5,
};

export default function ThresholdSettingsModal({ isOpen, onClose, deviceId }: ThresholdSettingsModalProps) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    if (isOpen && deviceId) {
      loadConfig();
    }
  }, [isOpen, deviceId]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await api.getDeviceConfig(deviceId);
      setConfig(data);
    } catch (err) {
      console.error('Failed to load device config:', err);
      error('Failed to load threshold settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateDeviceConfig(deviceId, config);
      success('Alert thresholds updated successfully');
      onClose();
    } catch (err) {
      console.error('Failed to update config:', err);
      error('Failed to update threshold settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    const val = value === '' ? null : parseFloat(value);
    setConfig((prev: any) => ({ ...prev, [field]: val }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="organic-card w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border flex justify-between items-center bg-background/50">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Settings className="text-primary" /> Alert Threshold Settings
          </h2>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary hover:bg-border rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-text-secondary text-sm mb-6">
            Configure the specific thresholds that will trigger an alert for this device. 
            Leave a field blank to use the global system default.
          </p>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-background animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Temperature */}
              <div className="space-y-3">
                <h3 className="font-semibold text-text-primary border-b border-border pb-2">Temperature (°C)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Minimum</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="input-field" 
                      placeholder={`Default: ${DEFAULT_THRESHOLDS.temperature_c_min}`}
                      value={config.temperature_c_min ?? ''}
                      onChange={(e) => handleChange('temperature_c_min', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Maximum</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="input-field" 
                      placeholder={`Default: ${DEFAULT_THRESHOLDS.temperature_c_max}`}
                      value={config.temperature_c_max ?? ''}
                      onChange={(e) => handleChange('temperature_c_max', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Humidity */}
              <div className="space-y-3">
                <h3 className="font-semibold text-text-primary border-b border-border pb-2">Humidity (%)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Minimum</label>
                    <input 
                      type="number" 
                      step="1"
                      className="input-field" 
                      placeholder={`Default: ${DEFAULT_THRESHOLDS.humidity_pct_min}`}
                      value={config.humidity_pct_min ?? ''}
                      onChange={(e) => handleChange('humidity_pct_min', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Maximum</label>
                    <input 
                      type="number" 
                      step="1"
                      className="input-field" 
                      placeholder={`Default: ${DEFAULT_THRESHOLDS.humidity_pct_max}`}
                      value={config.humidity_pct_max ?? ''}
                      onChange={(e) => handleChange('humidity_pct_max', e.target.value)}
                    />
                  </div>
                </div>
              </div>



              {/* pH Level */}
              <div className="space-y-3">
                <h3 className="font-semibold text-text-primary border-b border-border pb-2">pH Level</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Minimum</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="input-field" 
                      placeholder={`Default: ${DEFAULT_THRESHOLDS.ph_min}`}
                      value={config.ph_min ?? ''}
                      onChange={(e) => handleChange('ph_min', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Maximum</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="input-field" 
                      placeholder={`Default: ${DEFAULT_THRESHOLDS.ph_max}`}
                      value={config.ph_max ?? ''}
                      onChange={(e) => handleChange('ph_max', e.target.value)}
                    />
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3 bg-background/50">
          <button 
            className="btn btn-secondary px-6" 
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary px-8 flex items-center gap-2" 
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
