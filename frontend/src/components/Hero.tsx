import React from 'react';
import { Eye, Play } from 'lucide-react';
import { HERO_CONTENT } from '../data/roadguardData';
import { ProductPreview } from './ProductPreview';

interface HeroProps {
  onOpenDemo?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenDemo }) => {
  return (
    <section id="top" className="relative pt-36 md:pt-44 overflow-hidden">
      {/* Radial Sky Glow Effect */}
      <div className="absolute inset-x-0 top-0 h-[800px] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_-12%,rgba(255,255,255,0.085)_0%,rgba(255,255,255,0)_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_50%_0%,rgba(217,119,87,0.04)_0%,rgba(217,119,87,0)_70%)]" />
      </div>

      <div className="wrap relative z-10 flex flex-col items-center text-center">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line-2 bg-white/[0.03] text-xs font-mono text-text-3 tracking-wide mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
          <span>{HERO_CONTENT.badge}</span>
        </div>

        {/* Fluid Hero Title */}
        <h1 className="text-[clamp(54px,9.5vw,118px)] font-normal leading-[0.98] tracking-[-0.058em] hero-title-gradient pb-2">
          {HERO_CONTENT.title}
        </h1>

        {/* Hero Lede */}
        <p className="mt-7 max-w-[640px] text-text-2 text-[clamp(17px,1.7vw,20px)] leading-[1.55] tracking-[-0.01em]">
          {HERO_CONTENT.lede}
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
          <a
            href="#detection"
            className="btn btn-light btn-lg shadow-btn-light"
          >
            <Eye className="w-4 h-4" />
            <span>{HERO_CONTENT.primaryCta}</span>
          </a>

          <button
            onClick={onOpenDemo}
            className="btn btn-ghost btn-lg shadow-btn-ghost"
          >
            <Play className="w-3.5 h-3.5 fill-current text-text-2" />
            <span>{HERO_CONTENT.secondaryCta}</span>
            <span className="ml-1 text-text-3 font-mono text-xs">{HERO_CONTENT.videoDuration}</span>
          </button>
        </div>

        {/* Monospace Spec Pills */}
        <div className="flex flex-wrap justify-center items-center gap-x-2.5 gap-y-1 mt-6 text-text-3 font-mono text-[12.5px] tracking-wide">
          {HERO_CONTENT.specs.map((spec, i) => (
            <React.Fragment key={spec}>
              {i > 0 && <span className="text-text-4 select-none">·</span>}
              <span>{spec}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Product Demonstration Stage */}
      <div className="relative mt-20 px-4 md:px-6 pb-16">
        <div className="max-w-[1200px] mx-auto">
          <ProductPreview />
        </div>
        {/* Soft bottom gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
      </div>
    </section>
  );
};

