import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="pt-24 pb-12 mt-36 border-t border-line text-left text-sm text-text-2">
      <div className="wrap">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-8 pb-16">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-surface-2 border border-line-2 flex items-center justify-center text-text">
                <Shield className="w-3.5 h-3.5 text-amber" />
              </div>
              <span className="font-semibold text-base tracking-tight text-text">
                RoadGuard <span className="text-amber">AI</span>
              </span>
            </div>
            <p className="text-xs text-text-3 max-w-xs leading-relaxed">
              Intelligent Road Monitoring. Safer Roads. Automated computer vision infrastructure intelligence for resilient civil transportation.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white/[0.03] border border-line text-[11px] font-mono text-text-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Certified ASTM D6433 Standard</span>
            </div>
          </div>

          {/* Platform Column */}
          <div className="space-y-3">
            <h5 className="font-medium text-xs font-mono uppercase tracking-wider text-text">Platform</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#detection" className="hover:text-text transition-colors">Detection Pipeline</a></li>
              <li><a href="#mapping" className="hover:text-text transition-colors">GIS Spatial Mapping</a></li>
              <li><a href="#analysis" className="hover:text-text transition-colors">Neural Depth Profiler</a></li>
              <li><a href="#resolution" className="hover:text-text transition-colors">Municipal Dispatch</a></li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div className="space-y-3">
            <h5 className="font-medium text-xs font-mono uppercase tracking-wider text-text">Solutions</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-text transition-colors">Municipal Public Works</a></li>
              <li><a href="#" className="hover:text-text transition-colors">State DOTs</a></li>
              <li><a href="#" className="hover:text-text transition-colors">Fleet Telematics Operators</a></li>
              <li><a href="mailto:civil@roadguard.ai" className="hover:text-text transition-colors">civil@roadguard.ai</a></li>
            </ul>
          </div>

          {/* Governance Column */}
          <div className="space-y-3">
            <h5 className="font-medium text-xs font-mono uppercase tracking-wider text-text">Governance</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-text transition-colors">Edge Privacy Architecture</a></li>
              <li><a href="#" className="hover:text-text transition-colors">Data Sovereignty</a></li>
              <li><a href="#" className="hover:text-text transition-colors">Security & CJIS Compliance</a></li>
              <li><a href="#" className="hover:text-text transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-text-4">
          <div>© 2026 RoadGuard AI Infrastructure Systems. All rights reserved.</div>
          <div>Built for resilient transportation networks</div>
        </div>
      </div>
    </footer>
  );
};

