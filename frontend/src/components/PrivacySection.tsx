import React from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { headerMotionVariants, staggerContainer, staggerItem } from '../styles/motion';

export const PrivacySection: React.FC = () => {
  return (
    <section id="privacy" className="relative pt-36 md:pt-44">
      <div className="wrap">
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-12 lg:gap-16 items-start text-left">
          {/* Left Column: Heading and Privacy Policy Callout */}
          <motion.div
            variants={headerMotionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10% 0px' }}
          >
            <div className="step">
              <span className="w-5 h-5 rounded-md bg-white/[0.06] border border-line-2 flex items-center justify-center text-amber">
                <Lock className="w-3 h-3" />
              </span>
              <span className="text-text font-medium">Data Governance</span>
            </div>

            <h2 className="text-[clamp(36px,5.4vw,60px)] font-semibold leading-[1.04] tracking-[-0.045em] h2-gradient pb-2">
              Road data stays sovereign. Driver privacy protected.
            </h2>

            <p className="mt-5 text-text-2 text-[clamp(17px,1.5vw,19px)] leading-[1.6]">
              Citizen privacy and municipal security are non-negotiable. Vehicle license plates and pedestrian faces are automatically blurred directly inside the camera buffer before frames are written to disk. Raw consumer imagery never touches third-party cloud servers.
            </p>

            <div className="mt-8">
              <a
                href="#faq"
                className="inline-flex items-center gap-2 text-sm font-medium text-text hover:text-amber transition-colors group"
              >
                <span>Read the municipal privacy framework</span>
                <ArrowRight className="w-4 h-4 text-text-3 group-hover:translate-x-1 group-hover:text-amber transition-all" />
              </a>
            </div>
          </motion.div>

          {/* Right Column: 3 Metric Definition Pillars (.facts matching Aloud) */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10% 0px' }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 lg:pt-8"
          >
            {/* Pillar 1 */}
            <motion.div
              variants={staggerItem}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="p-6 rounded-card border border-line bg-surface shadow-card hover:border-line-2 transition-colors"
            >
              <div className="text-[clamp(26px,2.8vw,34px)] font-semibold text-text tracking-tight font-mono mb-2">
                100%
              </div>
              <div className="text-sm font-semibold text-text mb-1">On-Device Edge</div>
              <p className="text-xs text-text-2 leading-relaxed">
                Automatic license plate and pedestrian face anonymization at the camera hardware level.
              </p>
            </motion.div>

            {/* Pillar 2 */}
            <motion.div
              variants={staggerItem}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="p-6 rounded-card border border-line bg-surface shadow-card hover:border-line-2 transition-colors"
            >
              <div className="text-[clamp(26px,2.8vw,34px)] font-semibold text-amber tracking-tight font-mono mb-2">
                Zero Cloud
              </div>
              <div className="text-sm font-semibold text-text mb-1">Raw Video Storage</div>
              <p className="text-xs text-text-2 leading-relaxed">
                Raw road video is never streamed off-device or monetized. Only verified defect telemetry is stored.
              </p>
            </motion.div>

            {/* Pillar 3 */}
            <motion.div
              variants={staggerItem}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="p-6 rounded-card border border-line bg-surface shadow-card hover:border-line-2 transition-colors"
            >
              <div className="text-[clamp(26px,2.8vw,34px)] font-semibold text-text tracking-tight font-mono mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
                ASTM
              </div>
              <div className="text-sm font-semibold text-text mb-1">D6433 Compliant</div>
              <p className="text-xs text-text-2 leading-relaxed">
                Audited PCI engineering standard matching federal, state, and county department protocols.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

