import React from 'react';
import { Plus } from 'lucide-react';
import { FAQ_ITEMS } from '../data/roadguardData';

export const FAQ: React.FC = () => {
  return (
    <section id="faq" className="relative pt-36 md:pt-44">
      <div className="wrap">
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-12 lg:gap-14 text-left">
          {/* Left Column: Heading and Contact Info */}
          <div>
            <h2 className="text-[clamp(36px,5.4vw,60px)] font-semibold leading-[1.04] tracking-[-0.045em] h2-gradient pb-2">
              Questions
            </h2>
            <p className="mt-4 text-text-2 text-base leading-relaxed">
              Planning a municipal deployment or regional road assessment? Reach out directly to our engineering team at{' '}
              <a
                href="mailto:civil@roadguard.ai"
                className="text-text underline decoration-white/30 hover:decoration-white/80 transition-colors"
              >
                civil@roadguard.ai
              </a>
              .
            </p>
          </div>

          {/* Right Column: Native Smooth <details> FAQ Accordion */}
          <div className="border-t border-line divide-y divide-line">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.id}
                className="group py-5 text-left cursor-pointer transition-colors"
              >
                <summary className="flex items-center justify-between gap-6 list-none font-medium text-base text-text tracking-tight group-hover:text-white transition-colors">
                  <span>{item.question}</span>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-text-3 group-hover:text-text transition-transform duration-300 group-open:rotate-45">
                    <Plus className="w-4 h-4" />
                  </div>
                </summary>
                <div className="mt-3 text-sm text-text-2 leading-relaxed max-w-xl">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

