import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Eye, Sparkles, Shield, Cpu, Activity } from 'lucide-react';
import { EASE_SWIFT, buttonMotion } from '../../styles/motion';

interface HomeHeroProps {
  onOpenDemo?: () => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ onOpenDemo }) => {
  return (
    <section id="hero" className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-clip">
      {/* Dual Radial Sky Glow matching Aloud .hero-sky */}
      <div className="hero-sky pointer-events-none relative z-0" aria-hidden="true" />

      <div className="wrap flex flex-col items-center text-center relative z-10">
        {/* Brand Tag / Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_SWIFT }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-line-2 bg-surface/80 backdrop-blur-md text-xs font-mono text-text-2 mb-6 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
          <span className="text-white font-semibold">ROADGUARD AI</span>
          <span className="text-text-4">·</span>
          <span>Next-Gen Infrastructure Telemetry</span>
        </motion.div>

        {/* Fluid Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_SWIFT }}
          className="hero-title text-[clamp(34px,7.8vw,100px)] font-normal leading-[1.05] sm:leading-[0.98] tracking-[-0.04em] sm:tracking-[-0.055em] hero-title-gradient pb-2 max-w-5xl"
        >
          Intelligent Road Monitoring.<br />
          Safer Roads.
        </motion.h1>

        {/* Hero Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.15, ease: EASE_SWIFT }}
          className="mt-5 sm:mt-7 max-w-[660px] text-text-2 text-[clamp(15px,1.6vw,20px)] leading-[1.58] tracking-[-0.01em]"
        >
          An AI-powered platform that detects road damage, maps potholes and transforms road images into actionable infrastructure intelligence.
        </motion.p>

        {/* Hero Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.25, ease: EASE_SWIFT }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8 sm:mt-10 w-full max-w-xs sm:max-w-none"
        >
          {/* Explore Platform Button */}
          <motion.div {...buttonMotion} className="w-full sm:w-auto">
            <Link
              to="/detection"
              className="btn btn-light btn-lg shadow-btn-light w-full sm:w-auto text-[15px]"
            >
              <Eye className="w-4 h-4 text-amber" />
              <span>Explore Platform</span>
              <ArrowRight className="w-4 h-4 text-text-3" />
            </Link>
          </motion.div>

          {/* View Live Demo Button */}
          <motion.button
            onClick={() => {
              if (onOpenDemo) onOpenDemo();
              else window.dispatchEvent(new CustomEvent('open-demo-video'));
            }}
            className="btn btn-ghost btn-lg w-full sm:w-auto text-[15px] border border-line-2 bg-surface/60 hover:bg-surface-2 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Play className="w-4 h-4 fill-current text-amber" />
            <span>View Live Demo</span>
          </motion.button>
        </motion.div>

        {/* Visual Teaser & Quick Specs Banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: EASE_SWIFT }}
          className="mt-12 sm:mt-16 w-full max-w-4xl"
        >
          <div className="relative rounded-2xl border border-line-2 bg-gradient-to-b from-[#13141c]/90 to-[#0a0a0f]/90 backdrop-blur-xl p-5 sm:p-7 shadow-2xl overflow-hidden">
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber/10 rounded-full blur-3xl pointer-events-none" />

            {/* Quick Interactive Telemetry Ribbon */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-line/60 pb-5">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-amber/15 border border-amber/30 flex items-center justify-center text-amber shrink-0 shadow-inner">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white tracking-tight">
                    On-Edge Computer Vision Telemetry
                  </h4>
                  <p className="text-xs text-text-3 font-mono">
                    YOLOv11x-Seg · 60 FPS Continuous Pavement Inference
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-Time Engine Ready</span>
                </span>
                <Link
                  to="/detection"
                  className="inline-flex items-center gap-1 text-xs text-amber hover:text-white transition font-mono"
                >
                  <span>Launch Tool</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Micro Feature Highlights Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 text-left font-mono">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-line">
                <div className="text-[11px] text-text-3 flex items-center gap-1.5 mb-1">
                  <Cpu className="w-3.5 h-3.5 text-amber" />
                  <span>Edge Speed</span>
                </div>
                <div className="text-sm font-bold text-white">14.2 ms</div>
                <div className="text-[10px] text-text-4">Per-frame latency</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-line">
                <div className="text-[11px] text-text-3 flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>mAP Accuracy</span>
                </div>
                <div className="text-sm font-bold text-white">98.4%</div>
                <div className="text-[10px] text-text-4">Distress validation</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-line">
                <div className="text-[11px] text-text-3 flex items-center gap-1.5 mb-1">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>Privacy</span>
                </div>
                <div className="text-sm font-bold text-white">100% On-Device</div>
                <div className="text-[10px] text-text-4">Face & plate blurring</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-line">
                <div className="text-[11px] text-text-3 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber" />
                  <span>Standard</span>
                </div>
                <div className="text-sm font-bold text-white">ASTM D6433</div>
                <div className="text-[10px] text-text-4">Pavement Index (PCI)</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
