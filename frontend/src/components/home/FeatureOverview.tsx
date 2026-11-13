import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Scan,
  MapPin,
  BarChart3,
  FileCheck,
  TrendingUp,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { EASE_SWIFT, windowReveal } from '../../styles/motion';

export const FeatureOverview: React.FC = () => {
  const features = [
    {
      title: 'AI Detection Workspace',
      subtitle: 'Computer Vision & Defect Segmentation',
      desc: 'Drag and drop road imagery or select street presets to run YOLOv11 inference. Visualizes real-time bounding boxes, damage categories, confidence scores, and millimeter cavity dimensions.',
      link: '/detection',
      badge: 'Interactive Model',
      icon: Scan,
      accent: 'border-amber/40 hover:border-amber',
      tagColor: 'text-amber bg-amber/10',
    },
    {
      title: 'Geographical Defect Mapping',
      subtitle: 'Interactive GIS Municipal Heatmap',
      desc: 'High-density geospatial map tracking potholes, alligator cracks, and rutting coordinates. Filter by severity level, click pins for verified defect details, and locate nearby hazards.',
      link: '/mapping',
      badge: 'React Leaflet GIS',
      icon: MapPin,
      accent: 'border-blue-500/30 hover:border-blue-400',
      tagColor: 'text-blue-400 bg-blue-500/10',
    },
    {
      title: 'Pavement Condition Analysis',
      subtitle: 'ASTM D6433 PCI Intelligence',
      desc: 'Automated Pavement Condition Index calculation based on defect deduct values, structural fracture frequency, and multi-tier neural backbones (YOLOv11x + HRNet + stereo depth).',
      link: '/analysis',
      badge: 'Civil Engineering Standards',
      icon: BarChart3,
      accent: 'border-purple-500/30 hover:border-purple-400',
      tagColor: 'text-purple-400 bg-purple-500/10',
    },
    {
      title: 'Citizen Incident Reports',
      subtitle: 'Crowdsourced Road Hazard Ledger',
      desc: 'Community-driven reporting portal where residents report potholes with GPS pins and photos. Tracks verified municipal lifecycle stages: Submitted, Under Review, In Progress, and Resolved.',
      link: '/reports',
      badge: 'Community Portal',
      icon: FileCheck,
      accent: 'border-emerald-500/30 hover:border-emerald-400',
      tagColor: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      title: 'Infrastructure Analytics',
      subtitle: 'Executive Telemetry & Municipal Velocity',
      desc: 'District hazard density, monthly submission vs resolution trends, Mean Time to Repair (MTTR) analytics, and automated one-click CSV infrastructure telemetry exports.',
      link: '/analytics',
      badge: 'DPW Dashboard',
      icon: TrendingUp,
      accent: 'border-amber/30 hover:border-amber',
      tagColor: 'text-amber bg-amber/10',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 relative z-10 border-t border-line/60">
      <div className="wrap">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE_SWIFT }}
              className="text-xs font-mono uppercase tracking-wider text-amber mb-3 flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Core Application Modules</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_SWIFT }}
              className="text-3xl md:text-5xl font-normal tracking-tight text-white mb-3"
            >
              Dedicated tools for every infrastructure stakeholder.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE_SWIFT }}
              className="text-base text-text-2"
            >
              From frontline citizens to civil engineers and municipal DPW supervisors, explore the modular capabilities of RoadGuard AI.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE_SWIFT }}
          >
            <Link
              to="/detection"
              className="btn btn-ghost border border-line-2 hover:border-line-3 text-xs font-mono"
            >
              <Layers className="w-3.5 h-3.5 text-amber" />
              <span>Open Detection Studio</span>
            </Link>
          </motion.div>
        </div>

        {/* Feature Cards Grid (Compact 3 + 2 layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.slice(0, 3).map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                variants={windowReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: EASE_SWIFT }}
                className={`group relative rounded-2xl border border-line-2 bg-gradient-to-b from-[#13141d]/90 to-[#0c0d12]/90 backdrop-blur-xl p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${feat.accent}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-surface-2 border border-line-2 flex items-center justify-center text-text group-hover:text-amber transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full border border-line ${feat.tagColor}`}>
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-white tracking-tight mb-1">
                    {feat.title}
                  </h3>
                  <div className="text-xs font-mono text-text-3 mb-3">
                    {feat.subtitle}
                  </div>
                  <p className="text-sm text-text-2 leading-relaxed mb-6">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-5 border-t border-line/60">
                  <Link
                    to={feat.link}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-text hover:text-amber transition-colors group/link"
                  >
                    <span>Launch {feat.title.split(' ')[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Secondary Row of 2 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {features.slice(3, 5).map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                variants={windowReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + idx * 0.1, ease: EASE_SWIFT }}
                className={`group relative rounded-2xl border border-line-2 bg-gradient-to-b from-[#13141d]/90 to-[#0c0d12]/90 backdrop-blur-xl p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${feat.accent}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-surface-2 border border-line-2 flex items-center justify-center text-text group-hover:text-amber transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full border border-line ${feat.tagColor}`}>
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-white tracking-tight mb-1">
                    {feat.title}
                  </h3>
                  <div className="text-xs font-mono text-text-3 mb-3">
                    {feat.subtitle}
                  </div>
                  <p className="text-sm text-text-2 leading-relaxed mb-6">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-5 border-t border-line/60">
                  <Link
                    to={feat.link}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-text hover:text-amber transition-colors group/link"
                  >
                    <span>Launch {feat.title.split(' ')[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
