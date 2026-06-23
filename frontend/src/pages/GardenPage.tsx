import { useState, useEffect } from 'react';
import { Flower, Sprout, Plus, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useDevices } from '../context/DeviceContext';
import { format } from 'date-fns';

export default function GardenPage() {
  const { selectedDevice } = useDevices();
  const { error, success } = useToast();
  
  const [plants, setPlants] = useState<any[]>([]);
  const [applications, setApplications] = useState<Record<string, any[]>>({});
  const [completedCycles, setCompletedCycles] = useState<any[]>([]);
  
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [newPlantName, setNewPlantName] = useState('');
  const [newPlantType, setNewPlantType] = useState('indoor');
  
  const [activePlantId, setActivePlantId] = useState<string | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [appAmount, setAppAmount] = useState('');
  const [appNotes, setAppNotes] = useState('');
  
  useEffect(() => {
    fetchPlants();
    if (selectedDevice) {
      fetchCompletedCycles();
    }
  }, [selectedDevice]);

  const fetchPlants = async () => {
    try {
      const data = await api.listPlants();
      setPlants(data);
      // Fetch applications for each plant
      const appMap: Record<string, any[]> = {};
      for (const p of data) {
        const apps = await api.request(`/plants/${p.id}/applications`);
        appMap[p.id] = apps;
      }
      setApplications(appMap);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompletedCycles = async () => {
    if (!selectedDevice) return;
    try {
      const data = await api.listCycles(selectedDevice.id, 'completed');
      setCompletedCycles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlantName) return;
    try {
      await api.createPlant({ name: newPlantName, plant_type: newPlantType });
      success('Plant added to your garden!');
      setNewPlantName('');
      setShowAddPlant(false);
      fetchPlants();
    } catch (err: any) {
      error(err.message || 'Failed to add plant');
    }
  };

  const handleApplyCompost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlantId) return;
    try {
      await api.applyCompost(activePlantId, {
        compost_cycle_id: selectedCycleId || undefined,
        amount_kg: parseFloat(appAmount) || undefined,
        notes: appNotes || undefined,
      });
      success('Compost applied successfully!');
      setActivePlantId(null);
      setAppAmount('');
      setAppNotes('');
      setSelectedCycleId('');
      fetchPlants();
    } catch (err: any) {
      error(err.message || 'Failed to apply compost');
    }
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-compost-900 tracking-tight mb-2 flex items-center gap-3">
          My Garden <Flower className="text-leaf-600" size={32} />
        </h1>
        <p className="text-compost-500 font-medium">Track where your Rawbin compost goes and watch your garden thrive.</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold text-compost-900">Your Plants</h2>
        <button 
          onClick={() => setShowAddPlant(!showAddPlant)}
          className="btn btn-primary px-4 py-2 flex items-center gap-2"
        >
          <Plus size={18} /> Add Plant
        </button>
      </div>

      {showAddPlant && (
        <form onSubmit={handleAddPlant} className="organic-card p-6 mb-8 bg-cream-50">
          <h3 className="text-lg font-bold text-compost-900 mb-4">Add a New Plant</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-compost-500 text-xs font-bold uppercase tracking-wider pl-1">Plant Name</label>
              <input 
                className="input-field py-2.5" 
                placeholder="e.g. Balcony Tomatoes" 
                value={newPlantName} 
                onChange={(e) => setNewPlantName(e.target.value)} 
                required 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-compost-500 text-xs font-bold uppercase tracking-wider pl-1">Type</label>
              <select 
                className="input-field py-2.5" 
                value={newPlantType} 
                onChange={(e) => setNewPlantType(e.target.value)}
              >
                <option value="indoor">Indoor Plant</option>
                <option value="vegetable">Vegetable / Herb</option>
                <option value="flower">Flower / Shrub</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary px-6 py-2">Save Plant</button>
            <button type="button" onClick={() => setShowAddPlant(false)} className="btn btn-secondary px-6 py-2 bg-white">Cancel</button>
          </div>
        </form>
      )}

      {plants.length === 0 && !showAddPlant ? (
        <div className="organic-card p-12 text-center border-dashed border-2 border-border/50">
          <div className="p-4 bg-leaf-100 rounded-full text-leaf-600 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Sprout size={32} />
          </div>
          <h3 className="text-xl font-bold text-compost-900 mb-2">Your garden is empty</h3>
          <p className="text-compost-500 max-w-sm mx-auto mb-6">Add your first plant to start tracking how your compost helps it grow.</p>
          <button onClick={() => setShowAddPlant(true)} className="btn btn-primary px-6 py-3">Add First Plant</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plants.map(plant => (
            <div key={plant.id} className="organic-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-leaf-100 p-3 rounded-2xl text-leaf-600">
                    <Sprout size={24} />
                  </div>
                  <span className="bg-cream-100 text-compost-500 text-xs font-bold px-3 py-1 rounded-full capitalize">
                    {plant.plant_type}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-compost-900 mb-1">{plant.name}</h3>
                <p className="text-sm text-compost-500 font-medium mb-6">Added {format(new Date(plant.created_at), 'MMM d, yyyy')}</p>
                
                <div className="space-y-3 mb-6">
                  <h4 className="text-xs font-bold text-compost-500 uppercase tracking-wider">Feeding History</h4>
                  {applications[plant.id]?.length === 0 ? (
                    <p className="text-sm text-compost-400 italic">No compost applied yet.</p>
                  ) : (
                    applications[plant.id]?.map(app => (
                      <div key={app.id} className="flex items-center gap-3 bg-cream-50 p-3 rounded-xl border border-border">
                        <CheckCircle2 size={16} className="text-leaf-600" />
                        <div>
                          <p className="text-sm font-bold text-compost-900">{app.amount_kg ? `${app.amount_kg}kg applied` : 'Compost applied'}</p>
                          <p className="text-xs text-compost-500">{format(new Date(app.applied_at), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => setActivePlantId(plant.id)}
                className="w-full py-2.5 rounded-xl border-2 border-leaf-200 text-leaf-700 font-bold hover:bg-leaf-50 transition-colors"
              >
                Feed Compost
              </button>
            </div>
          ))}
        </div>
      )}

      {activePlantId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-compost-900/40 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleApplyCompost} className="bg-cream-50 w-full max-w-md p-8 rounded-[2.5rem] shadow-organic-lg relative">
            <h2 className="text-2xl font-serif font-bold text-compost-900 mb-6">Feed Plant</h2>
            
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-col gap-1.5">
                <label className="text-compost-500 text-xs font-bold uppercase tracking-wider pl-1">Select Batch (Optional)</label>
                <select 
                  className="input-field py-3" 
                  value={selectedCycleId} 
                  onChange={(e) => setSelectedCycleId(e.target.value)}
                >
                  <option value="">-- No specific batch --</option>
                  {completedCycles.map(c => (
                    <option key={c.id} value={c.id}>{c.label || 'Completed Batch'} ({format(new Date(c.started_at), 'MMM d')})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-compost-500 text-xs font-bold uppercase tracking-wider pl-1">Amount (kg) (Optional)</label>
                <input 
                  type="number"
                  step="0.1"
                  className="input-field py-3" 
                  placeholder="e.g. 0.5" 
                  value={appAmount} 
                  onChange={(e) => setAppAmount(e.target.value)} 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-compost-500 text-xs font-bold uppercase tracking-wider pl-1">Notes (Optional)</label>
                <input 
                  className="input-field py-3" 
                  placeholder="e.g. Top dressed" 
                  value={appNotes} 
                  onChange={(e) => setAppNotes(e.target.value)} 
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary flex-1 py-3 text-lg">Apply</button>
              <button type="button" onClick={() => setActivePlantId(null)} className="btn btn-secondary flex-1 py-3 text-lg bg-white">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
