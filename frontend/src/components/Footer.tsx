import React from 'react';
import { Shield, Github, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-5% 0px' }}
      transition={{ duration: 0.6 }}
      className="pt-24 pb-12 mt-36 border-t border-line text-left text-sm text-text-2"
    >
      <div className="wrap">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1fr_1fr] gap-8 pb-16">
          {/* Brand Column */}
          <div className="space-y-4 pr-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line-2 flex items-center justify-center text-text shadow-sm">
                <Shield className="w-4 h-4 text-amber" />
              </div>
              <span className="font-semibold text-base tracking-tight text-text">
                ROADGUARD <span className="text-amber font-bold">AI</span>
              </span>
            </div>
            <p className="text-xs text-text-3 max-w-xs leading-relaxed">
              Intelligent Road Monitoring. Safer Roads. Automated computer vision and infrastructure telemetry for resilient transportation networks.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.03] border border-line text-[11px] font-mono text-text-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>ASTM D6433 Civil Pavement Standard</span>
            </div>
          </div>

          {/* Platform Column */}
          <div className="space-y-3">
            <h5 className="font-medium text-xs font-mono uppercase tracking-wider text-text">Platform</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#demo" className="hover:text-text transition-colors">Interactive Demo</a></li>
              <li><a href="#detection" className="hover:text-text transition-colors">01 Detect it</a></li>
              <li><a href="#mapping" className="hover:text-text transition-colors">02 Map it</a></li>
              <li><a href="#analysis" className="hover:text-text transition-colors">03 Analyse it</a></li>
              <li><a href="#resolution" className="hover:text-text transition-colors">04 Resolve it</a></li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div className="space-y-3">
            <h5 className="font-medium text-xs font-mono uppercase tracking-wider text-text">Solutions</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#demo" className="hover:text-text transition-colors">Municipal Public Works</a></li>
              <li><a href="#mapping" className="hover:text-text transition-colors">State DOT Corridors</a></li>
              <li><a href="#details" className="hover:text-text transition-colors">Fleet Telematics Operators</a></li>
              <li><a href="#privacy" className="hover:text-text transition-colors">Data Sovereignty</a></li>
              <li>
                <a
                  href="mailto:civil@roadguard.ai"
                  className="hover:text-amber transition-colors flex items-center gap-1 text-text-3"
                >
                  <span>civil@roadguard.ai</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Standards & Codebase Column */}
          <div className="space-y-3">
            <h5 className="font-medium text-xs font-mono uppercase tracking-wider text-text">Standards</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://github.com/yashodhangurav/roadguard"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-text transition-colors flex items-center gap-1.5"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li><a href="#details" className="hover:text-text transition-colors">Jetson & Edge NPU Specs</a></li>
              <li><a href="#privacy" className="hover:text-text transition-colors">On-Device Privacy Blurring</a></li>
              <li><a href="#faq" className="hover:text-text transition-colors">Pavement Condition Index (PCI)</a></li>
              <li><a href="#download" className="hover:text-text transition-colors">Engine Version v4.2.0</a></li>
            </ul>
          </div>

          {/* Administration Column */}
          <div className="space-y-3">
            <h5 className="font-medium text-xs font-mono uppercase tracking-wider text-text">Administration</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/admin/login"
                  className="hover:text-amber transition-colors flex items-center gap-1.5 text-text-2 font-medium"
                >
                  <Shield className="w-3.5 h-3.5 text-amber" />
                  <span>Administrator Portal</span>
                </a>
              </li>
              <li>
                <a href="/admin/login" className="hover:text-text transition-colors">
                  Supervisor Access
                </a>
              </li>
              <li>
                <a href="/admin/dashboard" className="hover:text-text transition-colors">
                  Municipal Command
                </a>
              </li>
              <li>
                <span className="text-text-4 font-mono text-[11px]">Restricted DPW Terminal</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-text-4">
          <div>© 2026 RoadGuard AI Infrastructure Systems. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href="#top" className="hover:text-text-3 transition-colors">Back to top ↑</a>
            <span>·</span>
            <span>Built for resilient transportation networks</span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};
