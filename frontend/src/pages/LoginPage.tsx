import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Mail, Lock, User, ArrowRight, Phone, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  
  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register({ 
          email, 
          password, 
          display_name: displayName, 
          phone: phone || undefined 
        });
        navigate('/');
      } else {
        if (loginMethod === 'email') {
          await login(email, password);
          navigate('/');
        } else {
          if (!otpSent) {
            await requestOtp(phone);
            setOtpSent(true);
          } else {
            await verifyOtp(phone, otpCode);
            navigate('/');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-emerald/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="organic-card w-full max-w-md p-10 relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald/10 text-emerald-dark mb-6">
            <Leaf size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">Rawbin</h1>
          <p className="text-text-secondary font-medium">
            {isRegister ? 'Create your smart ecosystem account' : 'Sign in to your dashboard'}
          </p>
        </div>

        {!isRegister && (
          <div className="flex bg-background p-1 rounded-2xl mb-8 border border-border">
            <button 
              type="button"
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${loginMethod === 'email' ? 'bg-white shadow-organic-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              onClick={() => { setLoginMethod('email'); setError(''); setOtpSent(false); }}
            >
              Email
            </button>
            <button 
              type="button"
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${loginMethod === 'phone' ? 'bg-white shadow-organic-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              onClick={() => { setLoginMethod('phone'); setError(''); }}
            >
              Phone
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="text-text-secondary text-xs font-bold uppercase tracking-wider pl-1">Full Name</label>
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  className="input-field pl-12 py-3.5"
                  placeholder="Jane Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {(!isRegister && loginMethod === 'phone') ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary text-xs font-bold uppercase tracking-wider pl-1">Phone Number</label>
                <div className="relative">
                  <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="tel"
                    className="input-field pl-12 py-3.5"
                    placeholder="+1234567890"
                    pattern="^\+[1-9]\d{1,14}$"
                    title="Must include country code, e.g. +1 or +91"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={otpSent}
                  />
                </div>
              </div>

              {otpSent && (
                <div className="flex flex-col gap-1.5 animate-fade-in-up mt-2">
                  <label className="text-text-secondary text-xs font-bold uppercase tracking-wider pl-1">6-Digit Code</label>
                  <div className="relative">
                    <KeyRound size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      className="input-field pl-12 py-3.5 text-center tracking-[0.5em] font-bold text-lg"
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                    />
                  </div>
                  <button 
                    type="button" 
                    className="text-emerald text-sm font-medium mt-2 hover:underline self-start"
                    onClick={() => { setOtpSent(false); setOtpCode(''); setError(''); }}
                  >
                    Change phone number
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary text-xs font-bold uppercase tracking-wider pl-1">Email</label>
                <div className="relative">
                  <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    className="input-field pl-12 py-3.5"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {isRegister && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-secondary text-xs font-bold uppercase tracking-wider pl-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="tel"
                      className="input-field pl-12 py-3.5"
                      placeholder="+1234567890"
                      pattern="^\+[1-9]\d{1,14}$"
                      title="Must include country code, e.g. +1 or +91"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary text-xs font-bold uppercase tracking-wider pl-1">Password</label>
                <div className="relative">
                  <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="password"
                    className="input-field pl-12 py-3.5"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </>
          )}

          {error && <div className="p-4 rounded-xl bg-alert/10 text-alert-dark text-sm font-medium border border-alert/20">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-full py-4 text-base font-bold mt-2 flex justify-center items-center gap-2 group"
            disabled={loading}
          >
            {loading ? 'Processing…' : (
              isRegister ? 'Create Account' : (
                loginMethod === 'phone' && !otpSent ? 'Send Login Code' : 'Sign In to Dashboard'
              )
            )}
            {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <span className="text-text-secondary font-medium">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            type="button"
            className="ml-2 text-emerald font-bold hover:underline"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
