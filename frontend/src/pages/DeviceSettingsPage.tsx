import { useState, useEffect } from 'react';
import { Settings, Save, UserPlus, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { useDevices } from '../context/DeviceContext';

export default function DeviceSettingsPage() {
  const { selectedDevice } = useDevices();
  const [config, setConfig] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [shareEmail, setShareEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Threshold form state
  const [tempMax, setTempMax] = useState('');
  const [tempMin, setTempMin] = useState('');
  const [co2Max, setCo2Max] = useState('');
  const [humMin, setHumMin] = useState('');
  const [humMax, setHumMax] = useState('');
  const [phMin, setPhMin] = useState('');
  const [phMax, setPhMax] = useState('');

  useEffect(() => {
    if (!selectedDevice) return;
    fetchSettings();
  }, [selectedDevice]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [cfg, mem] = await Promise.all([
        api.getDeviceConfig(selectedDevice.device_id),
        api.listMembers(selectedDevice.device_id),
      ]);
      setConfig(cfg);
      setMembers(mem);
      setTempMax(cfg.temperature_c_max ?? '');
      setTempMin(cfg.temperature_c_min ?? '');
      setCo2Max(cfg.co2_ppm_max ?? '');
      setHumMin(cfg.humidity_pct_min ?? '');
      setHumMax(cfg.humidity_pct_max ?? '');
      setPhMin(cfg.ph_min ?? '');
      setPhMax(cfg.ph_max ?? '');
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      await api.updateDeviceConfig(selectedDevice.device_id, {
        temperature_c_max: parseFloat(tempMax) || null,
        temperature_c_min: parseFloat(tempMin) || null,
        co2_ppm_max: parseFloat(co2Max) || null,
        humidity_pct_min: parseFloat(humMin) || null,
        humidity_pct_max: parseFloat(humMax) || null,
        ph_min: parseFloat(phMin) || null,
        ph_max: parseFloat(phMax) || null,
      });
      setSaveMsg('Thresholds saved!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!shareEmail) return;
    try {
      const updated = await api.shareDevice(selectedDevice.device_id, shareEmail);
      setMembers(updated);
      setShareEmail('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await api.removeMember(selectedDevice.device_id, userId);
      setMembers(members.filter((m) => m.user_id !== userId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!selectedDevice) {
    return (
      <div className="organic-card p-16 text-center flex flex-col items-center justify-center border-dashed border-2 animate-fade-in">
        <div className="p-6 bg-background rounded-full text-text-muted mb-6">
          <Settings size={48} strokeWidth={1.5} />
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-2">No Device Selected</h3>
        <p className="text-text-secondary max-w-md mx-auto">Select a device from the Dashboard first to configure its settings.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary tracking-tight mb-2 flex items-center gap-3">
          Device Settings <Settings className="text-primary-dark" size={32} />
        </h1>
        <p className="text-text-secondary font-medium">Configure hardware parameters and alerts for {selectedDevice.display_name}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-8">
          {/* Device Info Card */}
          <div className="organic-card p-8">
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <Settings size={20} className="text-primary-dark" /> Device Info
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-text-secondary font-medium text-sm">Hardware UID</span>
                <span className="text-text-primary font-mono text-sm bg-background px-3 py-1 rounded-lg border border-border">{selectedDevice.hardware_uid}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-text-secondary font-medium text-sm">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${selectedDevice.is_paired ? 'bg-emerald/10 text-emerald-dark' : 'bg-alert/10 text-alert-dark'}`}>
                  {selectedDevice.is_paired ? 'PAIRED' : 'UNPAIRED'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-text-secondary font-medium text-sm">Display Name</span>
                <span className="text-text-primary font-medium">{selectedDevice.display_name}</span>
              </div>
            </div>
          </div>

          {/* Thresholds Card */}
          <form className="organic-card p-8" onSubmit={handleSaveConfig}>
            <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-2">
              <AlertTriangle size={20} className="text-alert" /> Alert Thresholds
            </h2>
            <p className="text-text-secondary text-sm font-medium mb-6">Configure when the background workers should trigger mobile push notifications.</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Temp Min (°C)</label>
                <input type="number" step="0.1" className="input-field" value={tempMin} onChange={(e) => setTempMin(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Temp Max (°C)</label>
                <input type="number" step="0.1" className="input-field" value={tempMax} onChange={(e) => setTempMax(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Humidity Min (%)</label>
                <input type="number" step="0.1" className="input-field" value={humMin} onChange={(e) => setHumMin(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Humidity Max (%)</label>
                <input type="number" step="0.1" className="input-field" value={humMax} onChange={(e) => setHumMax(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary text-xs font-semibold uppercase tracking-wider">CO₂ Max (ppm)</label>
                <input type="number" step="1" className="input-field" value={co2Max} onChange={(e) => setCo2Max(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} />
                {saving ? 'Saving…' : 'Save Thresholds'}
              </button>
              {saveMsg && <span className={`text-sm font-medium ${saveMsg.includes('Error') ? 'text-alert' : 'text-emerald-dark'}`}>{saveMsg}</span>}
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-8">
          <div className="organic-card p-8">
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <Shield size={20} className="text-emerald" /> Device Access
            </h2>

            {/* Share form */}
            <div className="flex items-center gap-3 mb-6 bg-background p-2 rounded-2xl border border-border">
              <input
                type="email"
                className="flex-1 bg-transparent border-none focus:ring-0 px-3 text-sm text-text-primary outline-none"
                placeholder="Share with user@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
              <button className="btn btn-primary py-2 px-4 text-sm" onClick={handleShare}>
                <UserPlus size={16} /> Share
              </button>
            </div>

            {/* Member list */}
            <div className="flex flex-col gap-3">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-background transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald/10 text-emerald-dark flex items-center justify-center font-bold text-lg">
                      {m.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-text-primary font-medium text-sm leading-tight">{m.display_name}</p>
                      <p className="text-text-muted text-xs">{m.email || m.phone}</p>
                    </div>
                  </div>
                  {members.length > 1 && (
                    <button
                      className="p-2 text-text-muted hover:text-alert hover:bg-alert/10 rounded-xl transition-colors"
                      onClick={() => handleRemoveMember(m.user_id)}
                      title={`Remove ${m.display_name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
