import React, { useState, useEffect } from 'react';
import { Terminal, Check, CornerDownLeft, RotateCcw } from 'lucide-react';
import { BeforeAfter } from './BeforeAfter';

export const ResolutionSection: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [logIndex, setLogIndex] = useState(0);
  const [spinnerGlyph, setSpinnerGlyph] = useState('✻');

  const rawLogs = [
    { type: 'cmd', text: '> roadguard dispatch --corridor route-101 --priority critical' },
    { type: 'info', text: '⏺ Reading survey telemetry (survey_2026_11_13.geojson)' },
    { type: 'sub', text: '⎿ Scanned 84.6 km · 14 critical potholes · 32 longitudinal cracks' },
    { type: 'info', text: '⏺ Computing asphalt mix and patch volumetric requirements' },
    { type: 'sub', text: '⎿ Pothole #104: 420mm × 380mm × 72mm -> 0.11 tons hot-mix asphalt' },
    { type: 'sub', text: '⎿ Transverse crack MP 16.8 -> 18 kg rubberized sealant' },
    { type: 'info', text: '⏺ Dispatching to Municipal GIS & Cityworks API (city.gov/gis/workorders)' },
    { type: 'done', text: '✔ Work Order #WO-8942 generated and assigned to Road Crew 4.' },
  ];

  // Cycling unicode spinner glyph matching Aloud
  useEffect(() => {
    if (!isRunning) return;
    const glyphs = ['✻', '✳', '✢', '·', '✢', '✳'];
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % glyphs.length;
      setSpinnerGlyph(glyphs[idx]);
    }, 160);
    return () => clearInterval(timer);
  }, [isRunning]);

  // Typewriter step execution sequence
  useEffect(() => {
    if (!isRunning) return;
    if (logIndex < rawLogs.length) {
      const timer = setTimeout(() => {
        setLogIndex((prev) => prev + 1);
      }, 420);
      return () => clearTimeout(timer);
    } else {
      setIsRunning(false);
      setIsCompleted(true);
    }
  }, [isRunning, logIndex, rawLogs.length]);

  const handleStartDispatch = () => {
    if (isRunning) return;
    setIsCompleted(false);
    setLogIndex(1);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setLogIndex(0);
  };

  return (
    <section id="resolution" className="relative pt-36 md:pt-44">
      <div className="wrap">
        {/* Step Header */}
        <div className="max-w-[780px] mb-12 md:mb-16">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left Column: Feature Checkpoints */}
          <div className="space-y-6 text-left">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-amber mt-0.5 shrink-0 border border-line-2">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-text">Direct Municipal Dispatch</h4>
                <p className="text-sm text-text-2 mt-1 leading-relaxed">
                  Work orders sync seamlessly with Esri ArcGIS, Cityworks, Cartegraph, or Maximo with zero manual transcription or GIS re-entry.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-amber mt-0.5 shrink-0 border border-line-2">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-text">Asphalt Tonnage Forecasting</h4>
                <p className="text-sm text-text-2 mt-1 leading-relaxed">
                  Computes exact cubic meters and patch tonnage from 3D void calculations so municipal asphalt plants batch precisely what is required.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-amber mt-0.5 shrink-0 border border-line-2">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-text">Cryptographic Inspection Reports</h4>
                <p className="text-sm text-text-2 mt-1 leading-relaxed">
                  Generates tamper-evident PDF condition certificates and georeferenced GeoJSON spatial packages signed with hardware timestamp proofs.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Terminal Window Mockup matching Aloud */}
          <div className="rounded-card bg-[#0b0c0e] border border-line-2 shadow-window overflow-hidden flex flex-col aspect-[4/3]">
            {/* Terminal Titlebar */}
            <div className="flex items-center justify-between h-9 px-4 border-b border-line bg-[#14161a] text-xs font-mono text-text-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/70" />
              </div>
              <div className="flex items-center gap-2 text-text-2 font-medium">
                <Terminal className="w-3.5 h-3.5 text-amber" />
                <span>RoadGuard Dispatch CLI — v4.2</span>
              </div>
              <span className="text-[11px] text-text-4 font-mono">zsh</span>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-5 font-mono text-xs text-left overflow-y-auto space-y-2 bg-[#08090b]">
              {logIndex > 0 ? (
                <>
                  {rawLogs.slice(0, logIndex).map((log, i) => (
                    <div
                      key={i}
                      className={`leading-relaxed animate-fade-in ${
                        log.type === 'cmd'
                          ? 'text-text-3 font-semibold'
                          : log.type === 'sub'
                          ? 'text-text-3 pl-3'
                          : log.type === 'done'
                          ? 'text-emerald-400 font-medium'
                          : 'text-text'
                      }`}
                    >
                      {log.text}
                    </div>
                  ))}

                  {isRunning && (
                    <div className="flex items-center gap-2 text-amber text-xs pt-1">
                      <span className="font-mono text-sm">{spinnerGlyph}</span>
                      <span>Dispatching work order to road crews...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-text-3 space-y-3">
                  <div className="text-text-4"># Ready for automated municipal dispatch</div>
                  <div className="p-3.5 rounded-lg border border-amber/30 bg-amber/5 text-amber text-xs leading-relaxed">
                    Corridor survey complete: 14 critical potholes and 32 cracks ready for immediate dispatch to Zone 4 road maintenance crews.
                  </div>
                  <div className="text-text-3 text-[11px]">
                    Click &apos;Press Enter to dispatch&apos; below to execute simulated automated dispatch.
                  </div>
                </div>
              )}
            </div>

            {/* Terminal Input / Action Pill */}
            <div className="p-3.5 border-t border-line bg-[#0e1013] flex items-center justify-between">
              <span className="font-mono text-xs text-text-3">
                {isRunning
                  ? 'Status: Executing...'
                  : isCompleted
                  ? 'Status: Dispatched'
                  : 'Ready to dispatch'}
              </span>

              <div className="flex items-center gap-2">
                {isCompleted && (
                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-md text-text-3 hover:text-text hover:bg-white/[0.05] transition-colors"
                    title="Reset Terminal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={handleStartDispatch}
                  disabled={isRunning || isCompleted}
                  className={`btn btn-sm text-xs font-mono transition-all ${
                    isCompleted
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : isRunning
                      ? 'bg-white/[0.04] text-text-3'
                      : 'btn-ghost hover:bg-white/[0.08] text-text'
                  }`}
                >
                  <span>
                    {isCompleted ? 'Dispatched' : isRunning ? 'Dispatching...' : 'Press Enter to dispatch'}
                  </span>
                  <kbd className="ml-1"><CornerDownLeft className="w-3 h-3" /></kbd>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded Before and After Road Restoration Comparison Slider */}
        <BeforeAfter />
      </div>
    </section>
  );
};
