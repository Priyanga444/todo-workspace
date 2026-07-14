import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { RiMailLine, RiLockPasswordLine, RiUserLine, RiUserAddLine, RiGroupLine, RiShieldKeyholeLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

const Register = () => {
  const { register: registerUser, verifyOtp, setWorkspaceMode } = useApp();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Password visibility toggle state
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.log('Autoplay blocked:', err));
    }
  }, []);

  // Registration flow stages: basic form -> OTP verify -> mode selector
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [testOtp, setTestOtp] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await registerUser(data.name, data.email, data.password);
      if (res && res.requiresOtp) {
        setOtpEmail(res.email);
        setShowOtpScreen(true);
        if (res.test_otp_code) {
          setTestOtp(res.test_otp_code);
        }
      } else {
        setShowModeSelection(true);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOtpError('');
    try {
      await verifyOtp(otpEmail, otpCode);
      setShowModeSelection(true);
      setShowOtpScreen(false);
    } catch (err) {
      console.error(err);
      setOtpError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMode = (mode) => {
    setWorkspaceMode(mode);
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen moving-mesh-bg text-slate-900 overflow-hidden relative">
      
      {/* Premium Full-Screen Background Video Loop */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 select-none pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-[1.05] opacity-45"
          style={{ filter: 'brightness(1.05) contrast(0.95) saturate(1.0)' }}
        >
          <source
            src="/auth-bg.mp4"
            type="video/mp4"
          />
        </video>
        {/* Soft light readability overlay */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] bg-gradient-to-t from-white/70 via-transparent to-white/50" />
      </div>

      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl mx-auto items-center p-4 sm:p-8 relative z-10">
        
        {/* Left Side: Slogan Panel (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center pr-12 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-pink-500/20">
                W
              </div>
              <span className="font-extrabold text-xl text-slate-900 tracking-wider">Workspace</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-slate-900 drop-shadow-[0_1px_5px_rgba(255,255,255,0.6)]">
              Plan and execute project <br />
              <span className="bg-gradient-to-r from-pink-655 via-fuchsia-600 to-violet-600 bg-clip-text text-transparent">milestones seamlessly.</span>
            </h1>
            
            <p className="text-slate-700 text-sm leading-relaxed max-w-lg font-medium drop-shadow-[0_1px_3px_rgba(255,255,255,0.5)]">
              Unlock productivity by setting tasks checklist targets, checking project hourly timelines, setting scheduled reminders email alerts, and tracking weekly performance metrics.
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-3 pt-4">
            {['Kanban Board', 'Interactive Timeline', 'Workspace Analytics', 'Secure Sessions'].map((feature, idx) => (
              <motion.span
                key={feature}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * idx, duration: 0.5 }}
                className="px-4 py-2 bg-white/70 border border-slate-200/50 rounded-2xl text-xs font-bold text-slate-700 shadow-sm"
              >
                {feature}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Right Side: Form Card / Mode Selection */}
        <div className="col-span-1 lg:col-span-5 flex justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ 
              opacity: 1, 
              y: [0, -6, 0],
              transition: { 
                y: {
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 6,
                  ease: "easeInOut"
                },
                opacity: { duration: 0.8 }
              }
            }}
            whileHover={{ scale: 1.01 }}
            className="glass-card w-full max-w-md p-8 relative overflow-hidden"
          >
            {/* Soft glowing ambient circle behind form */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-pink-300/30 blur-[50px] pointer-events-none rounded-full" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-violet-300/20 blur-[50px] pointer-events-none rounded-full" />

            {!showModeSelection ? (
              !showOtpScreen ? (
                // Stage 1: Basic Register Form
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className="lg:hidden w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-pink-500/20 mx-auto mb-4">
                      W
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
                    <p className="text-pink-655 text-xs font-bold mt-1.5">Sign up to spawn your workspace console</p>
                  </div>

                  {errorMsg && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 rounded-2xl text-xs font-bold mb-5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">Full Name</label>
                      <div className="relative">
                        <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 text-sm z-10" />
                        <input 
                          type="text" 
                          {...register('name', { required: 'Name is required' })}
                          style={{ paddingLeft: '34px' }}
                          className="w-full pl-9 pr-4 py-2.5 text-xs bg-white/60 border border-slate-200 focus:outline-none focus:border-pink-500 text-slate-900 placeholder-slate-400 rounded-2xl transition-all" 
                          placeholder="name" 
                        />
                      </div>
                      {errors.name && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 text-sm z-10" />
                        <input 
                          type="email" 
                          {...register('email', { required: 'Email is required' })}
                          style={{ paddingLeft: '34px' }}
                          className="w-full pl-9 pr-4 py-2.5 text-xs bg-white/60 border border-slate-200 focus:outline-none focus:border-pink-500 text-slate-900 placeholder-slate-400 rounded-2xl transition-all" 
                          placeholder="you@workspace.com" 
                        />
                      </div>
                      {errors.email && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.email.message}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 text-sm z-10" />
                        <input 
                          type={showPassword ? "text" : "password"}
                          {...register('password', { required: 'Password is required' })}
                          style={{ paddingLeft: '34px', paddingRight: '40px' }}
                          className="w-full pl-9 pr-10 py-2.5 text-xs bg-white/60 border border-slate-200 focus:outline-none focus:border-pink-500 text-slate-900 placeholder-slate-400 rounded-2xl transition-all" 
                          placeholder="••••••••" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-20 cursor-pointer"
                        >
                          {showPassword ? <RiEyeOffLine className="text-sm" /> : <RiEyeLine className="text-sm" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.password.message}</p>}
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full btn-primary mt-6 py-3.5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/20 transition-all cursor-pointer active:scale-95"
                    >
                      <RiUserAddLine className="text-sm" />
                      {loading ? 'Registering...' : 'Register'}
                    </button>
                  </form>

                  <p className="text-center text-slate-600 text-xs mt-6 font-medium">
                    Already registered? <Link to="/" className="text-pink-655 hover:text-pink-700 font-bold transition-colors">Sign in here</Link>
                  </p>
                </div>
              ) : (
                // Stage 2: OTP Verification Form (Vibrant & Centered)
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <RiShieldKeyholeLine className="text-4xl text-pink-500 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-2xl font-bold text-slate-900">Verify Email</h2>
                    <p className="text-slate-700 text-xs font-bold mt-2.5">
                      We sent a 6-digit OTP code to <br />
                      <strong className="text-slate-900">{otpEmail}</strong>
                    </p>
                  </div>

                  {otpError && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 rounded-2xl text-xs font-bold mb-5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      {otpError}
                    </div>
                  )}

                  {testOtp && (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-2xl text-xs font-bold text-center mb-5">
                      💡 Helper Verification OTP: <strong className="text-emerald-900 underline tracking-wider">{testOtp}</strong>
                    </div>
                  )}

                  <form onSubmit={handleVerifyOtpSubmit} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-755 mb-2 uppercase tracking-wider text-center">
                        Enter 6-Digit OTP Code
                      </label>
                      <input 
                        type="text" 
                        maxLength="6"
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center text-lg font-bold tracking-[8px] bg-white/60 border border-slate-200 focus:outline-none focus:border-pink-500 text-slate-900 transition-all py-3.5 rounded-2xl" 
                        placeholder="000000" 
                        autoFocus
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading || otpCode.length !== 6}
                      className="w-full btn-primary py-3 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                    >
                      {loading ? 'Verifying Code...' : 'Verify & Log In'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpScreen(false);
                        setOtpCode('');
                        setOtpError('');
                      }}
                      className="w-full py-2.5 rounded-2xl bg-white/40 hover:bg-white/60 border border-slate-200/50 text-xs font-bold transition-all text-slate-700 cursor-pointer"
                    >
                      Back to Registration
                    </button>
                  </form>

                  <p className="text-center text-slate-500 text-[10px] mt-6 italic">
                    *Check your backend server console logs to read your local OTP preview link if using Ethereal Mail testing server.
                  </p>
                </div>
              )
            ) : (
              // Stage 3: Workspace Onboarding Selector
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Workspace Setup</h2>
                  <p className="text-pink-655 text-xs font-bold mt-2">Choose how you want to organize tasks</p>
                </div>

                <div className="space-y-4">
                  {/* Personal Mode Card */}
                  <div 
                    onClick={() => handleSelectMode('single')}
                    className="p-5 rounded-2xl bg-white/60 border border-slate-200 hover:border-pink-500 cursor-pointer transition-all flex items-start gap-4 group"
                  >
                    <div className="p-2.5 rounded-xl bg-pink-500/15 text-pink-600 border border-slate-200/50 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                      <RiUserLine className="text-xl" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-pink-600 transition-colors">Personal Workspace</h4>
                      <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                        For tracking individual work. Hides assignee dropdowns, project member counts, and team settings to keep you focused.
                      </p>
                    </div>
                  </div>

                  {/* Team Mode Card */}
                  <div 
                    onClick={() => handleSelectMode('team')}
                    className="p-5 rounded-2xl bg-white/60 border border-slate-200 hover:border-pink-500 cursor-pointer transition-all flex items-start gap-4 group"
                  >
                    <div className="p-2.5 rounded-xl bg-pink-500/15 text-pink-600 border border-slate-200/50 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                      <RiGroupLine className="text-xl" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-pink-600 transition-colors">Team Collaboration</h4>
                      <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                        For projects with multiple members. Add teammates, assign specific tasks, and review workloads together.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-[10px] text-slate-500 italic mt-6">
                  *You can change this setting at any time using the workspace switch in the sidebar.
                </p>
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Register;
