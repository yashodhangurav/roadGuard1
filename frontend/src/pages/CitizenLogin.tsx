import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EASE_SWIFT } from '../styles/motion';

export const CitizenLogin: React.FC = () => {
  const { login, loginAsDemoUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forgotPasswordSubmitted, setForgotPasswordSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const res = await login(email, password, rememberMe);
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage('Login successful! Redirecting to Citizen Portal...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } else {
      setErrorMessage(res.error || 'Invalid email or password.');
    }
  };

  const handleDemoLogin = () => {
    loginAsDemoUser();
    setSuccessMessage('Logged in as verified demo citizen!');
    setTimeout(() => {
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="py-12 md:py-20 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_SWIFT }}
          className="rounded-3xl border border-line-2 bg-gradient-to-b from-[#14151e]/95 to-[#0b0c10]/95 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl"
        >
          {/* Brand & Title */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line-2 flex items-center justify-center text-amber">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-semibold text-base tracking-tight text-white">
                ROADGUARD <span className="text-amber font-bold">AI</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Citizen Portal Login
            </h1>
            <p className="text-xs text-text-3 mt-1.5">
              Access your submitted road reports and municipal repair tracking.
            </p>
          </div>

          {/* Quick Demo Fill Pill */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full mb-6 py-2 px-3 rounded-xl border border-amber/35 bg-amber/10 hover:bg-amber/20 text-xs font-mono text-amber flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Click for One-Click Demo Citizen Login</span>
          </button>

          {/* Messages */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-text-3 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-line text-xs text-text placeholder-text-4 focus:outline-none focus:border-amber transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono text-text-3 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordSubmitted(!forgotPasswordSubmitted)}
                  className="text-[11px] text-amber hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface border border-line text-xs text-text placeholder-text-4 focus:outline-none focus:border-amber transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-4 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {forgotPasswordSubmitted && (
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-line text-[11px] font-mono text-amber">
                Demo environment: You can log in using any email and password (min 6 characters) or use the demo button above.
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-text-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-line bg-surface text-amber focus:ring-0 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 rounded-xl bg-amber hover:bg-[#c66848] text-white text-xs font-semibold shadow-[0_0_20px_rgba(217,119,87,0.35)] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer switch */}
          <div className="mt-6 pt-5 border-t border-line/60 text-center text-xs text-text-3">
            <span>Don't have an account? </span>
            <Link to="/signup" className="text-amber hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CitizenLogin;
