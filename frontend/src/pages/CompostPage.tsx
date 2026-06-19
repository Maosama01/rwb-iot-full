import { useState, useEffect } from 'react';
import { Leaf, Plus, Archive, Scale } from 'lucide-react';
import { api } from '../api/client';
import { useDevices } from '../context/DeviceContext';
import { format } from 'date-fns';
import { useToast } from '../context/ToastContext';

const WASTE_TYPES = ['food_scraps', 'yard_waste', 'paper', 'sawdust', 'manure', 'other'];

export default function CompostPage() {
  const { selectedDevice } = useDevices();
  const { error } = useToast();
  const [cycles, setCycles] = useState<any[]>([]);
  const [wasteLogs, setWasteLogs] = useState<any[]>([]);
  const [showNewCycle, setShowNewCycle] = useState(false);
  const [showWasteForm, setShowWasteForm] = useState(false);
  
  const [cycleLabel, setCycleLabel] = useState('');
  const [cycleNotes, setCycleNotes] = useState('');
  const [wasteType, setWasteType] = useState('food_scraps');
  const [wasteWeight, setWasteWeight] = useState('');
  const [wasteNotes, setWasteNotes] = useState('');
  const [isSubmittingCycle, setIsSubmittingCycle] = useState(false);
  const [isSubmittingWaste, setIsSubmittingWaste] = useState(false);

  useEffect(() => {
    if (!selectedDevice) return;
    fetchData();
  }, [selectedDevice]);

  const fetchData = async () => {
    try {
      const [c, w] = await Promise.all([
        api.listCycles(selectedDevice.device_id),
        api.listWasteLogs(selectedDevice.device_id),
      ]);
      setCycles(c);
      setWasteLogs(w.items || []);
    } catch (err) {
      console.error('Failed to fetch compost data:', err);
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCycle(true);
    try {
      await api.createCycle(selectedDevice.device_id, { label: cycleLabel, notes: cycleNotes });
      setCycleLabel('');
      setCycleNotes('');
      setShowNewCycle(false);
      fetchData();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmittingCycle(false);
    }
  };

  const handleCompleteCycle = async (cycleId: string) => {
    setIsSubmittingCycle(true);
    try {
      await api.updateCycle(cycleId, { status: 'completed' });
      fetchData();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmittingCycle(false);
    }
  };

  const handleCureCycle = async (cycleId: string) => {
    setIsSubmittingCycle(true);
    try {
      await api.updateCycle(cycleId, { status: 'curing' });
      fetchData();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmittingCycle(false);
    }
  };

  const handleAddWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingWaste(true);
    try {
      await api.createWasteLog(selectedDevice.device_id, {
        waste_type: wasteType,
        weight_kg: parseFloat(wasteWeight) || null,
        notes: wasteNotes || null,
      });
      setWasteWeight('');
      setWasteNotes('');
      setShowWasteForm(false);
      fetchData();
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSubmittingWaste(false);
    }
  };

  if (!selectedDevice) {
    return (
      <div className="organic-card p-16 text-center flex flex-col items-center justify-center border-dashed border-2 animate-fade-in">
        <div className="p-6 bg-background rounded-full text-text-muted mb-6">
          <Leaf size={48} strokeWidth={1.5} />
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-2">No Device Selected</h3>
        <p className="text-text-secondary max-w-md mx-auto">Select a device from the Dashboard to manage compost cycles.</p>
      </div>
    );
  }

  const activeCycle = cycles.find((c) => c.status === 'active');
  const pastCycles = cycles.filter((c) => c.status !== 'active');

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary tracking-tight mb-2 flex items-center gap-3">
          Compost Analytics <Leaf className="text-primary-dark" size={32} />
        </h1>
        <p className="text-text-secondary font-medium">Manage active cycles and log waste for {selectedDevice.display_name}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cycles Column */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Leaf size={20} className="text-emerald" /> Active Cycles
            </h2>
            {!activeCycle && (
              <button className="btn btn-primary btn-sm px-4 py-2" onClick={() => setShowNewCycle(true)}>
                <Plus size={16} /> New Cycle
              </button>
            )}
          </div>

          {showNewCycle && (
            <form className="organic-card p-6 animate-fade-in-up" onSubmit={handleCreateCycle}>
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary text-xs font-bold uppercase tracking-wider pl-1">Batch Name</label>
                  <input className="input-field py-2.5" placeholder="e.g. Summer Batch #3" value={cycleLabel} onChange={(e) => setCycleLabel(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary text-xs font-bold uppercase tracking-wider pl-1">Notes</label>
                  <input className="input-field py-2.5" placeholder="Optional notes" value={cycleNotes} onChange={(e) => setCycleNotes(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={isSubmittingCycle} className="btn btn-primary py-2 px-6">
                  {isSubmittingCycle ? 'Starting...' : 'Start Cycle'}
                </button>
                <button type="button" disabled={isSubmittingCycle} className="btn btn-secondary py-2 px-6 bg-white" onClick={() => setShowNewCycle(false)}>Cancel</button>
              </div>
            </form>
          )}

          {activeCycle && (
            <div className="organic-card p-6 bg-gradient-to-r from-emerald/10 to-transparent border-emerald/20 animate-fade-in-up">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald/20 rounded-xl text-emerald-dark">
                    <Leaf size={20} />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-emerald/20 text-emerald-dark border border-emerald/30">
                    ACTIVE
                  </span>
                </div>
                <div className="flex gap-2">
                  <button disabled={isSubmittingCycle} className="btn btn-secondary bg-white px-3 py-1.5 text-sm disabled:opacity-50" onClick={() => handleCureCycle(activeCycle.id)}>Move to Curing</button>
                  <button disabled={isSubmittingCycle} className="btn btn-primary px-3 py-1.5 text-sm disabled:opacity-50" onClick={() => handleCompleteCycle(activeCycle.id)}>Complete</button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-1">{activeCycle.label || 'Untitled Batch'}</h3>
              <p className="text-text-secondary text-sm font-medium mb-3">Started {format(new Date(activeCycle.started_at), 'MMM d, yyyy')}</p>
              {activeCycle.notes && <p className="text-text-muted text-sm bg-white/50 p-3 rounded-xl">{activeCycle.notes}</p>}
            </div>
          )}

          {pastCycles.length > 0 && (
            <div className="flex flex-col gap-4 mt-4">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider pl-1">Past Cycles</h3>
              {pastCycles.map((c) => (
                <div key={c.id} className="organic-card p-5 flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-background rounded-xl text-text-muted group-hover:text-primary transition-colors">
                      <Archive size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary">{c.label || 'Untitled'}</h4>
                      <p className="text-text-secondary text-xs font-medium">
                        {format(new Date(c.started_at), 'MMM d')}
                        {c.ended_at && ` — ${format(new Date(c.ended_at), 'MMM d, yyyy')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${c.status === 'curing' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 'bg-background text-text-muted border border-border'}`}>
                      {c.status.toUpperCase()}
                    </span>
                    {c.status === 'curing' && (
                      <button disabled={isSubmittingCycle} className="btn btn-primary px-3 py-1.5 text-xs disabled:opacity-50" onClick={() => handleCompleteCycle(c.id)}>
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Waste Logs Column */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Scale size={20} className="text-primary-dark" /> Waste Logs
            </h2>
            <button className="btn btn-secondary bg-white px-4 py-2 text-sm border border-border" onClick={() => setShowWasteForm(true)}>
              <Plus size={16} /> Log Waste
            </button>
          </div>

          {showWasteForm && (
            <form className="organic-card p-6 animate-fade-in-up" onSubmit={handleAddWaste}>
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary text-xs font-bold uppercase tracking-wider pl-1">Waste Type</label>
                  <select className="input-field py-2.5 capitalize" value={wasteType} onChange={(e) => setWasteType(e.target.value)}>
                    {WASTE_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary text-xs font-bold uppercase tracking-wider pl-1">Weight (kg)</label>
                  <input type="number" step="0.1" className="input-field py-2.5" placeholder="e.g. 2.5" value={wasteWeight} onChange={(e) => setWasteWeight(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary text-xs font-bold uppercase tracking-wider pl-1">Notes</label>
                  <input className="input-field py-2.5" placeholder="Optional" value={wasteNotes} onChange={(e) => setWasteNotes(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={isSubmittingWaste} className="btn btn-primary py-2 px-6">
                  {isSubmittingWaste ? 'Adding...' : 'Add Log'}
                </button>
                <button type="button" disabled={isSubmittingWaste} className="btn btn-secondary py-2 px-6 bg-white" onClick={() => setShowWasteForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          {wasteLogs.length === 0 ? (
            <div className="organic-card p-12 text-center flex flex-col items-center justify-center">
              <Scale size={32} className="text-text-muted/30 mb-3" strokeWidth={1.5} />
              <p className="text-text-secondary font-medium">No waste logged yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {wasteLogs.map((w) => (
                <div key={w.id} className="organic-card p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold tracking-wider bg-primary/10 text-primary-dark uppercase">
                        {w.waste_type.replace('_', ' ')}
                      </span>
                      <span className="text-text-muted text-xs font-medium">{format(new Date(w.logged_at), 'MMM d, HH:mm')}</span>
                    </div>
                    {w.notes && <p className="text-text-secondary text-sm mt-2">{w.notes}</p>}
                  </div>
                  {w.weight_kg && (
                    <div className="text-right">
                      <span className="text-2xl font-bold text-text-primary">{w.weight_kg}</span>
                      <span className="text-text-muted font-medium ml-1">kg</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
