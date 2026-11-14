import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Github, ArrowUpRight, HardHat } from 'lucide-react';
import { motion } from 'framer-motion';

export const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-5% 0px' }}
      transition={{ duration: 0.6 }}
      className="pt-20 pb-12 mt-28 border-t border-line text-left text-sm text-text-2 relative z-10"
    >
      <div className="wrap">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1fr_1fr] gap-8 pb-16">
          {/* Brand Column */}
          <div className="space-y-4 pr-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line-2 flex items-center justify-center text-text shadow-sm group-hover:border-line-3 transition-colors">
                <Shield className="w-4 h-4 text-amber" />
              </div>
              <span className="font-semibold text-base tracking-tight text-text">
                ROADGUARD <span className="text-amber font-bold">AI</span>
              </span>
            </Link>
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
              <li><Link to="/detection" className="hover:text-text transition-colors">01 Detection Workspace</Link></li>
              <li><Link to="/mapping" className="hover:text-text transition-colors">02 GIS Damage Map</Link></li>
              <li><Link to="/analysis" className="hover:text-text transition-colors">03 Pavement Analysis</Link></li>
              <li><Link to="/reports" className="hover:text-text transition-colors">04 Citizen Reports</Link></li>
              <li><Link to="/analytics" className="hover:text-text transition-colors">05 Municipal Telemetry</Link></li>
            </ul>
          </div>

          {/* Solutions & Info Column */}
          <div className="space-y-3">
            <h5 className="font-medium text-xs font-mono uppercase tracking-wider text-text">Solutions</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/about" className="hover:text-text transition-colors">About RoadGuard</Link></li>
              <li><Link to="/mapping" className="hover:text-text transition-colors">Corridor Monitoring</Link></li>
              <li><Link to="/reports" className="hover:text-text transition-colors">Public Works Dispatch</Link></li>
              <li><Link to="/about#privacy" className="hover:text-text transition-colors">Data Sovereignty</Link></li>
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
                  href="https://github.com/yashodhan/roadguard"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-text transition-colors flex items-center gap-1.5"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li><Link to="/analysis" className="hover:text-text transition-colors">YOLOv11 Edge Vision</Link></li>
              <li><Link to="/about" className="hover:text-text transition-colors">ASTM D6433 PCI Metric</Link></li>
              <li><Link to="/about" className="hover:text-text transition-colors">Edge Privacy Blurring</Link></li>
              <li><span className="text-text-4 font-mono text-[11px]">Engine v4.2.0</span></li>
            </ul>
          </div>

          {/* Administration Column */}
          <div className="space-y-3">
            <h5 className="font-medium text-xs font-mono uppercase tracking-wider text-text">Administration</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/admin/login"
                  className="hover:text-amber transition-colors flex items-center gap-1.5 text-text-2 font-medium"
                >
                  <Shield className="w-3.5 h-3.5 text-amber" />
                  <span>Administrator Portal</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/maintainer/login"
                  className="hover:text-[#d97757] transition-colors flex items-center gap-1.5 text-text-2 font-medium"
                >
                  <HardHat className="w-3.5 h-3.5 text-[#d97757]" />
                  <span>Maintainer Field Portal</span>
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-text transition-colors">
                  Supervisor Terminal
                </Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-text transition-colors">
                  Municipal Command
                </Link>
              </li>
              <li>
                <span className="text-text-4 font-mono text-[11px]">Restricted DPW Access</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-text-4">
          <div>© 2026 RoadGuard AI Infrastructure Systems. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-text-3 transition-colors cursor-pointer"
            >
              Back to top ↑
            </button>
            <span>·</span>
            <span>Built for resilient transportation networks</span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};
