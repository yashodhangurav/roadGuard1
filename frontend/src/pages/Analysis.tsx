import React, { useState } from 'react';
import {
  Activity,
  Sliders,
  Crosshair,
  Box,
  ShieldCheck,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  CATEGORY_DISTRIBUTION,
  SEVERITY_DISTRIBUTION,
} from '../data/adminDemoData';

interface ModelTab {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  mAP: string;
  architecture: string;
  latency: string;
  desc: string;
  metrics: { label: string; value: string }[];
}

export const Analysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs: ModelTab[] = [
    {
      name: 'Pothole Segmenter',
      icon: Crosshair,
      mAP: '98.4%',
      architecture: 'YOLOv11x-Seg · FP16 On-Edge',
      latency: '14.2ms',
      desc: 'Deep convolutional segmentation model trained on 240,000 georeferenced asphalt cavity annotations. Distinguishes true structural voids from illumination artifacts and surface water stains.',
      metrics: [
        { label: 'Precision', value: '99.1%' },
        { label: 'Recall', value: '97.8%' },
        { label: 'Volumetric Accuracy', value: '±6%' },
        { label: 'Edge Latency', value: '14.2ms' },
      ],
    },
    {
      name: 'Crack Classifier',
      icon: Activity,
      mAP: '95.2%',
      architecture: 'HRNet-W48 Backbone',
      latency: '18.6ms',
      desc: 'High-resolution feature network segmenting thin fracture boundaries down to 1.5mm width. Automatically differentiates structural alligator fatigue from environmental thermal joint contraction.',
      metrics: [
        { label: 'Crack Width Resolution', value: '1.5mm' },
        { label: 'Classification F1', value: '0.96' },
        { label: 'Alligator Accuracy', value: '94.8%' },
        { label: 'Edge Latency', value: '18.6ms' },
      ],
    },
    {
      name: 'Depth Profiler',
      icon: Box,
      mAP: '±4mm',
      architecture: 'Temporal Stereo Photogrammetry',
      latency: '22.1ms',
      desc: 'Multi-view stereo disparity and monocular depth neural estimation reconstructing sub-surface pavement cavities in 3D to compute exact asphalt patch volume before municipal dispatch.',
      metrics: [
        { label: 'Depth Resolution', value: '±4mm' },
        { label: 'Volumetric Estimation', value: '±5.2%' },
        { label: 'Depth Range', value: '10–180mm' },
        { label: 'Edge Latency', value: '22.1ms' },
      ],
    },
  ];

  const CurrentIcon = tabs[activeTab].icon;

  const handleExportSummary = () => {
    const reportData = {
      standard: 'ASTM D6433 Pavement Condition Index',
      generatedAt: new Date().toISOString(),
      networkPCI: 78,
      conditionRating: 'Satisfactory / Good',
      defectDeductions: [
        { distress: 'Wheelpath Pothole Cavities', deductPoints: -12, count: 48 },
        { distress: 'Alligator Fatigue Fractures', deductPoints: -6, count: 32 },
        { distress: 'Longitudinal Reflection Cracks', deductPoints: -4, count: 18 },
      ],
      defectDistribution: CATEGORY_DISTRIBUTION,
      severityDistribution: SEVERITY_DISTRIBUTION,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RoadGuard_PCI_Analysis_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-10 md:py-16">
      <div className="wrap">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/40 bg-purple-500/10 text-xs font-mono text-purple-400 mb-3 shadow-sm">
              <Activity className="w-3.5 h-3.5" />
              <span>ASTM D6433 Standard Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-white mb-2">
              Pavement Condition Analysis
            </h1>
            <p className="text-sm sm:text-base text-text-2 max-w-2xl">
              Automated Pavement Condition Index (PCI) scoring, distress deduct calculations, and multi-model neural vision telemetry.
            </p>
          </div>

          <button
            onClick={handleExportSummary}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-line-2 bg-surface hover:bg-surface-2 text-white text-xs font-mono font-semibold transition cursor-pointer shrink-0 shadow-sm"
          >
            <Download className="w-4 h-4 text-amber" />
            <span>Export PCI Telemetry</span>
          </button>
        </div>

        {/* Top Metric Cards: PCI Score & Deductions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* PCI Card */}
          <div className="rounded-2xl border border-line-2 bg-gradient-to-b from-[#14151e]/90 to-[#0e0f14]/90 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-text-3 uppercase tracking-wider">
                  Network Pavement Condition Index
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  Satisfactory (78/100)
                </span>
              </div>

              <div className="flex items-baseline gap-3 my-2">
                <span className="text-5xl font-bold font-mono text-white tracking-tight">
                  78
                </span>
                <span className="text-sm font-mono text-text-3">/ 100 PCI</span>
              </div>

              {/* Visual PCI Meter Bar */}
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden relative mt-4">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber to-emerald-400 transition-all duration-1000"
                  style={{ width: '78%' }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-text-4 mt-2">
                <span>0 Failed</span>
                <span>40 Poor</span>
                <span>70 Fair</span>
                <span>100 Good</span>
              </div>
            </div>

            <p className="text-xs text-text-3 mt-4 pt-4 border-t border-line/60">
              Evaluated per ASTM D6433 standard over 114 georeferenced municipal distress records.
            </p>
          </div>

          {/* Deduct Values Breakdown Card */}
          <div className="lg:col-span-2 rounded-2xl border border-line-2 bg-gradient-to-b from-[#14151e]/90 to-[#0e0f14]/90 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-text-3 uppercase tracking-wider">
                Distress Deduct Values (Total -22 PCI)
              </span>
              <span className="text-xs font-mono text-amber">ASTM D6433 Curves</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-line flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <div>
                    <div className="text-white font-semibold">High-Severity Cavities (Potholes)</div>
                    <div className="text-[10px] text-text-4">48 instances · Wheelpath impact</div>
                  </div>
                </div>
                <div className="text-red-400 font-bold">-12 pts</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-line flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#d97757]" />
                  <div>
                    <div className="text-white font-semibold">Structural Alligator Fatigue</div>
                    <div className="text-[10px] text-text-4">32 instances · Base layer degradation</div>
                  </div>
                </div>
                <div className="text-amber font-bold">-6 pts</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-line flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div>
                    <div className="text-white font-semibold">Longitudinal & Transverse Cracks</div>
                    <div className="text-[10px] text-text-4">18 instances · Thermal joints</div>
                  </div>
                </div>
                <div className="text-yellow-400 font-bold">-4 pts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Defect Distribution Pie Chart */}
          <div className="rounded-2xl border border-line-2 bg-gradient-to-b from-[#13141d]/90 to-[#0e0f14]/90 backdrop-blur-xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-white tracking-tight mb-1">
              Defect Category Breakdown
            </h3>
            <p className="text-xs text-text-3 font-mono mb-4">
              Relative frequency of distress types across the monitored network
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {CATEGORY_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-2 rounded-lg bg-[#14151e] border border-white/10 text-xs font-mono text-white shadow-xl">
                            <span className="font-bold">{data.name}</span>: {data.count} ({data.percentage}%)
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60 font-mono text-xs">
              {CATEGORY_DISTRIBUTION.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-text-3 truncate">{item.name}:</span>
                  <span className="font-bold text-white ml-auto">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Severity Distribution Bar Chart */}
          <div className="rounded-2xl border border-line-2 bg-gradient-to-b from-[#13141d]/90 to-[#0e0f14]/90 backdrop-blur-xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-white tracking-tight mb-1">
              Distress Severity Tiers
            </h3>
            <p className="text-xs text-text-3 font-mono mb-4">
              Defect breakdown categorized by ASTM structural urgency
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SEVERITY_DISTRIBUTION} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-2 rounded-lg bg-[#14151e] border border-white/10 text-xs font-mono text-white shadow-xl">
                            <span className="font-bold">{data.name} Severity</span>: {data.count} hazards
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {SEVERITY_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60 font-mono text-xs">
              {SEVERITY_DISTRIBUTION.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-text-3">{item.name}:</span>
                  <span className="font-bold text-white ml-auto">{item.count} items</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Model Deep Architecture Telemetry Section */}
        <div className="rounded-2xl border border-line-2 bg-gradient-to-b from-[#14151e]/90 to-[#0e0f14]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-line">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-amber mb-1 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>On-Edge Neural Architectures</span>
              </div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                Computer Vision Model Telemetry
              </h2>
            </div>

            {/* Model Tabs */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-surface border border-line">
              {tabs.map((tab, idx) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                    activeTab === idx
                      ? 'bg-amber text-white font-semibold shadow-sm'
                      : 'text-text-3 hover:text-white'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line-2 flex items-center justify-center text-amber">
                  <CurrentIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {tabs[activeTab].name}
                  </h3>
                  <div className="text-xs font-mono text-amber">
                    {tabs[activeTab].architecture} · {tabs[activeTab].latency}
                  </div>
                </div>
              </div>

              <p className="text-sm text-text-2 leading-relaxed">
                {tabs[activeTab].desc}
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                {tabs[activeTab].metrics.map((m) => (
                  <div key={m.label} className="p-3 rounded-xl bg-white/[0.02] border border-line font-mono">
                    <div className="text-[10px] text-text-4 uppercase mb-1">{m.label}</div>
                    <div className="text-base font-bold text-white">{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spec Card */}
            <div className="p-5 rounded-2xl bg-[#0d0e14] border border-line font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-text-3">
                <span>Mean Average Precision (mAP)</span>
                <span className="font-bold text-emerald-400">{tabs[activeTab].mAP}</span>
              </div>
              <div className="flex items-center justify-between text-text-3">
                <span>Inference Target</span>
                <span className="text-white">NVIDIA Jetson AGX Orin</span>
              </div>
              <div className="flex items-center justify-between text-text-3">
                <span>Quantization</span>
                <span className="text-white">TensorRT FP16 / INT8</span>
              </div>
              <div className="flex items-center justify-between text-text-3">
                <span>Input Resolution</span>
                <span className="text-white">1280 × 720 @ 60 FPS</span>
              </div>
              <div className="pt-2 border-t border-line/60 flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>On-Device Privacy Engine Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
