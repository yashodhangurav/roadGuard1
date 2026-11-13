import React, { useState } from 'react';
import { CheckCircle2, SlidersHorizontal } from 'lucide-react';

export const BeforeAfter: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging && e.buttons !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  const tasks = [
    { title: 'Severe pothole patched (MP 14.2)', time: 'Completed in 32 min' },
    { title: 'Alligator crack sealed with mastic (MP 16.8)', time: 'Completed in 18 min' },
    { title: 'Ravelled shoulder regraded (MP 18.1)', time: 'Completed in 45 min' },
    { title: 'Pavement Condition Index restored to 94/100', time: 'Inspected & Verified' },
  ];

  return (
    <div className="mt-28">
      {/* Section Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8 text-left">
        <div>
          <h3 className="text-xl font-semibold text-text">Forty-eight hours later</h3>
          <p className="mt-1 text-sm text-text-2">
            The same road surface, after municipal crews executed the patch plan. Drag across to compare.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 items-start">
        {/* Interactive Split Compare Slider */}
        <div
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          onPointerMove={handlePointerMove}
          className="relative aspect-[16/11] rounded-window border border-line-2 bg-[#0b0b0b] overflow-hidden shadow-window cursor-ew-resize select-none touch-none"
        >
          {/* Base Image: Before (Damaged Road with Crater) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1c1815] via-[#141210] to-[#0a0a0a] flex items-center justify-center p-8">
            <div className="relative w-full h-full border border-dashed border-red-500/40 rounded-xl flex items-center justify-center bg-red-950/10">
              <div className="text-center p-6">
                <div className="w-24 h-16 mx-auto rounded-[40%] bg-black/80 border-2 border-red-500/60 shadow-inner flex items-center justify-center text-xs font-mono text-red-400">
                  72mm Crater
                </div>
                <div className="mt-4 text-xs font-mono text-red-300">BEFORE: Severe Pavement Failure</div>
                <div className="text-[11px] text-text-3 font-mono mt-1">PCI: 38/100 · High Vehicle Hazard</div>
              </div>
            </div>
            <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full bg-black/60 border border-line text-[11px] font-mono text-text">
              BEFORE
            </span>
          </div>

          {/* Clipped Top Image: After (Repaired Smooth Asphalt) */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#151c18] via-[#101412] to-[#0a0a0a] flex items-center justify-center p-8 transition-none"
            style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
          >
            <div className="relative w-full h-full border border-emerald-500/40 rounded-xl flex items-center justify-center bg-emerald-950/10">
              <div className="text-center p-6">
                <div className="w-28 h-20 mx-auto rounded-xl bg-neutral-900 border-2 border-emerald-500/60 shadow-md flex items-center justify-center text-xs font-mono text-emerald-400">
                  Compacted Patch
                </div>
                <div className="mt-4 text-xs font-mono text-emerald-300">AFTER: Hot-Mix Asphalt Restoration</div>
                <div className="text-[11px] text-text-3 font-mono mt-1">PCI: 94/100 · Restored to Grade</div>
              </div>
            </div>
            <span className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-black/60 border border-line text-[11px] font-mono text-text">
              AFTER
            </span>
          </div>

          {/* Draggable Divider Line & Knob */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-0 bottom-0 -left-[1px] w-[2px] bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)]" />
            <div className="absolute top-1/2 -left-5 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-[#0a0a0a] flex items-center justify-center shadow-2xl transition-transform hover:scale-105">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Right Column: Repair Verification Checklist */}
        <div className="p-5 rounded-card border border-line bg-surface shadow-card text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-line text-xs font-mono text-text-3">
              <span className="font-semibold text-text">REPAIR VERIFICATION</span>
              <span className="text-amber">4/4 Completed</span>
            </div>

            <div className="divide-y divide-line/60 py-2">
              {tasks.map((task, i) => (
                <div key={i} className="py-3 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-text">{task.title}</div>
                    <div className="text-[11px] font-mono text-text-3 mt-0.5">{task.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-line text-[11px] text-text-3 leading-relaxed">
            All work orders include before/after photo documentation with GNSS position signatures verified.
          </div>
        </div>
      </div>
    </div>
  );
};

