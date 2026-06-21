import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Mail, Lock, User, ArrowRight, Phone, Thermometer, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  
  // OTP state (6 separate inputs for visual flair)
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    // Auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otpValues];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtpValues(newOtp);
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (isRegister) {
        await register({ 
          email, 
          password, 
          display_name: displayName, 
          phone
        });
        setIsRegister(false);
        setPassword('');
        setSuccessMsg('Account created successfully. Please sign in.');
      } else {
        if (loginMethod === 'email') {
          await login(email, password);
          navigate('/dashboard');
        } else {
          if (!otpSent) {
            await requestOtp(phone);
            setOtpSent(true);
          } else {
            const code = otpValues.join('');
            if (code.length < 6) throw new Error("Please enter all 6 digits");
            await verifyOtp(phone, code);
            navigate('/dashboard');
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
    <div className="min-h-screen flex w-full bg-background font-sans">
      {/* LEFT PANEL - PREMIUM VISUALS */}
      <div className="hidden lg:flex w-1/2 bg-[#0B251C] relative items-center justify-center overflow-hidden">
        {/* Dynamic Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B251C] via-[#0F3528] to-[#0A1A14] z-0"></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[140px] animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#6EE7B7]/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-2xl animate-fade-in-up">
          <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex items-center justify-center mb-10 shadow-2xl ring-1 ring-white/5">
            <Leaf size={40} className="text-[#34D399]" strokeWidth={2} />
          </div>
          
          <h2 className="text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            The Future of <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#34D399] to-[#059669]">Smart Composting</span>
          </h2>
          
          <p className="text-[#A7F3D0]/70 text-lg max-w-md font-medium leading-relaxed mb-16">
            Monitor real-time telemetry, track waste cycles, and manage your ecosystem securely from the cloud.
          </p>
          
          {/* Decorative Mock UI Widget */}
          <div className="w-full max-w-md bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 flex flex-col gap-5 text-left shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] transform hover:scale-[1.02] transition-transform duration-500">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
                    <Thermometer className="text-[#34D399]" size={24}/>
                 </div>
                 <div>
                    <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-0.5">Internal Temp</div>
                    <div className="text-white font-extrabold text-2xl tracking-tight">54.2<span className="text-white/50 text-lg ml-1">°C</span></div>
                 </div>
              </div>
              <div className="px-4 py-1.5 bg-[#34D399]/10 text-[#34D399] text-xs font-bold uppercase tracking-wider rounded-full border border-[#34D399]/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse"></span>
                Active
              </div>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-to-r from-[#34D399] to-[#10B981] w-[75%] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - INTERACTIVE FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white relative">
         <div className="w-full max-w-[420px] animate-fade-in">
            {/* Mobile Logo Only */}
            <div className="lg:hidden flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald/10 rounded-xl flex items-center justify-center">
                  <Leaf className="text-emerald-dark" size={20} />
                </div>
                <span className="text-2xl font-bold text-text-primary">Rawbin</span>
              </div>
            </div>

            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors mb-8">
              <ArrowRight size={16} className="rotate-180" /> Back to Home
            </Link>

            <div className="mb-10">
              <h1 className="text-3xl font-extrabold text-text-primary tracking-tight mb-3">
                {isRegister ? 'Create an account' : 'Welcome back'}
              </h1>
              <p className="text-text-secondary font-medium">
                {isRegister 
                  ? 'Enter your details to join the Rawbin ecosystem.' 
                  : 'Enter your credentials to access your dashboard.'}
              </p>
            </div>

            {/* Login Method Toggle */}
            {!isRegister && (
              <div className="flex bg-gray-100/80 p-1.5 rounded-2xl mb-8 border border-gray-200/50">
                <button 
                  type="button"
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 disabled:opacity-50 ${loginMethod === 'email' ? 'bg-white shadow-sm text-text-primary scale-[1.02]' : 'text-text-secondary hover:text-text-primary'}`}
                  onClick={() => { setLoginMethod('email'); setError(''); setSuccessMsg(''); setOtpSent(false); }}
                  disabled={loading}
                >
                  Email
                </button>
                <button 
                  type="button"
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 disabled:opacity-50 ${loginMethod === 'phone' ? 'bg-white shadow-sm text-text-primary scale-[1.02]' : 'text-text-secondary hover:text-text-primary'}`}
                  onClick={() => { setLoginMethod('phone'); setError(''); setSuccessMsg(''); }}
                  disabled={loading}
                >
                  Phone (OTP)
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
              <fieldset disabled={loading} className="flex flex-col gap-5 border-none p-0 m-0 w-full group/form">
                
                {isRegister && (
                  <div className="flex flex-col gap-2">
                    <label className="text-text-primary text-sm font-bold">Full Name</label>
                    <div className="relative group">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald transition-colors" />
                      <input
                        type="text"
                        className="w-full bg-gray-50 border border-gray-200 text-text-primary text-sm rounded-2xl focus:ring-4 focus:ring-emerald/10 focus:border-emerald block pl-11 p-4 transition-all"
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
                    <div className={`flex flex-col gap-2 transition-all duration-500 ${otpSent ? 'opacity-50 scale-[0.98] pointer-events-none' : ''}`}>
                      <label className="text-text-primary text-sm font-bold">Phone Number</label>
                      <div className="relative group">
                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald transition-colors" />
                        <input
                          type="tel"
                          className="w-full bg-gray-50 border border-gray-200 text-text-primary text-sm rounded-2xl focus:ring-4 focus:ring-emerald/10 focus:border-emerald block pl-11 p-4 transition-all disabled:bg-gray-100"
                          placeholder="+1234567890"
                          pattern="^\+[1-9]\d{1,14}$"
                          title="Must include country code, e.g. +1 or +91"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {otpSent && (
                      <div className="flex flex-col gap-3 animate-fade-in-up mt-2">
                        <div className="flex justify-between items-end">
                           <label className="text-text-primary text-sm font-bold">Verification Code</label>
                           <button 
                             type="button" 
                             className="text-emerald text-xs font-bold hover:text-emerald-dark transition-colors"
                             onClick={() => { setOtpSent(false); setOtpValues(['','','','','','']); setError(''); }}
                           >
                             Change number
                           </button>
                        </div>
                        <div className="flex justify-between gap-2" onPaste={handlePaste}>
                          {otpValues.map((digit, index) => (
                            <input
                              key={index}
                              ref={el => otpRefs.current[index] = el}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(index, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(index, e)}
                              className="w-12 h-14 bg-gray-50 border border-gray-200 text-center text-xl font-bold text-text-primary rounded-xl focus:ring-4 focus:ring-emerald/10 focus:border-emerald transition-all outline-none"
                              required
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-text-primary text-sm font-bold">Email Address</label>
                      <div className="relative group">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald transition-colors" />
                        <input
                          type="email"
                          className="w-full bg-gray-50 border border-gray-200 text-text-primary text-sm rounded-2xl focus:ring-4 focus:ring-emerald/10 focus:border-emerald block pl-11 p-4 transition-all"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {isRegister && (
                      <div className="flex flex-col gap-2">
                        <label className="text-text-primary text-sm font-bold">Phone Number</label>
                        <div className="relative group">
                          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald transition-colors" />
                          <input
                            type="tel"
                            className="w-full bg-gray-50 border border-gray-200 text-text-primary text-sm rounded-2xl focus:ring-4 focus:ring-emerald/10 focus:border-emerald block pl-11 p-4 transition-all"
                            placeholder="+1234567890"
                            pattern="^\+[1-9]\d{1,14}$"
                            title="Must include country code, e.g. +1 or +91"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <label className="text-text-primary text-sm font-bold">Password</label>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald transition-colors" />
                        <input
                          type="password"
                          className="w-full bg-gray-50 border border-gray-200 text-text-primary text-sm rounded-2xl focus:ring-4 focus:ring-emerald/10 focus:border-emerald block pl-11 p-4 transition-all"
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

                {error && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 animate-fade-in-up">
                    <ShieldCheck size={18} className="shrink-0" />
                    {error}
                  </div>
                )}

                {successMsg && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 text-green-600 text-sm font-bold border border-green-100 animate-fade-in-up">
                    <ShieldCheck size={18} className="shrink-0" />
                    {successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-text-primary text-white text-sm font-bold mt-4 flex justify-center items-center gap-2 group/btn hover:bg-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <Activity size={20} className="animate-spin" />
                  ) : (
                    isRegister ? 'Create Account' : (
                      loginMethod === 'phone' && !otpSent ? 'Send Login Code' : 'Sign In'
                    )
                  )}
                  {!loading && <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />}
                </button>
              </fieldset>
            </form>

            <div className="mt-10 text-center">
              <span className="text-gray-500 font-medium text-sm">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
              </span>
              <button
                type="button"
                className="ml-2 text-text-primary font-bold text-sm hover:underline"
                onClick={() => { setIsRegister(!isRegister); setError(''); setSuccessMsg(''); }}
              >
                {isRegister ? 'Sign In' : 'Create Account'}
              </button>
            </div>
         </div>
      </div>
    </div>
  );
}
