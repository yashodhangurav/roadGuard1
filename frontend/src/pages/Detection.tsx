import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Cpu, Layers, ShieldCheck, Download } from 'lucide-react';
import { RoadImageAnalysis } from '../components/RoadImageAnalysis';
import { EASE_SWIFT } from '../styles/motion';

export const Detection: React.FC = () => {
  return (
    <div className="py-12 md:py-16">
      <div className="wrap">
        {/* Page Header */}
        <div className="max-w-3xl mb-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SWIFT }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber/40 bg-amber/10 text-xs font-mono text-amber mb-4 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Computer Vision Engine · YOLOv11x-Seg</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_SWIFT }}
            className="text-3xl sm:text-5xl font-normal tracking-tight text-white mb-4"
          >
            Road Image Defect Detection Studio
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE_SWIFT }}
            className="text-base sm:text-lg text-text-2 leading-relaxed"
          >
            Upload any pavement photograph or test our pre-calibrated road distress samples. Our convolutional neural network segments cavities, cracks, and surface wear with millimeter precision.
          </motion.p>
        </div>

        {/* Feature Badges Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 text-xs font-mono">
          <div className="p-3 rounded-xl border border-line bg-surface/60 backdrop-blur-md flex items-center gap-3">
            <Cpu className="w-4 h-4 text-amber shrink-0" />
            <div>
              <div className="font-semibold text-white">YOLOv11x</div>
              <div className="text-[10px] text-text-3">Neural Segmentation</div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-line bg-surface/60 backdrop-blur-md flex items-center gap-3">
            <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">4 Defect Classes</div>
              <div className="text-[10px] text-text-3">Potholes & Cracks</div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-line bg-surface/60 backdrop-blur-md flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">ASTM D6433</div>
              <div className="text-[10px] text-text-3">Civil Severity Index</div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-line bg-surface/60 backdrop-blur-md flex items-center gap-3">
            <Download className="w-4 h-4 text-amber shrink-0" />
            <div>
              <div className="font-semibold text-white">Report Export</div>
              <div className="text-[10px] text-text-3">JSON & PDF Telemetry</div>
            </div>
          </div>
        </div>

        {/* The Full Road Image Analysis Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE_SWIFT }}
        >
          <RoadImageAnalysis />
        </motion.div>
      </div>
    </div>
  );
};

export default Detection;
