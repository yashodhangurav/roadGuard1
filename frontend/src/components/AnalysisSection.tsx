import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sliders, Activity, ShieldCheck, Box, Crosshair } from 'lucide-react';
import {
  EASE_SWIFT,
  headerMotionVariants,
  windowReveal,
} from '../styles/motion';

interface ModelTab {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  mAP: string;
  architecture: string;
  latency: string;
  desc: string;
  metrics: { label: string; value: string }[];
}

export const AnalysisSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const tabs: ModelTab[] = [
    {
      name: 'Pothole Segmenter',
      icon: Crosshair,
      mAP: '98.4%',
      architecture: 'YOLOv11x-Seg · FP16',
      latency: '14.2ms',
      desc: 'Deep convolutional segmentation model trained on 240,000 georeferenced asphalt cavity annotations. Distinguishes true structural voids from illumination artifacts and surface stains.',
      metrics: [
        { label: 'Precision', value: '99.1%' },
        { label: 'Recall', value: '97.8%' },
        { label: 'Volumetric Accuracy', value: '±6%' },
        { label: 'Edge Latency', value: '14.2ms' },
      ],
    },
    {
      name: 'Crack Classifier',
      icon: Activity,
      mAP: '95.2%',
      architecture: 'HRNet-W48 Backbone',
      latency: '18.6ms',
      desc: 'High-resolution feature network segmenting thin fracture boundaries down to 1.5mm width. Automatically differentiates structural alligator fatigue from environmental thermal joint contraction.',
      metrics: [
        { label: 'Crack Width Resolution', value: '1.5mm' },
        { label: 'Classification F1', value: '0.96' },
        { label: 'Alligator Accuracy', value: '94.8%' },
        { label: 'Edge Latency', value: '18.6ms' },
      ],
    },
    {
      name: 'Depth Profiler',
      icon: Box,
      mAP: '±4mm',
      architecture: 'Temporal Stereo Photogrammetry',
      latency: '22.1ms',
      desc: 'Multi-view stereo disparity and monocular depth neural estimation reconstructing sub-surface pavement cavities in 3D to compute exact asphalt patch volume before dispatch.',
      metrics: [
        { label: 'Z-Axis Accuracy', value: '±4mm' },
        { label: 'Max Depth Range', value: '250mm' },
        { label: 'Volume Disparity', value: '<5%' },
        { label: 'Point Cloud Density', value: '42k pts/m²' },
      ],
    },
    {
      name: 'PCI Calculator',
      icon: ShieldCheck,
      mAP: 'ASTM D6433',
      architecture: 'Standard Deduct Value Engine',
      latency: '<2ms',
      desc: 'Automates ASTM D6433 Pavement Condition Index ratings (0–100 scale), aggregating distress types, severity levels (Low, Medium, High), and density weights into certified inspection logs.',
      metrics: [
        { label: 'Standard', value: 'ASTM D6433-20' },
        { label: 'Corridor Rating Scale', value: '0 – 100 PCI' },
        { label: 'Deduct Accuracy', value: '100% Deterministic' },
        { label: 'Audit Compliance', value: 'Federal Highway' },
      ],
    },
    {
      name: 'Custom Rules',
      icon: Sliders,
      mAP: 'Configurable',
      architecture: 'Municipal Policy Rule Engine',
      latency: '<1ms',
      desc: 'Empowers municipal departments to configure custom trigger thresholds, winter freeze-thaw sensitivity, emergency pothole dispatch criteria, and contractor SLA penalties.',
      metrics: [
        { label: 'Threshold Override', value: 'Custom Depth' },
        { label: 'Freeze-Thaw Mode', value: 'Active' },
        { label: 'Emergency Alerts', value: '< 24 Hours' },
        { label: 'Export Integrations', value: 'Esri / Cartegraph' },
      ],
    },
  ];

  // Auto-switch tabs every 6.5s matching Aloud's setupFlows behavior, paused on hover
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [tabs.length, isPaused]);

  return (
    <motion.section
      id="analysis"
      className="relative pt-36 md:pt-44"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, ease: EASE_SWIFT }}
    >
      <div className="wrap">
        {/* Step Header with Staggered Entrance */}
        <div className="max-w-[780px] mb-12 md:mb-16 text-left">
          <motion.div
            variants={headerMotionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="step"
          >
            <span className="step-n">03</span>
            <span className="text-text font-medium">Analyse it</span>
          </motion.div>
          <motion.h2
            variants={headerMotionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="text-[clamp(36px,5.4vw,60px)] font-semibold leading-[1.04] tracking-[-0.045em] h2-gradient pb-2"
          >
            “Is that a puddle or a pothole?” Solved.
          </motion.h2>
          <motion.p
            variants={headerMotionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            className="mt-5 text-text-2 text-[clamp(17px,1.5vw,19px)] leading-[1.6]"
          >
            Defect classification, severity ratings, and automated road condition analysis. Raw road video is full of shadows, wet reflections, and tire marks. RoadGuard AI strips optical noise, computes true crater depth in 3D, and turns chaotic imagery into audited ASTM D6433 engineering data.
          </motion.p>
        </div>

        {/* Telemetry Noise Diff Component matching Aloud #diff */}
        <motion.div
          variants={windowReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-5 items-stretch"
        >
          {/* Left: Raw Sensor Input with False Positives Strikethrough */}
          <div className="p-6 md:p-8 rounded-card border border-line bg-surface shadow-card text-left flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between text-xs font-mono text-text-3 border-b border-line pb-3 mb-5">
                <span className="font-semibold text-text-2">RAW SENSOR INGESTION</span>
                <span>8 triggers · 60 FPS Dashcam</span>
              </div>
              <div className="space-y-3.5 text-[15px] leading-relaxed">
                <p className="text-text-4 line-through decoration-[#ff5555]/60 hover:text-text-3 transition-colors">
                  <s>Overhead highway overpass shadow</s>
                </p>
                <p className="text-text-4 line-through decoration-[#ff5555]/60 hover:text-text-3 transition-colors">
                  <s>Standing rainwater puddle reflection (flat surface, 0mm depth)</s>
                </p>
                <p className="text-text-4 line-through decoration-[#ff5555]/60 hover:text-text-3 transition-colors">
                  <s>Heavy deceleration tire skid mark (intact asphalt aggregate)</s>
                </p>
                <p className="text-text-4 line-through decoration-[#ff5555]/60 hover:text-text-3 transition-colors">
                  <s>Dry fallen leaves & road shoulder debris cluster</s>
                </p>
                <p className="text-text-4 line-through decoration-[#ff5555]/60 hover:text-text-3 transition-colors">
                  <s>Wet oil sheen surface refraction artifact</s>
                </p>
                <p className="underline decoration-dotted decoration-amber underline-offset-4 text-text font-medium">
                  <u>Transverse fatigue crack — Disparity verified: 14mm depth</u>
                </p>
                <p className="underline decoration-dotted decoration-amber underline-offset-4 font-semibold text-white">
                  <u>Severe asphalt pothole void — 72mm vertical crater at MP 14.2</u>
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-line text-[11px] font-mono text-text-3 flex items-center justify-between">
              <span>False Positive Rejection: 71.4%</span>
              <span className="text-emerald-400">Filtered on-edge</span>
            </div>
          </div>

          {/* Middle: Directional Flow Arrow */}
          <div className="flex md:flex-col items-center justify-center p-3 text-text-3">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-full bg-white/[0.04] border border-line-2 flex items-center justify-center text-amber shadow-sm"
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </div>

          {/* Right: Clean Verified Engineering Telemetry */}
          <div className="p-6 md:p-8 rounded-card border border-line bg-surface shadow-card text-left flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between text-xs font-mono text-text-3 border-b border-line pb-3 mb-5">
                <span className="font-semibold text-text-2">AUDITED WORK-ORDER SPECIFICATION</span>
                <span className="text-amber">ASTM D6433 Certified</span>
              </div>
              <div className="space-y-3.5">
                {/* Defect Spec Card 1 */}
                <motion.div
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}
                  className="p-3.5 rounded-lg bg-surface-2 border border-line-2 hover:border-amber/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber" />
                      Pothole #104 — Urgent (48h)
                    </span>
                    <span className="text-[10px] font-mono text-amber px-1.5 py-0.5 rounded bg-amber/10">
                      PCI -28 pts
                    </span>
                  </div>
                  <div className="text-xs text-text-3 mt-1.5 font-mono">
                    Void: 420mm × 380mm × 72mm · Volume: 0.11 m³ · Hot-Mix Patch
                  </div>
                </motion.div>

                {/* Defect Spec Card 2 */}
                <motion.div
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}
                  className="p-3.5 rounded-lg bg-surface-2 border border-line-2 hover:border-amber/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      Transverse Crack #105 — High Severity
                    </span>
                    <span className="text-[10px] font-mono text-orange-400 px-1.5 py-0.5 rounded bg-orange-400/10">
                      PCI -14 pts
                    </span>
                  </div>
                  <div className="text-xs text-text-3 mt-1.5 font-mono">
                    Length: 2.8m · Width: 14mm · Depth: 18mm · Rubberized Mastic
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-line text-[11px] font-mono text-text-3 flex items-center justify-between">
              <span>Segment Overall PCI: 58 / 100</span>
              <span className="text-amber font-semibold">Tier 1 Municipal Maintenance</span>
            </div>
          </div>
        </motion.div>

        {/* Diff Legend */}
        <div className="flex flex-wrap justify-center items-center gap-6 mt-6 text-xs text-text-3">
          <div className="flex items-center gap-2">
            <span className="text-text-4 line-through decoration-[#ff5555]"><s>Optical Artifact</s></span>
            <span>Shadows, puddle reflections, glare, and tire marks rejected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="underline decoration-dotted decoration-amber underline-offset-4 text-text font-medium">
              <u>Stereo Depth Verified</u>
            </span>
            <span>Real physical depressions and fractures measured in 3D</span>
          </div>
        </div>

        {/* 5-Tab AI Model Taxonomy Component matching Aloud #flows */}
        <div className="mt-28">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8 text-left">
            <div>
              <h3 className="text-xl md:text-2xl font-semibold text-text tracking-tight">
                Four specialized neural models, and custom municipal rules
              </h3>
              <p className="mt-2 text-sm text-text-2 max-w-xl">
                Each model runs independently on calibrated sensor telemetry. Models can be fine-tuned to regional asphalt wear patterns and frost heave cycles.
              </p>
            </div>
          </div>

          {/* Tab Navigation with 6.5s Auto-Progress Indicator */}
          <div
            className="flex flex-wrap gap-2.5 mb-6"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {tabs.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = i === activeTab;
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(i)}
                  className={`relative flex items-center gap-2 h-11 px-5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/[0.09] text-text border border-line-3 shadow-sm'
                      : 'text-text-2 hover:text-text border border-line-2 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber" />
                  <span>{tab.name}</span>

                  {/* Auto-Timer Progress Bar on Active Tab with Framer Motion */}
                  {isActive && !isPaused && (
                    <motion.span
                      layoutId="tabProgressLine"
                      className="absolute bottom-1 inset-x-5 h-[2px] rounded-full bg-amber/80 origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 6.5, ease: 'linear' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel with Crossfade Motion */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tabs[activeTab].name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: EASE_SWIFT }}
              className="p-8 md:p-10 rounded-card border border-line-2 bg-surface shadow-card text-left"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-line mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold text-text">{tabs[activeTab].name}</h4>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.05] border border-line text-amber">
                      {tabs[activeTab].architecture}
                    </span>
                  </div>
                  <p className="text-sm text-text-2 max-w-2xl mt-2 leading-relaxed">
                    {tabs[activeTab].desc}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="px-3 py-1.5 rounded-lg bg-surface-2 border border-line">
                    <span className="text-text-3 block text-[10px] uppercase">Accuracy</span>
                    <span className="text-text font-semibold">{tabs[activeTab].mAP}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-surface-2 border border-line">
                    <span className="text-text-3 block text-[10px] uppercase">Latency</span>
                    <span className="text-emerald-400 font-semibold">{tabs[activeTab].latency}</span>
                  </div>
                </div>
              </div>

              {/* Sub-metrics Grid for Active Model */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tabs[activeTab].metrics.map((metric, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-surface-2/60 border border-line">
                    <span className="block text-[11px] font-mono text-text-3 uppercase tracking-wider mb-1">
                      {metric.label}
                    </span>
                    <span className="text-base font-semibold text-text font-mono">
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
};
