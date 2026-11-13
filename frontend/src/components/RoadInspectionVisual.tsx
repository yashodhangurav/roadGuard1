import React from 'react';
import { AlertTriangle, Crosshair, Sparkles } from 'lucide-react';

interface RoadInspectionVisualProps {
  isScanning?: boolean;
}

export const RoadInspectionVisual: React.FC<RoadInspectionVisualProps> = ({ isScanning = false }) => {
  return (
    <div className="relative w-full aspect-[1200/760] bg-[#111214] overflow-hidden select-none">
      {/* Realistic Asphalt Road Texture & Perspective Canvas */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 760"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Asphalt Granular Texture Filter */}
          <filter id="road-asphalt" x="0" y="0" width="1200" height="760" filterUnits="userSpaceOnUse">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" result="noise" />
            <feColorMatrix
              type="matrix"
              values="0.10 0 0 0 0.07
                      0 0.10 0 0 0.07
                      0 0 0.10 0 0.08
                      0 0 0 1 0"
            />
            <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
          </filter>

          {/* Deep Crater Cavity Shadow */}
          <radialGradient id="crater-depth" cx="48%" cy="46%" r="52%">
            <stop offset="0%" stopColor="#020202" />
            <stop offset="50%" stopColor="#08080a" />
            <stop offset="85%" stopColor="#151619" />
            <stop offset="100%" stopColor="#222327" />
          </radialGradient>

          {/* Pavement Distress Shadow */}
          <linearGradient id="road-perspective-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e0f11" />
            <stop offset="40%" stopColor="#131417" />
            <stop offset="100%" stopColor="#18191d" />
          </linearGradient>
        </defs>

        {/* Base Asphalt Pavement Surface */}
        <rect width="1200" height="760" fill="url(#road-perspective-fade)" />
        <rect width="1200" height="760" fill="#18191c" filter="url(#road-asphalt)" opacity="0.88" />

        {/* Subtle Wheelpath Track Depressions */}
        <path d="M 440 0 L 260 760" stroke="#0e0f12" strokeWidth="90" opacity="0.6" />
        <path d="M 760 0 L 940 760" stroke="#0e0f12" strokeWidth="90" opacity="0.6" />

        {/* Asphalt Center Seam */}
        <line x1="600" y1="0" x2="600" y2="760" stroke="#121316" strokeWidth="2.5" />

        {/* Realistic Perspective Road Markings */}
        {/* Left Shoulder Line */}
        <path d="M 320 0 L 60 760" stroke="#d5d5d8" strokeWidth="7" opacity="0.75" />

        {/* Right Shoulder Line */}
        <path d="M 880 0 L 1140 760" stroke="#d5d5d8" strokeWidth="7" opacity="0.75" />

        {/* Center Double Yellow / Dashed Line in Perspective */}
        <g opacity="0.85">
          <line x1="595" y1="20" x2="595" y2="70" stroke="#d49b29" strokeWidth="4" />
          <line x1="605" y1="20" x2="605" y2="70" stroke="#d49b29" strokeWidth="4" />

          <line x1="594" y1="120" x2="594" y2="190" stroke="#d49b29" strokeWidth="4.5" />
          <line x1="606" y1="120" x2="606" y2="190" stroke="#d49b29" strokeWidth="4.5" />

          <line x1="593" y1="260" x2="593" y2="350" stroke="#d49b29" strokeWidth="5" />
          <line x1="607" y1="260" x2="607" y2="350" stroke="#d49b29" strokeWidth="5" />

          <line x1="592" y1="430" x2="592" y2="540" stroke="#d49b29" strokeWidth="5.5" />
          <line x1="608" y1="430" x2="608" y2="540" stroke="#d49b29" strokeWidth="5.5" />

          <line x1="590" y1="630" x2="590" y2="760" stroke="#d49b29" strokeWidth="6" />
          <line x1="610" y1="630" x2="610" y2="760" stroke="#d49b29" strokeWidth="6" />
        </g>

        {/* Left Lane: Interconnected Alligator Fatigue Cracks */}
        <g stroke="#23252a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
          <path d="M 280 440 L 320 425 L 350 450 L 320 480 Z" />
          <path d="M 320 425 L 360 415 L 390 435 L 350 450" />
          <path d="M 350 450 L 390 435 L 420 460 L 380 485 Z" />
          <path d="M 320 480 L 350 450 L 380 485 L 340 515 Z" />
          <path d="M 280 440 L 320 480 L 290 520 L 260 475 Z" />
          <path d="M 340 515 L 380 485 L 420 460 L 440 500 L 390 535 Z" />
          <path d="M 290 520 L 340 515 L 330 555 L 280 550 Z" />
          <path d="M 340 515 L 390 535 L 370 565 L 330 555" />
          {/* Radiating hairline fissure paths */}
          <path d="M 420 460 L 460 450" strokeWidth="1.5" />
          <path d="M 260 475 L 230 480" strokeWidth="1.5" />
          <path d="M 370 565 L 385 595" strokeWidth="1.5" />
        </g>

        {/* Right Lane: Deep Pothole Crater Geometry */}
        <g transform="translate(40, 60)">
          {/* Distressed Asphalt Rim Perimeter */}
          <path
            d="M 720 370 C 705 330, 755 305, 815 298 C 875 292, 940 310, 975 345 C 1010 380, 990 425, 945 448 C 895 470, 825 465, 765 450 C 730 430, 710 405, 720 370 Z"
            fill="#1e1f23"
            stroke="#282a2f"
            strokeWidth="3.5"
          />

          {/* Deep Cavity Void with Real Depth Shadow */}
          <path
            d="M 735 372 C 722 340, 765 318, 820 312 C 872 306, 930 322, 960 352 C 990 382, 972 418, 932 438 C 885 458, 825 452, 775 440 C 748 422, 730 400, 735 372 Z"
            fill="url(#crater-depth)"
            stroke="#0a0a0d"
            strokeWidth="2.5"
          />

          {/* Pit Void Bottom Shadows */}
          <ellipse cx="848" cy="382" rx="76" ry="34" fill="#030304" />
          <ellipse cx="840" cy="378" rx="52" ry="22" fill="#000000" />

          {/* Broken Bitumen Aggregate Rocks */}
          <circle cx="810" cy="365" r="3.5" fill="#3f4249" />
          <circle cx="870" cy="390" r="4" fill="#4a4d55" />
          <circle cx="835" cy="402" r="3" fill="#32343a" />
          <circle cx="785" cy="380" r="3.2" fill="#383b42" />
          <circle cx="895" cy="370" r="2.8" fill="#4e5159" />
          <circle cx="760" cy="415" r="2.2" fill="#2d2f35" />
        </g>

        {/* Hand-drawn Animated SVG Pen Loop Circling Pothole */}
        <ellipse
          cx="885"
          cy="435"
          rx="145"
          ry="75"
          stroke="#d97757"
          strokeWidth="3"
          strokeDasharray="700"
          strokeDashoffset={isScanning ? "0" : "140"}
          strokeLinecap="round"
          fill="rgba(217, 119, 87, 0.08)"
          filter="drop-shadow(0 2px 10px rgba(217, 119, 87, 0.5))"
          className="transition-all duration-700 ease-out"
        />

        {/* Corner Reticle Marks */}
        <g stroke="#ffffff" strokeWidth="1" opacity="0.3">
          <path d="M 30 30 L 50 30 M 30 30 L 30 50" />
          <path d="M 1170 30 L 1150 30 M 1170 30 L 1170 50" />
          <path d="M 30 730 L 50 730 M 30 730 L 30 710" />
          <path d="M 1170 730 L 1150 730 M 1170 730 L 1170 710" />
        </g>
      </svg>

      {/* AI Computer Vision Annotations matching Aloud .mk-label & .mk-area */}

      {/* 1. Floating Pill Label for Pothole (.mk-label) */}
      <div
        className="absolute left-[64%] md:left-[67%] top-[34%] md:top-[38%] flex items-center gap-2 h-7 px-3.5 rounded-full bg-[#f2f2f2] text-[#0f0f0f] text-xs font-semibold shadow-[0_6px_20px_rgba(0,0,0,0.55)] whitespace-nowrap transition-transform duration-500 hover:scale-105 z-10"
      >
        <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
        <span>Severe Pothole · 72mm</span>
        <span className="text-amber font-mono font-medium">(98.4%)</span>
      </div>

      {/* 2. Bounding Box for Alligator Cracking (.mk-area) */}
      <div className="absolute left-[19%] md:left-[21%] top-[52%] w-[21%] h-[24%] border border-dashed border-white/80 rounded-md bg-white/[0.04] shadow-[0_0_0_1px_rgba(0,0,0,0.5)] z-10">
        {/* Corner Brackets */}
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white" />
        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white" />
        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white" />

        {/* Dimension Pill (.mk-dims) */}
        <div className="absolute -top-6 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/85 border border-line-2 text-[10.5px] font-mono text-text shadow-sm">
          <AlertTriangle className="w-3 h-3 text-amber" />
          <span>Fatigue Cracking</span>
        </div>

        <div className="absolute -bottom-6 left-0 px-2 py-0.5 rounded bg-black/85 border border-line text-[10px] font-mono text-text-3">
          840mm × 520mm
        </div>
      </div>

      {/* 3. Top HUD Status Overlays */}
      <div className="absolute top-4 left-4 flex items-center gap-2 p-2.5 rounded-lg bg-black/80 border border-line-2 backdrop-blur-md font-mono text-[11px] text-text-2 z-10">
        <Crosshair className="w-3.5 h-3.5 text-amber animate-spin" style={{ animationDuration: '8s' }} />
        <span className="text-text font-medium">CAMERA HUD: 60 FPS</span>
        <span className="text-text-4">|</span>
        <span>Route 101 · MP 14.2</span>
        <span className="text-text-4">|</span>
        <span className="text-amber">ASTM D6433</span>
      </div>

      <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2 p-2.5 rounded-lg bg-black/80 border border-line-2 backdrop-blur-md font-mono text-[11px] text-text-3 z-10">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span>RTK GNSS: Fixed (±0.04m)</span>
      </div>
    </div>
  );
};
