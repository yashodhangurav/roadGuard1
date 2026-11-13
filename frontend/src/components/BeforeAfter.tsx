import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, SlidersHorizontal, AlertTriangle, ShieldCheck } from 'lucide-react';
import { EASE_SWIFT, staggerContainer, staggerItem } from '../styles/motion';

export const BeforeAfter: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update slider position based on pointer X
  const updateSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateSlider(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging && e.buttons !== 1) return;
    updateSlider(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }
  };

  // Entry animation sweep from 85% to 50%
  useEffect(() => {
    const timer = setTimeout(() => {
      let step = 0;
      const start = 84;
      const target = 50;
      const duration = 40; // frames
      const interval = setInterval(() => {
        step++;
        const progress = step / duration;
        // Quartic ease out matching Aloud
        const ease = 1 - Math.pow(1 - progress, 4);
        const current = start + (target - start) * ease;
        setSliderPosition(current);
        if (step >= duration) clearInterval(interval);
      }, 16);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const tasks = [
    { title: 'Severe pothole patched (MP 14.2)', time: 'Completed in 32 min · 0.12t asphalt' },
    { title: 'Alligator crack sealed with mastic (MP 16.8)', time: 'Completed in 18 min · Rubberized seal' },
    { title: 'Ravelled shoulder regraded (MP 18.1)', time: 'Completed in 45 min · Compaction grade' },
    { title: 'Pavement Condition Index restored to 94/100', time: 'ASTM D6433 Inspected & Certified' },
  ];

  return (
    <div className="mt-28">
      {/* Section Subhead */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE_SWIFT }}
        className="flex flex-wrap items-baseline justify-between gap-4 mb-8 text-left"
      >
        <div>
          <h3 className="text-xl md:text-2xl font-semibold text-text tracking-tight">
            Forty-eight hours later
          </h3>
          <p className="mt-1 text-sm text-text-2">
            The same road surface, after municipal crews executed the patch plan. Drag across to compare.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-stretch">
        {/* Interactive Split Compare Slider */}
        <motion.div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE_SWIFT }}
          className="relative aspect-[16/10] md:aspect-[16/9] rounded-card border border-line-2 bg-[#0c0d10] overflow-hidden shadow-window cursor-ew-resize select-none touch-none"
        >
          {/* Base Layer: BEFORE (Damaged Asphalt with 72mm Crater) */}
          <div className="absolute inset-0 bg-[#161616] overflow-hidden">
            {/* SVG Visual for Damaged Asphalt */}
            <svg className="w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
              <defs>
                <radialGradient id="before-hole" cx="48%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="#020202" />
                  <stop offset="60%" stopColor="#141414" />
                  <stop offset="90%" stopColor="#252525" />
                  <stop offset="100%" stopColor="#303030" />
                </radialGradient>
              </defs>

              {/* Asphalt Base Texture */}
              <rect width="800" height="450" fill="#181818" />

              {/* Distressed Road Paint Line */}
              <line x1="120" y1="0" x2="120" y2="450" stroke="#f59e0b" strokeWidth="6" strokeDasharray="24 16" strokeOpacity="0.5" />

              {/* Pothole Crater Bed */}
              <ellipse cx="440" cy="230" rx="140" ry="85" fill="url(#before-hole)" />
              {/* Jagged Crater Edges */}
              <path
                d="M 310 220 Q 340 160 420 155 Q 520 150 560 210 Q 585 270 510 300 Q 430 320 340 290 Q 300 260 310 220 Z"
                fill="#0a0a0a"
                stroke="#d97757"
                strokeWidth="2.5"
                strokeDasharray="8 4"
              />
              {/* Loose Aggregate Stones in Crater */}
              <circle cx="390" cy="220" r="8" fill="#3a3a3a" />
              <circle cx="460" cy="250" r="11" fill="#2d2d2d" />
              <circle cx="490" cy="210" r="7" fill="#444444" />
              <circle cx="420" cy="270" r="9" fill="#333333" />

              {/* Radiating Crack Lines */}
              <path d="M 310 220 L 240 180 L 190 200" stroke="#333333" strokeWidth="2.5" fill="none" />
              <path d="M 560 210 L 630 180 L 680 190" stroke="#333333" strokeWidth="2.5" fill="none" />
              <path d="M 510 300 L 560 360 L 610 390" stroke="#333333" strokeWidth="2.5" fill="none" />
              <path d="M 340 290 L 300 350 L 250 370" stroke="#333333" strokeWidth="2.5" fill="none" />
            </svg>

            {/* Before Status Tag */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-line text-xs font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-amber" />
              <span className="font-semibold text-text">BEFORE · PCI 38/100</span>
              <span className="text-text-3">Severe Cavity</span>
            </div>

            {/* Depth Overlay Badge */}
            <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-md bg-black/75 backdrop-blur-md border border-line text-[11px] font-mono text-amber">
              Depth: 72mm · Volume: 0.12 m³ · Critical Hazard
            </div>
          </div>

          {/* Top Layer: AFTER (Repaired Hot-Mix Asphalt Patch flush with road) */}
          <div
            className="absolute inset-0 bg-[#161616] overflow-hidden transition-none"
            style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
          >
            {/* SVG Visual for Repaired Asphalt */}
            <svg className="w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
              <defs>
                <radialGradient id="after-patch" cx="50%" cy="50%" r="55%">
                  <stop offset="0%" stopColor="#1e2024" />
                  <stop offset="85%" stopColor="#191a1e" />
                  <stop offset="100%" stopColor="#121316" />
                </radialGradient>
              </defs>

              {/* Asphalt Base Texture */}
              <rect width="800" height="450" fill="#181818" />

              {/* Repainted Clean Road Paint Line */}
              <line x1="120" y1="0" x2="120" y2="450" stroke="#f59e0b" strokeWidth="6" strokeDasharray="24 16" strokeOpacity="0.85" />

              {/* Freshly Compacted Hot-Mix Patch Polygon */}
              <polygon
                points="290,140 590,140 570,330 270,330"
                fill="url(#after-patch)"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="6 3"
              />

              {/* Compaction Roller Wheel Texture Marks */}
              <line x1="310" y1="180" x2="550" y2="180" stroke="#2a2c33" strokeWidth="4" strokeOpacity="0.6" />
              <line x1="305" y1="230" x2="555" y2="230" stroke="#2a2c33" strokeWidth="4" strokeOpacity="0.6" />
              <line x1="300" y1="280" x2="540" y2="280" stroke="#2a2c33" strokeWidth="4" strokeOpacity="0.6" />

              {/* Tar Joint Crack Seal Perimeter Line */}
              <polygon
                points="290,140 590,140 570,330 270,330"
                fill="none"
                stroke="#0f172a"
                strokeWidth="3.5"
              />
            </svg>

            {/* After Status Tag */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-line text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-text">AFTER · PCI 94/100</span>
              <span className="text-emerald-400">Compacted Flush</span>
            </div>

            {/* Verification Overlay Badge */}
            <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-md bg-black/75 backdrop-blur-md border border-line text-[11px] font-mono text-emerald-400">
              Work Order #WO-8942 · Hot-Mix Batch #402 · Passed Inspection
            </div>
          </div>

          {/* Draggable Divider Line & Knob */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* White Divider Line */}
            <div className="absolute top-0 bottom-0 -left-[1px] w-[2px] bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)]" />
            
            {/* 40px Circular Drag Handle */}
            <div className="absolute top-1/2 -left-5 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-[#0a0a0a] flex items-center justify-center shadow-2xl transition-transform hover:scale-110">
              <SlidersHorizontal className="w-4 h-4 text-neutral-900" />
            </div>
          </div>
        </motion.div>

        {/* Right Column: Repair Verification Checklist with Staggered Entrance */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="p-6 rounded-card border border-line-2 bg-surface shadow-card text-left flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-line text-xs font-mono text-text-3">
              <span className="font-semibold text-text">REPAIR VERIFICATION</span>
              <span className="text-emerald-400 font-semibold">4 / 4 Verified</span>
            </div>

            <div className="divide-y divide-line/60 py-2">
              {tasks.map((task, i) => (
                <motion.div
                  key={i}
                  variants={staggerItem}
                  className="py-3 flex items-start gap-3"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 350, damping: 20, delay: i * 0.1 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  </motion.div>
                  <div>
                    <h5 className="text-sm font-semibold text-text leading-tight">{task.title}</h5>
                    <p className="text-[11px] text-text-3 font-mono mt-0.5">{task.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-line text-xs text-text-3 leading-relaxed">
            Every completed repair logs timestamped before/after photographic evidence and contractor verification stamps back to municipal GIS.
          </div>
        </motion.div>
      </div>
    </div>
  );
};
