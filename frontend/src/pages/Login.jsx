import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { RiMailLine, RiCompass3Line, RiLockPasswordLine, RiShieldKeyholeLine, RiArrowLeftLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

const Login = () => {
  const { login, forgotPassword, resetPassword } = useApp();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Password visibility toggle states
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Forgot Password flow states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [testOtp, setTestOtp] = useState('');

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.log('Autoplay blocked:', err));
    }
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      const res = await forgotPassword(forgotEmail);
      setForgotStep(2);
      if (res && res.test_otp_code) {
        setTestOtp(res.test_otp_code);
      }
    } catch (err) {
      console.error(err);
      setForgotError(err.message || 'Account not found or system error.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotOtp || !newPass) return;
    setLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      await resetPassword(forgotEmail, forgotOtp, newPass);
      setForgotSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotOtp('');
        setNewPass('');
        setForgotSuccess('');
        setShowResetPassword(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      setForgotError(err.message || 'Invalid code or reset failed.');
    } finally {
      setLoading(false);
    }
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
        
        {/* Left Side: Brand Slogan & Welcome Panel (Desktop only) */}
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
              Optimize your workspace with <br />
              <span className="bg-gradient-to-r from-pink-655 via-fuchsia-600 to-violet-600 bg-clip-text text-transparent">speed and elegance.</span>
            </h1>
            
            <p className="text-slate-700 text-sm leading-relaxed max-w-lg font-medium drop-shadow-[0_1px_3px_rgba(255,255,255,0.5)]">
              Manage your project boards, assign checklist priorities, review comments timelines, and track monthly productivity metrics using a highly responsive, modern interface.
            </p>
          </motion.div>
 
          {/* Interactive Feature Pill Accents */}
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
 
        {/* Right Side: Form Card */}
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

            {!showForgotPassword ? (
              // Login Form View
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="lg:hidden w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-pink-500/20 mx-auto mb-4">
                    W
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Workspace Sign In</h2>
                  <p className="text-pink-655 text-xs font-bold mt-1.5">Enter your email and password to log in</p>
                </div>

                {errorMsg && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 rounded-2xl text-xs font-bold mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                    
                    <div className="flex justify-end mt-1.5">
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowForgotPassword(true);
                          setForgotStep(1);
                          setForgotError('');
                          setForgotSuccess('');
                          setForgotEmail('');
                          setShowPassword(false);
                        }}
                        className="text-[10px] text-pink-655 hover:text-pink-700 font-extrabold transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full btn-primary mt-6 py-3.5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    <RiCompass3Line className="text-sm animate-pulse" />
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>

                <p className="text-center text-slate-600 text-xs mt-6 font-medium">
                  New to the workspace? <Link to="/register" className="text-pink-655 hover:text-pink-700 font-bold transition-colors">Create credentials</Link>
                </p>
              </div>
            ) : (
              // Forgot Password Flow View
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    className="p-1.5 rounded-xl bg-white/50 border border-slate-200 hover:bg-white/90 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                  >
                    <RiArrowLeftLine className="text-sm" />
                  </button>
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Back to Login</span>
                </div>

                <div className="text-center mb-8">
                  <RiShieldKeyholeLine className="text-4xl text-pink-500 mx-auto mb-3 animate-bounce" />
                  <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
                  <p className="text-pink-655 text-xs font-bold mt-1.5">
                    {forgotStep === 1 ? 'Enter your email to receive a reset code' : 'Enter the code and set your new password'}
                  </p>
                </div>

                {forgotError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 rounded-2xl text-xs font-bold mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {forgotError}
                  </div>
                )}

                {forgotSuccess && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-2xl text-xs font-bold mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {forgotSuccess}
                  </div>
                )}

                {forgotStep === 1 ? (
                  // Step 1: Submit email
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 text-sm z-10" />
                        <input 
                          type="email" 
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          style={{ paddingLeft: '34px' }}
                          className="w-full pl-9 pr-4 py-2.5 text-xs bg-white/60 border border-slate-200 focus:outline-none focus:border-pink-500 text-slate-900 placeholder-slate-400 rounded-2xl transition-all" 
                          placeholder="you@workspace.com" 
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading || !forgotEmail}
                      className="w-full btn-primary py-3.5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/20 transition-all cursor-pointer active:scale-95"
                    >
                      {loading ? 'Sending Code...' : 'Send Reset Code'}
                    </button>
                  </form>
                ) : (
                  // Step 2: Submit OTP & new password
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    {testOtp && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-2xl text-xs font-bold text-center">
                        💡 Helper Reset OTP: <strong className="text-emerald-900 underline tracking-wider">{testOtp}</strong>
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-755 mb-2 uppercase tracking-wider text-center">
                        Enter 6-Digit Reset Code
                      </label>
                      <input 
                        type="text" 
                        maxLength="6"
                        required
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center text-lg font-bold tracking-[8px] bg-white/60 border border-slate-200 focus:outline-none focus:border-pink-500 text-slate-900 transition-all py-3.5 rounded-2xl" 
                        placeholder="000000" 
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">New Password</label>
                      <div className="relative">
                        <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 text-sm z-10" />
                        <input 
                          type={showResetPassword ? "text" : "password"}
                          required
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          style={{ paddingLeft: '34px', paddingRight: '40px' }}
                          className="w-full pl-9 pr-10 py-2.5 text-xs bg-white/60 border border-slate-200 focus:outline-none focus:border-pink-500 text-slate-900 placeholder-slate-400 rounded-2xl transition-all" 
                          placeholder="••••••••" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-20 cursor-pointer"
                        >
                          {showResetPassword ? <RiEyeOffLine className="text-sm" /> : <RiEyeLine className="text-sm" />}
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading || forgotOtp.length !== 6 || !newPass}
                      className="w-full btn-primary py-3.5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/20 transition-all cursor-pointer active:scale-95"
                    >
                      {loading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                  </form>
                )}

                <p className="text-center text-slate-500 text-[10px] mt-6 italic">
                  *Check your backend server console logs to read your local OTP preview link if using Ethereal Mail testing server.
                </p>
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Login;
