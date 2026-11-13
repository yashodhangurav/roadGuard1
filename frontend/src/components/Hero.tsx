import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Play, Radio } from 'lucide-react';
import { RoadImageAnalysis } from './RoadImageAnalysis';
import { DetectionResult } from '../services/detectionApi';
import { useMagnetic } from '../hooks/useMagnetic';
import { EASE_SWIFT, buttonMotion } from '../styles/motion';

interface HeroProps {
  onOpenDemo?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenDemo }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [activeSpeechStep, setActiveSpeechStep] = useState(0);
  const [activeTelemetryText, setActiveTelemetryText] = useState(
    'US-101 · Milepost 14.2 · Cavity Depth 82mm · 97.4% Conf'
  );
  const [captionWords, setCaptionWords] = useState<string[]>([
    'Severe',
    'pothole',
    'detected',
    'at',
    'MP',
    '14.2',
    '·',
    'Depth',
    '82mm',
    '·',
    'Logged',
    'to',
    'Zone',
    '4',
    'Municipal',
    'Repair',
    'Queue',
  ]);

  // Magnetic spring physics for floating pill bar
  const { ref: magneticRef, offset } = useMagnetic<HTMLDivElement>({
    strength: 0.16,
    maxDistance: 16,
  });

  const handleAnalysisComplete = useCallback((result: DetectionResult) => {
    if (result.defects.length > 0) {
      const primary = result.defects[0];
      const depthStr = primary.dimensions.estimatedDepthMm
        ? `Depth ${primary.dimensions.estimatedDepthMm}mm`
        : `${primary.dimensions.widthCm}×${primary.dimensions.heightCm}cm`;

      setActiveTelemetryText(
        `${result.fileName.replace(/\.jpg|\.png/i, '')} · ${primary.type} · ${depthStr} · ${primary.confidence}% Conf`
      );

      const words = [
        primary.severity,
        primary.type.toLowerCase(),
        'detected',
        '·',
        `${primary.confidence}%`,
        'confidence',
        '·',
        `${primary.dimensions.widthCm}x${primary.dimensions.heightCm}cm`,
        ...(primary.dimensions.estimatedDepthMm ? ['·', `depth`, `${primary.dimensions.estimatedDepthMm}mm`] : []),
        '·',
        'Work',
        'order:',
        primary.urgency,
      ];
      setCaptionWords(words);
    }
  }, []);

  const handleSimulateScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setActiveSpeechStep(0);

    captionWords.forEach((_, i) => {
      setTimeout(() => {
        setActiveSpeechStep(i + 1);
      }, (i + 1) * 160);
    });

    setTimeout(() => {
      setIsScanning(false);
    }, (captionWords.length + 2) * 160);
  };

  return (
    <section id="top" className="relative pt-36 md:pt-44 overflow-clip">
      {/* Dual Radial Sky Glow matching Aloud .hero-sky */}
      <div className="hero-sky pointer-events-none" aria-hidden="true" />

      {/* Hero Copy Container */}
      <div className="wrap flex flex-col items-center text-center relative z-10">
        {/* Fluid Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_SWIFT }}
          className="hero-title text-[clamp(28px,7.5vw,104px)] font-normal leading-[1.08] sm:leading-[0.98] tracking-[-0.03em] sm:tracking-[-0.058em] hero-title-gradient pb-2 max-w-5xl"
        >
          Intelligent Road<br className="sm:hidden" /> Monitoring.<br />
          Safer Roads.
        </motion.h1>

        {/* Hero Lede */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.15, ease: EASE_SWIFT }}
          className="mt-4 sm:mt-7 max-w-[640px] text-text-2 text-[clamp(15px,1.6vw,20px)] leading-[1.55] tracking-[-0.01em] px-2 sm:px-0"
        >
          AI-powered road damage detection that transforms road images and videos into actionable infrastructure intelligence.
        </motion.p>

        {/* Hero Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.25, ease: EASE_SWIFT }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9 sm:mt-10 w-full max-w-xs sm:max-w-none"
        >
          <motion.a
            href="#detection"
            className="btn btn-light btn-lg shadow-btn-light w-full sm:w-auto"
            {...buttonMotion}
          >
            <Eye className="w-4 h-4 text-amber" />
            <span>Explore Detection</span>
          </motion.a>

          <motion.button
            onClick={onOpenDemo}
            className="btn btn-ghost btn-lg shadow-btn-ghost w-full sm:w-auto"
            {...buttonMotion}
          >
            <Play className="w-3.5 h-3.5 fill-current text-text-2" />
            <span>View Live Demo</span>
            <span className="btn-note">1:20</span>
          </motion.button>
        </motion.div>

        {/* Monospace Spec Pills matching Aloud .hero-meta */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.38 }}
          className="flex flex-wrap justify-center items-center gap-x-2.5 gap-y-1 mt-6 text-text-3 font-mono text-[12.5px] tracking-wide"
        >
          <span>Edge Vision</span>
          <span className="text-text-4 select-none">·</span>
          <span>Real-Time 60 FPS</span>
          <span className="text-text-4 select-none">·</span>
          <span>Sub-meter GNSS</span>
          <span className="text-text-4 select-none">·</span>
          <span>ASTM D6433 Certified</span>
          <span className="text-text-4 select-none">·</span>
          <span>Model v4.2</span>
        </motion.p>
      </div>

      {/* Hero Stage matching Aloud .hero-stage with Road Image Analysis Dashboard */}
      <div className="hero-stage" id="hero-stage">
        {/* Ambient Glow */}
        <div className="hero-glow" aria-hidden="true" />

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.2, ease: EASE_SWIFT }}
          className="hero-frame px-3 sm:px-4"
        >
          {/* AI-Powered Road Image Analysis Interface */}
          <RoadImageAnalysis onAnalysisComplete={handleAnalysisComplete} />
        </motion.div>

        {/* Floating Telemetry Speech Bubble & Pill Dock (.bar-dock) directly under .hero-stage matching Aloud */}
        <div className="bar-dock">
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.25, ease: EASE_SWIFT }}
                className="bar-caption is-on"
                role="status"
              >
                {captionWords.map((word, idx) => (
                  <span
                    key={idx}
                    className={`inline-block mr-1 transition-opacity ${
                      idx < activeSpeechStep ? 'is-said text-white font-medium' : 'text-neutral-400 opacity-40'
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            ref={magneticRef}
            onClick={handleSimulateScan}
            style={{
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
            }}
            className="bar bar-hero cursor-pointer group"
            role="button"
            tabIndex={0}
            aria-label="Inspect Road Defect Detection Telemetry"
          >
            {/* Radar / Microphone Key with Ping Animation */}
            <div className="bar-key">
              <span className="relative flex items-center justify-center w-full h-full">
                <Radio className="w-3.5 h-3.5 text-amber" />
                <span className="absolute inset-0 rounded-md border border-amber/60 animate-ping pointer-events-none" />
              </span>
            </div>

            {/* Interactive Status Field */}
            <div className="bar-field">
              <span className="bar-ph hidden sm:inline">Telemetry Broadcast:</span>
              <span className="bar-ph sm:hidden">Telemetry:</span>
              <span className="bar-try text-neutral-800 font-mono text-[12px]">{activeTelemetryText}</span>
            </div>

            {/* Dynamic Sensor Telemetry Waveform Bars */}
            <div className="bar-meter">
              <div className="bar-bars" aria-hidden="true">
                <i style={{ height: isScanning ? '16px' : '6px' }} />
                <i style={{ height: isScanning ? '12px' : '14px' }} />
                <i style={{ height: isScanning ? '18px' : '8px' }} />
                <i style={{ height: isScanning ? '10px' : '16px' }} />
                <i style={{ height: isScanning ? '15px' : '10px' }} />
              </div>
            </div>

            {/* Live Telemetry Geocode Clock */}
            <div className="bar-clock hidden md:block">
              37°46&apos;29&quot;N 122°25&apos;10&quot;W
            </div>

            {/* RTK Fixed Chip */}
            <div className="bar-chip hidden sm:flex">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px]">RTK Lock ±4cm</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
