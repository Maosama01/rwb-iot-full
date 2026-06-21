import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { BrainCircuit, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';

export default function PredictiveInsightsWidget({ cycleId }: { cycleId: string }) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchInsights = async () => {
      try {
        const data = await api.getCycleInsights(cycleId);
        if (mounted) setInsights(data);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load insights');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchInsights();
    return () => { mounted = false; };
  }, [cycleId]);

  if (loading) {
    return (
      <div className="organic-card p-6 flex items-center justify-center h-48 animate-pulse">
        <Loader2 className="animate-spin text-primary opacity-50" size={32} />
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="organic-card p-6 flex flex-col items-center justify-center h-48 text-center border-dashed">
        <Info className="text-text-muted mb-2" size={24} />
        <p className="text-text-secondary text-sm">Insights currently unavailable for this cycle.</p>
      </div>
    );
  }

  const {
    estimated_completion_date,
    current_phase,
    degree_days_accumulated,
    percent_complete,
    recommendations,
  } = insights;

  return (
    <div className="organic-card p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20 relative overflow-hidden group">
      <div className="absolute -top-10 -right-10 text-primary opacity-5 group-hover:opacity-10 transition-opacity">
        <BrainCircuit size={150} />
      </div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 bg-primary/20 rounded-xl text-primary-dark">
          <BrainCircuit size={20} />
        </div>
        <h3 className="font-bold text-text-primary">Predictive AI Insights</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Current Phase</p>
          <p className="font-semibold text-text-primary">{current_phase}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Curing Progress</p>
          <div className="flex items-center gap-2">
            <div className="w-full bg-border rounded-full h-2 overflow-hidden flex-1">
              <div 
                className={`h-full ${percent_complete === 100 ? 'bg-emerald' : 'bg-primary'}`} 
                style={{ width: `${percent_complete}%` }}
              ></div>
            </div>
            <span className="text-sm font-bold text-text-secondary">{percent_complete}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Thermal Units</p>
          <p className="font-semibold text-text-primary">{degree_days_accumulated} <span className="text-sm font-normal text-text-secondary">DD</span></p>
        </div>
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Est. Completion</p>
          <p className="font-semibold text-text-primary">
            {estimated_completion_date ? format(new Date(estimated_completion_date), 'MMM d, yyyy') : 'Calculating...'}
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Recommendations</p>
        <ul className="space-y-2">
          {recommendations.map((rec: string, i: number) => (
            <li key={i} className="text-sm text-text-secondary flex items-start gap-2 bg-white/50 p-2.5 rounded-lg border border-border/50">
              <span className="text-primary mt-0.5">•</span> {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
