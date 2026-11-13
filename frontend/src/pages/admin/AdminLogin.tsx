import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { authenticateAdmin } from '../../services/adminService';
import { AdminUser } from '../../data/adminDemoData';

interface AdminLoginProps {
  onLoginSuccess: (admin: AdminUser) => void;
  onBackToHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  const handleFillDemo = () => {
    setEmail('admin@roadguard.ai');
    setPassword('admin2026');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid administrator email.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must contain at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authenticateAdmin(email.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotSent(true);
    setTimeout(() => setForgotSent(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#07080b] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Decorative background grid and amber glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] bg-[#d97757]/10 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Back Nav */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Public Website</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Icon & Heading */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#d97757]/15 border border-[#d97757]/40 text-[#d97757] shadow-[0_0_30px_rgba(217,119,87,0.25)]">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Administrator Portal
          </h2>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            Authorized access for municipal road authorities, public works engineers, and emergency dispatch supervisors.
          </p>
        </div>

        {/* Demo Credentials Quick Banner */}
        <div className="mb-4 p-3.5 rounded-2xl bg-[#111218]/90 border border-[#d97757]/30 shadow-lg text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#d97757] font-mono font-bold text-[11px] uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Demo Administrator Access</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#d97757] hover:bg-[#c66848] text-white transition cursor-pointer"
            >
              Auto-Fill
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-400 pt-1 border-t border-white/5">
            <div>
              <span className="text-neutral-500">Email: </span>
              <span className="text-neutral-200">admin@roadguard.ai</span>
            </div>
            <div>
              <span className="text-neutral-500">Pass: </span>
              <span className="text-neutral-200">admin2026</span>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-[#111218] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Forgot Password Confirmation */}
          {forgotSent && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Municipal password reset token dispatched to administrator inbox.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Administrator Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@roadguard.ai"
                  required
                  autoComplete="username"
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-[#d97757]/80 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-[#d97757] hover:underline font-mono"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-[#d97757]/80 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0d0e14] border-white/15 text-[#d97757] focus:ring-0 accent-[#d97757]"
                />
                <span>Remember this terminal session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white bg-[#d97757] hover:bg-[#c66848] transition shadow-[0_0_20px_rgba(217,119,87,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Log In to Municipal Console</span>
                </>
              )}
            </button>
          </form>

          {/* Footer badge */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] font-mono text-neutral-500">
            <Cpu className="w-3.5 h-3.5 text-[#d97757]" />
            <span>FIPS 140-2 Level 3 Secure Telemetry</span>
          </div>
        </div>
      </div>
    </div>
  );
};
