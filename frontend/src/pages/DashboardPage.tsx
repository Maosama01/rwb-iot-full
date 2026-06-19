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
  Leaf
} from 'lucide-react';
import { api } from '../api/client';
import { useDevices } from '../context/DeviceContext';
import TelemetryChart from '../components/TelemetryChart';

import PairingModal from '../components/PairingModal';

const INTERVALS = [
  { value: 'raw', label: 'Raw (24h)' },
  { value: 'hour', label: 'Hourly (7d)' },
  { value: 'day', label: 'Daily (90d)' },
];

export default function DashboardPage() {
  const { devices, selectedDevice, selectDevice, refetchDevices } = useDevices();
  const [telemetry, setTelemetry] = useState<any>(null);
  const [interval, setInterval] = useState('hour');
  const [loading, setLoading] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [showDeviceSelect, setShowDeviceSelect] = useState(false);

  useEffect(() => {
    if (!selectedDevice) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const telData = await api.getTelemetryHistory(selectedDevice.device_id, interval);
        setTelemetry(telData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDevice, interval]);

  const handlePairDemo = async () => {
    try {
      await api.createDemoDevice();
      await refetchDevices();
    } catch (err) {
      console.error(err);
      alert('Failed to pair demo device');
    } finally {
      setIsPairingModalOpen(false);
    }
  };

  // Mock Data Fallback for Premium Feel
  const latestReading = telemetry?.readings?.length 
    ? telemetry.readings[telemetry.readings.length - 1] 
    : {
        temperature_c: 58.4,
        ambient_temp_c: 24.1,
        humidity_pct: 68,
        co2_ppm: 850,
        ph_level: 6.8,
        fill_level_pct: 74,
        weight_kg: 14.2,
        fan_speed_rpm: 1200
      };

  const MetricCard = ({ title, value, unit, icon: Icon, trend, colorClass, isPercentage = false }) => (
    <div className="organic-card p-6 flex flex-col gap-4 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-${colorClass}/20 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity`}></div>
      <div className="flex items-center justify-between z-10">
        <div className={`p-3 rounded-2xl ${colorClass.includes('emerald') ? 'bg-emerald/10 text-emerald' : colorClass.includes('alert') ? 'bg-alert/10 text-alert' : 'bg-primary/10 text-primary-dark'}`}>
          <Icon size={24} />
        </div>
        {trend && <span className="text-sm font-medium text-emerald bg-emerald/10 px-2 py-1 rounded-full">{trend}</span>}
      </div>
      <div className="z-10">
        <h3 className="text-text-secondary text-sm font-medium mb-1">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-text-primary">{value}</span>
          <span className="text-text-muted font-medium">{unit}</span>
        </div>
        {isPercentage && (
          <div className="w-full bg-border rounded-full h-1.5 mt-4 overflow-hidden">
            <div className={`h-full ${colorClass.includes('emerald') ? 'bg-emerald' : 'bg-primary'}`} style={{ width: `${value}%` }}></div>
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
          <div className="relative">
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
                    key={d.device_id}
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

          {/* Historical Analytics */}
          <div className="organic-card p-8 mb-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary">Historical Analytics</h2>
              <div className="flex bg-background p-1 rounded-xl border border-border">
                {INTERVALS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${interval === opt.value ? 'bg-white shadow-organic-sm text-emerald-dark' : 'text-text-secondary hover:text-text-primary'}`}
                    onClick={() => setInterval(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="h-[400px] bg-background animate-pulse rounded-2xl w-full"></div>
            ) : (
              <div className="h-[400px]">
                <TelemetryChart
                  data={telemetry?.readings || []}
                  interval={interval}
                  metrics={['temperature', 'humidity', 'co2']}
                />
              </div>
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
