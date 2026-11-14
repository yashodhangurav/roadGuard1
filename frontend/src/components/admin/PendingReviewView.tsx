import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Wrench,
  Gauge,
  Activity,
  Truck,
  MapPin,
  Maximize2,
  Layers,
} from 'lucide-react';
import { useReports, RoadDamageReport } from '../../context/ReportsContext';
import { SeverityBadge, StatusBadge } from './SeverityBadge';
import {
  analyzeRoadImage,
  DetectionResult,
  downloadInspectionPdf,
} from '../../services/detectionApi';

interface PendingReviewViewProps {
  onSelectReport: (reportId: string) => void;
  searchQuery?: string;
}

export const PendingReviewView: React.FC<PendingReviewViewProps> = ({
  onSelectReport,
  searchQuery = '',
}) => {
  const { reports, updateReportStatus } = useReports();

  // Filter only pending submissions (Submitted or Under Review)
  const pendingReports = reports.filter(
    (r) => r.status === 'Submitted' || r.status === 'Under Review'
  ).filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.location.address.toLowerCase().includes(q) ||
      r.citizenName.toLowerCase().includes(q)
    );
  });

  // Selected report for the interactive AI detection stage
  const [selectedReport, setSelectedReport] = useState<RoadDamageReport | null>(null);

  // AI Detection State for selected report
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [showTags, setShowTags] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'annotated' | 'split' | 'raw'>('annotated');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Rejection Dialog State
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('Duplicate submission or verified resolved');
  const [customRejectText, setCustomRejectText] = useState<string>('');

  // Default selection to first pending report
  useEffect(() => {
    if (pendingReports.length > 0 && (!selectedReport || !pendingReports.some((r) => r.id === selectedReport.id))) {
      setSelectedReport(pendingReports[0]);
    }
  }, [pendingReports]);

  // When selected report changes, run/fetch AI analysis
  useEffect(() => {
    if (!selectedReport) {
      setDetectionResult(null);
      return;
    }

    let isMounted = true;
    const runScan = async () => {
      setIsScanning(true);
      try {
        const res = await analyzeRoadImage(selectedReport.imageUrl);
        if (isMounted) {
          setDetectionResult(res);
        }
      } catch (err) {
        console.warn('AI scan error:', err);
      } finally {
        if (isMounted) setIsScanning(false);
      }
    };

    runScan();
    return () => {
      isMounted = false;
    };
  }, [selectedReport?.id]);

  // Quick Action Handlers
  const handleVerify = (reportId: string) => {
    updateReportStatus(reportId, 'Under Review', 'Verified by Municipal Inspector via AI Review Hub.');
    setActionMsg(`Report ${reportId} verified and marked Under Review.`);
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleDispatch = (reportId: string) => {
    updateReportStatus(reportId, 'In Progress', 'Assigned to Municipal Rapid Patch Division #04.');
    setActionMsg(`Work order issued for ${reportId}. Repair crew dispatched!`);
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleConfirmReject = () => {
    if (!selectedReport) return;
    const full =
      rejectReason === 'Other'
        ? customRejectText.trim() || 'Administrative rejection'
        : rejectReason + (customRejectText ? `: ${customRejectText}` : '');
    updateReportStatus(selectedReport.id, 'Rejected', 'Submission rejected by municipal inspector.', full);
    setShowRejectModal(false);
    setCustomRejectText('');
    setActionMsg(`Report ${selectedReport.id} rejected.`);
    setTimeout(() => setActionMsg(null), 3000);
  };

  // PDF Export
  const handleDownloadPdf = async () => {
    if (!detectionResult || !selectedReport || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await downloadInspectionPdf(detectionResult, {
        address: selectedReport.location.address,
        latitude: selectedReport.location.latitude,
        longitude: selectedReport.location.longitude,
      });
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const criticalPending = pendingReports.filter((r) => r.severity === 'Critical');

  return (
    <div className="space-y-6">
      {/* 1. Header & AI Verification Metrics Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#111218] via-[#161724] to-[#111218] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d97757] animate-pulse" />
            <span className="text-xs font-mono uppercase text-[#d97757] font-semibold tracking-wider">
              Autonomous Verification Queue · Pending Review
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Pending Citizen Road Incident Review
          </h2>
          <p className="text-xs text-neutral-400">
            {pendingReports.length} road defects awaiting municipal inspection · Every submission is
            analyzed by the YOLOv11 & Pothole Ensemble with ASTM D6433 metrics.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-xs">
            <div className="text-[10px] uppercase font-mono text-neutral-400">Total Pending</div>
            <div className="font-bold text-white text-base mt-0.5">{pendingReports.length} Tickets</div>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs">
            <div className="text-[10px] uppercase font-mono text-red-300">Critical Hazards</div>
            <div className="font-bold text-red-400 text-base mt-0.5">{criticalPending.length} Urgent</div>
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* 2. MAIN INTERACTIVE AI DETECTION STAGE FOR SELECTED REPORT */}
      {selectedReport && (
        <div className="rounded-3xl bg-[#0f1016] border border-white/10 overflow-hidden shadow-2xl">
          {/* Top Bar for Selected Report */}
          <div className="p-4 sm:p-5 border-b border-white/10 bg-[#121319] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-400">INSPECTING TICKET:</span>
              <span className="font-mono font-bold text-base text-white">{selectedReport.id}</span>
              <SeverityBadge severity={selectedReport.severity} />
              <StatusBadge status={selectedReport.status} />
              <span className="text-xs text-neutral-400 hidden sm:inline">
                by {selectedReport.citizenName} · {selectedReport.submittedAt}
              </span>
            </div>

            {/* View Mode Controls */}
            <div className="flex items-center gap-1.5 bg-[#090a0d] p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('annotated')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                  viewMode === 'annotated' ? 'bg-[#d97757] text-white font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                AI Reticle
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                  viewMode === 'split' ? 'bg-[#d97757] text-white font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Split Compare
              </button>
              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                  viewMode === 'raw' ? 'bg-[#d97757] text-white font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Raw Photo
              </button>
            </div>
          </div>

          {/* Suspected Duplicate Alert Pill */}
          {(selectedReport.duplicateStatus === 'NEEDS_REVIEW' ||
            selectedReport.duplicateReviewStatus === 'PENDING_ADMIN_REVIEW' ||
            selectedReport.canonicalIssueId) && (
            <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-black/40 to-orange-950/30 border border-amber-500/50 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-amber-200">
                    Suspected Duplicate ({selectedReport.duplicateMatchType || 'ORB Viewpoint'}):
                  </span>{' '}
                  <span className="text-neutral-300">
                    Matches canonical ticket #{selectedReport.canonicalIssueId || 'CANONICAL'}. {selectedReport.duplicateMatchReason || 'Similar road distress characteristics identified.'}
                  </span>
                </div>
              </div>
              <a
                href="/admin/duplicates"
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono text-[11px] font-bold transition flex items-center gap-1 shrink-0"
              >
                <span>Side-by-Side Review →</span>
              </a>
            </div>
          )}

          {/* AI Detection Visual Stage + Telemetry Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-white/10">
            {/* Visual Viewport Canvas (7 cols) */}
            <div className="lg:col-span-7 p-4 sm:p-6 bg-[#08090d] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between relative">
              <div className="flex items-center justify-between pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-neutral-300">
                    {detectionResult?.modelInfo.name || 'YOLO11n-RoadHazard'}
                  </span>
                  {detectionResult && (
                    <span className="text-[10px] font-mono text-neutral-500">
                      ({detectionResult.stats.scanDurationMs}ms inference)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-neutral-300 font-mono text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBoxes}
                      onChange={(e) => setShowBoxes(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-black border-white/20 text-[#d97757] accent-[#d97757]"
                    />
                    <span>Boxes</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-neutral-300 font-mono text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTags}
                      onChange={(e) => setShowTags(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-black border-white/20 text-[#d97757] accent-[#d97757]"
                    />
                    <span>Confidence</span>
                  </label>
                </div>
              </div>

              {/* Image Canvas with Scanning Laser Animation */}
              {viewMode === 'split' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-neutral-400">CITIZEN RAW UPLOAD</div>
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-black">
                      <img
                        src={selectedReport.imageUrl}
                        alt="Raw photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-[#d97757]">AI PREDICTION OVERLAY</div>
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#d97757]/40 bg-black">
                      <img
                        src={selectedReport.annotatedImageUrl || detectionResult?.annotatedImageUrl || selectedReport.imageUrl}
                        alt="AI annotated photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 bg-black my-2 group select-none">
                  <img
                    src={
                      viewMode === 'raw'
                        ? selectedReport.imageUrl
                        : selectedReport.annotatedImageUrl || detectionResult?.annotatedImageUrl || selectedReport.imageUrl
                    }
                    alt="Road defect evidence"
                    className="w-full h-full object-cover"
                  />

                  {/* Scanning Laser Beam */}
                  {isScanning && (
                    <motion.div
                      initial={{ top: '0%' }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#d97757] to-transparent shadow-[0_0_20px_#d97757] z-30 pointer-events-none"
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-0.5 rounded-full bg-black/90 border border-[#d97757] text-[#d97757] text-[10px] font-mono whitespace-nowrap shadow-xl">
                        SCANNING ROAD DISTRESS · YOLO ENSEMBLE
                      </div>
                    </motion.div>
                  )}

                  {/* Dynamic Bounding Box Overlay (if unburnt) */}
                  {!selectedReport.annotatedImageUrl &&
                    !detectionResult?.annotatedImageUrl &&
                    showBoxes &&
                    viewMode === 'annotated' &&
                    detectionResult?.defects.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          position: 'absolute',
                          left: `${d.box.x}%`,
                          top: `${d.box.y}%`,
                          width: `${d.box.width}%`,
                          height: `${d.box.height}%`,
                        }}
                        className="border-2 border-[#d97757] bg-[#d97757]/15 rounded-lg shadow-[0_0_15px_rgba(217,119,87,0.4)] pointer-events-none"
                      >
                        {showTags && (
                          <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-black/85 text-white text-[10px] font-mono border border-white/20 whitespace-nowrap">
                            <span className="text-[#d97757] font-semibold">{d.type}</span> ·{' '}
                            <span>{d.confidence.toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Bottom Canvas Footer */}
              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="flex items-center gap-1 truncate max-w-sm">
                  <MapPin className="w-3.5 h-3.5 text-[#d97757] shrink-0" />
                  <span>{selectedReport.location.address}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onSelectReport(selectedReport.id)}
                  className="text-[#d97757] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Open Full Inspector</span>
                </button>
              </div>
            </div>

            {/* AI Telemetry & Municipal Actions (5 cols) */}
            <div className="lg:col-span-5 p-5 sm:p-6 bg-[#111218] flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#d97757]" />
                    <span>AI Engineering Assessment</span>
                  </h4>
                  {detectionResult && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                      {detectionResult.defects.length} Defect{detectionResult.defects.length === 1 ? '' : 's'} Identified
                    </span>
                  )}
                </div>

                {/* Defect Details */}
                {detectionResult?.defects[0] ? (
                  <div className="p-3.5 rounded-2xl bg-[#090a0d] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        {detectionResult.defects[0].type}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {detectionResult.defects[0].confidence.toFixed(1)}% Confidence
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
                      <div>
                        <span className="text-[10px] font-mono text-neutral-400 block">Dimensions:</span>
                        <span className="text-white font-mono font-semibold">
                          {detectionResult.defects[0].dimensions.widthCm}×{detectionResult.defects[0].dimensions.heightCm} cm
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-neutral-400 block">Est. Depth:</span>
                        <span className="text-amber-400 font-mono font-semibold">
                          {detectionResult.defects[0].dimensions.estimatedDepthMm || 45} mm
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-neutral-400 block">PCI Rating:</span>
                        <span className="text-white font-mono font-semibold">
                          {detectionResult.stats.pciScore} / 100
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-neutral-400 block">Asphalt Mix:</span>
                        <span className="text-white font-mono font-semibold">
                          {detectionResult.stats.estimatedPatchTons} Tons
                        </span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-white/5 text-[11px] text-neutral-300">
                      <span className="text-[10px] font-mono text-neutral-400 block uppercase">
                        Recommended Remediation:
                      </span>
                      {detectionResult.defects[0].repairMethod}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-neutral-400 text-center">
                    Analyzing pavement distress telemetry...
                  </div>
                )}

                {/* Citizen description */}
                <div className="p-3 rounded-xl bg-[#090a0d] border border-white/5 text-xs">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block mb-0.5">
                    Citizen Notes:
                  </span>
                  <p className="text-neutral-300 leading-relaxed italic">
                    &ldquo;{selectedReport.description}&rdquo;
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf || !detectionResult}
                  className="w-full h-10 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <FileText className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
                  <span>
                    {isGeneratingPdf ? 'Generating PDF...' : 'Download Official PDF Report'}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleVerify(selectedReport.id)}
                    className="h-9 px-3 rounded-xl text-xs font-semibold bg-[#d97757] hover:bg-[#c66848] text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify Issue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDispatch(selectedReport.id)}
                    className="h-9 px-3 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Dispatch Crew</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  className="w-full h-8 px-3 rounded-xl text-[11px] font-mono text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3 h-3" />
                  <span>Reject with Reason</span>
                </button>
              </div>
            </div>
          </div>

          {/* ASTM D6433 Quick Banner */}
          {detectionResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-[#0b0c10] text-xs">
              <div className="p-3.5 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-[#d97757] shrink-0" />
                <div>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">Distresses</div>
                  <div className="font-bold text-white text-sm">{detectionResult.stats.totalDefects} Hazards</div>
                </div>
              </div>
              <div className="p-3.5 flex items-center gap-3">
                <Gauge className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">PCI Index</div>
                  <div className="font-bold text-white text-sm">{detectionResult.stats.pciScore} / 100</div>
                </div>
              </div>
              <div className="p-3.5 flex items-center gap-3">
                <Activity className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">Hazard Score</div>
                  <div className="font-bold text-red-400 text-sm">{detectionResult.stats.hazardIndex} / 100</div>
                </div>
              </div>
              <div className="p-3.5 flex items-center gap-3">
                <Wrench className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">Patch Asphalt</div>
                  <div className="font-bold text-white text-sm">{detectionResult.stats.estimatedPatchTons} Tons</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PENDING QUEUE TABLE (Select any issue to inspect in AI stage) */}
      <div className="rounded-3xl border border-white/10 bg-[#111218] p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-mono font-bold uppercase text-white tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#d97757]" />
              <span>Pending Review Worklist ({pendingReports.length})</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Click any report row to load it into the AI Computer Vision Inspection console above.
            </p>
          </div>
        </div>

        {pendingReports.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 p-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <div className="text-sm font-semibold text-white">All Clear! No Pending Issues</div>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Every citizen road damage submission has been reviewed and verified.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d0e14] border-b border-white/10 font-mono text-[11px] text-neutral-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Photo Preview</th>
                  <th className="py-3 px-4">Distress Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingReports.map((r) => {
                  const isSelected = selectedReport?.id === r.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-[#d97757]/10' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <span className="text-[#d97757]">{r.id}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/15 bg-black shrink-0 relative">
                          <img
                            src={r.annotatedImageUrl || r.imageUrl}
                            alt={r.category}
                            className="w-full h-full object-cover"
                          />
                          {r.aiDetection && (
                            <span className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded bg-[#d97757] text-[7px] font-mono font-bold text-white">
                              AI
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div>{r.category}</div>
                        <span className="text-[10px] font-mono text-neutral-500">by {r.citizenName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <SeverityBadge severity={r.severity} />
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300 max-w-[200px] truncate">
                        {r.location.address}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                        {r.submittedAt}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(r);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer border ${
                            isSelected
                              ? 'bg-[#d97757] text-white border-[#d97757]'
                              : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'
                          }`}
                        >
                          {isSelected ? 'Active Scan' : 'Inspect AI'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectReport(r.id);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition cursor-pointer"
                        >
                          Modal
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REJECTION REASON DIALOG MODAL */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div
              className="w-full max-w-md rounded-2xl bg-[#14151e] border border-red-500/40 p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Reject Road Defect Ticket</h4>
                  <p className="text-xs text-neutral-400">
                    Provide the official municipal reason for rejecting ticket {selectedReport?.id}.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Rejection Reason Category
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                >
                  <option value="Duplicate submission or already scheduled">
                    Duplicate submission or already scheduled
                  </option>
                  <option value="Private property / Non-municipal roadway">
                    Private property / Non-municipal roadway
                  </option>
                  <option value="Distress below minimum hazard threshold">
                    Distress below minimum hazard threshold
                  </option>
                  <option value="Photograph unreadable, blurred or obstructed">
                    Photograph unreadable, blurred or obstructed
                  </option>
                  <option value="Invalid GPS coordinates / location mismatch">
                    Invalid GPS coordinates / location mismatch
                  </option>
                  <option value="Other">Other (custom explanation)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Explanation for Citizen
                </label>
                <textarea
                  value={customRejectText}
                  onChange={(e) => setCustomRejectText(e.target.value)}
                  placeholder="Detail why this report cannot be prioritized or serviced..."
                  rows={3}
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
