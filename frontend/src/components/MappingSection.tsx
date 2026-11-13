import React from 'react';
import { MapPin, Layers, Satellite } from 'lucide-react';
import { SAMPLE_DEFECTS } from '../data/roadguardData';

export const MappingSection: React.FC = () => {
  return (
    <section id="mapping" className="relative pt-36 md:pt-44">
      <div className="wrap">
        {/* Step Header */}
        <div className="max-w-[780px] mb-14 md:mb-16">
          <div className="step">
            <span className="step-n">02</span>
            <span className="text-text font-medium">Mapping</span>
          </div>
          <h2 className="text-[clamp(36px,5.4vw,60px)] font-semibold leading-[1.04] tracking-[-0.045em] h2-gradient pb-2">
            Every defect pinned to the global grid
          </h2>
          <p className="mt-5 text-text-2 text-[clamp(17px,1.5vw,19px)] leading-[1.6]">
            Display detected road defects on a geographical map with location and severity information. RoadGuard AI geo-tags every anomaly with sub-meter GNSS coordinates, clustering repairs onto GIS layers so road crews plan optimal routes.
          </p>
        </div>

        {/* Spatial Map Display (Desktop / Canvas Split View) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.38fr_1fr] gap-5">
          {/* Main GIS Vector Map Canvas Mockup */}
          <div className="relative rounded-card border border-line-2 bg-surface overflow-hidden shadow-window aspect-[16/10] flex flex-col">
            {/* Map Top Telemetry Strip */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-surface-2/70 text-xs font-mono text-text-3">
              <div className="flex items-center gap-2 text-text font-medium">
                <Satellite className="w-3.5 h-3.5 text-amber" />
                <span>GIS Layer: Route 101 Corridor</span>
              </div>
              <div>RTK Fixed · Precision ±0.04m</div>
            </div>

            {/* Stylized Dark Cartographic Canvas */}
            <div className="relative flex-1 bg-[#090b0e] p-6 overflow-hidden flex items-center justify-center">
              {/* Map Grid Vectors */}
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:40px_40px]" />

              {/* Highway Corridor Line */}
              <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 600 360">
                <path d="M 60 300 C 180 240, 260 120, 540 80" stroke="#3a4250" strokeWidth="12" fill="none" strokeLinecap="round" />
                <path d="M 60 300 C 180 240, 260 120, 540 80" stroke="#d97757" strokeWidth="2" strokeDasharray="6 4" fill="none" />

                {/* Defect Markers */}
                <g transform="translate(180, 220)">
                  <circle cx="0" cy="0" r="14" fill="rgba(217,119,87,0.2)" className="animate-ping" />
                  <circle cx="0" cy="0" r="7" fill="#d97757" />
                </g>
                <g transform="translate(320, 150)">
                  <circle cx="0" cy="0" r="6" fill="#f4a261" />
                </g>
                <g transform="translate(460, 100)">
                  <circle cx="0" cy="0" r="8" fill="#e63946" />
                </g>
              </svg>

              {/* Floating Defect Hover Tooltip */}
              <div className="relative z-10 p-3.5 rounded-xl bg-surface/90 border border-line-2 backdrop-blur-md shadow-2xl text-left max-w-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber" />
                  <span className="text-xs font-semibold text-text">Pothole Cluster #14</span>
                  <span className="text-[10px] font-mono text-amber ml-auto">CRITICAL</span>
                </div>
                <div className="text-[11px] text-text-3 font-mono">
                  Location: MP 14.2 · 3 Defect Points Merged
                </div>
                <div className="text-xs text-text-2 mt-1.5">
                  Recommended: Hot-mix asphalt patch (0.34 tons)
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clustered Telemetry Cards */}
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-xl border border-line bg-surface flex items-center justify-between text-xs font-mono text-text-3">
              <span className="flex items-center gap-1.5 text-text font-medium">
                <Layers className="w-3.5 h-3.5 text-amber" />
                Detected Anomalies on Route
              </span>
              <span>{SAMPLE_DEFECTS.length} points</span>
            </div>

            {SAMPLE_DEFECTS.map((defect) => (
              <div
                key={defect.id}
                className="p-4 rounded-card border border-line bg-surface shadow-card hover:border-line-2 transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber" />
                    <span className="text-sm font-semibold text-text capitalize">{defect.type}</span>
                  </div>
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.05] text-amber border border-line">
                    {defect.severity}
                  </span>
                </div>
                <div className="text-xs text-text-2 mb-1.5">{defect.location}</div>
                <div className="flex items-center justify-between text-[11px] font-mono text-text-3 border-t border-line/60 pt-2 mt-2">
                  <span>Depth: {defect.depthMm}mm</span>
                  <span>Confidence: {defect.confidence}%</span>
                  <span>{defect.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
