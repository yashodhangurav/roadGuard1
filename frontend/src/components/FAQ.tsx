import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FAQ_ITEMS } from '../data/roadguardData';
import { EASE_SWIFT, headerMotionVariants, staggerContainer, staggerItem } from '../styles/motion';

export const FAQ: React.FC = () => {
  // Track open state of FAQ items (first item open by default for immediate affordance)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['faq-1']));

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section id="faq" className="relative pt-36 md:pt-44">
      <div className="wrap">
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-12 lg:gap-16 text-left items-start">
          {/* Left Column: Heading, Domain Context and Direct Contact */}
          <motion.div
            variants={headerMotionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10% 0px' }}
          >
            <div className="step">
              <span className="step-n">FAQ</span>
              <span className="text-text font-medium">Knowledge Base</span>
            </div>

            <h2 className="text-[clamp(36px,5.4vw,60px)] font-semibold leading-[1.04] tracking-[-0.045em] h2-gradient pb-2">
              Questions
            </h2>

            <p className="mt-5 text-text-2 text-base leading-relaxed max-w-md">
              Everything you need to know about automated road damage detection, ASTM D6433 Pavement Condition Index ratings, and edge dashcam ingestion.
            </p>

            <motion.div
              variants={staggerItem}
              className="mt-8 p-4 rounded-xl border border-line bg-surface/60 max-w-sm"
            >
              <div className="text-xs font-semibold text-text mb-1">Planning a municipal deployment?</div>
              <p className="text-xs text-text-3 leading-relaxed mb-3">
                Our civil engineering team provides technical corridor assessments and GIS pilot integrations.
              </p>
              <a
                href="mailto:civil@roadguard.ai"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-amber hover:underline"
              >
                civil@roadguard.ai →
              </a>
            </motion.div>
          </motion.div>

          {/* Right Column: Expandable Accordion with Smooth Framer Motion Transitions */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10% 0px' }}
            className="border-t border-line divide-y divide-line"
          >
            {FAQ_ITEMS.map((item) => {
              const isOpen = openIds.has(item.id);

              return (
                <motion.div
                  key={item.id}
                  variants={staggerItem}
                  className="py-5 text-left transition-colors"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-6 list-none font-medium text-base text-text tracking-tight hover:text-white transition-colors group text-left cursor-pointer"
                  >
                    <span className="group-hover:text-white transition-colors">{item.question}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25, ease: EASE_SWIFT }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                        isOpen
                          ? 'bg-amber/15 text-amber border-amber/40'
                          : 'bg-white/[0.04] text-text-3 border-line group-hover:border-line-2 group-hover:text-text'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </motion.div>
                  </button>

                  {/* Accordion Content with Framer Motion AnimatePresence */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE_SWIFT }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm text-text-2 leading-relaxed max-w-xl pb-2 pt-3">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
