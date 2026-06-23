import { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  Leaf,
  Bell,
  BellRing,
  Sparkles,
  Globe,
  Trash2,
  Calendar,
  Play,
  Square
} from 'lucide-react';
import { api } from '../api/client';
import { useDevices } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import { requestPushToken, onForegroundMessage } from '../firebase';
import Skeleton from '../components/Skeleton';
import PairingModal from '../components/PairingModal';
import AIChatWidget from '../components/AIChatWidget';

export default function DashboardPage() {
  const { devices, selectedDevice, selectDevice, refetchDevices } = useDevices();
  const { error, success } = useToast();
  const [latestData, setLatestData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [showDeviceSelect, setShowDeviceSelect] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [communityImpact, setCommunityImpact] = useState<any>(null);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [cycleLoading, setCycleLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      success(`Alert: ${payload.notification?.title}`);
    });
    return () => unsubscribe();
  }, [success]);

  useEffect(() => {
    if (!selectedDevice) return;

    const fetchInitial = async () => {
      setLoading(true);
      try {
        const [latest, impact, cycles] = await Promise.all([
          api.getLatestTelemetry(selectedDevice.id),
          api.getCommunityImpact(),
          api.listCycles(selectedDevice.id, 'active')
        ]);
        setLatestData(latest);
        setCommunityImpact(impact);
        setActiveCycle(cycles?.[0] || null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();

    const pollLatestInterval = window.setInterval(async () => {
      try {
        const latest = await api.getLatestTelemetry(selectedDevice.id);
        setLatestData(latest);
      } catch (err) {
        console.error('Failed to poll latest telemetry:', err);
      }
    }, 5000);

    return () => {
      window.clearInterval(pollLatestInterval);
    };
  }, [selectedDevice]);

  const handlePairDemo = async () => {
    try {
      await api.createDemoDevice();
      await refetchDevices();
      success('Rawbin paired successfully!');
    } catch (err) {
      error('Failed to pair Rawbin');
    } finally {
      setIsPairingModalOpen(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      const token = await requestPushToken();
      if (token) {
        await api.updatePushToken(token);
        setPushEnabled(true);
        success('Notifications enabled!');
      } else {
        error('Failed to enable notifications.');
      }
    } catch (err) {
      error('Error setting up notifications.');
    }
  };

  const handleToggleCycle = async () => {
    if (!selectedDevice) return;
    setCycleLoading(true);
    try {
      if (activeCycle) {
        await api.updateCycle(activeCycle.id, { status: 'completed' });
        setActiveCycle(null);
        success('Cycle completed successfully!');
      } else {
        const cycle = await api.createCycle(selectedDevice.id, { label: 'Quick Cycle' });
        setActiveCycle(cycle);
        success('Cycle started!');
      }
    } catch (err: any) {
      error(err?.message || 'Failed to toggle cycle');
    } finally {
      setCycleLoading(false);
    }
  };

  // Live Data defaults for display
  const latestReading = {
    temperature_c: latestData?.temperature_c ?? 58.4,
    humidity_pct: latestData?.humidity_pct ?? 68,
    fill_level_pct: latestData?.fill_level_pct ?? 74,
    weight_kg: latestData?.weight_kg ?? 14.2,
  };

  // Determine compost status
  let statusText = "Rawbin is happily composting! 🌱";
  let statusColor = "bg-leaf-100 text-leaf-900";
  if (latestReading.temperature_c < 30) {
    statusText = "Warming up the compost bed ☀️";
    statusColor = "bg-cream-100 text-compost-900";
  } else if (latestReading.temperature_c > 70) {
    statusText = "Running a bit hot! Cooling down 💨";
    statusColor = "bg-[#FFF5F3] text-terracotta-500";
  } else if (latestReading.humidity_pct < 40) {
    statusText = "A bit dry! Add some food scraps 🍎";
    statusColor = "bg-cream-100 text-compost-900";
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Friendly Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-compost-900 tracking-tight mb-1">
            Today
          </h1>
          <p className="text-compost-500 font-medium">Here's how your compost is doing.</p>
        </div>
        
        {devices.length > 0 && (
          <div className="flex items-center gap-3 relative">
            <button
              onClick={handleEnablePush}
              title="Enable Notifications"
              className={`p-3.5 rounded-full transition-all ${pushEnabled ? 'bg-leaf-100 text-leaf-900' : 'bg-white border border-border text-compost-500 hover:text-leaf-600'}`}
            >
              {pushEnabled ? <BellRing size={20} /> : <Bell size={20} />}
            </button>

            <button 
              onClick={() => setShowDeviceSelect(!showDeviceSelect)}
              className="btn btn-secondary bg-white rounded-full px-5 flex items-center gap-2"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-leaf-400"></div>
              <span className="hidden sm:inline">{selectedDevice?.display_name || 'My Rawbin'}</span>
              <ChevronDown size={18} className="text-compost-500" />
            </button>
            {showDeviceSelect && (
              <div className="absolute right-0 top-full mt-2 w-48 organic-card p-2 z-50">
                {devices.map(d => (
                  <button
                    key={d.id}
                    className="w-full text-left px-4 py-3 rounded-2xl text-sm font-medium hover:bg-cream-50 text-compost-900"
                    onClick={() => { selectDevice(d); setShowDeviceSelect(false); }}
                  >
                    {d.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!selectedDevice ? (
        <div className="organic-card p-12 md:p-16 text-center flex flex-col items-center justify-center border-dashed border-2 border-border/50 bg-cream-50/50">
          <div className="p-6 bg-white shadow-organic-sm rounded-full text-leaf-600 mb-6">
            <Leaf size={48} strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-serif font-bold text-compost-900 mb-3">Welcome to Rawbin</h3>
          <p className="text-compost-500 max-w-sm mx-auto mb-8 leading-relaxed">
            Connect your first Rawbin smart composter to start turning food scraps into rich soil effortlessly.
          </p>
          <button onClick={() => setIsPairingModalOpen(true)} className="btn btn-primary px-8 text-lg py-4">
            Connect My Rawbin
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Quick Action Buttons (Lomi Style) */}
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={handleToggleCycle}
                disabled={cycleLoading}
                className={`organic-card p-6 flex flex-col items-center justify-center text-center group transition-all duration-500 ease-spring active:scale-95 hover:scale-[1.02] border border-border/50 shadow-organic-sm ${activeCycle ? 'hover:bg-amber-600 hover:text-white hover:border-amber-600' : 'hover:bg-leaf-600 hover:text-white hover:border-leaf-600'}`}
              >
                <div className={`relative w-16 h-16 flex items-center justify-center rounded-full mb-3 transition-all duration-500 ${activeCycle ? 'bg-amber-100 text-amber-600 group-hover:bg-white/20 group-hover:text-white' : 'bg-leaf-100 text-leaf-600 group-hover:bg-white/20 group-hover:text-white'}`}>
                  {cycleLoading ? (
                    <div className="w-7 h-7 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <div className={`absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeCycle ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'}`}>
                        <Play fill="currentColor" size={28} />
                      </div>
                      <div className={`absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeCycle ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-150 -rotate-90'}`}>
                        <Square fill="currentColor" size={28} />
                      </div>
                    </>
                  )}
                </div>
                <div className="relative h-7 w-full flex items-center justify-center overflow-hidden">
                  <span className={`absolute font-bold text-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeCycle ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'} group-hover:text-white text-compost-900`}>
                    Start Cycle
                  </span>
                  <span className={`absolute font-bold text-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeCycle ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'} group-hover:text-white text-compost-900`}>
                    Complete Cycle
                  </span>
                </div>
                <div className="relative h-5 w-full flex items-center justify-center mt-1 overflow-hidden">
                  <span className={`absolute text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeCycle ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'} text-compost-500 group-hover:text-white/90`}>
                    Ready to start
                  </span>
                  <span className={`absolute text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeCycle ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'} text-amber-600 group-hover:text-white/90`}>
                    A cycle is currently running
                  </span>
                </div>
              </button>
            </div>

            {/* Impact Card (Trash Bag Metaphor) */}
            <div className="organic-card p-8 bg-gradient-to-br from-[#EAF4F4] to-white border border-border/50 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Leaf size={120} />
              </div>
              
              <h3 className="text-2xl font-serif font-bold text-compost-900 mb-2 relative z-10">My Impact</h3>
              <p className="text-compost-500 font-medium relative z-10">Every cycle keeps food out of landfills.</p>
              
              <div className="relative w-56 h-56 mx-auto my-8 flex items-center justify-center relative z-10">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-sm">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-leaf-100" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-leaf-600 transition-all duration-1000 ease-out" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - Math.min(100, (latestReading.weight_kg / 20) * 100) / 100)}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <div className="bg-compost-800 text-white p-3 rounded-full mb-1 opacity-90 shadow-md">
                     <Trash2 size={32} />
                   </div>
                   <span className="text-2xl font-bold text-compost-900 mt-1">
                     {Math.round(Math.min(100, (latestReading.weight_kg / 20) * 100))}%
                   </span>
                </div>
              </div>

              <p className="text-compost-600 font-medium relative z-10 text-lg">
                until my next trash bag saved
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-border/50 relative z-10">
                 <div>
                   <p className="text-3xl font-bold text-leaf-900">
                     {loading ? <Skeleton className="w-16 h-8 mx-auto" variant="text" /> : latestReading.weight_kg.toFixed(1)} <span className="text-lg">kg</span>
                   </p>
                   <p className="text-sm font-medium text-compost-500 mt-1">waste saved</p>
                 </div>
                 <div>
                   <p className="text-3xl font-bold text-compost-900">
                     {loading ? <Skeleton className="w-12 h-8 mx-auto" variant="text" /> : '12'}
                   </p>
                   <p className="text-sm font-medium text-compost-500 mt-1">cycles completed</p>
                 </div>
              </div>
            </div>

            {/* Global Community Impact */}
            {communityImpact && (
              <div className="organic-card p-6 bg-cream-50 border-border">
                <div className="flex items-center gap-4">
                  <div className="bg-[#4299E1]/10 p-4 rounded-full text-[#4299E1] shrink-0">
                    <Globe size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-compost-900 flex items-center gap-2">
                      Global Impact
                    </h3>
                    <p className="text-sm text-compost-500 font-medium leading-tight mt-1">
                      Together, the Rawbin community of <span className="font-bold text-compost-900">{communityImpact.total_users}</span> users has diverted <span className="font-bold text-leaf-600">{communityImpact.total_weight_kg.toFixed(1)}kg</span> of waste!
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column (Ask Rawbin AI) */}
          <div className="lg:col-span-5 h-[500px] lg:h-auto hidden md:block">
            <AIChatWidget inline={true} />
          </div>
        </div>
      )}

      <PairingModal 
        isOpen={isPairingModalOpen} 
        onClose={() => setIsPairingModalOpen(false)} 
        onComplete={handlePairDemo} 
      />
    </div>
  );
}
