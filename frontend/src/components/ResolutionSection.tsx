import React, { useState } from 'react';
import { Terminal, Check, CornerDownLeft } from 'lucide-react';
import { BeforeAfter } from './BeforeAfter';

export const ResolutionSection: React.FC = () => {
  const [isDispatched, setIsDispatched] = useState(false);

  const terminalLogs = [
    { type: 'cmd', text: '> roadguard dispatch --corridor route-101 --priority critical' },
    { type: 'info', text: '⏺ Reading survey telemetry (survey_2026_11_13.geojson)' },
    { type: 'sub', text: '⎿ Scanned 84.6 km · 14 critical potholes · 32 longitudinal cracks' },
    { type: 'info', text: '⏺ Computing asphalt mix and patch requirements' },
    { type: 'sub', text: '⎿ Pothole #104: 420mm × 380mm × 72mm -> 0.11 tons hot-mix asphalt' },
    { type: 'sub', text: '⎿ Alligator crack MP 16.8 -> 18 kg rubberized sealant' },
    { type: 'info', text: '⏺ Dispatching to Municipal GIS & Cityworks API' },
    { type: 'done', text: '✔ Work Order #WO-8942 generated and assigned to Road Crew 4.' },
  ];

  return (
    <section id="resolution" className="relative pt-36 md:pt-44">
      <div className="wrap">
        {/* Step Header */}
        <div className="max-w-[780px] mb-14 md:mb-16">
          <div className="step">
            <span className="step-n">04</span>
            <span className="text-text font-medium">Resolution</span>
          </div>
          <h2 className="text-[clamp(36px,5.4vw,60px)] font-semibold leading-[1.04] tracking-[-0.045em] h2-gradient pb-2">
            Your road crews get the work order
          </h2>
          <p className="mt-5 text-text-2 text-[clamp(17px,1.5vw,19px)] leading-[1.6]">
            Generate road inspection reports and prioritised maintenance recommendations. Dispatch repair plans directly into municipal GIS, work-order databases, or contractor mobile apps with exact coordinates, required asphalt volume, and photographic proof.
          </p>
        </div>

        {/* Feature Checkpoints & Interactive CLI Dispatch Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Feature Checkpoints */}
          <div className="space-y-6 text-left">
            <div className="flex items-start gap-3.5">
              <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-amber mt-0.5 shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <p className="text-sm text-text-2 leading-relaxed">
                <strong className="text-text font-medium">Direct Municipal Dispatch:</strong> Work orders sync seamlessly with Esri ArcGIS, Cityworks, or Cartegraph with zero manual re-entry.
              </p>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-amber mt-0.5 shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <p className="text-sm text-text-2 leading-relaxed">
                <strong className="text-text font-medium">Asphalt Volume Estimation:</strong> Computes exact cubic meters and patch tonnage so crews load correct asphalt batches.
              </p>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-amber mt-0.5 shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <p className="text-sm text-text-2 leading-relaxed">
                <strong className="text-text font-medium">Cryptographic Inspection Reports:</strong> Generates tamper-proof PDF condition certificates and GeoJSON spatial packages.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Terminal Window Mockup matching Aloud */}
          <div className="rounded-window bg-terminal-dark border border-line-2 shadow-window overflow-hidden flex flex-col aspect-[4/3]">
            {/* Terminal Titlebar */}
            <div className="flex items-center justify-between h-8 px-4 border-b border-line bg-terminal-title text-xs font-mono text-text-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
              </div>
              <div className="flex items-center gap-2 text-text-2 font-medium">
                <Terminal className="w-3.5 h-3.5 text-amber" />
                <span>RoadGuard Dispatch CLI — v4.2</span>
              </div>
              <span className="text-[10px] text-text-4">zsh</span>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-5 font-mono text-xs text-left overflow-y-auto space-y-2 bg-[#090909]">
              {isDispatched ? (
                terminalLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`leading-relaxed ${
                      log.type === 'cmd'
                        ? 'text-text-3'
                        : log.type === 'sub'
                        ? 'text-text-3 pl-3'
                        : log.type === 'done'
                        ? 'text-emerald-400 font-medium'
                        : 'text-text'
                    }`}
                  >
                    {log.text}
                  </div>
                ))
              ) : (
                <div className="text-text-3 space-y-2">
                  <div>Waiting for dispatch command...</div>
                  <div className="p-3 rounded border border-amber/40 bg-amber/5 text-amber text-xs">
                    Survey corridor Route 101 ready: 14 critical potholes pending municipal repair queue assignment.
                  </div>
                </div>
              )}
            </div>

            {/* Terminal Input / Action Pill */}
            <div className="p-3 border-t border-line bg-[#0d0d0d] flex items-center justify-between">
              <span className="font-mono text-xs text-text-3">
                {isDispatched ? 'Status: Dispatched' : 'Ready to dispatch'}
              </span>
              <button
                onClick={() => setIsDispatched(true)}
                disabled={isDispatched}
                className="btn btn-sm btn-ghost hover:bg-white/[0.08] text-xs font-mono"
              >
                <span>{isDispatched ? 'Dispatched' : 'Press Enter to dispatch'}</span>
                <kbd className="ml-1"><CornerDownLeft className="w-3 h-3" /></kbd>
              </button>
            </div>
          </div>
        </div>

        {/* Embedded Before and After Road Restoration Comparison Slider */}
        <BeforeAfter />
      </div>
    </section>
  );
};

