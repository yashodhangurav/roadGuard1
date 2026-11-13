import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Gauge,
  RefreshCw,
} from 'lucide-react';

interface DefectSample {
  id: string;
  name: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  confidence: number;
  dimensions: string;
  rawImage: string;
  description: string;
  boxes: {
    label: string;
    conf: number;
    top: string;
    left: string;
    width: string;
    height: string;
  }[];
}

const SAMPLE_FRAMES: DefectSample[] = [
  {
    id: 'FRAME-01',
    name: 'High-Velocity Wheelpath Cavity',
    category: 'Pothole',
    severity: 'Critical',
    confidence: 96.8,
    dimensions: '58cm × 44cm × 8.6cm depth',
    rawImage: '/samples/road-pothole-1.jpg',
    description: 'Deep asphalt void with broken edge aggregates posing immediate tire-rim blow hazard.',
    boxes: [
      { label: 'POTHOLE', conf: 96.8, top: '32%', left: '26%', width: '42%', height: '38%' },
    ],
  },
  {
    id: 'FRAME-02',
    name: 'Fatigue Alligator Network',
    category: 'Alligator Crack',
    severity: 'High',
    confidence: 93.4,
    dimensions: '142cm × 88cm pattern area',
    rawImage: '/samples/road-crack-2.jpg',
    description: 'Interconnected polygonal cracking resulting from repetitive sub-base structural deflection.',
    boxes: [
      { label: 'ALLIGATOR CRACK', conf: 93.4, top: '24%', left: '18%', width: '60%', height: '52%' },
    ],
  },
  {
    id: 'FRAME-03',
    name: 'Longitudinal Centerline Separation',
    category: 'Longitudinal Crack',
    severity: 'Medium',
    confidence: 89.2,
    dimensions: '210cm length × 1.8cm gap',
    rawImage: '/samples/road-multi-3.jpg',
    description: 'Parallel joint cracking extending down traffic lane with water infiltration risk.',
    boxes: [
      { label: 'LONGITUDINAL CRACK', conf: 89.2, top: '28%', left: '34%', width: '30%', height: '48%' },
    ],
  },
];

export const AIDetectionView: React.FC = () => {
  const [selectedFrame, setSelectedFrame] = useState<DefectSample>(SAMPLE_FRAMES[0]);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [isRunningInference, setIsRunningInference] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'annotated' | 'raw'>('split');

  const handleRunInference = () => {
    setIsRunningInference(true);
    setTimeout(() => {
      setIsRunningInference(false);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Engine Specs */}
      <div className="p-5 rounded-3xl bg-[#111218] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-bold text-base text-white">YOLOv11-RoadDefect-RT Inference Engine</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#d97757]/15 border border-[#d97757]/30 text-[#d97757]">
              ACTIVE MODEL v4.2.0
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time asphalt distress classification and millimeter depth estimation optimized for TensorRT INT8.
          </p>
        </div>

        {/* Inference Action */}
        <button
          onClick={handleRunInference}
          disabled={isRunningInference}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d97757] hover:bg-[#c66848] text-white text-xs font-semibold shadow-md transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunningInference ? 'animate-spin' : ''}`} />
          <span>{isRunningInference ? 'Running TensorRT Pipeline...' : 'Re-Run Computer Vision'}</span>
        </button>
      </div>

      {/* Frame Selection Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-neutral-400 mr-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#d97757]" />
          <span>Select Test Sample:</span>
        </span>
        {SAMPLE_FRAMES.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFrame(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer border ${
              selectedFrame.id === f.id
                ? 'bg-[#d97757]/20 border-[#d97757] text-white'
                : 'bg-[#111218] border-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            {f.name} ({f.category})
          </button>
        ))}
      </div>

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Side-by-side or Overlaid Image View */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls Bar */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#111218] border border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-neutral-400">View Mode:</span>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] ${
                  viewMode === 'split' ? 'bg-[#d97757] text-white' : 'bg-white/5 text-neutral-400'
                }`}
              >
                Split Comparison
              </button>
              <button
                onClick={() => setViewMode('annotated')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] ${
                  viewMode === 'annotated' ? 'bg-[#d97757] text-white' : 'bg-white/5 text-neutral-400'
                }`}
              >
                Annotated Frame
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] ${
                  viewMode === 'raw' ? 'bg-[#d97757] text-white' : 'bg-white/5 text-neutral-400'
                }`}
              >
                Raw Sensor
              </button>
            </div>

            {/* Bounding box toggle */}
            <label className="flex items-center gap-2 text-neutral-300 font-mono text-[11px] cursor-pointer">
              <input
                type="checkbox"
                checked={showBoundingBoxes}
                onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-black border-white/20 text-[#d97757] accent-[#d97757]"
              />
              <span>Overlay Bounding Boxes</span>
            </label>
          </div>

          {/* Visual Canvas Display */}
          {viewMode === 'split' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* RAW UNPROCESSED FRAME */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>RAW SENSOR CAPTURE</span>
                  <span>RGB 4K 60FPS</span>
                </div>
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-black">
                  <img
                    src={selectedFrame.rawImage}
                    alt="Raw Frame"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400 border border-white/10">
                    UNCALIBRATED
                  </div>
                </div>
              </div>

              {/* ANNOTATED PREDICTION FRAME */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#d97757]">
                  <span>AI DETECTED DISTRESS</span>
                  <span>CONF: {selectedFrame.confidence}%</span>
                </div>
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#d97757]/40 bg-black">
                  <img
                    src={selectedFrame.rawImage}
                    alt="AI Annotated"
                    className="w-full h-full object-cover"
                  />

                  {/* Bounding Boxes */}
                  {showBoundingBoxes &&
                    selectedFrame.boxes.map((b, i) => (
                      <div
                        key={i}
                        style={{
                          top: b.top,
                          left: b.left,
                          width: b.width,
                          height: b.height,
                        }}
                        className="absolute border-2 border-[#d97757] bg-[#d97757]/15 rounded-lg shadow-[0_0_20px_rgba(217,119,87,0.3)] pointer-events-none"
                      >
                        <div className="absolute -top-3 left-2 px-2 py-0.5 rounded bg-[#d97757] text-white text-[10px] font-mono font-bold shadow">
                          {b.label} · {b.conf}%
                        </div>
                      </div>
                    ))}

                  <div className="absolute bottom-2 left-2 right-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-300">
                    <span className="text-emerald-400">INFERENCE PASS: VERIFIED</span>
                    <span>PCI: -34 PTS</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 bg-black">
              <img
                src={selectedFrame.rawImage}
                alt="Inspection View"
                className="w-full h-full object-cover"
              />

              {viewMode === 'annotated' &&
                showBoundingBoxes &&
                selectedFrame.boxes.map((b, i) => (
                  <div
                    key={i}
                    style={{
                      top: b.top,
                      left: b.left,
                      width: b.width,
                      height: b.height,
                    }}
                    className="absolute border-2 border-[#d97757] bg-[#d97757]/15 rounded-lg shadow-[0_0_25px_rgba(217,119,87,0.4)] pointer-events-none"
                  >
                    <div className="absolute -top-3 left-2 px-2.5 py-0.5 rounded bg-[#d97757] text-white text-[10px] font-mono font-bold">
                      {b.label} · {b.conf}%
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Right Col: Telemetry Parameters & Model Performance */}
        <div className="space-y-4">
          {/* Classification Metadata Card */}
          <div className="p-5 rounded-2xl bg-[#111218] border border-white/10 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#d97757]" />
              <span>Inspection Telemetry</span>
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-neutral-400">Detected Class</span>
                <span className="font-bold text-white">{selectedFrame.category}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-neutral-400">Severity Tier</span>
                <span className="font-bold text-[#d97757]">{selectedFrame.severity}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-neutral-400">Confidence Score</span>
                <span className="font-mono font-bold text-emerald-400">{selectedFrame.confidence}%</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-neutral-400">Estimated Geometry</span>
                <span className="font-mono text-neutral-200">{selectedFrame.dimensions}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed bg-[#0d0e14] p-3 rounded-xl border border-white/5">
              {selectedFrame.description}
            </p>
          </div>

          {/* Model Hardware Benchmarks */}
          <div className="p-5 rounded-2xl bg-[#111218] border border-white/10 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-[#d97757]" />
              <span>Edge Performance</span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#0d0e14] border border-white/5">
                <div className="text-[10px] text-neutral-500 uppercase">Latency</div>
                <div className="text-sm font-bold text-white mt-0.5">14.8 ms</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0d0e14] border border-white/5">
                <div className="text-[10px] text-neutral-500 uppercase">Throughput</div>
                <div className="text-sm font-bold text-white mt-0.5">67.6 FPS</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0d0e14] border border-white/5">
                <div className="text-[10px] text-neutral-500 uppercase">mAP@50</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">94.2%</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0d0e14] border border-white/5">
                <div className="text-[10px] text-neutral-500 uppercase">VRAM Usage</div>
                <div className="text-sm font-bold text-neutral-300 mt-0.5">1.2 GB</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
