import { useState, useEffect } from 'react';
import { X, Search, ShieldCheck, Bluetooth, Loader2, CheckCircle2 } from 'lucide-react';

export default function PairingModal({ isOpen, onClose, onComplete }: any) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      return;
    }

    let timer: NodeJS.Timeout;
    if (step === 0) {
      // Step 0: Searching
      timer = setTimeout(() => setStep(1), 2000);
    } else if (step === 1) {
      // Step 1: Found, generating challenge
      timer = setTimeout(() => setStep(2), 2500);
    } else if (step === 2) {
      // Step 2: Verifying signature
      timer = setTimeout(() => setStep(3), 2000);
    } else if (step === 3) {
      // Step 3: Success!
      timer = setTimeout(() => onComplete(), 1500);
    }

    return () => clearTimeout(timer);
  }, [isOpen, step, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-text-primary/20 backdrop-blur-sm animate-fade-in">
      <div className="organic-card w-full max-w-md p-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary transition-colors rounded-full hover:bg-background"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary">Pair Hardware</h2>
          <p className="text-text-secondary text-sm">Secure HMAC-SHA256 Bluetooth Setup</p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Step 0 & 1 */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${step >= 0 ? 'bg-background border border-border' : 'opacity-30 grayscale'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step > 0 ? 'bg-emerald/10 text-emerald-dark' : 'bg-primary/10 text-primary-dark'}`}>
              {step > 0 ? <CheckCircle2 size={24} /> : <Search size={24} className="animate-pulse" />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-text-primary">{step > 0 ? 'Device Found' : 'Scanning Nearby...'}</h4>
              <p className="text-xs text-text-secondary font-medium">Looking for active Rawbin units.</p>
            </div>
          </div>

          {/* Step 1 & 2 */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${step >= 1 ? 'bg-background border border-border' : 'opacity-30 grayscale'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step > 1 ? 'bg-emerald/10 text-emerald-dark' : 'bg-primary/10 text-primary-dark'}`}>
              {step > 1 ? <CheckCircle2 size={24} /> : (step === 1 ? <Loader2 size={24} className="animate-spin" /> : <Bluetooth size={24} />)}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-text-primary">{step > 1 ? 'Challenge Accepted' : 'Cryptographic Handshake'}</h4>
              <p className="text-xs text-text-secondary font-medium">Transmitting secure random seed.</p>
            </div>
          </div>

          {/* Step 2 & 3 */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${step >= 2 ? 'bg-background border border-border' : 'opacity-30 grayscale'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step > 2 ? 'bg-emerald/10 text-emerald-dark' : 'bg-primary/10 text-primary-dark'}`}>
              {step > 2 ? <CheckCircle2 size={24} /> : (step === 2 ? <Loader2 size={24} className="animate-spin" /> : <ShieldCheck size={24} />)}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-text-primary">{step > 2 ? 'Signature Verified' : 'Verifying HMAC'}</h4>
              <p className="text-xs text-text-secondary font-medium">Computing SHA-256 local signature.</p>
            </div>
          </div>
        </div>

        {step === 3 && (
          <div className="mt-8 text-center animate-fade-in-up">
            <p className="text-emerald-dark font-bold bg-emerald/10 py-3 rounded-xl border border-emerald/20">
              Connection Secured!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
