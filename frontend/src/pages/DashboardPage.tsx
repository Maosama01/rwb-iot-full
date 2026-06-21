import { useState, useEffect } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  FlaskConical, 
  ChevronDown, 
  Scale, 
  Fan,
  Activity,
  AlertTriangle,
  Leaf,
  LayoutDashboard,
  Bell,
  BellRing
} from 'lucide-react';
import { api } from '../api/client';
import { useDevices } from '../context/DeviceContext';
import TelemetryChart from '../components/TelemetryChart';
import { WidgetErrorBoundary } from '../components/WidgetErrorBoundary';
import { useToast } from '../context/ToastContext';
import { requestPushToken, onForegroundMessage } from '../firebase';
import Skeleton from '../components/Skeleton';

import PairingModal from '../components/PairingModal';

const INTERVALS = [
  { value: 'raw', label: 'Raw (24h)' },
  { value: 'hour', label: 'Hourly (7d)' },
  { value: 'day', label: 'Daily (90d)' },
];

export default function DashboardPage() {
  const { devices, selectedDevice, selectDevice, refetchDevices } = useDevices();
  const { error, success } = useToast();
  const [telemetry, setTelemetry] = useState<any>(null);
  const [latestData, setLatestData] = useState<any>(null);
  const [chartInterval, setChartInterval] = useState('hour');
  const [loading, setLoading] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [showDeviceSelect, setShowDeviceSelect] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      success(`New Alert: ${payload.notification?.title} - ${payload.notification?.body}`);
    });
    return () => unsubscribe();
  }, [success]);

  useEffect(() => {
    if (!selectedDevice) return;

    const fetchInitial = async () => {
      setLoading(true);
      try {
        const [telData, latest] = await Promise.all([
          api.getTelemetryHistory(selectedDevice.id, chartInterval),
          api.getLatestTelemetry(selectedDevice.id)
        ]);
        setTelemetry(telData);
        setLatestData(latest);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();

    // Fast polling for live top widgets
    const pollLatestInterval = window.setInterval(async () => {
      try {
        const latest = await api.getLatestTelemetry(selectedDevice.id);
        setLatestData(latest);
      } catch (err) {
        console.error('Failed to poll latest telemetry:', err);
      }
    }, 5000);

    // Slow polling for heavy historical charts
    const pollHistoryInterval = window.setInterval(async () => {
      try {
        const telData = await api.getTelemetryHistory(selectedDevice.id, chartInterval);
        setTelemetry(telData);
      } catch (err) {
        console.error('Failed to poll historical data:', err);
      }
    }, 60000);

    return () => {
      window.clearInterval(pollLatestInterval);
      window.clearInterval(pollHistoryInterval);
    };
  }, [selectedDevice, chartInterval]);

  const handlePairDemo = async () => {
    try {
      await api.createDemoDevice();
      await refetchDevices();
      success('Demo device paired successfully');
    } catch (err) {
      error('Failed to pair demo device');
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
        success('Push notifications enabled!');
      } else {
        error('Failed to enable push notifications (permission denied or no config in .env).');
      }
    } catch (err) {
      error('Error setting up push notifications.');
    }
  };

  // Live Data
  const latestReading = {
    temperature_c: latestData?.temperature_c ?? 58.4,
    ambient_temp_c: latestData?.ambient_temp_c ?? 24.1,
    humidity_pct: latestData?.humidity_pct ?? 68,
    co2_ppm: latestData?.co2_ppm ?? 850,
    ph_level: latestData?.ph_level ?? 6.8,
    fill_level_pct: latestData?.fill_level_pct ?? 74,
    weight_kg: latestData?.weight_kg ?? 14.2,
    fan_speed_rpm: latestData?.fan_speed_rpm ?? 1200
  };

  const MetricCard = ({ title, value, unit, icon: Icon, trend, colorClass, isPercentage = false }: { title: string; value: string | number; unit: string; icon: any; trend?: string; colorClass: string; isPercentage?: boolean }) => (
    <div className="organic-card p-6 flex flex-col gap-4 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-${colorClass}/20 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity`}></div>
      <div className="flex items-center justify-between z-10">
        <div className={`p-3 rounded-2xl ${colorClass.includes('emerald') ? 'bg-emerald/10 text-emerald' : colorClass.includes('alert') ? 'bg-alert/10 text-alert' : 'bg-primary/10 text-primary-dark'}`}>
          <Icon size={24} />
        </div>
        {trend && !loading && <span className="text-sm font-medium text-emerald bg-emerald/10 px-2 py-1 rounded-full">{trend}</span>}
        {trend && loading && <Skeleton className="h-6 w-12" variant="circular" />}
      </div>
      <div className="z-10">
        <h3 className="text-text-secondary text-sm font-medium mb-1">{title}</h3>
        {loading ? (
          <div className="flex items-baseline gap-2 mt-1">
            <Skeleton className="h-8 w-16" variant="text" />
            <Skeleton className="h-4 w-6" variant="text" />
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-text-primary">{value}</span>
            <span className="text-text-muted font-medium">{unit}</span>
          </div>
        )}
        {isPercentage && (
          <div className="w-full bg-border rounded-full h-1.5 mt-4 overflow-hidden">
            {loading ? (
              <Skeleton className="w-full h-full" variant="rectangular" />
            ) : (
              <div className={`h-full ${colorClass.includes('emerald') ? 'bg-emerald' : 'bg-primary'}`} style={{ width: `${value}%` }}></div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Ecosystem Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-text-primary tracking-tight mb-2 flex items-center gap-3">
            Ecosystem <Leaf className="text-primary-dark" size={32} />
          </h1>
          <p className="text-text-secondary font-medium">All devices operating within optimal composting parameters.</p>
        </div>
        
        {devices.length > 0 && (
          <div className="flex items-center gap-4 relative">
            <button
              onClick={handleEnablePush}
              title="Enable Push Notifications"
              className={`p-3 rounded-xl transition-all border ${pushEnabled ? 'bg-primary/10 border-primary/20 text-primary-dark' : 'bg-white border-border text-text-muted hover:text-primary'}`}
            >
              {pushEnabled ? <BellRing size={20} /> : <Bell size={20} />}
            </button>

            <button 
              onClick={() => setShowDeviceSelect(!showDeviceSelect)}
              className="btn btn-secondary flex items-center gap-2 bg-white"
            >
              <div className="w-2 h-2 rounded-full bg-emerald"></div>
              {selectedDevice?.display_name || 'Select Device'}
              <ChevronDown size={18} className="text-text-muted" />
            </button>
            {showDeviceSelect && (
              <div className="absolute right-0 top-full mt-2 w-48 organic-card p-2 z-50">
                {devices.map(d => (
                  <button
                    key={d.id}
                    className="w-full text-left px-4 py-2 rounded-xl text-sm font-medium hover:bg-background text-text-primary"
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

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="organic-card p-8 flex items-center gap-6 bg-gradient-to-r from-emerald/10 to-transparent border-emerald/20">
          <div className="p-4 bg-emerald/20 rounded-2xl text-emerald-dark">
            <Scale size={32} />
          </div>
          <div>
            <p className="text-text-secondary font-medium mb-1">Total Compost Processed</p>
            <h2 className="text-4xl font-bold text-text-primary">14.2 <span className="text-xl text-text-muted">kg</span></h2>
          </div>
        </div>
        <div className="organic-card p-8 flex items-center gap-6 bg-gradient-to-r from-alert/10 to-transparent border-alert/20">
          <div className="p-4 bg-alert/20 rounded-2xl text-alert">
            <AlertTriangle size={32} />
          </div>
          <div>
            <p className="text-text-secondary font-medium mb-1">Active Alerts</p>
            <h2 className="text-4xl font-bold text-text-primary">0 <span className="text-xl text-text-muted">Issues</span></h2>
          </div>
        </div>
      </div>

      {!selectedDevice ? (
        <div className="organic-card p-16 text-center flex flex-col items-center justify-center border-dashed border-2">
          <div className="p-6 bg-background rounded-full text-text-muted mb-6">
            <Thermometer size={48} strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-2">No Devices Paired</h3>
          <p className="text-text-secondary max-w-md mx-auto mb-8">
            Connect your first Rawbin smart composter to start tracking your sustainability impact in real-time.
          </p>
          <button onClick={() => setIsPairingModalOpen(true)} className="btn btn-primary px-8">
            Pair Hardware Device
          </button>
        </div>
      ) : (
        <>
          {/* Live Telemetry Grid (8 Metrics) */}
          <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <Activity className="text-primary-dark" /> Live Telemetry
          </h2>
          <WidgetErrorBoundary widgetName="Live Telemetry">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <MetricCard title="Internal Temp" value={latestReading.temperature_c.toFixed(1)} unit="°C" icon={Thermometer} trend="+1.2°" colorClass="text-alert" />
              <MetricCard title="Ambient Temp" value={latestReading.ambient_temp_c.toFixed(1)} unit="°C" icon={Thermometer} colorClass="text-emerald" />
              <MetricCard title="Moisture Level" value={latestReading.humidity_pct.toFixed(0)} unit="%" icon={Droplets} isPercentage colorClass="text-primary" />
              <MetricCard title="CO₂ Concentration" value={latestReading.co2_ppm.toFixed(0)} unit="ppm" icon={Wind} colorClass="text-text-secondary" />
              <MetricCard title="pH Level" value={latestReading.ph_level.toFixed(1)} unit="pH" icon={FlaskConical} colorClass="text-primary" />
              <MetricCard title="Fill Level" value={latestReading.fill_level_pct.toFixed(0)} unit="%" icon={LayoutDashboard} isPercentage colorClass="text-emerald" />
              <MetricCard title="Bin Weight" value={latestReading.weight_kg.toFixed(1)} unit="kg" icon={Scale} colorClass="text-text-primary" />
              <MetricCard title="Aeration Fan" value={latestReading.fan_speed_rpm.toFixed(0)} unit="RPM" icon={Fan} colorClass="text-emerald" />
            </div>
          </WidgetErrorBoundary>

          {/* Historical Analytics */}
          <div className="organic-card p-8 mb-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary">Historical Analytics</h2>
              <div className="flex bg-background p-1 rounded-xl border border-border">
                {INTERVALS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${chartInterval === opt.value ? 'bg-white shadow-organic-sm text-emerald-dark' : 'text-text-secondary hover:text-text-primary'}`}
                    onClick={() => setChartInterval(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-[400px] w-full" variant="rectangular" />
            ) : (
              <WidgetErrorBoundary widgetName="Historical Analytics Chart">
                <div className="h-[400px]">
                  <TelemetryChart
                    data={telemetry?.readings || []}
                    interval={chartInterval}
                    metrics={['temperature', 'humidity', 'co2']}
                  />
                </div>
              </WidgetErrorBoundary>
            )}
          </div>
        </>
      )}

      <PairingModal 
        isOpen={isPairingModalOpen} 
        onClose={() => setIsPairingModalOpen(false)} 
        onComplete={handlePairDemo} 
      />
    </div>
  );
}
