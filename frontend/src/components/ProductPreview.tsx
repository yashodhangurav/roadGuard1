import React, { useState } from 'react';
import { Radio, AlertTriangle, Crosshair, Navigation } from 'lucide-react';
import { useMagnetic } from '../hooks/useMagnetic';

export const ProductPreview: React.FC = () => {
  const [activeDefectIndex, setActiveDefectIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { ref: magneticRef, offset } = useMagnetic<HTMLDivElement>({ strength: 0.08, maxDistance: 10 });

  const detections = [
    {
      title: 'Pothole Detected',
      depth: '72mm',
      conf: '98.4%',
      mp: 'Milepost 14.2',
      coord: '37°46\'29"N 122°25\'10"W',
      speech: 'Severe pothole detected at MP 14.2 · Depth 7.2 cm · Logged to Zone 4 Municipal Repair Queue',
    },
    {
      title: 'Alligator Cracking',
      depth: '18mm',
      conf: '94.1%',
      mp: 'Milepost 14.8',
      coord: '37°46\'38"N 122°25\'02"W',
      speech: 'Structural fatigue crack cluster identified · Surface area 2.4 m² · High priority sealing required',
    },
    {
      title: 'Wheelpath Rutting',
      depth: '34mm',
      conf: '91.7%',
      mp: 'Milepost 15.6',
      coord: '37°46\'51"N 122°24\'49"W',
      speech: 'Continuous longitudinal rutting detected · Lane 1 right wheelpath · Monitored for hydroplaning risk',
    },
  ];

  const current = detections[activeDefectIndex];

  const handleBarClick = () => {
    setIsSpeaking(true);
    setActiveDefectIndex((prev) => (prev + 1) % detections.length);
    setTimeout(() => {
      setIsSpeaking(false);
    }, 4500);
  };

  return (
    <div className="relative">
      {/* Outer Road Edge Console Window Mockup */}
      <div className="relative rounded-window bg-surface-subtle border border-line-2 shadow-window overflow-hidden">
        {/* Title Bar */}
        <div className="flex items-center justify-between h-9 px-4 border-b border-line bg-surface/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80" />
          </div>
          <div className="font-mono text-xs text-text-3 flex items-center gap-2">
            <Navigation className="w-3 h-3 text-amber" />
            <span>RoadGuard Edge Console — Live Survey Stream</span>
          </div>
          <div className="text-[11px] font-mono text-text-4">60 FPS · CUDA 12.4</div>
        </div>

        {/* Viewport: Simulated Forward-Facing Dashcam Feed with Overlays */}
        <div className="relative aspect-[16/9] w-full bg-[#080808] overflow-hidden">
          {/* Simulated Asphalt Surface Texture with Road Grid */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#141414] via-[#0d0d0d] to-[#080808]">
            {/* Perspective Road Lane Lines */}
            <svg className="w-full h-full opacity-30 pointer-events-none" viewBox="0 0 1000 560" fill="none">
              <path d="M500 120 L150 560" stroke="#ffffff" strokeWidth="2" strokeDasharray="16 16" />
              <path d="M500 120 L850 560" stroke="#ffffff" strokeWidth="2" strokeDasharray="16 16" />
              <path d="M500 120 L500 560" stroke="#ffb703" strokeWidth="3" strokeDasharray="24 16" />
            </svg>
          </div>

          {/* Computer Vision Detection Bounding Box 1 (Active Pothole) */}
          <div className="absolute left-[34%] top-[48%] w-[28%] h-[32%] border border-amber/90 rounded-md bg-amber/5 pointer-events-none shadow-[0_0_20px_rgba(217,119,87,0.25)] transition-all duration-500">
            {/* Corner Markers */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-amber" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-amber" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-amber" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-amber" />

            {/* Defect Label Tag */}
            <div className="absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface border border-line-2 text-[11px] font-mono text-text shadow-md">
              <AlertTriangle className="w-3 h-3 text-amber" />
              <span className="font-semibold">{current.title}</span>
              <span className="text-amber">({current.conf})</span>
            </div>

            {/* Depth Telemetry Badge */}
            <div className="absolute -bottom-6 right-0 px-2 py-0.5 rounded bg-black/75 border border-line text-[10px] font-mono text-text-3">
              Depth: <span className="text-white font-medium">{current.depth}</span>
            </div>
          </div>

          {/* HUD Telemetry Overlay in Top Corners */}
          <div className="absolute top-4 left-4 p-3 rounded-lg bg-black/60 border border-line-2 backdrop-blur-md font-mono text-xs text-text-2 space-y-1">
            <div className="flex items-center gap-2 text-text font-medium">
              <Crosshair className="w-3.5 h-3.5 text-amber" />
              <span>Edge Vision: ACTIVE</span>
            </div>
            <div>Vehicle Speed: <span className="text-text">46.2 km/h</span></div>
            <div>Route: <span className="text-text">{current.mp}</span></div>
          </div>

          <div className="absolute top-4 right-4 p-3 rounded-lg bg-black/60 border border-line-2 backdrop-blur-md font-mono text-xs text-text-2 text-right space-y-1">
            <div className="text-text font-medium">GNSS: RTK FIXED</div>
            <div className="text-text-3">{current.coord}</div>
            <div className="text-amber">ASTM D6433 Certified</div>
          </div>
        </div>
      </div>

      {/* Floating Telemetry Speech Bubble (Revealed when interacting with the bar) */}
      <div
        className={`absolute left-1/2 -bottom-4 -translate-x-1/2 w-max max-w-[min(640px,calc(100vw-32px))] px-4 py-2 rounded-xl bg-[#0a0a0a]/90 backdrop-blur-md border border-line-2 text-sm text-text text-center transition-all duration-300 z-20 ${
          isSpeaking ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <span className="text-amber font-mono text-xs mr-2">LOGGED:</span>
        <span>{current.speech}</span>
      </div>

      {/* Iconic Floating Telemetry Pill with Spring Physics */}
      <div className="sticky bottom-6 mt-8 flex justify-center pointer-events-auto z-10">
        <div
          ref={magneticRef}
          onClick={handleBarClick}
          style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
          className="group cursor-pointer flex items-center gap-3.5 h-14 px-4 rounded-2xl bg-white text-[#1a1a1a] shadow-bar border border-black/10 hover:bg-neutral-50 transition-colors"
        >
          {/* Radar Scanner Ping Icon */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100 border border-black/5 text-[#1a1a1a]">
            <Radio className="w-4 h-4 text-amber" />
            <span className="absolute inset-0 rounded-lg border border-amber/50 animate-radar-ping pointer-events-none" />
          </div>

          {/* Interactive Status Field */}
          <div className="flex flex-col text-left pr-2">
            <span className="text-[13px] font-medium leading-none text-[#1a1a1a] group-hover:text-black">
              Click to simulate live road scan
            </span>
            <span className="text-[11px] font-mono text-neutral-500 mt-1">
              {current.mp} · {current.conf} confidence
            </span>
          </div>

          {/* Dynamic Frequency Telemetry Bars */}
          <div className="flex items-center gap-1 h-5 px-2 bg-neutral-100 rounded-md border border-black/5">
            {[18, 8, 22, 14, 20, 10].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-amber rounded-full animate-pulse"
                style={{ height: `${h}px`, animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>

          {/* GPS Coordinates Badge */}
          <div className="hidden sm:inline-flex items-center px-2 py-1 rounded bg-neutral-100 border border-black/5 text-[11px] font-mono text-neutral-600">
            {current.coord}
          </div>
        </div>
      </div>
    </div>
  );
};
