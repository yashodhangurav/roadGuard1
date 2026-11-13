import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  UploadCloud,
  CheckCircle2,
  Scan,
  Satellite,
  ChevronRight,
  Info,
  Clock,
} from 'lucide-react';
import { EASE_SWIFT, headerMotionVariants, windowReveal, buttonMotion } from '../styles/motion';

export type DefectType = 'Pothole' | 'Longitudinal Crack' | 'Alligator Crack' | 'Surface Deterioration';
export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface WorkflowDefect {
  id: string;
  type: DefectType;
  severity: SeverityLevel;
  confidence: number;
  depthMm?: number;
  dimensions: string;
  repairMethod: string;
  coordinates: string;
  box: {
    top: number; // percentage
    left: number; // percentage
    width: number; // percentage
    height: number; // percentage
  };
  mapPosition: {
    x: number; // percentage on map
    y: number; // percentage on map
  };
}

export interface RoadScene {
  id: string;
  name: string;
  location: string;
  pciScore: number;
  condition: 'Good' | 'Fair' | 'Poor' | 'Critical';
  imageMeta: string;
  defects: WorkflowDefect[];
}

const SAMPLE_SCENES: RoadScene[] = [
  {
    id: 'scene-101',
    name: 'US-101 Northbound · Milepost 14.2',
    location: 'San Francisco Bay Highway Corridor',
    pciScore: 58,
    condition: 'Fair',
    imageMeta: '1920×1080 · 60 FPS Dashcam · Forward View · ISO 100',
    defects: [
      {
        id: 'def-1',
        type: 'Pothole',
        severity: 'Critical',
        confidence: 98.4,
        depthMm: 72,
        dimensions: '480mm × 390mm · Vol 0.12m³',
        repairMethod: 'Immediate hot-mix asphalt compaction patch',
        coordinates: '37°46\'29"N 122°25\'10"W',
        box: { top: 48, left: 58, width: 22, height: 26 },
        mapPosition: { x: 32, y: 64 },
      },
      {
        id: 'def-2',
        type: 'Alligator Crack',
        severity: 'High',
        confidence: 94.1,
        dimensions: '1.4m × 0.9m · Wheelpath fatigue',
        repairMethod: 'Base stabilization and rubberized mastic seal',
        coordinates: '37°46\'31"N 122°25\'08"W',
        box: { top: 52, left: 18, width: 28, height: 28 },
        mapPosition: { x: 46, y: 50 },
      },
      {
        id: 'def-3',
        type: 'Longitudinal Crack',
        severity: 'Medium',
        confidence: 91.5,
        dimensions: '3.2m length · 14mm aperture',
        repairMethod: 'Hot-pour crack filling and edge sealant',
        coordinates: '37°46\'34"N 122°25\'04"W',
        box: { top: 22, left: 45, width: 14, height: 32 },
        mapPosition: { x: 64, y: 34 },
      },
      {
        id: 'def-4',
        type: 'Surface Deterioration',
        severity: 'Low',
        confidence: 88.7,
        dimensions: '0.8 m² · Aggregate raveling',
        repairMethod: 'Microsurfacing slurry seal preventative layer',
        coordinates: '37°46\'37"N 122°25\'01"W',
        box: { top: 62, left: 76, width: 18, height: 22 },
        mapPosition: { x: 82, y: 20 },
      },
    ],
  },
  {
    id: 'scene-280',
    name: 'I-280 Southbound · Milepost 28.6',
    location: 'Silicon Valley Transit Artery',
    pciScore: 46,
    condition: 'Poor',
    imageMeta: '4K Dashcam · 60 FPS HDR · Telephoto · ISO 160',
    defects: [
      {
        id: 'def-5',
        type: 'Pothole',
        severity: 'High',
        confidence: 96.2,
        depthMm: 54,
        dimensions: '360mm × 320mm · Vol 0.08m³',
        repairMethod: 'Cold-pour emergency patch prior to storm',
        coordinates: '37°24\'18"N 122°10\'42"W',
        box: { top: 54, left: 48, width: 20, height: 24 },
        mapPosition: { x: 38, y: 58 },
      },
      {
        id: 'def-6',
        type: 'Longitudinal Crack',
        severity: 'High',
        confidence: 93.8,
        dimensions: '4.8m length · 18mm aperture',
        repairMethod: 'Routing and rubberized joint sealant',
        coordinates: '37°24\'22"N 122°10\'38"W',
        box: { top: 32, left: 24, width: 18, height: 38 },
        mapPosition: { x: 58, y: 40 },
      },
      {
        id: 'def-7',
        type: 'Surface Deterioration',
        severity: 'Medium',
        confidence: 89.4,
        dimensions: '1.6 m² · Surface polishing & bleeding',
        repairMethod: 'Shotblasting surface texture restoration',
        coordinates: '37°24\'26"N 122°10\'33"W',
        box: { top: 60, left: 72, width: 22, height: 24 },
        mapPosition: { x: 76, y: 24 },
      },
    ],
  },
  {
    id: 'scene-oak',
    name: 'Oakwood Blvd · Municipal District 4',
    location: 'Urban Residential Arterial',
    pciScore: 74,
    condition: 'Good',
    imageMeta: 'Mobile Smartphone Mount · 1080p · Wide Angle',
    defects: [
      {
        id: 'def-8',
        type: 'Alligator Crack',
        severity: 'Medium',
        confidence: 92.6,
        dimensions: '0.9m × 0.6m · Incipient cracking',
        repairMethod: 'Preventative fog seal coating',
        coordinates: '37°48\'12"N 122°22\'05"W',
        box: { top: 58, left: 28, width: 24, height: 24 },
        mapPosition: { x: 44, y: 52 },
      },
      {
        id: 'def-9',
        type: 'Pothole',
        severity: 'Medium',
        confidence: 90.1,
        depthMm: 28,
        dimensions: '220mm × 190mm · Minor cavity',
        repairMethod: 'Standard spray-injection patching',
        coordinates: '37°48\'15"N 122°22\'02"W',
        box: { top: 46, left: 62, width: 16, height: 18 },
        mapPosition: { x: 68, y: 36 },
      },
    ],
  },
];

export const ProductPreview: React.FC = () => {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [selectedDefectId, setSelectedDefectId] = useState<string>('def-1');
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  const activeScene = SAMPLE_SCENES[activeSceneIndex];
  const selectedDefect =
    activeScene.defects.find((d) => d.id === selectedDefectId) || activeScene.defects[0];

  const handleSceneChange = (index: number) => {
    setActiveSceneIndex(index);
    setSelectedDefectId(SAMPLE_SCENES[index].defects[0]?.id || '');
    setIsSimulatingScan(true);
    setTimeout(() => {
      setIsSimulatingScan(false);
    }, 1200);
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'Critical':
        return {
          bg: 'bg-red-500/15',
          text: 'text-red-400',
          border: 'border-red-500/30',
          dot: 'bg-red-500',
        };
      case 'High':
        return {
          bg: 'bg-orange-500/15',
          text: 'text-orange-400',
          border: 'border-orange-500/30',
          dot: 'bg-orange-400',
        };
      case 'Medium':
        return {
          bg: 'bg-amber/15',
          text: 'text-amber',
          border: 'border-amber/30',
          dot: 'bg-amber',
        };
      case 'Low':
        return {
          bg: 'bg-sky-500/15',
          text: 'text-sky-400',
          border: 'border-sky-500/30',
          dot: 'bg-sky-400',
        };
    }
  };

  return (
    <motion.section
      id="demo"
      className="relative pt-32 md:pt-40"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, ease: EASE_SWIFT }}
    >
      <div className="wrap">
        {/* Section Header with Staggered Entrance */}
        <div className="max-w-[780px] mb-12 md:mb-16 text-left">
          <motion.div
            variants={headerMotionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="step"
          >
            <span className="step-n">DEMO</span>
            <span className="text-text font-medium">Interactive Product Demonstration</span>
          </motion.div>
          <motion.h2
            variants={headerMotionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="text-[clamp(34px,5.2vw,58px)] font-semibold leading-[1.04] tracking-[-0.045em] h2-gradient pb-2"
          >
            Complete edge inspection in action
          </motion.h2>
          <motion.p
            variants={headerMotionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            className="mt-4 text-text-2 text-[clamp(16px,1.5vw,19px)] leading-[1.6]"
          >
            Explore the end-to-end computer vision pipeline: upload road imagery, detect bounding boxes, classify defect types, compute severity indices, and pinpoint GPS locations on the GIS grid.
          </motion.p>
        </div>

        {/* Studio Window Chrome with Motion Reveal */}
        <motion.div
          variants={windowReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative rounded-card border border-line-2 bg-[#090a0d] shadow-window overflow-hidden"
        >
          {/* Top Chrome Titlebar with Scene Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-line bg-[#12141a]/90 backdrop-blur-md">
            {/* macOS Window Controls + Console Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80" />
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-text-2 font-medium">
                <Scan className="w-3.5 h-3.5 text-amber" />
                <span>RoadGuard Vision Studio — v4.2 Edge Classifier</span>
              </div>
            </div>

            {/* Road Image Input Selector */}
            <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-black/40 border border-line">
              <span className="text-[11px] font-mono text-text-3 px-2 hidden sm:inline-block">
                Sample Feeds:
              </span>
              {SAMPLE_SCENES.map((scene, idx) => (
                <button
                  key={scene.id}
                  onClick={() => handleSceneChange(idx)}
                  className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                    activeSceneIndex === idx
                      ? 'bg-white/10 text-text shadow-sm border border-line-2 font-medium'
                      : 'text-text-3 hover:text-text-2'
                  }`}
                >
                  {idx === 0 ? 'Route 101' : idx === 1 ? 'I-280' : 'Oakwood Blvd'}
                </button>
              ))}

              {/* Mock Upload Button */}
              <motion.button
                onClick={() => {
                  handleSceneChange((activeSceneIndex + 1) % SAMPLE_SCENES.length);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono text-amber hover:bg-amber/10 transition-colors ml-1"
                title="Simulate Uploading New Road Image"
                {...buttonMotion}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Simulate Upload</span>
              </motion.button>
            </div>
          </div>

          {/* Workflow Studio Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.32fr_1fr] border-b border-line items-stretch">
            {/* LEFT: 1. ROAD IMAGE INPUT + 2. AI DETECTION BOUNDING BOXES */}
            <div className="relative bg-[#0d0f14] overflow-hidden flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-line select-none">
              {/* Image Input Metadata Strip */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-line bg-[#090b0e]/70 text-[11px] font-mono text-text-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-text font-medium">{activeScene.name}</span>
                </div>
                <div className="hidden sm:inline-block">{activeScene.imageMeta}</div>
                {/* Toggle Bounding Boxes */}
                <button
                  onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                  className="text-amber hover:underline text-[11px]"
                >
                  {showBoundingBoxes ? 'Hide Bounding Boxes' : 'Show Bounding Boxes'}
                </button>
              </div>

              {/* Realistic Road Canvas Image Viewport */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-[#121316] overflow-hidden">
                {/* Granular Asphalt Road Texture SVG */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 1000 600"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <defs>
                    <filter id="demo-asphalt" x="0%" y="0%" width="100%" height="100%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                      <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0.14 0" />
                      <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
                    </filter>
                    <radialGradient id="demo-crater" cx="50%" cy="50%" r="55%">
                      <stop offset="0%" stopColor="#030303" />
                      <stop offset="65%" stopColor="#0d0d0d" />
                      <stop offset="100%" stopColor="#1e1e1e" />
                    </radialGradient>
                  </defs>

                  {/* Dark Asphalt Base */}
                  <rect width="1000" height="600" fill="#141417" />
                  <rect width="1000" height="600" fill="#1b1c20" filter="url(#demo-asphalt)" />

                  {/* Perspective Highway Shoulder and Outer Bounds */}
                  <line x1="200" y1="0" x2="60" y2="600" stroke="#ffffff" strokeWidth="4" strokeOpacity="0.35" />
                  <line x1="800" y1="0" x2="940" y2="600" stroke="#ffffff" strokeWidth="4" strokeOpacity="0.35" />

                  {/* Center Perspective Dashed Yellow Stripe */}
                  <line x1="495" y1="0" x2="495" y2="600" stroke="#f59e0b" strokeWidth="3" strokeDasharray="28 20" strokeOpacity="0.75" />
                  <line x1="505" y1="0" x2="505" y2="600" stroke="#f59e0b" strokeWidth="3" strokeDasharray="28 20" strokeOpacity="0.75" />

                  {/* Wheelpath Distress Cracks in Pavement */}
                  <path
                    d="M 240 330 Q 300 350 350 340 T 440 400"
                    stroke="#2b2d35"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 640 310 Q 720 290 770 340 T 840 380"
                    stroke="#2b2d35"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Physical Pothole Crater Bed SVG Graphic */}
                  <ellipse cx="680" cy="380" rx="90" ry="55" fill="url(#demo-crater)" />
                  <path
                    d="M 610 370 Q 640 330 710 335 Q 760 350 750 395 Q 720 430 650 420 Q 600 400 610 370 Z"
                    fill="#080808"
                    stroke="#3f3f46"
                    strokeWidth="2"
                  />
                </svg>

                {/* Scanning Laser Sweep Effect with Framer Motion */}
                <AnimatePresence>
                  {isSimulatingScan && (
                    <motion.div
                      initial={{ top: '0%', opacity: 0.9 }}
                      animate={{ top: '100%', opacity: [0.9, 1, 0.4] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.1, ease: 'linear' }}
                      className="absolute inset-x-0 h-1 bg-amber shadow-[0_0_20px_#d97757] pointer-events-none z-30"
                    />
                  )}
                </AnimatePresence>

                {/* 2. AI DETECTION BOUNDING BOXES OVER DEFECTS */}
                {showBoundingBoxes &&
                  activeScene.defects.map((defect) => {
                    const isSelected = defect.id === selectedDefectId;
                    const sevTokens = getSeverityBadge(defect.severity);

                    return (
                      <motion.div
                        key={defect.id}
                        layout
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.35, ease: EASE_SWIFT }}
                        onClick={() => setSelectedDefectId(defect.id)}
                        className={`absolute cursor-pointer transition-all duration-300 group ${
                          isSelected
                            ? 'z-20 scale-102 ring-2 ring-white/80 shadow-[0_0_25px_rgba(217,119,87,0.4)]'
                            : 'z-10 hover:scale-101 opacity-85 hover:opacity-100'
                        }`}
                        style={{
                          top: `${defect.box.top}%`,
                          left: `${defect.box.left}%`,
                          width: `${defect.box.width}%`,
                          height: `${defect.box.height}%`,
                        }}
                      >
                        {/* Bounding Box Border */}
                        <div
                          className={`w-full h-full rounded-md border-2 border-dashed ${
                            defect.severity === 'Critical'
                              ? 'border-red-500 bg-red-500/10'
                              : defect.severity === 'High'
                              ? 'border-orange-400 bg-orange-400/10'
                              : defect.severity === 'Medium'
                              ? 'border-amber bg-amber/10'
                              : 'border-sky-400 bg-sky-400/10'
                          }`}
                        >
                          {/* Corner L-Brackets */}
                          <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white" />
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white" />
                          <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white" />
                          <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white" />
                        </div>

                        {/* Defect Classification & Severity Label Tag */}
                        <div
                          className={`absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-mono whitespace-nowrap shadow-lg border transition-transform ${
                            isSelected
                              ? 'bg-white text-black border-black/20 font-semibold'
                              : 'bg-black/90 text-text border-line-2'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sevTokens.dot}`} />
                          <span>{defect.type}</span>
                          <span className={isSelected ? 'text-neutral-700' : sevTokens.text}>
                            ({defect.confidence}%)
                          </span>
                        </div>

                        {/* Dimensions & Depth Pill (Bottom of Box) */}
                        <div className="absolute -bottom-6 right-0 px-1.5 py-0.5 rounded bg-black/85 border border-line text-[9.5px] font-mono text-text-3 whitespace-nowrap">
                          {defect.depthMm ? `${defect.depthMm}mm depth` : defect.dimensions.split('·')[0]}
                        </div>
                      </motion.div>
                    );
                  })}

                {/* HUD Camera Overlays */}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/70 backdrop-blur-md border border-line text-[10px] font-mono text-text-3">
                  EDGE INFERENCE: 14.8ms · TENSORRT
                </div>
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-black/70 backdrop-blur-md border border-line text-[10px] font-mono text-text-3">
                  TARGET DEFECTS: {activeScene.defects.length} FOUND
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: 5. DETECTION RESULTS + 6. MAP PREVIEW */}
            <div className="flex flex-col justify-between bg-[#0b0c10] p-5 sm:p-6 text-left space-y-6">
              {/* 5. DETECTION RESULTS SUMMARY METRICS */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-text-3 block">
                      Survey Assessment
                    </span>
                    <h3 className="text-base font-semibold text-text tracking-tight mt-0.5">
                      Detection Telemetry & Road Condition
                    </h3>
                  </div>
                  {/* Road Condition Badge */}
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-text-3 uppercase block">Condition</span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md border ${
                        activeScene.pciScore >= 70
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : activeScene.pciScore >= 50
                          ? 'bg-amber/10 text-amber border-amber/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {activeScene.condition} (PCI {activeScene.pciScore}/100)
                    </span>
                  </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  <div className="p-3 rounded-lg bg-surface border border-line">
                    <span className="block text-[10px] font-mono text-text-3 uppercase">Total Defects</span>
                    <span className="text-base font-semibold text-text font-mono">
                      {activeScene.defects.length} Found
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-surface border border-line">
                    <span className="block text-[10px] font-mono text-text-3 uppercase">Avg Confidence</span>
                    <span className="text-base font-semibold text-amber font-mono">
                      {(
                        activeScene.defects.reduce((acc, d) => acc + d.confidence, 0) /
                        activeScene.defects.length
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-surface border border-line">
                    <span className="block text-[10px] font-mono text-text-3 uppercase">ASTM Standard</span>
                    <span className="text-base font-semibold text-text font-mono">D6433</span>
                  </div>
                </div>

                {/* 3 & 4. CLASSIFICATION & SEVERITY LIST */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-text-3 uppercase tracking-wider flex items-center justify-between">
                    <span>Identified Anomalies (Click to inspect)</span>
                    <span>Confidence</span>
                  </div>

                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {activeScene.defects.map((defect) => {
                      const isSelected = defect.id === selectedDefectId;
                      const sevTokens = getSeverityBadge(defect.severity);

                      return (
                        <motion.div
                          key={defect.id}
                          whileHover={{ x: 2 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => setSelectedDefectId(defect.id)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-surface-2 border-amber ring-1 ring-amber/50 shadow-sm'
                              : 'bg-surface/60 border-line hover:border-line-2 hover:bg-surface'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full ${sevTokens.dot}`} />
                            <div>
                              <div className="text-xs font-semibold text-text flex items-center gap-2">
                                <span>{defect.type}</span>
                                <span
                                  className={`text-[9.5px] font-mono uppercase px-1.5 py-0.2 rounded border ${sevTokens.bg} ${sevTokens.text} ${sevTokens.border}`}
                                >
                                  {defect.severity}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-text-3">
                                {defect.dimensions}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-semibold text-text">
                              {defect.confidence}%
                            </span>
                            <ChevronRight className="w-3 h-3 text-text-3 inline-block ml-1" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 6. MAP PREVIEW: GEOGRAPHIC CORRIDOR WITH DEFECT LOCATIONS */}
              <div className="pt-4 border-t border-line">
                <div className="flex items-center justify-between mb-2.5 text-xs font-mono text-text-3">
                  <div className="flex items-center gap-1.5 text-text font-medium">
                    <MapPin className="w-3.5 h-3.5 text-amber" />
                    <span>Corridor Geo-Map Preview</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <Satellite className="w-3 h-3 text-emerald-400" />
                    <span>GNSS RTK Locked</span>
                  </div>
                </div>

                {/* Stylized Dark Cartographic Vector Map */}
                <div className="relative aspect-[16/7] rounded-lg bg-[#07080a] border border-line-2 overflow-hidden">
                  {/* Cartographic Coordinate Grid Lines */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
                      `,
                      backgroundSize: '32px 32px',
                    }}
                  />

                  {/* Road Corridor Path SVG */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 200">
                    <path
                      d="M 40 170 C 160 140, 240 70, 460 30"
                      stroke="#1e293b"
                      strokeWidth="14"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M 40 170 C 160 140, 240 70, 460 30"
                      stroke="#d97757"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      fill="none"
                    />
                  </svg>

                  {/* Defect Location Map Markers */}
                  {activeScene.defects.map((defect) => {
                    const isSelected = defect.id === selectedDefectId;
                    const sevTokens = getSeverityBadge(defect.severity);

                    return (
                      <div
                        key={`map-${defect.id}`}
                        onClick={() => setSelectedDefectId(defect.id)}
                        className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 hover:scale-125 z-10"
                        style={{
                          left: `${defect.mapPosition.x}%`,
                          top: `${defect.mapPosition.y}%`,
                        }}
                      >
                        {/* Selected Ping Animation */}
                        {isSelected && (
                          <span className="absolute -inset-2 rounded-full bg-amber/40 animate-ping pointer-events-none" />
                        )}

                        {/* Defect Point Marker */}
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border shadow-md ${
                            isSelected
                              ? 'bg-amber border-white scale-110 shadow-[0_0_12px_rgba(217,119,87,0.8)]'
                              : `${sevTokens.bg} ${sevTokens.border}`
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-white' : sevTokens.dot
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Selected Location Stamp */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-line text-[10px] font-mono text-text-3">
                    <span className="text-text font-medium truncate">
                      {selectedDefect.type} · {selectedDefect.coordinates}
                    </span>
                    <span className="text-amber shrink-0 ml-2">
                      {selectedDefect.severity} SEVERITY
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Selected Defect Deep-Dive Banner with AnimatePresence */}
          <div className="px-5 py-3.5 bg-[#0e1014] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-text font-semibold">
                <Info className="w-3.5 h-3.5 text-amber" />
                Active Selection: {selectedDefect.type}
              </span>
              <span className="text-text-3 hidden sm:inline">|</span>
              <span className="text-text-2 hidden sm:inline">
                Recommended Action: <strong className="text-text">{selectedDefect.repairMethod}</strong>
              </span>
            </div>

            <div className="flex items-center gap-4 text-text-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber" />
                <span>Inspection Priority: {selectedDefect.severity === 'Critical' ? 'Urgent (24h)' : 'Scheduled'}</span>
              </span>
              <span className="text-text font-semibold">
                Confidence: <span className="text-emerald-400">{selectedDefect.confidence}%</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};
