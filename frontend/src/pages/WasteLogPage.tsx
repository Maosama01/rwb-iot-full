import { useState, useEffect } from 'react';
import { Apple, Leaf, Coffee, TreeDeciduous, Info, Plus } from 'lucide-react';
import { api } from '../api/client';
import { useDevices } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';

const WASTE_CATEGORIES = [
  { id: 'food', label: 'Food Scraps', type: 'greens', icon: Apple, color: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-200', description: 'Fruits, vegetables, coffee grounds' },
  { id: 'greens', label: 'Fresh Yard Waste', type: 'greens', icon: Leaf, color: 'bg-green-100 text-green-600', border: 'border-green-200', description: 'Grass clippings, fresh leaves' },
  { id: 'browns', label: 'Dry Browns', type: 'browns', icon: TreeDeciduous, color: 'bg-amber-100 text-amber-600', border: 'border-amber-200', description: 'Dry leaves, paper, cardboard' },
  { id: 'other', label: 'Other', type: 'other', icon: Coffee, color: 'bg-slate-100 text-slate-600', border: 'border-slate-200', description: 'Miscellaneous compostable items' }
];

export default function WasteLogPage() {
  const { selectedDevice } = useDevices();
  const { error, success } = useToast();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [weight, setWeight] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedDevice) {
      fetchLogs();
    }
  }, [selectedDevice]);

  const fetchLogs = async () => {
    if (!selectedDevice) return;
    try {
      const data = await api.listWasteLogs(selectedDevice.id, { limit: 100 });
      setLogs(data.items || []);
    } catch (err: any) {
      console.error('Failed to fetch waste logs:', err);
    }
  };

  const handleLogWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !selectedCategory || !weight) return;
    
    setIsSubmitting(true);
    try {
      const category = WASTE_CATEGORIES.find(c => c.id === selectedCategory);
      if (!category) return;

      await api.createWasteLog(selectedDevice.id, {
        waste_type: category.id,
        weight_kg: parseFloat(weight),
        notes: notes || null,
      });
      
      success('Waste logged successfully!');
      setWeight('');
      setNotes('');
      setSelectedCategory(null);
      fetchLogs();
    } catch (err: any) {
      error(err.message || 'Failed to log waste');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate live C:N ratio approximation based on recent logs
  const calculateTotals = () => {
    let greens = 0;
    let browns = 0;
    
    logs.forEach(log => {
      const cat = WASTE_CATEGORIES.find(c => c.id === log.waste_type);
      if (cat?.type === 'greens') greens += log.weight_kg || 0;
      if (cat?.type === 'browns') browns += log.weight_kg || 0;
    });

    return { greens, browns };
  };

  const { greens, browns } = calculateTotals();
  const total = greens + browns;
  const greensPct = total > 0 ? (greens / total) * 100 : 0;
  const brownsPct = total > 0 ? (browns / total) * 100 : 0;
  
  // Ideal ratio is roughly 2-3 parts Browns to 1 part Greens by volume/weight.
  // For simplicity, let's say 60-70% Browns is ideal.
  let balanceMessage = "Add waste to see your balance.";
  let balanceColor = "text-text-muted";
  
  if (total > 0) {
    if (brownsPct < 50) {
      balanceMessage = "Too much nitrogen! Add more dry browns (paper, leaves).";
      balanceColor = "text-amber-500";
    } else if (brownsPct > 80) {
      balanceMessage = "Too much carbon! Add more green food scraps.";
      balanceColor = "text-emerald-500";
    } else {
      balanceMessage = "Perfect C:N balance! Keep it up.";
      balanceColor = "text-primary-dark";
    }
  }

  if (!selectedDevice) {
    return (
      <div className="organic-card p-16 text-center animate-fade-in">
        <h3 className="text-2xl font-bold text-text-primary mb-2">No Device Selected</h3>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary tracking-tight mb-2">Interactive Waste Log</h1>
        <p className="text-text-secondary font-medium">Track what you throw away and maintain the perfect Carbon-to-Nitrogen ratio.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form & Balance */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* C:N Balance Bar */}
          <div className="organic-card p-6 border-border">
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <Info size={20} className="text-primary" /> Carbon:Nitrogen Balance
            </h2>
            <div className="h-4 w-full bg-surface-dark rounded-full overflow-hidden flex mb-3">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                style={{ width: `${greensPct}%` }}
                title="Greens (Nitrogen)"
              />
              <div 
                className="h-full bg-amber-500 transition-all duration-1000 ease-out" 
                style={{ width: `${brownsPct}%` }}
                title="Browns (Carbon)"
              />
            </div>
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-emerald-600">{greensPct.toFixed(0)}% Greens</span>
              <span className="text-amber-600">{brownsPct.toFixed(0)}% Browns</span>
            </div>
            <p className={`text-sm font-medium ${balanceColor}`}>{balanceMessage}</p>
          </div>

          {/* Add Waste Form */}
          <form className="organic-card p-6" onSubmit={handleLogWaste}>
            <h2 className="text-xl font-bold text-text-primary mb-6">Log New Waste</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {WASTE_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                      isSelected 
                        ? `${cat.border} ring-2 ring-offset-2 ring-primary bg-background` 
                        : 'border-transparent bg-surface hover:bg-background'
                    }`}
                  >
                    <div className={`p-3 rounded-xl mb-3 ${cat.color}`}>
                      <Icon size={24} />
                    </div>
                    <span className="font-bold text-text-primary text-sm mb-1">{cat.label}</span>
                    <span className="text-xs text-text-muted text-center">{cat.description}</span>
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-bold uppercase tracking-wider">Weight (kg)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0.1"
                  className="input-field py-3 text-lg" 
                  placeholder="e.g. 1.5" 
                  value={weight} 
                  onChange={e => setWeight(e.target.value)} 
                  required 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-bold uppercase tracking-wider">Notes (Optional)</label>
                <input 
                  type="text" 
                  className="input-field py-3 text-lg" 
                  placeholder="e.g. Moldy bread" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !selectedCategory || !weight} 
              className="btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
            >
              <Plus size={24} /> {isSubmitting ? 'Logging...' : 'Add to Compost'}
            </button>
          </form>
        </div>

        {/* Right Column: Recent Logs */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-text-primary mb-2">Recent Logs</h2>
          {logs.length === 0 ? (
            <div className="organic-card p-8 text-center text-text-muted font-medium">
              No waste logged yet.
            </div>
          ) : (
            logs.slice(0, 10).map((log) => {
              const cat = WASTE_CATEGORIES.find(c => c.id === log.waste_type) || WASTE_CATEGORIES[3];
              const Icon = cat.icon;
              return (
                <div key={log.id} className="organic-card p-4 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${cat.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-text-primary">{cat.label}</h4>
                    <p className="text-xs text-text-muted font-medium">{format(new Date(log.logged_at), 'MMM d, h:mm a')}</p>
                    {log.notes && <p className="text-sm text-text-secondary mt-1">{log.notes}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-text-primary">{log.weight_kg}</span>
                    <span className="text-text-muted text-sm ml-1">kg</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
}
