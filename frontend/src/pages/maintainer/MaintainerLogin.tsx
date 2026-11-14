import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HardHat,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { maintainerLogin, Maintainer } from '../../services/maintainerService';

interface MaintainerLoginProps {
  onLoginSuccess: (user: Maintainer) => void;
  onBackToHome?: () => void;
}

export const MaintainerLogin: React.FC<MaintainerLoginProps> = ({
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await maintainerLogin(email, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('maintainer2026');
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-text flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#d97757]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-[#111218] border border-[#d97757]/30 shadow-xl shadow-[#d97757]/10 mb-2">
            <HardHat className="w-8 h-8 text-[#d97757]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>RoadGuard</span>
            <span className="text-[#d97757]">Maintainer Portal</span>
          </h1>
          <p className="text-xs text-neutral-400">
            Dedicated field technician operations, GPS verification & AI repair sign-off.
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#111218]/90 border border-white/10 backdrop-blur-xl shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">
                Maintainer Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  required
                  placeholder="carlos.mendez@roadguard.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#d97757]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#d97757]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#d97757] hover:bg-[#c26244] text-white font-semibold text-xs shadow-lg shadow-[#d97757]/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating Crew...</span>
              ) : (
                <>
                  <span>Sign In to Field Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Quick Logins */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <span className="block text-[10px] font-mono uppercase text-neutral-500 text-center tracking-wider">
              Quick Fill Demo Maintainers
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('carlos.mendez@roadguard.ai')}
                className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left transition"
              >
                <div className="text-xs font-semibold text-white">Carlos Mendez</div>
                <div className="text-[10px] text-[#d97757]">Rapid Patch Division</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('aisha.khan@roadguard.ai')}
                className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left transition"
              >
                <div className="text-xs font-semibold text-white">Aisha Khan</div>
                <div className="text-[10px] text-amber-400">Heavy Asphalt Works</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex items-center justify-between text-xs text-neutral-500 px-2 font-mono">
          <Link to="/" className="hover:text-white transition">
            ← Citizen Reporting
          </Link>
          <Link to="/admin/login" className="hover:text-white transition">
            Administrator Portal →
          </Link>
        </div>
      </div>
    </div>
  );
};
