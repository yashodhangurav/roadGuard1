import React, { useEffect, useRef } from 'react';
import { Eye, Play, ShieldAlert } from 'lucide-react';

interface BottomCTAProps {
  onOpenDemo: () => void;
}

export const BottomCTA: React.FC<BottomCTAProps> = ({ onOpenDemo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 30-Line Generative Harmonic Road Vibration Wave Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let isVisible = true;
    let t = 0;

    // Handle canvas sizing & DPR
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Intersection observer to pause off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    const lineCount = 30;

    const render = () => {
      if (!isVisible) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      t += 0.015;

      for (let i = 0; i < lineCount; i++) {
        const p = i / (lineCount - 1); // 0 to 1
        const yBase = h * 0.45 + (p - 0.5) * 80;

        ctx.beginPath();

        for (let x = 0; x <= w; x += 12) {
          const normX = x / w;
          // Harmonic wave partials representing pavement roughness frequencies
          const freq1 = Math.sin(normX * 4 + t * 0.9 + p * 2.5);
          const freq2 = Math.cos(normX * 8 - t * 1.3 + p * 3.2) * 0.45;
          const freq3 = Math.sin(normX * 16 + t * 1.7) * 0.18;

          // Envelope mask (tapers at edges)
          const envelope = Math.sin(normX * Math.PI);

          const dy = (freq1 + freq2 + freq3) * 38 * envelope;
          const y = yBase + dy;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Palette blending from deep charcoal to amber
        const alpha = (0.12 + p * 0.35) * (1 - Math.abs(p - 0.5) * 1.2);
        ctx.strokeStyle = `rgba(217, 119, 87, ${Math.max(0.04, alpha)})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <section id="download" className="relative mt-36 md:mt-48 pt-36 md:pt-48 pb-36 md:pb-44 border-t border-line overflow-hidden">
      {/* Background Harmonic Vibration Sine Wave Canvas */}
      <div className="absolute inset-0 pointer-events-none opacity-45">
        <canvas ref={canvasRef} className="w-full h-full" />
        <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />
      </div>

      <div className="wrap relative z-10 flex flex-col items-center text-center">
        {/* Embossed RoadGuard Radar Shield Icon (104px x 104px matching Aloud) */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-4 rounded-3xl bg-amber/20 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-b from-[#222222] via-[#161616] to-[#0d0d0d] border border-line-3 shadow-[0_24px_50px_rgba(0,0,0,0.8)] flex items-center justify-center text-amber transform transition-transform group-hover:scale-105">
            <ShieldAlert className="w-12 h-12 sm:w-14 sm:h-14 stroke-[1.5]" />
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-[clamp(36px,6vw,68px)] font-semibold leading-[1.02] tracking-[-0.05em] hero-title-gradient max-w-3xl mb-5">
          Safer roads begin with a single scan.
        </h2>

        {/* Lede */}
        <p className="text-[clamp(16px,1.6vw,19px)] text-text-2 max-w-xl mb-10 leading-relaxed">
          Equip municipal fleet vehicles, highway inspection trucks, or explore our interactive computer vision playground today.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-12">
          <a href="#detection" className="btn btn-light btn-lg">
            <Eye className="w-4 h-4 text-amber" />
            <span>Explore Detection</span>
          </a>
          <button onClick={onOpenDemo} className="btn btn-ghost btn-lg">
            <Play className="w-4 h-4 fill-current" />
            <span>View Live Demo</span>
            <span className="btn-note">1:20</span>
          </button>
        </div>

        {/* Telemetry Version Badge matching Aloud dl-meta */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-text-3 px-4 py-2 rounded-full bg-white/[0.04] border border-line">
          <span>Engine v4.2.0</span>
          <span>·</span>
          <span>Core Weights 84 MB</span>
          <span>·</span>
          <span>Certified ASTM D6433</span>
          <span>·</span>
          <span>November 2026</span>
        </div>
      </div>
    </section>
  );
};

