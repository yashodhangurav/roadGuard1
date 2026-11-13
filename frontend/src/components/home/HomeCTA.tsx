import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, Shield, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EASE_SWIFT, buttonMotion } from '../../styles/motion';

export const HomeCTA: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <section id="cta" className="py-24 md:py-32 relative z-10 border-t border-line/60">
      <div className="wrap">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE_SWIFT }}
          className="relative rounded-3xl border border-line-2 bg-gradient-to-b from-[#151622]/90 via-[#111219]/90 to-[#0a0a0f]/95 backdrop-blur-2xl p-8 sm:p-14 text-center overflow-hidden shadow-2xl"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber/40 bg-amber/10 text-xs font-mono text-amber mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
            <span>Autonomous Pavement Intelligence</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white max-w-3xl mx-auto leading-[1.08] mb-5">
            Modernize your road infrastructure monitoring today.
          </h2>

          {/* Lede */}
          <p className="text-base sm:text-lg text-text-2 max-w-2xl mx-auto leading-relaxed mb-8">
            Whether you are a municipal DPW engineer, transit corridor supervisor, or civic citizen, join us in building safer, pothole-free roadways.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <motion.button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
              className="btn btn-light btn-lg shadow-btn-light w-full sm:w-auto text-[15px]"
              {...buttonMotion}
            >
              <span>{isAuthenticated ? 'Open My Dashboard' : 'Get Started Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <motion.div {...buttonMotion} className="w-full sm:w-auto">
              <Link
                to="/detection"
                className="btn btn-ghost btn-lg border border-line-2 hover:border-line-3 bg-surface/70 w-full sm:w-auto text-[15px]"
              >
                <Eye className="w-4 h-4 text-amber" />
                <span>Explore Detection</span>
              </Link>
            </motion.div>
          </div>

          {/* Trust points */}
          <div className="mt-10 pt-8 border-t border-line/60 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-text-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>ASTM D6433 Standards</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>100% On-Edge Privacy Protection</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber" />
              <span>Zero Hardware Lock-In</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

