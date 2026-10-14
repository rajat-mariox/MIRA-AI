import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ChevronLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useAppDispatch } from "../hooks/reduxHooks";
import { setCredentials } from "../app/features/auth/authSlice";
import { getErrorMessage } from '../lib/errors';

const Login: React.FC = () => {
  const [step, setStep] = useState<'login' | 'forgot' | 'otp' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resetSuccessPopup, setResetSuccessPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');
    setSuccessMsg('');

    let hasError = false;
    if (!email) {
      setEmailError('Email address is required');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      const body = await authService.login(email, password);
      const token = body.data?.token || body.data?.accessToken;
      const user = body.data?.user || body.data?.admin || { name: 'Admin', email };

      if (token) {
        // setCredentials also persists token + user to localStorage
        dispatch(setCredentials({ token, user }));
        navigate("/");
      } else {
        setError('Invalid server response: Access token missing.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid credentials. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0 && step === 'otp') {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, step]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resetSuccessPopup) {
      timer = setTimeout(() => {
        setResetSuccessPopup(false);
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [resetSuccessPopup]);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Email address is required');
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccessMsg('If this email belongs to an admin, a 6-digit OTP has been sent to it.');
      setStep('otp');
      setCountdown(30);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send OTP. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');

    if (otpValue.length < 6) {
      setError('Please fill out the complete 6-digit OTP.');
      setSuccessMsg('');
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyOtp(email, otpValue);
      setStep('reset');
      setError('');
      setSuccessMsg('');
      setPassword(''); // Clear fields for new password
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid OTP. Please try again.'));
      setSuccessMsg('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isLoading) return;
    setSuccessMsg('');
    setError('');
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setOtp(['', '', '', '', '', '']);
      setCountdown(30);
      setSuccessMsg('A new OTP has been sent to your email.');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to resend OTP. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Both fields must be filled');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const otpValue = otp.join('');
      await authService.resetPassword(email, otpValue, password);
      setStep('login');
      setPassword('');
      setConfirmPassword('');
      setOtp(['', '', '', '', '', '']);
      setResetSuccessPopup(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reset password. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-transparent relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(69,202,255,0.15),transparent_50%)]" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(255,27,107,0.15),transparent_50%)]" />

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="glass-card rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-40 h-40 flex items-center justify-center mb-4 animate-pulse-slow">
              <img
                src="/logo-light.png"
                alt="MIRAI Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-extrabold text-white text-center">
              {step === 'login' ? 'Admin Portal' : step === 'forgot' ? 'Recover Access' : step === 'otp' ? 'Verify OTP' : 'Enter a new password'}
            </h1>
            <p className="text-white/40 mt-2 text-center">
              {step === 'login' && 'MIRA-AI Management Interface'}
              {step === 'forgot' && 'Enter your email to receive a recovery code'}
              {step === 'otp' && `We've sent a 6-digit code to ${email}`}
              {step === 'reset' && 'Confirm your password to continue'}
            </p>
            {step === 'reset' && (
              <p className="text-[10px] text-brand-cyan/60 font-medium uppercase tracking-wider mt-2 animate-pulse">
                Both fields must be filled
              </p>
            )}
          </div>

          {successMsg && !resetSuccessPopup && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm py-3 px-4 rounded-xl mb-6 text-center animate-in fade-in zoom-in-95">
              {successMsg}
            </div>
          )}

          {resetSuccessPopup && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm py-3 px-4 rounded-xl mb-6 text-center animate-in fade-in zoom-in-95">
              Password has been successfully reset. Please log in.
            </div>
          )}

          {step === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/60 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    className={`w-full bg-white/5 border ${emailError ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-brand-cyan/50'} rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 transition-all font-medium`}
                    placeholder="admin@mira.ai"
                  />
                </div>
                {emailError && (
                  <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5 ml-1 animate-in slide-in-from-top-1 fade-in duration-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-medium text-white/60">Password</label>
                  <button
                    type="button"
                    onClick={() => setStep('forgot')}
                    className="text-xs text-brand-cyan hover:underline transition-all"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    className={`w-full bg-white/5 border ${passwordError ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-brand-cyan/50'} rounded-xl py-3 pl-10 pr-12 text-white focus:outline-none focus:ring-2 transition-all font-medium`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg transition-all"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5 text-white/40" />
                    ) : (
                      <Eye 
                        stroke="white" 
                        className="w-4.5 h-4.5 text-white stroke-[2.5px] drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" 
                      />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5 ml-1 animate-in slide-in-from-top-1 fade-in duration-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2.5 px-4 rounded-xl animate-in fade-in zoom-in-95">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-gradient hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-brand-pink/25 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>
            </form>
          )}

          {step === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-6" noValidate>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/60 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 transition-all font-medium"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2.5 px-4 rounded-xl animate-in fade-in zoom-in-95">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-gradient hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-brand-pink/25 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
              </button>

              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full flex items-center justify-center gap-2 text-sm text-white/30 hover:text-white transition-colors capitalize font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Login
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && idx > 0) {
                        document.getElementById(`otp-${idx - 1}`)?.focus();
                      }
                    }}
                    className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 transition-all"
                  />
                ))}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2.5 px-4 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-brand-gradient hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-brand-pink/25"
              >
                Verify Code
              </button>

              <div className="text-center flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                  className={`text-sm transition-colors ${countdown > 0 ? 'text-white/30 cursor-not-allowed' : 'text-brand-cyan hover:underline'}`}
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('forgot'); setCountdown(0); }}
                  className="text-xs text-white/30 hover:text-white transition-colors"
                >
                  Change Email Address
                </button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-6" noValidate>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/60 ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 transition-all font-medium"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg transition-all"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5 text-white/40" />
                    ) : (
                      <Eye 
                        stroke="white" 
                        className="w-4.5 h-4.5 text-white stroke-[2.5px] drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" 
                      />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-white/60 ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 transition-all font-medium"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg transition-all"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4.5 h-4.5 text-white/40" />
                    ) : (
                      <Eye 
                        stroke="white" 
                        className="w-4.5 h-4.5 text-white stroke-[2.5px] drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" 
                      />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2.5 px-4 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-gradient hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-brand-pink/25 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Password'}
              </button>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-white/5 flex justify-center">
            <p className="text-white/30 text-xs text-center leading-relaxed">
              Protected by MIRA-AI Security Protocol.<br />
              Unauthorized access is strictly prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
