import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EASE_SWIFT } from '../styles/motion';

export const CitizenSignup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('You must accept the Terms of Service.');
      return;
    }

    setIsLoading(true);
    const res = await signup({ name, email, mobile, password });
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage('Account registered successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } else {
      setErrorMessage(res.error || 'Failed to create account.');
    }
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
          {/* Brand & Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
              <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line-2 flex items-center justify-center text-amber">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-semibold text-base tracking-tight text-white">
                ROADGUARD <span className="text-amber font-bold">AI</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Create Citizen Account
            </h1>
            <p className="text-xs text-text-3 mt-1">
              Join your community to report and track neighborhood road hazards.
            </p>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono text-text-3 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-4" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Marcus Vance"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface border border-line text-xs text-text placeholder-text-4 focus:outline-none focus:border-amber transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-text-3 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marcus@example.com"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface border border-line text-xs text-text placeholder-text-4 focus:outline-none focus:border-amber transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-text-3 uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-4" />
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface border border-line text-xs text-text placeholder-text-4 focus:outline-none focus:border-amber transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-text-3 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-9 py-2 rounded-xl bg-surface border border-line text-xs text-text placeholder-text-4 focus:outline-none focus:border-amber transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-4 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-text-3 uppercase tracking-wider mb-1">
                  Confirm
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-4" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-9 py-2 rounded-xl bg-surface border border-line text-xs text-text placeholder-text-4 focus:outline-none focus:border-amber transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-4 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-text-2">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-line bg-surface text-amber focus:ring-0 mt-0.5 cursor-pointer"
                />
                <span>
                  I agree to the Terms of Service, Civic Privacy Policies, and automated edge analysis disclosures.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-2.5 rounded-xl bg-amber hover:bg-[#c66848] text-white text-xs font-semibold shadow-[0_0_20px_rgba(217,119,87,0.35)] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer switch */}
          <div className="mt-5 pt-4 border-t border-line/60 text-center text-xs text-text-3">
            <span>Already have an account? </span>
            <Link to="/login" className="text-amber hover:underline font-semibold">
              Log in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CitizenSignup;

