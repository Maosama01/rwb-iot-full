import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Skeleton from './Skeleton';
import { BrainCircuit, Clock, Droplets, Thermometer, Leaf } from 'lucide-react';

interface PredictiveInsights {
  current_phase: string;
  health_score: number;
  estimated_days_remaining: number;
  ideal_temperature: number;
  ideal_humidity: number;
  phase_started_at: string | null;
}

export default function PredictiveInsightsCard({ deviceId }: { deviceId: string }) {
  const [data, setData] = useState<PredictiveInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) return;
    
    let isMounted = true;
    setLoading(true);
    
    api.getPredictiveInsights(deviceId)
      .then(res => {
        if (isMounted) setData(res);
      })
      .catch(err => {
        console.error("Failed to load predictive insights", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [deviceId]);

  if (loading) {
    return (
      <div className="organic-card p-6 border-border/50 h-[300px] flex flex-col justify-between">
        <Skeleton variant="text" className="w-1/2 h-8 mb-4" />
        <div className="flex gap-4">
          <Skeleton variant="circular" className="w-[120px] h-[120px]" />
          <div className="flex-1 space-y-4 flex flex-col justify-center">
            <Skeleton variant="rectangular" className="h-5 w-full" />
            <Skeleton variant="rectangular" className="h-5 w-5/6" />
            <Skeleton variant="rectangular" className="h-5 w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="organic-card p-6 border-border/50 h-[300px] flex items-center justify-center text-text-muted">
        Insufficient telemetry data to generate predictive insights.
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald to-emerald-light';
    if (score >= 50) return 'from-yellow-500 to-yellow-300';
    return 'from-red-500 to-red-300';
  };

  const circumference = 2 * Math.PI * 45; // r=45
  const strokeDashoffset = circumference - (data.health_score / 100) * circumference;

  return (
    <div className="organic-card p-6 border-border/50 relative overflow-hidden group animate-fade-in-up">
      <div className="relative z-10 flex flex-col md:flex-row gap-8">
        {/* Health Score Ring */}
        <div className="flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Compost Health</h3>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-border"
              />
              <circle
                cx="64"
                cy="64"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`${getScoreColor(data.health_score)} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-4xl font-black ${getScoreColor(data.health_score)}`}>{data.health_score}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 flex flex-col justify-center">
          {/* Top Info Row */}
          <div>
            <h2 className="text-2xl font-black text-text-primary flex items-center gap-2 mb-1">
              <BrainCircuit className="text-emerald" size={24} />
              AI Predictive Insights
            </h2>
            <p className="text-text-secondary text-sm">
              Analyzing your compost's temperature and humidity to track its progress.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface/50 rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase mb-1">
                <Leaf size={14} /> Current Phase
              </div>
              <div className="text-lg font-bold text-text-primary">
                {data.current_phase === 'Mesophilic' ? 'Warming Up' : 
                 data.current_phase === 'Thermophilic' ? 'Active Composting' : 
                 data.current_phase === 'Maturation' ? 'Curing' : data.current_phase}
              </div>
            </div>

            <div className="bg-surface/50 rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase mb-1">
                <Clock size={14} /> Est. Completion
              </div>
              <div className="text-lg font-bold text-emerald">{data.estimated_days_remaining} Days</div>
            </div>

            <div className="bg-surface/50 rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase mb-1">
                <Thermometer size={14} /> Target Temp
              </div>
              <div className="text-lg font-bold text-text-primary">{data.ideal_temperature}°C</div>
            </div>

            <div className="bg-surface/50 rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase mb-1">
                <Droplets size={14} /> Target Humidity
              </div>
              <div className="text-lg font-bold text-text-primary">{data.ideal_humidity}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Timeline */}
      <div className="mt-8 pt-6 border-t border-border relative z-10">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Cycle Progression</h3>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-border -translate-y-1/2 z-0"></div>
          
          {['Mesophilic', 'Thermophilic', 'Maturation'].map((phase, idx) => {
            const isActive = data.current_phase === phase;
            const isPast = ['Mesophilic', 'Thermophilic', 'Maturation'].indexOf(data.current_phase) > idx;
            
            let colorClass = 'bg-surface border-border text-text-muted';
            if (isActive) colorClass = 'bg-emerald border-emerald text-white scale-110 shadow-organic';
            else if (isPast) colorClass = 'bg-emerald/20 border-emerald/50 text-emerald';

            const phaseNames: Record<string, string> = {
              'Mesophilic': 'Warming Up',
              'Thermophilic': 'Active Composting',
              'Maturation': 'Curing',
            };

            return (
              <div key={phase} className="flex flex-col items-center gap-2 relative z-10 w-28">
                <div className={`w-4 h-4 rounded-full border-2 transition-all ${colorClass}`}></div>
                <span className={`text-xs font-bold text-center ${isActive ? 'text-text-primary' : 'text-text-muted'}`}>
                  {phaseNames[phase]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
