import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wifi, 
  Smartphone, 
  CheckCircle2, 
  Loader2, 
  Bluetooth, 
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { api } from '../api/client';
import { useDevices } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';

export default function DeviceSetupPage() {
  const [step, setStep] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [wifiNetwork, setWifiNetwork] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  
  const navigate = useNavigate();
  const { fetchDevices } = useDevices();
  const { showToast } = useToast();

  const handleStartScan = () => {
    setIsScanning(true);
    setStep(1);
    // Simulate BLE scan delay
    setTimeout(() => {
      setIsScanning(false);
      setStep(2);
    }, 3000);
  };

  const handleConnectWifi = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3); // Connecting to wifi mock
    setTimeout(() => {
      setStep(4); // Pair with backend
      handleBackendPairing();
    }, 2000);
  };

  const handleBackendPairing = async () => {
    setIsPairing(true);
    try {
      // In a real flow, this would pass WiFi credentials over BLE to the device
      // The device would connect to the internet, then we'd do the HMAC handshake.
      // Here we just use the demo endpoint.
      await api.createDemoDevice();
      await fetchDevices(); // refresh device list
      setIsPairing(false);
      setStep(5); // Success
      
      // Auto redirect to dashboard after success
      setTimeout(() => {
        showToast('success', 'New Rawbin paired successfully!');
        navigate('/dashboard');
      }, 3000);
    } catch (err: any) {
      setIsPairing(false);
      showToast('error', err.message || 'Failed to pair device');
      setStep(2); // Go back to wifi setup on failure
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header Progress */}
        <div className="bg-emerald p-6 flex items-center justify-between relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
           <div className="relative z-10">
             <h2 className="text-2xl font-extrabold text-white tracking-tight">Add New Rawbin</h2>
             <p className="text-emerald-100 font-medium mt-1 text-sm">Device Setup Wizard</p>
           </div>
           <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center relative z-10 shadow-inner">
             <Cpu className="text-white" size={24} />
           </div>
        </div>

        {/* Dynamic Content Body */}
        <div className="p-8 sm:p-12 min-h-[400px] flex flex-col justify-center relative">
           
           {/* Step 0: Welcome / Instructions */}
           {step === 0 && (
             <div className="flex flex-col items-center text-center animate-fade-in-up">
               <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
                 <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-pulse"></div>
                 <Bluetooth size={48} />
               </div>
               <h3 className="text-2xl font-bold text-text-primary mb-3">Power on your Rawbin</h3>
               <p className="text-text-secondary mb-8 max-w-xs">
                 Make sure your composter is plugged in and the blue pairing light is flashing.
               </p>
               <button 
                 onClick={handleStartScan}
                 className="w-full sm:w-auto px-8 py-4 bg-text-primary hover:bg-black text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
               >
                 Start Scanning
                 <ArrowRight size={20} />
               </button>
             </div>
           )}

           {/* Step 1: Scanning */}
           {step === 1 && (
             <div className="flex flex-col items-center text-center animate-fade-in">
               <div className="relative mb-8">
                 <div className="w-24 h-24 bg-emerald/10 text-emerald rounded-full flex items-center justify-center">
                   <Smartphone size={40} className="animate-bounce" />
                 </div>
                 <div className="absolute -inset-4 border-2 border-emerald/30 rounded-full animate-ping"></div>
                 <div className="absolute -inset-8 border-2 border-emerald/10 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
               </div>
               <h3 className="text-2xl font-bold text-text-primary mb-2">Looking for devices...</h3>
               <p className="text-text-secondary">Keep your phone close to the Rawbin.</p>
             </div>
           )}

           {/* Step 2: Found & Wifi Setup */}
           {step === 2 && (
             <div className="animate-fade-in-up w-full">
               <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-8">
                 <div className="w-12 h-12 bg-emerald text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
                   <CheckCircle2 size={24} />
                 </div>
                 <div>
                   <h4 className="font-bold text-text-primary">Rawbin Found!</h4>
                   <p className="text-sm text-text-secondary">Rawbin-X82 (BLE Signal: Excellent)</p>
                 </div>
               </div>

               <h3 className="text-xl font-bold text-text-primary mb-4">Connect to Wi-Fi</h3>
               <p className="text-text-secondary text-sm mb-6">
                 Your Rawbin needs internet access to sync telemetry and receive OTA updates.
               </p>

               <form onSubmit={handleConnectWifi} className="flex flex-col gap-4 w-full">
                 <div className="relative group">
                   <Wifi size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald transition-colors" />
                   <input
                     type="text"
                     className="w-full bg-gray-50 border border-gray-200 text-text-primary text-sm rounded-2xl focus:ring-4 focus:ring-emerald/10 focus:border-emerald block pl-11 p-4 transition-all"
                     placeholder="Network Name (SSID)"
                     value={wifiNetwork}
                     onChange={(e) => setWifiNetwork(e.target.value)}
                     required
                   />
                 </div>
                 <div className="relative group mb-2">
                   <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald transition-colors" />
                   <input
                     type="password"
                     className="w-full bg-gray-50 border border-gray-200 text-text-primary text-sm rounded-2xl focus:ring-4 focus:ring-emerald/10 focus:border-emerald block pl-11 p-4 transition-all"
                     placeholder="Wi-Fi Password"
                     value={wifiPassword}
                     onChange={(e) => setWifiPassword(e.target.value)}
                     required
                   />
                 </div>
                 <button 
                   type="submit"
                   className="w-full py-4 bg-emerald hover:bg-emerald-dark text-white font-bold rounded-2xl transition-colors shadow-lg hover:shadow-xl"
                 >
                   Connect & Pair
                 </button>
               </form>
             </div>
           )}

           {/* Step 3: Connecting to Wifi (Mock) */}
           {step === 3 && (
             <div className="flex flex-col items-center text-center animate-fade-in">
               <Loader2 size={48} className="text-emerald animate-spin mb-6" />
               <h3 className="text-2xl font-bold text-text-primary mb-2">Connecting to {wifiNetwork}...</h3>
               <p className="text-text-secondary">Sending credentials via Bluetooth securely.</p>
             </div>
           )}

           {/* Step 4: Pairing (Mock) */}
           {step === 4 && (
             <div className="flex flex-col items-center text-center animate-fade-in">
               <Loader2 size={48} className="text-text-primary animate-spin mb-6" />
               <h3 className="text-2xl font-bold text-text-primary mb-2">Registering Device...</h3>
               <p className="text-text-secondary">Exchanging security keys with the Rawbin Cloud.</p>
             </div>
           )}

           {/* Step 5: Success */}
           {step === 5 && (
             <div className="flex flex-col items-center text-center animate-fade-in-up">
               <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
                 <div className="absolute inset-0 bg-green-400 opacity-20 animate-ping"></div>
                 <CheckCircle2 size={48} className="relative z-10" />
               </div>
               <h3 className="text-3xl font-extrabold text-text-primary mb-3">All Set!</h3>
               <p className="text-text-secondary max-w-sm mb-8">
                 Your new Rawbin is securely connected and ready to compost. Redirecting you to the dashboard...
               </p>
               <Loader2 size={24} className="text-gray-400 animate-spin" />
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
