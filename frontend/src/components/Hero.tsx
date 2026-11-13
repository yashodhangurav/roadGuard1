import React, { useState } from 'react';
import { Eye, Play, Radio, Layers, Sparkles } from 'lucide-react';
import { RoadInspectionVisual } from './RoadInspectionVisual';
import { useMagnetic } from '../hooks/useMagnetic';

interface HeroProps {
  onOpenDemo?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenDemo }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [activeSpeechStep, setActiveSpeechStep] = useState(0);
  const { ref: magneticRef, offset } = useMagnetic<HTMLDivElement>({ strength: 0.08, maxDistance: 10 });

  const captionWords = [
    'Severe',
    'pothole',
    'detected',
    'at',
    'MP 14.2',
    '—',
    'Depth 72mm',
    '—',
    'Logged',
    'to',
    'Zone 4',
    'Municipal',
    'Repair',
    'Queue',
  ];

  const handleBarClick = () => {
    setIsScanning(true);
    setActiveSpeechStep(0);

    // Synchronously highlight words like Aloud's speech player
    captionWords.forEach((_, i) => {
      setTimeout(() => {
        setActiveSpeechStep(i + 1);
      }, (i + 1) * 180);
    });

    setTimeout(() => {
      setIsScanning(false);
    }, 4500);
  };

  return (
    <section id="top" className="relative pt-36 md:pt-44 overflow-clip">
      {/* Dual Radial Sky Glow matching Aloud .hero-sky */}
      <div className="hero-sky pointer-events-none" aria-hidden="true" />

      {/* Hero Copy Container */}
      <div className="wrap flex flex-col items-center text-center relative z-10">
        {/* Fluid Hero Title */}
        <h1 className="hero-title text-[clamp(28px,7.5vw,104px)] font-normal leading-[1.08] sm:leading-[0.98] tracking-[-0.03em] sm:tracking-[-0.058em] hero-title-gradient pb-2 max-w-5xl">
          Intelligent Road<br className="sm:hidden" /> Monitoring.<br />
          Safer Roads.
        </h1>

        {/* Hero Lede */}
        <p className="mt-4 sm:mt-7 max-w-[640px] text-text-2 text-[clamp(15px,1.6vw,20px)] leading-[1.55] tracking-[-0.01em] px-2 sm:px-0">
          AI-powered road damage detection that transforms road images and videos into actionable infrastructure intelligence.
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9 sm:mt-10 w-full max-w-xs sm:max-w-none">
          <a
            href="#detection"
            className="btn btn-light btn-lg shadow-btn-light w-full sm:w-auto"
          >
            <Eye className="w-4 h-4" />
            <span>Explore Detection</span>
          </a>

          <button
            onClick={onOpenDemo}
            className="btn btn-ghost btn-lg shadow-btn-ghost w-full sm:w-auto"
          >
            <Play className="w-3.5 h-3.5 fill-current text-text-2" />
            <span>View Live Demo</span>
            <span className="btn-note">1:20</span>
          </button>
        </div>

        {/* Monospace Spec Pills matching Aloud .hero-meta */}
        <p className="flex flex-wrap justify-center items-center gap-x-2.5 gap-y-1 mt-6 text-text-3 font-mono text-[12.5px] tracking-wide">
          <span>Edge Vision</span>
          <span className="text-text-4 select-none">·</span>
          <span>Real-Time 60 FPS</span>
          <span className="text-text-4 select-none">·</span>
          <span>Sub-meter GNSS</span>
          <span className="text-text-4 select-none">·</span>
          <span>ASTM D6433 Certified</span>
          <span className="text-text-4 select-none">·</span>
          <span>Model v4.2</span>
        </p>
      </div>

      {/* Hero Stage matching Aloud .hero-stage */}
      <div className="hero-stage" id="hero-stage">
        {/* Ambient Glow */}
        <div className="hero-glow" aria-hidden="true" />

        <div className="hero-frame">
          {/* Base Console Window (.hero-window) */}
          <figure className="window hero-window">
            {/* Top Window Strip */}
            <div className="flex items-center justify-between h-9 px-4 border-b border-line bg-surface/90">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
              </div>
              <div className="font-mono text-xs text-text-3 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-amber" />
                <span>RoadGuard AI Infrastructure Console — Survey Corridor Overview</span>
              </div>
              <div className="text-[11px] font-mono text-text-4">14 defects logged</div>
            </div>

            {/* Base GIS Workspace Area */}
            <div className="aspect-[1203/700] w-full bg-[#0d0e11] p-6 text-left">
              <div className="grid grid-cols-4 gap-4 opacity-40">
                <div className="p-3.5 rounded-xl border border-line bg-surface">
                  <div className="text-xs font-mono text-text-3">CORRIDOR</div>
                  <div className="text-sm font-semibold text-text mt-1">Route 101 North</div>
                  <div className="text-xs text-amber font-mono mt-1">84.6 km surveyed</div>
                </div>
                <div className="p-3.5 rounded-xl border border-line bg-surface">
                  <div className="text-xs font-mono text-text-3">POTHOLES</div>
                  <div className="text-sm font-semibold text-text mt-1">14 Critical</div>
                  <div className="text-xs text-text-3 font-mono mt-1">Avg Depth: 58mm</div>
                </div>
                <div className="p-3.5 rounded-xl border border-line bg-surface">
                  <div className="text-xs font-mono text-text-3">PCI RATING</div>
                  <div className="text-sm font-semibold text-text mt-1">68 / 100 (Fair)</div>
                  <div className="text-xs text-text-3 font-mono mt-1">ASTM D6433</div>
                </div>
                <div className="p-3.5 rounded-xl border border-line bg-surface">
                  <div className="text-xs font-mono text-text-3">STATUS</div>
                  <div className="text-sm font-semibold text-emerald-400 mt-1">Edge Stream Live</div>
                  <div className="text-xs text-text-3 font-mono mt-1">RTK Accuracy ±4cm</div>
                </div>
              </div>
            </div>
          </figure>

          {/* Overlapping Live Road Inspection Window (.road-window matching .sb-window) */}
          <figure className="road-window">
            <div className="sb-scroll">
              <RoadInspectionVisual isScanning={isScanning} />
            </div>
          </figure>

          {/* Floating Telemetry Speech Bubble (.bar-caption) */}
          <div className="relative">
            <div
              className={`bar-caption ${isScanning ? 'is-on' : ''}`}
              role="status"
              aria-live="polite"
            >
              {captionWords.map((word, index) => (
                <span
                  key={index}
                  className={`inline-block mr-1.5 transition-all ${
                    index < activeSpeechStep ? 'is-said text-white font-medium' : 'text-text-3'
                  }`}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* Iconic Floating Telemetry Pill (.bar-hero) with Spring Damping Physics */}
          <div className="bar-dock">
            <div
              ref={magneticRef}
              onClick={handleBarClick}
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
              }}
              className="bar bar-hero group"
            >
              {/* Radar Key */}
              <div className="bar-key relative">
                <Radio className="w-4 h-4 text-amber" />
                <span className="absolute inset-0 rounded-md border border-amber/40 animate-radar-ping pointer-events-none" />
              </div>

              {/* Status Field with Hover Transition */}
              <div className="bar-field flex-1 min-w-0">
                <span className="bar-ph truncate text-xs sm:text-[13px]">
                  <span className="hidden sm:inline">Click to simulate live road inspection scan</span>
                  <span className="sm:hidden">Tap to simulate road scan</span>
                </span>
                <span className="bar-try flex items-center gap-1.5 font-medium text-black truncate text-xs sm:text-[13px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber shrink-0" />
                  <span className="truncate">Scan Route 101 corridor (MP 14.2)</span>
                </span>
              </div>

              {/* Sensor Frequency Vibration Bars */}
              <div className="bar-meter shrink-0">
                <div className="bar-bars">
                  {[16, 8, 20, 14, 18, 10].map((h, i) => (
                    <i
                      key={i}
                      className="bg-[#737373] group-hover:bg-amber transition-colors"
                      style={{
                        height: isScanning ? `${Math.max(4, (h * 1.3) % 20)}px` : `${h}px`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* GNSS Coordinates Clock */}
              <div className="bar-clock hidden md:block font-mono">
                37°46'29"N 122°25'10"W
              </div>

              {/* Chip Badge */}
              <div className="bar-chip hidden xs:flex sm:flex">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs">RTK Fixed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
