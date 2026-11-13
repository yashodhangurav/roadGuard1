import React, { useState } from 'react';
import { Satellite, MapPin, Layers, Radio, ChevronRight, CheckCircle2, Navigation } from 'lucide-react';

interface DefectPoint {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  location: string;
  depth: string;
  volume: string;
  confidence: number;
  coordinates: string;
  x: number; // percentage on map
  y: number; // percentage on map
}

const PIN_DEFECTS: DefectPoint[] = [
  {
    id: 'pothole-101',
    type: 'Pothole',
    severity: 'critical',
    title: 'Severe Cavity Defect',
    location: 'Route 101, MP 14.2 · Lane 1',
    depth: '72mm',
    volume: '0.12 m³',
    confidence: 98.4,
    coordinates: '37°46\'29"N 122°25\'10"W',
    x: 28,
    y: 68,
  },
  {
    id: 'crack-102',
    type: 'Alligator Crack',
    severity: 'high',
    title: 'Structural Fatigue Network',
    location: 'Route 101, MP 14.8 · Shoulder',
    depth: '18mm',
    volume: '0.04 m³',
    confidence: 94.1,
    coordinates: '37°46\'42"N 122°25\'01"W',
    x: 48,
    y: 45,
  },
  {
    id: 'rut-103',
    type: 'Wheelpath Rutting',
    severity: 'medium',
    title: 'Longitudinal Depression',
    location: 'Route 101, MP 15.3 · Lane 2',
    depth: '34mm',
    volume: '0.08 m³',
    confidence: 91.7,
    coordinates: '37°47\'05"N 122°24\'48"W',
    x: 72,
    y: 30,
  },
  {
    id: 'joint-104',
    type: 'Transverse Joint',
    severity: 'low',
    title: 'Thermal Contraction Crack',
    location: 'Route 101, MP 16.1 · Full Width',
    depth: '12mm',
    volume: '0.02 m³',
    confidence: 89.3,
    coordinates: '37°47\'30"N 122°24\'32"W',
    x: 88,
    y: 18,
  },
];

export const MappingSection: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('pothole-101');
  const [isClustered, setIsClustered] = useState<boolean>(true);

  const selectedDefect = PIN_DEFECTS.find((d) => d.id === selectedId) || PIN_DEFECTS[0];

  return (
    <section id="mapping" className="relative pt-36 md:pt-44">
      <div className="wrap">
        {/* Step Header */}
        <div className="max-w-[780px] mb-12 md:mb-16">
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

        {/* Spatial Desk Grid (Asymmetric Split 1.38fr : 1fr) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.38fr_1fr] gap-6 items-start">
          {/* Main Interactive GIS Vector Map Canvas */}
          <div className="relative rounded-card border border-line-2 bg-[#090b0e] overflow-hidden shadow-window flex flex-col">
            {/* Map Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-[#101318]/90 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-text tracking-tight">
                  Corridor GIS: US-101 Bay Area Northbound
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono text-text-3 px-2 py-0.5 rounded bg-white/[0.05] border border-line">
                  WGS84 / UTM Zone 10N
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-text-3">
                <Satellite className="w-3.5 h-3.5 text-amber" />
                <span>RTK FIX (±0.04m)</span>
              </div>
            </div>

            {/* Stylized Dark Cartographic Map Canvas */}
            <div className="relative aspect-[16/11] md:aspect-[16/10] bg-[#08090d] overflow-hidden select-none">
              {/* Background Cartographic Vector Grid */}
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 50% 50%, rgba(217, 119, 87, 0.08) 0%, transparent 65%),
                    linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px)
                  `,
                  backgroundSize: '100% 100%, 48px 48px, 48px 48px',
                }}
              />

              {/* Highway Corridor Geometry SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 700 450">
                <defs>
                  <linearGradient id="route-flow" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="40%" stopColor="#d97757" />
                    <stop offset="100%" stopColor="#64748b" />
                  </linearGradient>

                  {/* Cluster Area Envelope Gradient */}
                  <radialGradient id="cluster-glow" cx="45%" cy="55%" r="60%">
                    <stop offset="0%" stopColor="rgba(217, 119, 87, 0.25)" />
                    <stop offset="70%" stopColor="rgba(217, 119, 87, 0.05)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>

                {/* Regional Topo Elevation Contour Rings */}
                <path d="M 50 120 Q 240 80 420 160 T 680 90" stroke="#1f2937" strokeWidth="1" strokeDasharray="4 6" fill="none" />
                <path d="M 30 220 Q 220 180 390 260 T 670 190" stroke="#1f2937" strokeWidth="1" strokeDasharray="4 6" fill="none" />
                <path d="M 20 340 Q 200 300 360 380 T 660 310" stroke="#1f2937" strokeWidth="1" strokeDasharray="4 6" fill="none" />

                {/* Clustered Work Zone Convex Hull */}
                {isClustered && (
                  <polygon
                    points="160,330 310,230 520,160 550,110 330,170 170,270"
                    fill="url(#cluster-glow)"
                    stroke="#d97757"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                    strokeOpacity="0.8"
                  />
                )}

                {/* Highway Mainline Corridor Ribbon */}
                <path
                  d="M 120 400 C 260 340, 340 220, 620 90"
                  stroke="#1e293b"
                  strokeWidth="24"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 120 400 C 260 340, 340 220, 620 90"
                  stroke="url(#route-flow)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 120 400 C 260 340, 340 220, 620 90"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeDasharray="8 8"
                  fill="none"
                  strokeOpacity="0.4"
                />
              </svg>

              {/* Interactive Defect Marker Pins */}
              {PIN_DEFECTS.map((pin) => {
                const isSelected = pin.id === selectedId;
                const isCrit = pin.severity === 'critical';
                const isHigh = pin.severity === 'high';

                return (
                  <div
                    key={pin.id}
                    onClick={() => setSelectedId(pin.id)}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 hover:scale-125 z-10"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  >
                    {/* Pulsing Target Radar for Selected Pin */}
                    {isSelected && (
                      <span className="absolute -inset-3 rounded-full bg-amber/30 animate-ping pointer-events-none" />
                    )}

                    {/* Outer Circle Pill */}
                    <div
                      className={`relative flex items-center justify-center w-8 h-8 rounded-full border transition-all ${
                        isSelected
                          ? 'bg-amber text-white border-white shadow-[0_0_20px_rgba(217,119,87,0.8)] scale-110'
                          : isCrit
                          ? 'bg-[#181818] border-amber text-amber'
                          : isHigh
                          ? 'bg-[#181818] border-orange-400 text-orange-400'
                          : 'bg-[#181818] border-neutral-600 text-neutral-400'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>

                    {/* Defect Label Pill Hover/Active */}
                    <div
                      className={`absolute left-1/2 -top-8 -translate-x-1/2 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-white text-black opacity-100 shadow-md'
                          : 'bg-black/80 text-text-2 opacity-0 hover:opacity-100 pointer-events-none'
                      }`}
                    >
                      {pin.type} · {pin.depth}
                    </div>
                  </div>
                );
              })}

              {/* Selected Pin HUD Card (Bottom Left of Map) */}
              <div className="absolute left-4 bottom-16 sm:bottom-14 z-20 max-w-[280px] p-3 rounded-xl bg-[#101318]/95 border border-line-2 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-line">
                  <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedDefect.severity === 'critical'
                          ? 'bg-amber'
                          : selectedDefect.severity === 'high'
                          ? 'bg-orange-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    {selectedDefect.title}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-amber">
                    {selectedDefect.severity}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-text-3 mb-1">
                  {selectedDefect.location}
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-text-2">
                  <span>Depth: <strong className="text-text">{selectedDefect.depth}</strong></span>
                  <span>Volume: <strong className="text-text">{selectedDefect.volume}</strong></span>
                  <span>Confidence: <strong className="text-text">{selectedDefect.confidence}%</strong></span>
                  <span>GNSS: <strong className="text-text">RTK Fix</strong></span>
                </div>
              </div>

              {/* Floating GIS Telemetry Bar (.bar-desk matching Aloud) */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-3 z-20 w-[92%] max-w-[480px]">
                <div className="flex items-center justify-between px-3.5 py-2 rounded-full bg-white text-[#1a1a1a] shadow-2xl border border-black/10 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber" />
                    </span>
                    <Radio className="w-3.5 h-3.5 text-amber" />
                    <span className="font-semibold text-neutral-900">14 Satellites</span>
                    <span className="text-neutral-500 font-mono text-[11px]">· RTK Fixed</span>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-700">
                    Accuracy: <span className="font-semibold text-neutral-950">±0.04m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Spatial Cluster Work Order Stack */}
          <div className="flex flex-col gap-4">
            {/* Cluster Dispatch Summary Header Card */}
            <div className="p-5 rounded-card border border-line-2 bg-surface shadow-card text-left">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber" />
                  <span className="text-xs font-mono uppercase text-amber tracking-wider font-semibold">
                    Work-Order Aggregation
                  </span>
                </div>
                <button
                  onClick={() => setIsClustered(!isClustered)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    isClustered
                      ? 'bg-amber/15 text-amber border-amber/30'
                      : 'bg-white/[0.04] text-text-3 border-line'
                  }`}
                >
                  {isClustered ? 'Cluster Active' : 'Individual Points'}
                </button>
              </div>

              <h3 className="text-lg font-semibold text-text tracking-tight">
                Zone 4: Milepost 14.2–16.1 Paving Group
              </h3>
              <p className="mt-1 text-xs text-text-2 leading-relaxed">
                4 spatial defects within 1.9km surveyed corridor aggregated into a single municipal hot-mix asphalt dispatch.
              </p>

              {/* Cluster Metric Metrics */}
              <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-line text-left">
                <div>
                  <span className="block text-[10px] font-mono uppercase text-text-3">Anomalies</span>
                  <span className="text-base font-semibold text-text font-mono">4 Points</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase text-text-3">Est. Asphalt</span>
                  <span className="text-base font-semibold text-amber font-mono">0.26 Tons</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase text-text-3">Priority</span>
                  <span className="text-base font-semibold text-red-400 font-mono">Tier 1</span>
                </div>
              </div>
            </div>

            {/* List of Surveyed Defects */}
            <div className="flex flex-col gap-2.5">
              {PIN_DEFECTS.map((pin) => {
                const isSelected = pin.id === selectedId;

                return (
                  <div
                    key={pin.id}
                    onClick={() => setSelectedId(pin.id)}
                    className={`p-3.5 rounded-card border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'border-amber bg-surface-2 shadow-card ring-1 ring-amber/50'
                        : 'border-line bg-surface hover:border-line-2'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            pin.severity === 'critical'
                              ? 'bg-amber'
                              : pin.severity === 'high'
                              ? 'bg-orange-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span className="text-xs font-semibold text-text">{pin.type}</span>
                        <span className="text-[10px] font-mono text-text-3">· {pin.depth}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] border border-line text-text-2">
                        {pin.confidence}% match
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-text-3">
                      <span>{pin.location}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-text-3" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Municipal GIS Export Action */}
            <div className="p-3.5 rounded-xl border border-line bg-surface-2/60 flex items-center justify-between text-xs text-text-2">
              <span className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-amber" />
                <span>Export ready for Esri ArcGIS & Cityworks</span>
              </span>
              <span className="font-mono text-[11px] text-amber flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                GeoJSON v2.1
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
