import React, { useState, useEffect } from 'react';
import { ArrowRight, Sliders, Activity, ShieldCheck, Box, Crosshair } from 'lucide-react';

export const AnalysisSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { name: 'Pothole Segmenter', icon: Crosshair, mAP: '98.4%', desc: 'Mask-RCNN and YOLO-v11 architecture trained on 240,000 pavement void annotations.' },
    { name: 'Crack Classifier', icon: Activity, mAP: '95.2%', desc: 'Fracture segmentation model discerning longitudinal, transverse, and fatigue alligator cracking.' },
    { name: 'Depth Profiler', icon: Box, mAP: '±4mm', desc: 'Stereo disparity photogrammetry and monocular neural depth estimation calculating vertical crater void.' },
    { name: 'PCI Calculator', icon: ShieldCheck, mAP: 'ASTM D6433', desc: 'Standard Pavement Condition Index logic scoring road segments from 0 (failed) to 100 (good).' },
    { name: 'Custom Rules', icon: Sliders, mAP: 'Configurable', desc: 'Municipal-specific severity thresholds and contractor alert triggers matching regional guidelines.' },
  ];

  // Auto-switch tabs every 6.5s matching Aloud's setupFlows behavior
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [tabs.length]);

  return (
    <section id="analysis" className="relative pt-36 md:pt-44">
      <div className="wrap">
        {/* Step Header */}
        <div className="max-w-[780px] mb-14 md:mb-16">
          <div className="step">
            <span className="step-n">03</span>
            <span className="text-text font-medium">Analysis</span>
          </div>
          <h2 className="text-[clamp(36px,5.4vw,60px)] font-semibold leading-[1.04] tracking-[-0.045em] h2-gradient pb-2">
            “Is that a puddle or a pothole?” Solved.
          </h2>
          <p className="mt-5 text-text-2 text-[clamp(17px,1.5vw,19px)] leading-[1.6]">
            Show defect classification, confidence scores, severity and road condition analytics. Raw road video is full of shadows, wet asphalt reflections, and tire marks. RoadGuard AI strips optical noise, computes true crater depth, and turns chaotic imagery into audited engineering data.
          </p>
        </div>

        {/* Telemetry Noise Diff Component matching Aloud #diff */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-5 items-stretch">
          {/* Left: Raw Sensor Input with False Positives Strikethrough */}
          <div className="p-7 rounded-card border border-line bg-surface shadow-card text-left">
            <div className="flex items-baseline justify-between text-xs font-mono text-text-3 border-b border-line pb-3 mb-4">
              <span className="font-semibold text-text-2">RAW CAMERA STREAM</span>
              <span>8 stream triggers · 60 FPS</span>
            </div>
            <div className="space-y-3 text-[15px] text-text leading-relaxed">
              <p className="text-text-4 line-through decoration-white/40">
                Overhead highway overpass shadow
              </p>
              <p className="text-text-4 line-through decoration-white/40">
                Standing rainwater puddle reflection
              </p>
              <p className="text-text-4 line-through decoration-white/40">
                Heavy deceleration tire skid mark
              </p>
              <p className="underline decoration-dotted decoration-white/60 underline-offset-4">
                Transverse fatigue crack — Disparity verified: 14mm depth
              </p>
              <p className="underline decoration-dotted decoration-white/60 underline-offset-4 font-medium text-white">
                Severe asphalt pothole void — 72mm vertical depression
              </p>
            </div>
          </div>

          {/* Middle: Directional Flow Arrow */}
          <div className="flex md:flex-col items-center justify-center p-2 text-text-4">
            <ArrowRight className="w-5 h-5 text-amber" />
          </div>

          {/* Right: Clean Verified Engineering Telemetry */}
          <div className="p-7 rounded-card border border-line bg-surface shadow-card text-left">
            <div className="flex items-baseline justify-between text-xs font-mono text-text-3 border-b border-line pb-3 mb-4">
              <span className="font-semibold text-text-2">AUDITED DEFECT SPECIFICATION</span>
              <span className="text-amber">ASTM D6433 Certified</span>
            </div>
            <div className="space-y-3.5 text-sm">
              <div className="p-3 rounded-lg bg-surface-2/80 border border-line-2">
                <div className="font-semibold text-text">Pothole #104 — High Priority</div>
                <div className="text-xs text-text-3 mt-1 font-mono">
                  Void: 420mm × 380mm × 72mm · Volume: 0.11 m³
                </div>
              </div>
              <div className="p-3 rounded-lg bg-surface-2/80 border border-line-2">
                <div className="font-semibold text-text">Transverse Crack #105 — Medium Severity</div>
                <div className="text-xs text-text-3 mt-1 font-mono">
                  Length: 2.8m · Width: 14mm · Depth: 18mm
                </div>
              </div>
              <div className="text-xs text-text-3 font-mono pt-1">
                PCI Impact: -34 points on surveyed segment
              </div>
            </div>
          </div>
        </div>

        {/* Diff Legend */}
        <div className="flex flex-wrap justify-center items-center gap-6 mt-6 text-xs text-text-3">
          <div className="flex items-center gap-2">
            <span className="text-text-4 line-through">Strikethrough</span>
            <span>Filtered optical artifacts (shadows, puddle reflections, glare)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="underline decoration-dotted decoration-white/60 underline-offset-4 text-text">
              Dotted underline
            </span>
            <span>Stereo depth-verified structural pavement failures</span>
          </div>
        </div>

        {/* 5-Tab AI Model Taxonomy Component matching Aloud #flows */}
        <div className="mt-28">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8 text-left">
            <div>
              <h3 className="text-xl font-semibold text-text">Four specialized neural models, and custom municipal rules</h3>
              <p className="mt-2 text-sm text-text-2 max-w-xl">
                Each model runs independently on calibrated sensor telemetry. Models can be fine-tuned to regional asphalt wear patterns and frost heave cycles.
              </p>
            </div>
          </div>

          {/* Tab Navigation with 6.5s Auto-Progress Indicator */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = i === activeTab;
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(i)}
                  className={`relative flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/[0.08] text-text border border-line-3'
                      : 'text-text-2 hover:text-text border border-line-2 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber" />
                  <span>{tab.name}</span>

                  {/* Auto-Timer Progress Bar on Active Tab */}
                  {isActive && (
                    <span className="absolute bottom-1.5 inset-x-4 h-[1px] bg-white/60 animate-flow-bar origin-left" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          <div className="p-8 rounded-card border border-line bg-surface shadow-card text-left">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-semibold text-text">{tabs[activeTab].name}</span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-white/[0.05] border border-line text-amber">
                Accuracy: {tabs[activeTab].mAP}
              </span>
            </div>
            <p className="text-sm text-text-2 max-w-2xl leading-relaxed">
              {tabs[activeTab].desc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

