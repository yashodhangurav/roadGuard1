import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { modalBackdrop, modalFrame } from '../../styles/motion';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const { login, signup, loginAsDemoUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Signup form state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forgotPasswordSubmitted, setForgotPasswordSubmitted] = useState(false);

  // Handle Mode Switch
  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!loginEmail.includes('@') || !loginEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const result = await login(loginEmail, loginPassword, rememberMe);
    setIsLoading(false);

    if (result.success) {
      setSuccessMessage('Welcome back! Logging you in...');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } else {
      setErrorMessage(result.error || 'Invalid credentials.');
    }
  };

  // Signup Handler
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@') || !signupEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 7) {
      setErrorMessage('Please enter a valid mobile phone number.');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('You must agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setIsLoading(true);
    const result = await signup({
      name: name.trim(),
      email: signupEmail.trim(),
      mobile: mobile.trim(),
      password: signupPassword,
    });
    setIsLoading(false);

    if (result.success) {
      setSuccessMessage('Citizen account created successfully! Accessing portal...');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } else {
      setErrorMessage(result.error || 'Could not create account.');
    }
  };

  // Quick Demo Login
  const handleQuickDemoLogin = () => {
    loginAsDemoUser();
    setSuccessMessage('Signed in as demo citizen (Marcus Vance)...');
    setTimeout(() => {
      onClose();
      if (onSuccess) onSuccess();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          variants={modalFrame}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-md rounded-2xl bg-[#0f1015]/95 border border-white/15 p-6 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.85)] z-10 text-left overflow-hidden my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Accent Glow */}
          <div
            className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#d97757]/15 blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
            aria-label="Close Authentication Modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#d97757]/15 border border-[#d97757]/30 flex items-center justify-center text-[#d97757]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-white">
                ROADGUARD <span className="text-[#d97757]">CITIZEN</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-400 block -mt-0.5">
                MUNICIPAL INFRASTRUCTURE PORTAL
              </span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight mt-3">
            {mode === 'login' ? 'Sign in to your account' : 'Create citizen reporter account'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {mode === 'login'
              ? 'Report potholes, track repair work orders, and receive municipal updates.'
              : 'Join thousands of citizens improving road safety and pavement quality.'}
          </p>

          {/* Tab Selector */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10 mt-5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#d97757] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#d97757] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error & Success Feedback Banners */}
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="mt-5 space-y-3.5">
              <div>
                <label className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757] transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider block">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordSubmitted(true)}
                    className="text-[11px] text-[#d97757] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Notice */}
              {forgotPasswordSubmitted && (
                <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] text-neutral-300">
                  Password reset link dispatched to registered email. For demo testing, you may log
                  in with any test password or use the demo button below.
                </div>
              )}

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-white/20 bg-black/60 text-[#d97757] accent-[#d97757] cursor-pointer"
                  />
                  <span className="text-xs text-neutral-400">Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-11 rounded-xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer ${
                  isLoading
                    ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed'
                    : 'bg-[#d97757] hover:bg-[#c66848] shadow-[0_0_20px_rgba(217,119,87,0.4)]'
                }`}
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Citizen Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Quick Demo Login Option */}
              <div className="pt-2 text-center">
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-mono">
                    <span className="bg-[#0f1015] px-2 text-neutral-500">Demo Testing</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="w-full py-2 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs text-neutral-300 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#d97757]" />
                  <span>One-Click Demo Login (Marcus Vance)</span>
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    autoComplete="name"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757] transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757] transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider block mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    autoComplete="tel"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      autoComplete="new-password"
                      required
                      className="w-full px-3 pr-8 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      {showSignupPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider block mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter"
                      autoComplete="new-password"
                      required
                      className="w-full px-3 pr-8 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-3.5 h-3.5 mt-0.5 rounded border-white/20 bg-black/60 text-[#d97757] accent-[#d97757] cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] text-neutral-400 leading-snug">
                    I agree to the RoadGuard{' '}
                    <span className="text-white hover:underline">Terms of Service</span> and consent
                    to GPS telemetry processing for municipal roadway maintenance.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-11 rounded-xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer ${
                  isLoading
                    ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed'
                    : 'bg-[#d97757] hover:bg-[#c66848] shadow-[0_0_20px_rgba(217,119,87,0.4)]'
                }`}
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Citizen Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer note */}
          <div className="mt-5 pt-3 border-t border-white/10 text-center text-[10px] text-neutral-500">
            Demo Mode: Credentials and session state are persisted locally in browser localStorage.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
