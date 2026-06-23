import { useState, useEffect } from 'react';
import { Settings, Save, UserPlus, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { useDevices } from '../context/DeviceContext';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';

export default function DeviceSettingsPage() {
  const { selectedDevice } = useDevices();
  const { error, success } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [shareEmail, setShareEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // Threshold form state
  const [tempMax, setTempMax] = useState('');
  const [tempMin, setTempMin] = useState('');
  const [humMin, setHumMin] = useState('');
  const [humMax, setHumMax] = useState('');
  const [phMin, setPhMin] = useState('');
  const [phMax, setPhMax] = useState('');

  useEffect(() => {
    if (!selectedDevice) return;
    fetchSettings();
  }, [selectedDevice]);

  const fetchSettings = async () => {
    if (!selectedDevice) return;
    try {
      const [cfg, mem] = await Promise.all([
        api.getDeviceConfig(selectedDevice.id),
        api.listMembers(selectedDevice.id),
      ]);
      setMembers(mem);
      setTempMax(cfg.temperature_c_max ?? '');
      setTempMin(cfg.temperature_c_min ?? '');
      setHumMin(cfg.humidity_pct_min ?? '');
      setHumMax(cfg.humidity_pct_max ?? '');
      setPhMin(cfg.ph_min ?? '');
      setPhMax(cfg.ph_max ?? '');
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    setSaving(true);
    try {
      await api.updateDeviceConfig(selectedDevice.id, {
        temperature_c_max: parseFloat(tempMax) || null,
        temperature_c_min: parseFloat(tempMin) || null,
        humidity_pct_min: parseFloat(humMin) || null,
        humidity_pct_max: parseFloat(humMax) || null,
        ph_min: parseFloat(phMin) || null,
        ph_max: parseFloat(phMax) || null,
      });
      success('Thresholds saved successfully!');
    } catch (err: any) {
      error(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!shareEmail || !selectedDevice) return;
    setSharing(true);
    try {
      const updated = await api.shareDevice(selectedDevice.id, shareEmail);
      setMembers(updated);
      setShareEmail('');
      success('Device shared successfully!');
    } catch (err: any) {
      error(err.message);
    } finally {
      setSharing(false);
    }
  };

  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveMember = async (userId: string) => {
    if (!selectedDevice) return;
    setRemovingId(userId);
    try {
      await api.removeMember(selectedDevice.id, userId);
      setMembers(members.filter((m) => m.user_id !== userId));
      success('Member removed successfully.');
    } catch (err: any) {
      error(err.message);
    } finally {
      setRemovingId(null);
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
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} />
                {saving ? 'Saving…' : 'Save Thresholds'}
              </button>
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
              <button className="btn btn-primary py-2 px-4 text-sm disabled:opacity-50" onClick={handleShare} disabled={sharing}>
                <UserPlus size={16} /> {sharing ? 'Sharing...' : 'Share'}
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
                      className="p-2 text-text-muted hover:text-alert hover:bg-alert/10 rounded-xl transition-colors disabled:opacity-50"
                      onClick={() => setConfirmRemoveId(m.user_id)}
                      title={`Remove ${m.display_name}`}
                      disabled={removingId === m.user_id}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Firmware OTA Updates Card */}
          <FirmwareUpdateCard />
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmRemoveId}
        onClose={() => setConfirmRemoveId(null)}
        onConfirm={() => {
          if (confirmRemoveId) handleRemoveMember(confirmRemoveId);
        }}
        title="Remove Member"
        message="Are you sure you want to revoke this user's access to the device?"
        confirmText="Remove Access"
      />
    </div>
  );
}

function FirmwareUpdateCard() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'updating' | 'success'>('idle');
  const [progress, setProgress] = useState(0);

  const handleCheck = () => {
    setStatus('checking');
    setTimeout(() => {
      setStatus('available');
    }, 2000);
  };

  const handleUpdate = () => {
    setStatus('updating');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('success');
          return 100;
        }
        return prev + 10;
      });
    }, 400);
  };

  return (
    <div className="organic-card p-8 bg-gradient-to-br from-[#0B251C] to-[#0A1A14] text-white border-none relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-50%] left-[-20%] w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none"></div>
      
      <div className="relative z-10">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
          <Settings size={20} className="text-[#34D399]" /> Firmware & OTA
        </h2>

        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-[#A7F3D0]/70 text-xs uppercase tracking-widest font-bold mb-1">Current Version</p>
            <p className="text-2xl font-extrabold tracking-tight">DEMO-1.0.0</p>
          </div>
          <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white border border-white/10">
            Stable
          </div>
        </div>

        {status === 'idle' && (
          <button onClick={handleCheck} className="w-full py-3 bg-white text-[#0B251C] font-bold rounded-xl hover:bg-gray-100 transition-colors">
            Check for Updates
          </button>
        )}

        {status === 'checking' && (
          <div className="flex items-center justify-center py-3">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
            <span className="font-bold text-[#A7F3D0]">Checking servers...</span>
          </div>
        )}

        {status === 'available' && (
          <div className="animate-fade-in-up">
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl mb-4">
              <p className="font-bold text-white mb-1">Update Available: DEMO-1.0.1</p>
              <p className="text-xs text-[#A7F3D0]/80">Includes improved PID tuning for fan control and general stability fixes.</p>
            </div>
            <button onClick={handleUpdate} className="w-full py-3 bg-[#34D399] text-[#0B251C] font-bold rounded-xl hover:bg-[#10B981] transition-colors shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              Download & Install
            </button>
          </div>
        )}

        {status === 'updating' && (
          <div className="animate-fade-in">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-[#A7F3D0]">Flashing Firmware...</span>
              <span className="text-white">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-to-r from-[#34D399] to-[#10B981] rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-xs text-white/50 mt-4 text-center">Do not power off your Rawbin.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center animate-fade-in-up py-4">
            <div className="w-12 h-12 bg-[#34D399]/20 rounded-full flex items-center justify-center mb-3 text-[#34D399]">
              <Shield size={24} />
            </div>
            <p className="font-bold text-white text-lg">Update Complete!</p>
            <p className="text-xs text-[#A7F3D0]/70 text-center">Your Rawbin is now running DEMO-1.0.1.</p>
          </div>
        )}
      </div>
    </div>
  );
}
