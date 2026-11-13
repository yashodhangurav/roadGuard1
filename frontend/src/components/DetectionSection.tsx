import React, { useState } from 'react';
import { Target, Video, Cpu, AlertTriangle, Layers, Eye, Gauge, Crosshair } from 'lucide-react';

type ViewMode = 'rgb' | 'depth' | 'mask';

export const DetectionSection: React.FC = () => {
  const [activeMode, setActiveMode] = useState<ViewMode>('rgb');
  const [selectedDefect, setSelectedDefect] = useState<'pothole' | 'crack' | null>('pothole');

  return (
    <section id="detection" className="relative pt-36 md:pt-44">
      <div className="wrap">
        {/* Step Eyebrow & Header */}
        <div className="max-w-[780px] mb-12 md:mb-16">
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

        {/* Product Demonstration Display Window */}
        <div className="relative rounded-card border border-line-2 bg-surface overflow-hidden shadow-window mb-8">
          {/* Studio Window Chrome Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line-2 bg-[#121212]/90 backdrop-blur-md">
            {/* macOS Window Controls + Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80" />
              </div>
              <span className="text-xs font-mono text-text-3 hidden sm:inline-block">
                RoadGuard Vision Studio — US-101 Segment 4.2 · Live Stream
              </span>
            </div>

            {/* View Mode Switcher Pills */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-line">
              <button
                onClick={() => setActiveMode('rgb')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeMode === 'rgb'
                    ? 'bg-white/10 text-text shadow-sm'
                    : 'text-text-3 hover:text-text-2'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>RGB Vision</span>
              </button>
              <button
                onClick={() => setActiveMode('depth')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeMode === 'depth'
                    ? 'bg-amber/20 text-amber border border-amber/30'
                    : 'text-text-3 hover:text-text-2'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Depth Map</span>
              </button>
              <button
                onClick={() => setActiveMode('mask')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeMode === 'mask'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-text-3 hover:text-text-2'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Segmentation</span>
              </button>
            </div>
          </div>

          {/* Interactive Inspection Canvas */}
          <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden select-none">
            {/* Visual Canvas Layers */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1200 520"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                {/* Granular asphalt surface noise */}
                <filter id="det-noise" x="0%" y="0%" width="100%" height="100%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
                  <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0.12 0" />
                  <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
                </filter>

                {/* Depth map thermal gradient */}
                <linearGradient id="depth-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1a0033" />
                  <stop offset="30%" stopColor="#4a154b" />
                  <stop offset="55%" stopColor="#9e1f63" />
                  <stop offset="75%" stopColor="#e05338" />
                  <stop offset="90%" stopColor="#f39c12" />
                  <stop offset="100%" stopColor="#f1c40f" />
                </linearGradient>

                {/* Pothole Cavity Shadow */}
                <radialGradient id="crater-depth" cx="48%" cy="46%" r="52%">
                  <stop offset="0%" stopColor="#040404" stopOpacity="0.98" />
                  <stop offset="45%" stopColor="#0a0a0a" stopOpacity="0.9" />
                  <stop offset="85%" stopColor="#141414" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#1e1e1e" stopOpacity="0.1" />
                </radialGradient>

                {/* Pen Loop Drawing Gradient */}
                <linearGradient id="loop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d97757" />
                  <stop offset="100%" stopColor="#ff9a7b" />
                </linearGradient>
              </defs>

              {/* Asphalt Road Canvas Backdrop */}
              {activeMode === 'rgb' && (
                <>
                  <rect width="1200" height="520" fill="#141414" />
                  <rect width="1200" height="520" fill="#1a1a1a" filter="url(#det-noise)" />

                  {/* Perspective Road Geometry */}
                  <line x1="160" y1="0" x2="40" y2="520" stroke="#ffffff" strokeWidth="4" strokeOpacity="0.45" />
                  <line x1="1040" y1="0" x2="1160" y2="520" stroke="#ffffff" strokeWidth="4" strokeOpacity="0.45" />
                  
                  {/* Center Divided Lane Stripe */}
                  <line x1="595" y1="0" x2="595" y2="520" stroke="#f59e0b" strokeWidth="3" strokeDasharray="32 24" strokeOpacity="0.65" />
                  <line x1="605" y1="0" x2="605" y2="520" stroke="#f59e0b" strokeWidth="3" strokeDasharray="32 24" strokeOpacity="0.65" />

                  {/* Surface Distress Micro-Cracks */}
                  <path
                    d="M260 210 Q320 230 360 220 T420 280 M360 220 L390 190"
                    stroke="#262626"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M740 310 Q820 290 880 340 T960 330"
                    stroke="#222222"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              )}

              {/* Depth Map View */}
              {activeMode === 'depth' && (
                <>
                  <rect width="1200" height="520" fill="#0d0417" />
                  <rect width="1200" height="520" fill="url(#depth-grad)" opacity="0.35" />
                  <ellipse cx="780" cy="280" rx="140" ry="85" fill="#581845" opacity="0.6" />
                  <ellipse cx="780" cy="280" rx="110" ry="65" fill="#900c3f" opacity="0.75" />
                  <ellipse cx="780" cy="280" rx="80" ry="48" fill="#c70039" opacity="0.85" />
                  <ellipse cx="780" cy="280" rx="50" ry="30" fill="#ff5733" opacity="0.95" />
                  <ellipse cx="778" cy="280" rx="25" ry="16" fill="#ffc300" />
                </>
              )}

              {/* Segmentation Mask View */}
              {activeMode === 'mask' && (
                <>
                  <rect width="1200" height="520" fill="#0a0a0a" />
                  <polygon
                    points="160,0 1040,0 1160,520 40,520"
                    fill="#102a43"
                    opacity="0.5"
                    stroke="#2680eb"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M680 260 Q730 220 830 235 Q900 250 880 310 Q830 350 750 340 Q670 320 680 260 Z"
                    fill="#e05338"
                    opacity="0.8"
                    stroke="#ff6b4a"
                    strokeWidth="2"
                  />
                  <polygon
                    points="220,180 440,160 460,320 240,340"
                    fill="#10b981"
                    opacity="0.5"
                    stroke="#34d399"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                </>
              )}

              {/* DEFECT ZONE A: Severe Pothole Crater (Center-Right) */}
              <g
                className="cursor-pointer transition-opacity"
                onClick={() => setSelectedDefect('pothole')}
              >
                {/* 3D Crater Bed */}
                <ellipse
                  cx="780"
                  cy="285"
                  rx="105"
                  ry="64"
                  fill="url(#crater-depth)"
                />
                {/* Aggregate Fractures in Cavity */}
                <path
                  d="M730 270 L755 285 L745 305 L770 295 L800 310 L825 280 L810 265 Z"
                  fill="#000000"
                  opacity="0.75"
                />

                {/* Animated Hand-Drawn Pen Loop circling the pothole */}
                <path
                  d="M 660,285 C 660,225 740,215 800,220 C 865,225 905,255 895,305 C 885,345 825,355 765,350 C 700,345 660,325 670,275 C 675,250 710,235 745,235"
                  fill="none"
                  stroke="url(#loop-grad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 900,
                    strokeDashoffset: 0,
                    filter: 'drop-shadow(0 2px 6px rgba(217,119,87,0.5))',
                  }}
                />

                {/* Crosshair Target on Impact Core */}
                <g transform="translate(780, 285)" opacity="0.65">
                  <circle r="12" stroke="#d97757" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                  <line x1="-16" y1="0" x2="16" y2="0" stroke="#d97757" strokeWidth="1.5" />
                  <line x1="0" y1="-16" x2="0" y2="16" stroke="#d97757" strokeWidth="1.5" />
                </g>
              </g>

              {/* DEFECT ZONE B: Alligator Fatigue Crack Area (Left) */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedDefect('crack')}
              >
                {/* Crack Network Pattern */}
                <g stroke="#3a3a3a" strokeWidth="2.5" fill="none" strokeLinecap="round">
                  <path d="M250 200 L280 230 L320 220 L350 250 L380 230 L420 260" />
                  <path d="M280 230 L290 280 L330 290 L350 250" />
                  <path d="M320 220 L340 180 L390 190 L380 230" />
                  <path d="M290 280 L260 310 L310 330 L330 290" />
                  <path d="M350 250 L370 300 L410 290 L420 260" />
                </g>

                {/* Selection Bounding Crop Box with Corner Handles (.mk-area) */}
                <rect
                  x="225"
                  y="160"
                  width="220"
                  height="180"
                  fill="rgba(255, 255, 255, 0.03)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  opacity="0.8"
                />

                {/* Crisp Corner L-Brackets */}
                <path d="M220 175 L220 155 L240 155" stroke="#ffffff" strokeWidth="2.5" fill="none" />
                <path d="M425 155 L445 155 L445 175" stroke="#ffffff" strokeWidth="2.5" fill="none" />
                <path d="M220 325 L220 345 L240 345" stroke="#ffffff" strokeWidth="2.5" fill="none" />
                <path d="M425 345 L445 345 L445 325" stroke="#ffffff" strokeWidth="2.5" fill="none" />
              </g>
            </svg>

            {/* FLOATING ANNOTATION PILL 1: Severe Pothole Label (.mk-label) */}
            <div
              onClick={() => setSelectedDefect('pothole')}
              className={`absolute top-[18%] right-[8%] md:right-[16%] transition-all duration-300 cursor-pointer ${
                selectedDefect === 'pothole' ? 'scale-105 z-20' : 'hover:scale-102 z-10'
              }`}
            >
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white text-[#0a0a0a] shadow-2xl border border-black/10">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d97757] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#d97757]" />
                </span>
                <span className="text-[13px] font-semibold tracking-tight">
                  Severe Pothole · 72mm
                </span>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-black/10 text-neutral-800">
                  98.4%
                </span>
              </div>

              {/* Expanded Inspection Card */}
              {selectedDefect === 'pothole' && (
                <div className="mt-2 p-3.5 rounded-xl bg-[#121212]/95 border border-line-2 shadow-2xl backdrop-blur-xl text-left w-64 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-line mb-2.5">
                    <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber" />
                      Critical Distress D40
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber/15 text-amber">
                      PCI: 18 / 100
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-text-3 font-mono">
                    <div>
                      <span className="block text-[10px] text-text-3/70 uppercase">Cavity Vol</span>
                      <span className="text-text font-medium">0.12 m³</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-text-3/70 uppercase">Max Depth</span>
                      <span className="text-amber font-medium">72 mm</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-text-3/70 uppercase">Classification</span>
                      <span className="text-text font-medium">ASTM D6433</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-text-3/70 uppercase">Priority</span>
                      <span className="text-red-400 font-medium">Urgent (48h)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FLOATING ANNOTATION PILL 2: Crack Dimension Pill (.mk-dims) */}
            <div
              onClick={() => setSelectedDefect('crack')}
              className={`absolute top-[14%] left-[8%] md:left-[16%] transition-all duration-300 cursor-pointer ${
                selectedDefect === 'crack' ? 'scale-105 z-20' : 'hover:scale-102 z-10'
              }`}
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#181818]/90 text-text border border-line-2 shadow-lg backdrop-blur-md">
                <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-mono font-medium text-emerald-400">
                  840mm × 520mm
                </span>
                <span className="text-[11px] text-text-3 font-mono">
                  Alligator Crack
                </span>
              </div>

              {/* Expanded Inspection Card */}
              {selectedDefect === 'crack' && (
                <div className="mt-2 p-3 rounded-xl bg-[#121212]/95 border border-line-2 shadow-2xl backdrop-blur-xl text-left w-56 animate-fade-in">
                  <div className="flex items-center justify-between pb-1.5 border-b border-line mb-2">
                    <span className="text-xs font-semibold text-text">Class D20 Fatigue</span>
                    <span className="text-[10px] font-mono text-emerald-400">94.2%</span>
                  </div>
                  <div className="text-[11px] text-text-2 leading-relaxed">
                    Structural wheelpath fatigue failure. Interconnected polygons propagating along the asphalt binder.
                  </div>
                </div>
              )}
            </div>

            {/* Bottom HUD Metadata Bar */}
            <div className="absolute bottom-3 inset-x-4 flex items-center justify-between text-[11px] font-mono text-text-3 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-lg border border-line">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  GPS FIX: 37°46&apos;29&quot;N 122°25&apos;10&quot;W
                </span>
                <span className="hidden sm:inline-block text-text-3/60">|</span>
                <span className="hidden sm:inline-block">ALTITUDE: 42.4m</span>
                <span className="hidden md:inline-block text-text-3/60">|</span>
                <span className="hidden md:inline-block">SPEED: 64.2 km/h</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber">INFERENCE: 16.2ms</span>
                <span className="text-text-3/60">·</span>
                <span>TENSORRT FP16</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column Sub-feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="group p-6 md:p-7 rounded-card border border-line bg-surface shadow-card hover:border-line-2 transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-line-2 flex items-center justify-center text-text mb-5 group-hover:scale-105 transition-transform">
              <Target className="w-5 h-5 text-amber" />
            </div>
            <h4 className="text-base font-semibold text-text mb-2">Millimeter-level Framing</h4>
            <p className="text-sm text-text-2 leading-relaxed">
              Crop, box, and polygon masks generate on the fly. Bounding vectors snap tightly to damaged asphalt edges with sub-millimeter volume calculation.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group p-6 md:p-7 rounded-card border border-line bg-surface shadow-card hover:border-line-2 transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-line-2 flex items-center justify-center text-text mb-5 group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5 text-amber" />
            </div>
            <h4 className="text-base font-semibold text-text mb-2">Dashcam, Mobile, or Drone</h4>
            <p className="text-sm text-text-2 leading-relaxed">
              Ingest 4K dashcam streams, smartphone camera mounts, or georeferenced orthomosaic drone surveys with zero proprietary sensor locks.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group p-6 md:p-7 rounded-card border border-line bg-surface shadow-card hover:border-line-2 transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-line-2 flex items-center justify-center text-text mb-5 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5 text-amber" />
            </div>
            <h4 className="text-base font-semibold text-text mb-2">
              <kbd>60</kbd><kbd>FPS</kbd> Edge Inference
            </h4>
            <p className="text-sm text-text-2 leading-relaxed">
              On-device YOLO vision model runs offline on Jetson, Ambarella, or mobile neural engines with zero cloud transmission overhead.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
