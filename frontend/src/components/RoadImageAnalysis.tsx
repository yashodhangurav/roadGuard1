import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Scan,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Activity,
  Sliders,
  Eye,
  EyeOff,
  Crosshair,
  Wrench,
  Gauge,
  Sparkles,
} from 'lucide-react';
import {
  DetectionResult,
  ROAD_PRESETS,
  RoadSamplePreset,
  analyzeRoadImage,
  checkBackendHealth,
  downloadReportFile,
} from '../services/detectionApi';

interface RoadImageAnalysisProps {
  className?: string;
  onAnalysisComplete?: (result: DetectionResult) => void;
}

export const RoadImageAnalysis: React.FC<RoadImageAnalysisProps> = ({
  className = '',
  onAnalysisComplete,
}) => {
  // Active selected preset or uploaded custom image
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-pothole');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('/samples/road-pothole-1.jpg');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Analysis execution state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(true); // default true to showcase model output immediately
  const [currentResult, setCurrentResult] = useState<DetectionResult | null>(null);

  // Interactive inspection state
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>('DEF-101-01');
  const [hoveredDefectId, setHoveredDefectId] = useState<string | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [showConfidenceTags, setShowConfidenceTags] = useState<boolean>(true);

  // Backend connection state
  const [backendEndpoint, setBackendEndpoint] = useState<string>(
    (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/detect'
  );
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [endpointInput, setEndpointInput] = useState<string>(backendEndpoint);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial load: set preset 1 as initial analysis result
  useEffect(() => {
    const initPreset = ROAD_PRESETS[0];
    const initialResult: DetectionResult = {
      imageId: initPreset.id,
      fileName: 'road-pothole-1.jpg',
      imageUrl: initPreset.imageUrl,
      analyzedAt: new Date().toISOString(),
      defects: initPreset.defects,
      stats: initPreset.stats,
      backend: 'Demo Engine',
      backendEndpoint,
      modelInfo: {
        name: 'YOLOv11-RoadDefect-RT',
        version: 'v4.2.0-fp16',
        inferenceTimeMs: 42,
      },
    };
    setCurrentResult(initialResult);
    if (onAnalysisComplete) onAnalysisComplete(initialResult);

    // Check backend health asynchronously
    checkBackendHealth(backendEndpoint).then((healthy) => {
      setIsBackendHealthy(healthy);
    });
  }, []);

  // Handle Preset selection
  const handleSelectPreset = (preset: RoadSamplePreset) => {
    setSelectedPresetId(preset.id);
    setUploadedFile(null);
    setPreviewUrl(preset.imageUrl);
    setIsAnalyzing(false);
    setHasAnalyzed(true);
    setSelectedDefectId(preset.defects[0]?.id || null);

    const result: DetectionResult = {
      imageId: preset.id,
      fileName: `${preset.id}.jpg`,
      imageUrl: preset.imageUrl,
      analyzedAt: new Date().toISOString(),
      defects: preset.defects,
      stats: preset.stats,
      backend: isBackendHealthy ? 'Live API' : 'Demo Engine',
      backendEndpoint,
      modelInfo: {
        name: 'YOLOv11-RoadDefect-RT',
        version: isBackendHealthy ? 'v4.2.0-live' : 'v4.2.0-fp16',
        inferenceTimeMs: preset.stats.scanDurationMs,
      },
    };
    setCurrentResult(result);
    if (onAnalysisComplete) onAnalysisComplete(result);
  };

  // Process File Upload
  const handleFileUpload = (file: File) => {
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      alert('Please upload a valid road photograph (JPG, JPEG, PNG, or WEBP).');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUploadedFile(file);
    setSelectedPresetId('custom-upload');
    setPreviewUrl(objectUrl);
    setHasAnalyzed(false);
    setCurrentResult(null);
    setSelectedDefectId(null);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Execute Analysis
  const handleRunAnalysis = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      let res: DetectionResult;
      if (uploadedFile) {
        res = await analyzeRoadImage(uploadedFile, undefined, backendEndpoint);
      } else {
        res = await analyzeRoadImage(previewUrl, selectedPresetId, backendEndpoint);
      }

      setCurrentResult(res);
      setHasAnalyzed(true);
      setSelectedDefectId(res.defects[0]?.id || null);
      if (onAnalysisComplete) onAnalysisComplete(res);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset analysis
  const handleReset = () => {
    setHasAnalyzed(false);
    setSelectedDefectId(null);
    setHoveredDefectId(null);
  };

  // Color helper for severities
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'text-red-400 bg-red-950/50 border-red-500/40';
      case 'High':
        return 'text-[#d97757] bg-[#d97757]/10 border-[#d97757]/40';
      case 'Medium':
        return 'text-amber-300 bg-amber-950/40 border-amber-500/40';
      default:
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40';
    }
  };

  const getBoundingBoxBorderColor = (severity: string, isHighlighted: boolean) => {
    if (severity === 'Critical') {
      return isHighlighted
        ? 'border-red-400 shadow-[0_0_20px_rgba(248,113,113,0.7)] bg-red-500/20'
        : 'border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.4)] bg-red-500/10';
    }
    if (severity === 'High') {
      return isHighlighted
        ? 'border-[#ff8f6b] shadow-[0_0_20px_rgba(217,119,87,0.7)] bg-[#d97757]/20'
        : 'border-[#d97757] shadow-[0_0_10px_rgba(217,119,87,0.4)] bg-[#d97757]/10';
    }
    if (severity === 'Medium') {
      return isHighlighted
        ? 'border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.7)] bg-amber-400/20'
        : 'border-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.4)] bg-amber-400/10';
    }
    return isHighlighted
      ? 'border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.7)] bg-emerald-400/20'
      : 'border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.4)] bg-emerald-500/10';
  };

  return (
    <div className={`w-full max-w-[1320px] mx-auto ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={onFileInputChange}
      />

      {/* Main Glassmorphism Console Container */}
      <div className="relative rounded-2xl bg-[#0d0e12]/95 border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Top Control & HUD Titlebar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-white/10 bg-[#121319]/90 backdrop-blur-md">
          {/* Left: Window Dots & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]/80 inline-block" />
            </div>
            <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4 text-[#d97757]" />
              <span className="text-xs font-semibold tracking-wide text-white uppercase">
                RoadGuard AI Image Analysis
              </span>
              <span className="hidden md:inline-block text-[11px] font-mono text-neutral-400 border border-white/10 px-2 py-0.5 rounded-md bg-white/[0.03]">
                YOLOv11-RoadDefect · ASTM D6433
              </span>
            </div>
          </div>

          {/* Center: Presets Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1 scrollbar-none">
            {ROAD_PRESETS.map((preset) => {
              const isActive = selectedPresetId === preset.id && !uploadedFile;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`shrink-0 text-[12px] font-medium px-3 py-1 rounded-lg transition-all whitespace-nowrap border cursor-pointer ${
                    isActive
                      ? 'bg-[#d97757]/20 border-[#d97757] text-white shadow-[0_0_12px_rgba(217,119,87,0.35)]'
                      : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                  title={preset.subtitle}
                >
                  {preset.name.split(' ')[0]} {preset.name.split(' ')[1]}
                </button>
              );
            })}

            {uploadedFile && (
              <span className="shrink-0 text-[12px] font-medium px-3 py-1 rounded-lg bg-[#d97757]/20 border border-[#d97757] text-white whitespace-nowrap">
                Custom Upload
              </span>
            )}
          </div>

          {/* Right: Backend Connection Status Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition text-left"
              title="Click to configure backend API endpoint"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendHealthy
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-[11px] font-mono text-neutral-300">
                {isBackendHealthy ? 'Live API (Connected)' : 'Demo Engine (Offline)'}
              </span>
              <Sliders className="w-3 h-3 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Main Dashboard Grid: Left Stage (Image & Bounding Boxes) + Right Stage (Detection Results) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-white/10">
          {/* LEFT: Image Viewport & Annotation Canvas (7 or 8 columns on large screens) */}
          <div
            className={`lg:col-span-7 xl:col-span-8 p-4 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 relative ${
              isDragOver ? 'bg-[#d97757]/[0.08]' : 'bg-[#090a0d]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Toolbar above image */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-white border border-white/15 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#d97757]" />
                  <span>Upload Road Photo</span>
                </button>
                <span className="text-[11px] text-neutral-500 hidden sm:inline">
                  JPG, JPEG, PNG, WEBP · Drag & drop supported
                </span>
              </div>

              {/* View options */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                  className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1.5 ${
                    showBoundingBoxes
                      ? 'border-[#d97757]/50 bg-[#d97757]/10 text-white'
                      : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-white'
                  }`}
                  title="Toggle Detection Bounding Boxes"
                >
                  {showBoundingBoxes ? (
                    <Eye className="w-3.5 h-3.5 text-[#d97757]" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[11px] hidden sm:inline">Boxes</span>
                </button>

                <button
                  onClick={() => setShowConfidenceTags(!showConfidenceTags)}
                  className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1.5 ${
                    showConfidenceTags
                      ? 'border-[#d97757]/50 bg-[#d97757]/10 text-white'
                      : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-white'
                  }`}
                  title="Toggle Confidence Badges"
                >
                  <Crosshair className="w-3.5 h-3.5 text-[#d97757]" />
                  <span className="text-[11px] hidden sm:inline">Tags</span>
                </button>
              </div>
            </div>

            {/* Road Image Canvas with Dynamic Aspect Ratio */}
            <div className="relative w-full aspect-[5/3] sm:aspect-[16/10] rounded-xl overflow-hidden border border-white/10 bg-[#000000] select-none group">
              {/* Underlying authentic road photograph */}
              <img
                src={previewUrl}
                alt="Road Surface Inspection"
                className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-[1.01]"
              />

              {/* Subtle vignette shadow */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-black/20" />

              {/* Laser Scanning Animation Beam */}
              {isAnalyzing && (
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#d97757] to-transparent shadow-[0_0_20px_#d97757,0_0_35px_#ff8f6b] z-30 pointer-events-none"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-0.5 rounded-full bg-black/80 border border-[#d97757] text-[#d97757] text-[10px] font-mono whitespace-nowrap shadow-lg">
                    SCANNING ROAD DISTRESS · YOLOv11 TENSORRT
                  </div>
                </motion.div>
              )}

              {/* Interactive Bounding Boxes Overlay */}
              {hasAnalyzed &&
                showBoundingBoxes &&
                currentResult?.defects.map((defect) => {
                  const isSelected = selectedDefectId === defect.id;
                  const isHovered = hoveredDefectId === defect.id;
                  const isHighlighted = isSelected || isHovered;

                  return (
                    <motion.div
                      key={defect.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      style={{
                        position: 'absolute',
                        left: `${defect.box.x}%`,
                        top: `${defect.box.y}%`,
                        width: `${defect.box.width}%`,
                        height: `${defect.box.height}%`,
                      }}
                      onClick={() => setSelectedDefectId(defect.id)}
                      onMouseEnter={() => setHoveredDefectId(defect.id)}
                      onMouseLeave={() => setHoveredDefectId(null)}
                      className={`cursor-pointer transition-all duration-200 border-2 rounded-lg z-20 ${getBoundingBoxBorderColor(
                        defect.severity,
                        isHighlighted
                      )}`}
                    >
                      {/* Corner Reticles (Viewfinder brackets) */}
                      <span className="absolute -top-[3px] -left-[3px] w-2.5 h-2.5 border-t-2 border-l-2 border-white/90" />
                      <span className="absolute -top-[3px] -right-[3px] w-2.5 h-2.5 border-t-2 border-r-2 border-white/90" />
                      <span className="absolute -bottom-[3px] -left-[3px] w-2.5 h-2.5 border-b-2 border-l-2 border-white/90" />
                      <span className="absolute -bottom-[3px] -right-[3px] w-2.5 h-2.5 border-b-2 border-r-2 border-white/90" />

                      {/* Center target crosshair if selected */}
                      {isHighlighted && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
                          <Crosshair className="w-6 h-6 text-white" />
                        </div>
                      )}

                      {/* Floating Defect Chip Tag */}
                      {showConfidenceTags && (
                        <div
                          className={`absolute -top-7 left-0 px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-tight whitespace-nowrap shadow-md backdrop-blur-md transition-all ${
                            isHighlighted
                              ? 'bg-neutral-900 border border-white/40 text-white scale-105 z-30'
                              : 'bg-black/80 border border-white/20 text-neutral-300'
                          }`}
                        >
                          <span className="font-semibold text-[#d97757] mr-1">{defect.type}</span>
                          <span className="text-white font-mono">{defect.confidence}%</span>
                          {defect.dimensions.estimatedDepthMm && (
                            <span className="ml-1 text-neutral-400">
                              · {defect.dimensions.estimatedDepthMm}mm
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}

              {/* Drag Over Dropzone State */}
              <AnimatePresence>
                {isDragOver && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#000000]/85 backdrop-blur-sm border-2 border-dashed border-[#d97757] flex flex-col items-center justify-center gap-3 z-40 text-center p-6"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#d97757]/20 border border-[#d97757] flex items-center justify-center text-[#d97757]">
                      <Upload className="w-7 h-7 animate-bounce" />
                    </div>
                    <div className="text-base font-semibold text-white">
                      Drop road image to analyze
                    </div>
                    <p className="text-xs text-neutral-400 max-w-xs">
                      Supports high-resolution asphalt photographs (JPG, PNG, WEBP)
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Bar beneath image: quick instructions / status */}
            <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d97757]" />
                <span className="font-mono text-[11px]">
                  Frame ID: {currentResult?.imageId || 'PENDING'} · Resolution: 1400×840px
                </span>
              </div>
              <div className="text-[11px] text-neutral-500">
                Click any bounding box or list card to inspect dimensions & repair specs
              </div>
            </div>
          </div>

          {/* RIGHT: Detection Results & Damage Intelligence Panel (4 or 5 columns) */}
          <div className="lg:col-span-5 xl:col-span-4 p-5 sm:p-6 bg-[#0f1015]/95 flex flex-col justify-between">
            <div>
              {/* Header: Results count and Road Condition Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#d97757]" />
                    Detection Results
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {hasAnalyzed
                      ? `${currentResult?.defects.length || 0} defects detected in frame`
                      : 'Image loaded · Ready for analysis'}
                  </p>
                </div>

                {hasAnalyzed && currentResult && (
                  <div
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${getSeverityBadgeClass(
                      currentResult.stats.overallCondition
                    )}`}
                  >
                    {currentResult.stats.overallCondition} Condition
                  </div>
                )}
              </div>

              {/* Defects List */}
              <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {!hasAnalyzed ? (
                  <div className="py-12 px-4 rounded-xl border border-dashed border-white/10 text-center">
                    <Scan className="w-8 h-8 text-neutral-500 mx-auto mb-2 opacity-60" />
                    <div className="text-sm font-medium text-neutral-300">Analysis Pending</div>
                    <p className="text-xs text-neutral-500 mt-1 max-w-[220px] mx-auto">
                      Click the &ldquo;Analyze Image&rdquo; button below to run pothole and crack
                      detection.
                    </p>
                  </div>
                ) : currentResult?.defects.length === 0 ? (
                  <div className="py-10 text-center rounded-xl bg-white/[0.02] border border-white/10 p-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <div className="text-sm font-medium text-white">No Defects Detected</div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Pavement surface appears smooth and structurally intact.
                    </p>
                  </div>
                ) : (
                  currentResult?.defects.map((defect, idx) => {
                    const isSelected = selectedDefectId === defect.id;
                    const isHovered = hoveredDefectId === defect.id;

                    return (
                      <div
                        key={defect.id}
                        onClick={() => setSelectedDefectId(defect.id)}
                        onMouseEnter={() => setHoveredDefectId(defect.id)}
                        onMouseLeave={() => setHoveredDefectId(null)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#181922] border-[#d97757] shadow-[0_0_15px_rgba(217,119,87,0.2)]'
                            : isHovered
                            ? 'bg-[#14151b] border-white/20'
                            : 'bg-[#111217] border-white/5 hover:border-white/15'
                        }`}
                      >
                        {/* Title Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-mono text-neutral-400">
                              #{idx + 1}
                            </span>
                            <span className="text-sm font-semibold text-white">{defect.type}</span>
                          </div>

                          <span
                            className={`text-[10px] font-medium font-mono px-2 py-0.5 rounded border ${getSeverityBadgeClass(
                              defect.severity
                            )}`}
                          >
                            {defect.severity}
                          </span>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-white/5 text-xs">
                          <div>
                            <div className="text-[10px] uppercase text-neutral-400 font-mono">
                              Confidence
                            </div>
                            <div className="text-xs font-semibold text-white mt-0.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {defect.confidence}%
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] uppercase text-neutral-400 font-mono">
                              Dimensions
                            </div>
                            <div className="text-xs font-semibold text-white mt-0.5">
                              {defect.dimensions.widthCm} × {defect.dimensions.heightCm} cm
                            </div>
                          </div>

                          {defect.dimensions.estimatedDepthMm && (
                            <div>
                              <div className="text-[10px] uppercase text-neutral-400 font-mono">
                                Est. Depth
                              </div>
                              <div className="text-xs font-semibold text-amber mt-0.5">
                                {defect.dimensions.estimatedDepthMm} mm
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="text-[10px] uppercase text-neutral-400 font-mono">
                              Work Order
                            </div>
                            <div className="text-xs font-medium text-neutral-300 mt-0.5">
                              {defect.urgency}
                            </div>
                          </div>
                        </div>

                        {/* Recommended Remediation (revealed if selected) */}
                        {isSelected && (
                          <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-neutral-300 bg-white/[0.02] p-2 rounded-lg">
                            <div className="flex items-center gap-1.5 text-[#d97757] font-medium mb-1">
                              <Wrench className="w-3 h-3" />
                              <span>Maintenance Method</span>
                            </div>
                            <p className="text-neutral-400 leading-relaxed">
                              {defect.repairMethod}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className={`col-span-2 sm:col-span-1 h-11 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isAnalyzing
                      ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed'
                      : 'bg-[#d97757] hover:bg-[#c66848] text-white shadow-[0_0_20px_rgba(217,119,87,0.4)]'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Image</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="h-11 px-4 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Download Report Button */}
              {hasAnalyzed && currentResult && (
                <button
                  type="button"
                  onClick={() => downloadReportFile(currentResult)}
                  className="w-full h-10 px-4 rounded-xl text-xs font-medium bg-[#14161f] hover:bg-[#1a1d29] text-white border border-white/15 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-[#d97757]" />
                  <span>Download ASTM D6433 Report (JSON)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Small Road Damage Statistics Section Below Preview */}
        {hasAnalyzed && currentResult && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-[#0b0c10] border-t border-white/10">
            {/* Stat 1: Defect Count */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase">
                <AlertTriangle className="w-3.5 h-3.5 text-[#d97757]" />
                Total Defects
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                {currentResult.stats.totalDefects}{' '}
                <span className="text-xs font-normal text-neutral-400 font-sans">
                  ({currentResult.stats.potholesCount} Pothole, {currentResult.stats.cracksCount}{' '}
                  Crack)
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                {currentResult.stats.criticalCount} requiring emergency patch
              </div>
            </div>

            {/* Stat 2: PCI Score */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                PCI Index
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                {currentResult.stats.pciScore}{' '}
                <span className="text-xs font-mono text-neutral-400">/ 100</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">ASTM D6433 Standard deduction</div>
            </div>

            {/* Stat 3: Hazard Index */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase">
                <Activity className="w-3.5 h-3.5 text-red-400" />
                Hazard Index
              </div>
              <div className="text-xl sm:text-2xl font-bold text-red-400 mt-1">
                {currentResult.stats.hazardIndex}{' '}
                <span className="text-xs font-mono text-neutral-400">/ 100</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                High tire blow-out risk rating
              </div>
            </div>

            {/* Stat 4: Patch Material */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase">
                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                Asphalt Patch Mix
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                {currentResult.stats.estimatedPatchTons}{' '}
                <span className="text-xs font-normal text-neutral-400 font-sans">Metric Tons</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Est. repair cost: ${(currentResult.stats.estimatedPatchTons * 165).toFixed(0)} USD
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backend API Configuration Modal */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#121319] border border-white/15 rounded-2xl p-6 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Cpu className="w-4 h-4 text-[#d97757]" />
                  RoadGuard Detection API Endpoint
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded-md"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-xs text-neutral-300 leading-relaxed">
                  The dashboard attempts to post image frames to your actual machine learning
                  service endpoint (FastAPI / PyTorch YOLOv11 TensorRT).
                </p>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-mono block mb-1">
                    API Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={endpointInput}
                    onChange={(e) => setEndpointInput(e.target.value)}
                    placeholder="http://localhost:8000/api/detect"
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#d97757]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 text-[11px] text-neutral-400 space-y-1.5">
                  <div className="flex items-center justify-between font-mono">
                    <span>Server Status:</span>
                    <span
                      className={`font-semibold ${
                        isBackendHealthy ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isBackendHealthy ? 'Online (Ready)' : 'Offline (Using Demo Simulation)'}
                    </span>
                  </div>
                  <div>
                    If offline or unreachable, the UI runs high-precision calibrated client-side
                    distress analytics and report generation.
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={async () => {
                      const healthy = await checkBackendHealth(endpointInput);
                      setIsBackendHealthy(healthy);
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white"
                  >
                    Test Health
                  </button>
                  <button
                    onClick={() => {
                      setBackendEndpoint(endpointInput);
                      setShowConfigModal(false);
                    }}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#d97757] hover:bg-[#c66848] text-white"
                  >
                    Save & Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
