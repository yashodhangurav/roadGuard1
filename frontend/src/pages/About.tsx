import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  MapPin,
  BarChart3,
  Wrench,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EASE_SWIFT } from '../styles/motion';

export const About: React.FC = () => {
  const pipelineSteps = [
    {
      num: '01',
      title: 'Detect It',
      desc: 'High-speed edge camera frames or citizen uploads are processed at 60 FPS using YOLOv11x segmentation, isolating potholes and cracks in 14.2 milliseconds.',
      icon: Eye,
    },
    {
      num: '02',
      title: 'Map It',
      desc: 'Sub-meter GNSS telemetry georeferences each defect, pinpointing coordinates onto high-precision GIS heatmaps for urban public works departments.',
      icon: MapPin,
    },
    {
      num: '03',
      title: 'Analyse It',
      desc: 'Distress severity is automatically calculated under ASTM D6433 standards, computing the Pavement Condition Index (PCI) and base-layer degradation risk.',
      icon: BarChart3,
    },
    {
      num: '04',
      title: 'Resolve It',
      desc: 'Direct work orders dispatch municipal maintenance crews with exact asphalt patch volume estimates, closing the loop with verified completion audits.',
      icon: Wrench,
    },
  ];

  return (
    <div className="py-12 md:py-20">
      <div className="wrap">
        {/* Page Header */}
        <div className="max-w-3xl mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SWIFT }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber/40 bg-amber/10 text-xs font-mono text-amber mb-4 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Transportation Intelligence</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_SWIFT }}
            className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white mb-6"
          >
            Pioneering safer roadways with edge vision.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE_SWIFT }}
            className="text-base sm:text-xl text-text-2 leading-relaxed"
          >
            RoadGuard AI is an automated infrastructure platform engineered to detect roadway damage, map potholes in real-time, and transform raw street imagery into civil engineering intelligence.
          </motion.p>
        </div>

        {/* Problem & Solution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {/* Problem */}
          <div className="rounded-2xl border border-line-2 bg-gradient-to-b from-[#161314]/90 to-[#0e0c0d]/90 backdrop-blur-xl p-8 shadow-xl">
            <div className="text-xs font-mono uppercase tracking-wider text-red-400 mb-2">
              The Infrastructure Problem
            </div>
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-4">
              Potholes cost billions and endanger lives.
            </h2>
            <p className="text-sm text-text-2 leading-relaxed mb-6">
              Traditional pavement surveys rely on manual foot patrols or expensive specialized inspection vans driven once every 3 to 5 years. By the time a pothole is cataloged, water ingress and traffic impact have already degraded the structural roadbed, costing cities 400% more in deep reconstruction fees.
            </p>
            <ul className="space-y-2.5 text-xs font-mono text-text-3">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>$26.5B spent annually in vehicular pothole damage</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>Average 42-day lag between defect onset and municipal repair</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>Severe safety hazard for cyclists and motorcyclists</span>
              </li>
            </ul>
          </div>

          {/* Solution */}
          <div className="rounded-2xl border border-line-2 bg-gradient-to-b from-[#13161c]/90 to-[#0c0e14]/90 backdrop-blur-xl p-8 shadow-xl">
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">
              The RoadGuard AI Solution
            </div>
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-4">
              Real-time computer vision + citizen crowd telemetry.
            </h2>
            <p className="text-sm text-text-2 leading-relaxed mb-6">
              We bridge the gap between residents and city departments. High-frequency dashcams and citizen mobile reports feed an automated neural pipeline that classifies defects, quantifies cavity dimensions, and automatically queues work orders for public works repair crews.
            </p>
            <ul className="space-y-2.5 text-xs font-mono text-text-3">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Sub-15ms edge inference on consumer hardware</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Turnaround times slashed from weeks to under 48 hours</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Full civil compliance with ASTM D6433 PCI metrics</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 4-Stage Pipeline Section */}
        <div className="mb-20">
          <div className="max-w-xl mb-10">
            <div className="text-xs font-mono uppercase tracking-wider text-amber mb-2">
              End-to-End Pipeline
            </div>
            <h2 className="text-3xl font-semibold text-white tracking-tight">
              The 4-stage autonomous lifecycle.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pipelineSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="rounded-2xl border border-line-2 bg-gradient-to-b from-[#13141d]/90 to-[#0c0d12]/90 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xl font-mono font-bold text-amber">
                        {step.num}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-text">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white tracking-tight mb-2">
                      {step.title}
                    </h3>
                    <p className="text-xs text-text-2 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technology Deep Dive & Privacy */}
        <div id="privacy" className="rounded-3xl border border-line-2 bg-gradient-to-b from-[#13141f]/90 via-[#0f1017]/90 to-[#0a0a0f]/95 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/40 bg-blue-500/10 text-xs font-mono text-blue-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero-Surveillance Privacy Engine</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-white">
                Engineered for pavement, not surveillance.
              </h2>
              <p className="text-sm text-text-2 leading-relaxed">
                RoadGuard AI is purpose-built to preserve public privacy. Before any pavement frame is saved or transmitted, on-chip neural algorithms automatically blur pedestrian faces and vehicle license plates. Only anonymized road surface telemetry and geospatial distress coordinates enter municipal archives.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 font-mono text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-line">
                  <div className="text-amber font-bold">100% On-Device</div>
                  <div className="text-text-4 text-[10px] mt-0.5">Pre-storage redaction</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-line">
                  <div className="text-emerald-400 font-bold">ASTM D6433</div>
                  <div className="text-text-4 text-[10px] mt-0.5">Civil compliant</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-line">
                  <div className="text-blue-400 font-bold">Zero Cloud Lock-in</div>
                  <div className="text-text-4 text-[10px] mt-0.5">Self-hostable stack</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-line font-mono text-xs space-y-4">
              <div className="text-text uppercase font-semibold text-xs tracking-wider border-b border-line pb-3">
                Core Tech Stack
              </div>
              <div className="space-y-2 text-text-3">
                <div className="flex justify-between">
                  <span>Vision Model:</span>
                  <span className="text-white">YOLOv11x-Seg</span>
                </div>
                <div className="flex justify-between">
                  <span>Inference:</span>
                  <span className="text-white">ONNX / TensorRT</span>
                </div>
                <div className="flex justify-between">
                  <span>Frontend:</span>
                  <span className="text-white">React 18 + Tailwind</span>
                </div>
                <div className="flex justify-between">
                  <span>Mapping:</span>
                  <span className="text-white">Leaflet & OpenStreetMap</span>
                </div>
                <div className="flex justify-between">
                  <span>Telemetry:</span>
                  <span className="text-white">ASTM Pavement Index</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <Link
            to="/detection"
            className="btn btn-light btn-lg shadow-btn-light inline-flex items-center gap-2"
          >
            <span>Explore the AI Detection Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
