import { useState, useEffect } from 'react';
import { X, Search, Bluetooth, Loader2, CheckCircle2, Sprout } from 'lucide-react';

export default function PairingModal({ isOpen, onClose, onComplete }: any) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    if (step === 0) {
      // Step 0: Searching
      timer = setTimeout(() => setStep(1), 2000);
    } else if (step === 1) {
      // Step 1: Found, saying hello
      timer = setTimeout(() => setStep(2), 2500);
    } else if (step === 2) {
      // Step 2: Finalizing
      timer = setTimeout(() => setStep(3), 2000);
    } else if (step === 3) {
      // Step 3: Success!
      timer = setTimeout(() => onComplete(), 1500);
    }

    return () => clearTimeout(timer);
  }, [isOpen, step, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-compost-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-cream-50 w-full max-w-md p-8 md:p-10 rounded-[2.5rem] shadow-organic-lg relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-compost-500 hover:text-compost-900 transition-colors rounded-full hover:bg-cream-100"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-10 mt-2">
          <div className="w-16 h-16 bg-leaf-100 text-leaf-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bluetooth size={28} />
          </div>
          <h2 className="text-3xl font-serif font-bold text-compost-900 mb-2">Connect Rawbin</h2>
          <p className="text-compost-500 font-medium text-sm">Make sure your bin is plugged in and nearby.</p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Step 0 & 1 */}
          <div className={`flex items-center gap-5 p-5 rounded-3xl transition-all duration-500 ${step >= 0 ? 'bg-white shadow-sm border border-border' : 'opacity-40 grayscale'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${step > 0 ? 'bg-leaf-100 text-leaf-600' : 'bg-cream-100 text-compost-500'}`}>
              {step > 0 ? <CheckCircle2 size={24} /> : <Search size={24} className="animate-pulse" />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-compost-900 text-lg">{step > 0 ? 'Found it!' : 'Looking around...'}</h4>
              <p className="text-sm text-compost-500 font-medium">Scanning for active units nearby.</p>
            </div>
          </div>

          {/* Step 1 & 2 */}
          <div className={`flex items-center gap-5 p-5 rounded-3xl transition-all duration-500 ${step >= 1 ? 'bg-white shadow-sm border border-border' : 'opacity-40 grayscale'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${step > 1 ? 'bg-leaf-100 text-leaf-600' : 'bg-cream-100 text-compost-500'}`}>
              {step > 1 ? <CheckCircle2 size={24} /> : (step === 1 ? <Loader2 size={24} className="animate-spin" /> : <Bluetooth size={24} />)}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-compost-900 text-lg">{step > 1 ? 'Handshake complete' : 'Saying hello...'}</h4>
              <p className="text-sm text-compost-500 font-medium">Connecting to your bin.</p>
            </div>
          </div>

          {/* Step 2 & 3 */}
          <div className={`flex items-center gap-5 p-5 rounded-3xl transition-all duration-500 ${step >= 2 ? 'bg-white shadow-sm border border-border' : 'opacity-40 grayscale'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${step > 2 ? 'bg-leaf-100 text-leaf-600' : 'bg-cream-100 text-compost-500'}`}>
              {step > 2 ? <CheckCircle2 size={24} /> : (step === 2 ? <Loader2 size={24} className="animate-spin" /> : <Sprout size={24} />)}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-compost-900 text-lg">{step > 2 ? 'Ready to compost' : 'Setting things up...'}</h4>
              <p className="text-sm text-compost-500 font-medium">Finalizing secure connection.</p>
            </div>
          </div>
        </div>

        {step === 3 && (
          <div className="mt-8 text-center animate-fade-in-up">
            <p className="text-leaf-900 font-bold bg-leaf-100 py-4 rounded-2xl border border-leaf-400 shadow-sm text-lg flex items-center justify-center gap-2">
              <CheckCircle2 size={20} /> Connected Successfully!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
