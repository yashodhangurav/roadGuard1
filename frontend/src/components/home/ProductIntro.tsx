import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Cpu, Wrench, ArrowRight, CheckCircle2 } from 'lucide-react';
import { EASE_SWIFT, windowReveal } from '../../styles/motion';

export const ProductIntro: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Edge Ingestion',
      subtitle: 'Passive Mobile & Dashcam Capture',
      desc: 'Vehicle-mounted dashcams or citizen mobile phones passively record road surface imagery while traversing urban corridors at up to 65 mph.',
      icon: Camera,
      badge: '60 FPS Video',
    },
    {
      num: '02',
      title: 'Neural Vision',
      subtitle: 'Sub-Millimeter AI Classification',
      desc: 'Custom-trained YOLOv11 segmentation models isolate asphalt cavities, alligator cracking, and surface rutting with 98.4% precision and real-time bounding boxes.',
      icon: Cpu,
      badge: '14.2ms Edge Latency',
    },
    {
      num: '03',
      title: 'Actionable Dispatch',
      subtitle: 'Automated Municipal Work Orders',
      desc: 'Severe cavities are immediately georeferenced, scored using ASTM D6433 Pavement Condition standards, and routed to municipal public works maintenance crews.',
      icon: Wrench,
      badge: 'Zero-Touch Work Orders',
    },
  ];

  return (
    <section id="intro" className="py-20 md:py-28 relative z-10 border-t border-line/60">
      <div className="wrap">
        {/* Section Header */}
        <div className="max-w-2xl mb-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE_SWIFT }}
            className="text-xs font-mono uppercase tracking-wider text-amber mb-3 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber" />
            <span>Autonomous Infrastructure Lifecycle</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE_SWIFT }}
            className="text-3xl md:text-5xl font-normal tracking-tight text-white mb-4"
          >
            How RoadGuard AI transforms roadway maintenance.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE_SWIFT }}
            className="text-base md:text-lg text-text-2 leading-relaxed"
          >
            Replacing manual walk-ins and slow paper surveys with an automated end-to-end loop: from camera capture to repaired asphalt.
          </motion.p>
        </div>

        {/* 3 Step Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                variants={windowReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15, ease: EASE_SWIFT }}
                className="group relative rounded-2xl border border-line-2 bg-gradient-to-b from-[#14151e]/80 to-[#0e0f14]/80 backdrop-blur-xl p-7 flex flex-col justify-between hover:border-line-3 hover:shadow-xl transition-all"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-mono font-bold text-amber/80 group-hover:text-amber transition-colors">
                      {step.num}
                    </span>
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-white/[0.04] border border-line text-text-3">
                      {step.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-surface-2 border border-line-2 flex items-center justify-center text-amber mb-5 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Text */}
                  <h3 className="text-xl font-semibold text-white tracking-tight mb-1">
                    {step.title}
                  </h3>
                  <div className="text-xs font-mono text-amber/90 mb-3">
                    {step.subtitle}
                  </div>
                  <p className="text-sm text-text-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-line/60 flex items-center gap-2 text-xs font-mono text-text-3 group-hover:text-white transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fully automated on-edge</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Link to Platform */}
        <div className="mt-12 text-center">
          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-sm font-semibold text-text-2 hover:text-white transition group"
          >
            <span>Learn more about our AI architecture and pavement algorithms</span>
            <ArrowRight className="w-4 h-4 text-amber group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};
