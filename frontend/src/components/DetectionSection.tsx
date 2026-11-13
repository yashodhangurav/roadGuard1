import React from 'react';
import { Target, Video, Cpu } from 'lucide-react';

export const DetectionSection: React.FC = () => {
  return (
    <section id="detection" className="relative pt-36 md:pt-44">
      <div className="wrap">
        {/* Step Header */}
        <div className="max-w-[780px] mb-14 md:mb-16">
          <div className="step">
            <span className="step-n">01</span>
            <span className="text-text font-medium">Detection</span>
          </div>
          <h2 className="text-[clamp(36px,5.4vw,60px)] font-semibold leading-[1.04] tracking-[-0.045em] h2-gradient pb-2">
            RoadGuard AI spots what drivers miss
          </h2>
          <p className="mt-5 text-text-2 text-[clamp(17px,1.5vw,19px)] leading-[1.6]">
            Detect potholes, cracks, surface deterioration and damaged road areas using computer vision. Process high-speed dashcam feeds, mobile camera frames, and drone aerials in real time — with zero human lag.
          </p>
        </div>

        {/* Product Demonstration Display with SVG Animated Markup */}
        <div className="relative rounded-card border border-line-2 bg-surface overflow-hidden shadow-window mb-6">
          <div className="relative aspect-[16/9] md:aspect-[21/9] bg-gradient-to-br from-[#181818] via-[#121212] to-[#0a0a0a] flex items-center justify-center p-8">
            {/* SVG Interactive Pen Circle & Crop Bounding Box Mockup */}
            <svg className="w-full max-w-[800px] h-auto drop-shadow-2xl" viewBox="0 0 800 360" fill="none">
              {/* Simulated Road Surface Cracks */}
              <path d="M120 180 Q240 160 380 210 T680 170" stroke="#333333" strokeWidth="3" />
              <path d="M380 210 L440 290" stroke="#333333" strokeWidth="2.5" />

              {/* Animated Pothole Detection Loop */}
              <ellipse
                cx="380"
                cy="210"
                rx="90"
                ry="55"
                stroke="#d97757"
                strokeWidth="2.5"
                strokeDasharray="460"
                strokeDashoffset="0"
                fill="rgba(217,119,87,0.08)"
              />

              {/* Pill Tag */}
              <g transform="translate(390, 120)">
                <rect width="210" height="34" rx="17" fill="#f2f2f2" />
                <circle cx="18" cy="17" r="5" fill="#d97757" />
                <text x="32" y="22" fill="#0a0a0a" fontSize="13" fontFamily="Geist, sans-serif" fontWeight="600">
                  Severe Pothole · 72mm
                </text>
              </g>

              {/* Bounding Area Crop Indicator */}
              <rect
                x="140"
                y="110"
                width="160"
                height="120"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                fill="rgba(255,255,255,0.03)"
              />
              <text x="144" y="100" fill="#8f8f8f" fontSize="11" fontFamily="Geist Mono, monospace">
                Alligator Crack Zone · 94%
              </text>
            </svg>
          </div>
        </div>

        {/* 3-Column Sub-feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 md:p-7 rounded-card border border-line bg-surface shadow-card hover:border-line-2 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-line-2 flex items-center justify-center text-text mb-5">
              <Target className="w-5 h-5 text-amber" />
            </div>
            <h4 className="text-base font-semibold text-text mb-2">Millimeter-level Framing</h4>
            <p className="text-sm text-text-2 leading-relaxed">
              Crop, box, and polygon masks generate on the fly. The vision model calculates pothole crater volume directly from visual disparity.
            </p>
          </div>

          <div className="p-6 md:p-7 rounded-card border border-line bg-surface shadow-card hover:border-line-2 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-line-2 flex items-center justify-center text-text mb-5">
              <Video className="w-5 h-5 text-amber" />
            </div>
            <h4 className="text-base font-semibold text-text mb-2">Dashcam, Mobile, or Drone</h4>
            <p className="text-sm text-text-2 leading-relaxed">
              Ingest 4K dashcam streams, smartphone camera mounts, or high-resolution orthomosaic drone surveys with zero proprietary sensor locks.
            </p>
          </div>

          <div className="p-6 md:p-7 rounded-card border border-line bg-surface shadow-card hover:border-line-2 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-line-2 flex items-center justify-center text-text mb-5">
              <Cpu className="w-5 h-5 text-amber" />
            </div>
            <h4 className="text-base font-semibold text-text mb-2">
              <kbd>60</kbd><kbd>FPS</kbd> Edge Inference
            </h4>
            <p className="text-sm text-text-2 leading-relaxed">
              Runs fully on-device on Jetson, Ambarella, or Apple Neural Engine. Zero cellular upload required during active road surveying.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

