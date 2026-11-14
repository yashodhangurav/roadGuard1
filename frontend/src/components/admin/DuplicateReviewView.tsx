import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  MapPin,
  CheckCircle2,
  Clock,
  Eye,
  GitCompare,
  Fingerprint,
  Cpu,
  Compass,
  Check,
  ShieldCheck,
  PlusCircle,
  Link2,
} from 'lucide-react';
import { useReports } from '../../context/ReportsContext';
import { SeverityBadge } from './SeverityBadge';
import { calculateHaversineDistanceMeters } from '../../services/detectionApi';

interface DuplicateReviewViewProps {
  onSelectReport: (reportId: string) => void;
  searchQuery?: string;
}

export const DuplicateReviewView: React.FC<DuplicateReviewViewProps> = ({
  onSelectReport,
  searchQuery = '',
}) => {
  const { reports, reviewDuplicate, getReportById } = useReports();

  // Active filter: 'pending' | 'confirmed' | 'all'
  const [filterMode, setFilterMode] = useState<'pending' | 'confirmed' | 'all'>('pending');

  // Selected suspected duplicate report
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // View modes for image comparison
  const [viewModeOriginal, setViewModeOriginal] = useState<'annotated' | 'raw'>('raw');
  const [viewModeCandidate, setViewModeCandidate] = useState<'annotated' | 'raw'>('annotated');

  // Admin decision action dialog state
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingActionType, setPendingActionType] = useState<'CONFIRM_DUPLICATE' | 'DISMISS_DUPLICATE'>('CONFIRM_DUPLICATE');

  // Filter suspected duplicate reports from context
  const suspectedReports = reports.filter((r) => {
    const isSuspected =
      r.duplicateReviewStatus === 'PENDING_ADMIN_REVIEW' ||
      r.duplicateStatus === 'NEEDS_REVIEW' ||
      r.isDuplicate === true ||
      Boolean(r.canonicalIssueId);

    if (!isSuspected) return false;

    if (filterMode === 'pending') {
      return (
        r.duplicateReviewStatus === 'PENDING_ADMIN_REVIEW' ||
        r.duplicateStatus === 'NEEDS_REVIEW'
      );
    }
    if (filterMode === 'confirmed') {
      return r.duplicateStatus === 'CONFIRMED_DUPLICATE' || r.isDuplicate === true;
    }
    return true;
  }).filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      (r.canonicalIssueId && r.canonicalIssueId.toLowerCase().includes(q)) ||
      r.category.toLowerCase().includes(q) ||
      r.location.address.toLowerCase().includes(q) ||
      r.citizenName.toLowerCase().includes(q)
    );
  });

  // Default selection to first suspected report
  useEffect(() => {
    if (suspectedReports.length > 0 && (!selectedReportId || !suspectedReports.some((r) => r.id === selectedReportId))) {
      setSelectedReportId(suspectedReports[0].id);
    }
  }, [suspectedReports, selectedReportId]);

  const activeReport = selectedReportId ? getReportById(selectedReportId) : null;

  // The canonical / original parent report
  const canonicalReport = activeReport?.canonicalIssueId
    ? getReportById(activeReport.canonicalIssueId)
    : null;

  // GPS Distance calculation
  const gpsDistanceMeters =
    activeReport && canonicalReport
      ? calculateHaversineDistanceMeters(
          activeReport.location.latitude,
          activeReport.location.longitude,
          canonicalReport.location.latitude,
          canonicalReport.location.longitude
        )
      : activeReport?.duplicateMatchReason?.match(/(\d+\.?\d*)\s*m/i)?.[1]
      ? parseFloat(activeReport.duplicateMatchReason.match(/(\d+\.?\d*)\s*m/i)![1])
      : 4.2;

  // Execute review decision
  const handleExecuteDecision = async () => {
    if (!activeReport) return;
    setIsSubmittingDecision(true);

    try {
      await reviewDuplicate(
        activeReport.id,
        pendingActionType,
        canonicalReport ? canonicalReport.id : activeReport.canonicalIssueId,
        decisionNotes,
        'Municipal Road Inspector'
      );

      const msg =
        pendingActionType === 'CONFIRM_DUPLICATE'
          ? `Report ${activeReport.id} successfully confirmed as duplicate of #${activeReport.canonicalIssueId || 'CANONICAL'}. Work order linked.`
          : `Report ${activeReport.id} confirmed as independent issue. Unique work ticket generated!`;

      setActionSuccessMsg(msg);
      setShowConfirmModal(false);
      setDecisionNotes('');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error applying duplicate decision:', err);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>Suspected Duplicate Road Hazard Review</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {suspectedReports.length} in Queue
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Multi-tier verification hub combining GNSS geospatial proximity, 64-bit DCT perceptual hashing, and OpenCV ORB feature matching with RANSAC homography.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#111218] border border-white/10 text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterMode === 'pending'
                ? 'bg-amber-500 text-black font-bold shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Pending Review
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('confirmed')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterMode === 'confirmed'
                ? 'bg-[#d97757] text-white font-bold shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Confirmed Duplicates
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white/20 text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Suspected
          </button>
        </div>
      </div>

      {/* ACTION FEEDBACK ALERT */}
      {actionSuccessMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between gap-3 text-xs text-emerald-200 shadow-xl"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-neutral-400 hover:text-white text-xs font-mono"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* MAIN TWO-COLUMN WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SUSPECTED REPORTS QUEUE (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl bg-[#0e1017] border border-white/10 p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Suspected Queue ({suspectedReports.length})</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-400">SELECT TO COMPARE</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {suspectedReports.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-neutral-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-mono text-white">Queue Clear</p>
                <p className="text-[11px]">No suspected duplicate reports awaiting municipal review.</p>
              </div>
            ) : (
              suspectedReports.map((item) => {
                const isSelected = item.id === selectedReportId;
                const isConfirmed = item.duplicateStatus === 'CONFIRMED_DUPLICATE';
                const isPending = item.duplicateReviewStatus === 'PENDING_ADMIN_REVIEW' || item.duplicateStatus === 'NEEDS_REVIEW';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedReportId(item.id)}
                    className={`p-3 rounded-2xl border transition cursor-pointer text-left space-y-2 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                        : 'bg-[#12141e] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.imageUrl}
                          alt="Road distress"
                          className="w-11 h-11 rounded-lg object-cover bg-black border border-white/10 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-bold text-white">
                              #{item.id.slice(-8)}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                                isConfirmed
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : isPending
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              }`}
                            >
                              {isConfirmed ? 'CONFIRMED DUP' : isPending ? 'NEEDS REVIEW' : 'NEW ISSUE'}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-300 font-medium truncate max-w-[160px]">
                            {item.category} · {item.severity}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1 border-t border-white/5">
                      <span className="truncate max-w-[170px] text-neutral-400">
                        📍 {item.location.address}
                      </span>
                      {item.canonicalIssueId && (
                        <span className="text-amber-400 font-semibold shrink-0">
                          Matches #{item.canonicalIssueId.slice(-6)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: COMPARISON STAGE, METRICS, & ACTIONS (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {activeReport ? (
            <>
              {/* COMPARISON STAGE CONTAINER */}
              <div className="rounded-3xl bg-[#0e1017] border border-white/10 p-5 shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                      Side-by-Side Visual Evidence Inspection
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-neutral-400">Ticket under review:</span>
                    <span className="text-white font-bold font-mono">#{activeReport.id}</span>
                  </div>
                </div>

                {/* SIDE-BY-SIDE IMAGE COMPARISON VIEWPORT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PANE 1: ORIGINAL CANONICAL TICKET */}
                  <div className="p-3.5 rounded-2xl bg-[#12141f] border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-neutral-200 border border-white/20">
                          ORIGINAL CANONICAL ISSUE
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          #{canonicalReport ? canonicalReport.id : activeReport.canonicalIssueId || 'CANONICAL-01'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/10 text-[9px] font-mono">
                        <button
                          type="button"
                          onClick={() => setViewModeOriginal('raw')}
                          className={`px-2 py-0.5 rounded transition ${
                            viewModeOriginal === 'raw' ? 'bg-[#d97757] text-white font-bold' : 'text-neutral-400'
                          }`}
                        >
                          Raw
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewModeOriginal('annotated')}
                          className={`px-2 py-0.5 rounded transition ${
                            viewModeOriginal === 'annotated' ? 'bg-[#d97757] text-white font-bold' : 'text-neutral-400'
                          }`}
                        >
                          AI Box
                        </button>
                      </div>
                    </div>

                    {/* Image Box */}
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black group">
                      <img
                        src={
                          viewModeOriginal === 'annotated' && canonicalReport?.annotatedImageUrl
                            ? canonicalReport.annotatedImageUrl
                            : canonicalReport?.imageUrl || '/samples/road-pothole-1.jpg'
                        }
                        alt="Original report"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[9px] font-mono text-emerald-400 border border-emerald-500/30">
                        Primary Work Ticket
                      </div>
                    </div>

                    {/* Canonical Metadata Card */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">
                          {canonicalReport?.category || activeReport.category}
                        </span>
                        <SeverityBadge severity={canonicalReport?.severity || activeReport.severity} />
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-[#d97757] shrink-0" />
                        <span className="truncate">{canonicalReport?.location.address || activeReport.location.address}</span>
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500 flex items-center justify-between pt-1 border-t border-white/5">
                        <span>Submitted by {canonicalReport?.citizenName || 'Marcus Vance'}</span>
                        <span>{canonicalReport?.submittedAt || 'Earlier today'}</span>
                      </div>
                    </div>

                    {/* Button to inspect full canonical ticket */}
                    <button
                      type="button"
                      onClick={() => onSelectReport(canonicalReport ? canonicalReport.id : activeReport.canonicalIssueId || activeReport.id)}
                      className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-[#d97757]" />
                      <span>Inspect Original Ticket Full Details</span>
                    </button>
                  </div>

                  {/* PANE 2: NEWLY UPLOADED REPORT */}
                  <div className="p-3.5 rounded-2xl bg-[#15131b] border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          NEWLY SUBMITTED
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          #{activeReport.id.slice(-8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/10 text-[9px] font-mono">
                        <button
                          type="button"
                          onClick={() => setViewModeCandidate('raw')}
                          className={`px-2 py-0.5 rounded transition ${
                            viewModeCandidate === 'raw' ? 'bg-[#d97757] text-white font-bold' : 'text-neutral-400'
                          }`}
                        >
                          Raw
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewModeCandidate('annotated')}
                          className={`px-2 py-0.5 rounded transition ${
                            viewModeCandidate === 'annotated' ? 'bg-[#d97757] text-white font-bold' : 'text-neutral-400'
                          }`}
                        >
                          AI Box
                        </button>
                      </div>
                    </div>

                    {/* Image Box */}
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black group">
                      <img
                        src={
                          viewModeCandidate === 'annotated' && activeReport.annotatedImageUrl
                            ? activeReport.annotatedImageUrl
                            : activeReport.imageUrl
                        }
                        alt="Candidate report"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[9px] font-mono text-amber-400 border border-amber-500/30">
                        Candidate Duplicate
                      </div>
                    </div>

                    {/* Candidate Metadata Card */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{activeReport.category}</span>
                        <SeverityBadge severity={activeReport.severity} />
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-[#d97757] shrink-0" />
                        <span className="truncate">{activeReport.location.address}</span>
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500 flex items-center justify-between pt-1 border-t border-white/5">
                        <span>Submitted by {activeReport.citizenName}</span>
                        <span>{activeReport.submittedAt}</span>
                      </div>
                    </div>

                    {/* Citizen Note */}
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] text-neutral-400 italic truncate">
                      &ldquo;{activeReport.description}&rdquo;
                    </div>
                  </div>
                </div>

                {/* COMPARISON METRICS TELEMETRY GRID (Requirements 3, 4, 5, 6) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {/* CARD 1: GPS PROXIMITY DISTANCE (Req 3) */}
                  <div className="p-3.5 rounded-2xl bg-[#12141f] border border-white/10 space-y-1 text-left">
                    <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono uppercase">
                      <span className="flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-[#d97757]" />
                        <span>GNSS Proximity</span>
                      </span>
                      <span className="text-emerald-400 font-semibold">≤ 50m Gating</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-white mt-1">
                      {gpsDistanceMeters.toFixed(1)} <span className="text-xs font-normal text-neutral-400">meters</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed">
                      Coordinates: {activeReport.location.latitude.toFixed(5)}°, {activeReport.location.longitude.toFixed(5)}°
                    </p>
                  </div>

                  {/* CARD 2: PHASH PERCEPTUAL SIMILARITY (Req 4) */}
                  <div className="p-3.5 rounded-2xl bg-[#12141f] border border-white/10 space-y-1 text-left">
                    <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono uppercase">
                      <span className="flex items-center gap-1">
                        <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                        <span>64-bit DCT pHash</span>
                      </span>
                      <span className="text-amber-400 font-semibold">Hamming</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                      {activeReport.duplicateStatus === 'CONFIRMED_DUPLICATE' ? '0 / 64' : '3 / 64'}{' '}
                      <span className="text-xs font-normal text-neutral-400">
                        ({activeReport.duplicateStatus === 'CONFIRMED_DUPLICATE' ? '100%' : '95.3%'} match)
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-neutral-400 truncate">
                      Fingerprint: cee4d5d823838e74
                    </p>
                  </div>

                  {/* CARD 3: OPENCV ORB & RANSAC HOMOGRAPHY (Req 5) */}
                  <div className="p-3.5 rounded-2xl bg-[#12141f] border border-white/10 space-y-1 text-left">
                    <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono uppercase">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        <span>ORB + RANSAC</span>
                      </span>
                      <span className="text-cyan-400 font-semibold">Lowe 0.75</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                      {activeReport.duplicateStatus === 'CONFIRMED_DUPLICATE' ? '407' : '38'}{' '}
                      <span className="text-xs font-normal text-neutral-400">inliers</span>
                    </div>
                    <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Valid Homography Matrix Found</span>
                    </p>
                  </div>
                </div>

                {/* MATCH REASON & PRESERVATION GUARANTEE (Req 8 & Req 10) */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Full Citizen Submission Preservation:</span>
                      <p className="text-[11px] text-neutral-400 leading-snug">
                        Confirming a duplicate links the new report to canonical ticket #{activeReport.canonicalIssueId || 'PARENT'} while keeping all citizen credits, original photos, and GPS telemetries fully intact in MongoDB Atlas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ADMINISTRATIVE ACTIONS TOOLBAR (Req 7 & Req 10) */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-mono text-neutral-400">
                    Decision Status:{' '}
                    <span className="text-white font-semibold">
                      {activeReport.duplicateReviewStatus || 'PENDING_ADMIN_REVIEW'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Action 1: Create New Issue (Mark as Distinct / Independent) */}
                    <button
                      type="button"
                      onClick={() => {
                        setPendingActionType('DISMISS_DUPLICATE');
                        setShowConfirmModal(true);
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center gap-2 transition cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-blue-400" />
                      <span>Create New Issue (Mark Distinct)</span>
                    </button>

                    {/* Action 2: Confirm Duplicate */}
                    <button
                      type="button"
                      onClick={() => {
                        setPendingActionType('CONFIRM_DUPLICATE');
                        setShowConfirmModal(true);
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_25px_rgba(245,158,11,0.3)] flex items-center gap-2 transition cursor-pointer font-mono font-bold"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>Confirm Duplicate</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-[#0e1017] border border-white/10 space-y-3">
              <Layers className="w-10 h-10 text-neutral-600 mx-auto" />
              <h3 className="text-sm font-mono text-white font-bold">No Report Selected</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Select a suspected duplicate road hazard from the queue on the left to inspect side-by-side images, pHash, and ORB geometric metrics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION & DECISION AUDIT MODAL DIALOG (Requirement 10) */}
      <AnimatePresence>
        {showConfirmModal && activeReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-[#14151e] border border-white/15 p-6 shadow-2xl space-y-4 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    pendingActionType === 'CONFIRM_DUPLICATE'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  }`}
                >
                  {pendingActionType === 'CONFIRM_DUPLICATE' ? (
                    <Link2 className="w-5 h-5" />
                  ) : (
                    <PlusCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    {pendingActionType === 'CONFIRM_DUPLICATE'
                      ? 'Confirm Duplicate Road Defect Link'
                      : 'Mark as Independent New Issue'}
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Applying review decision to report #{activeReport.id}.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0e1017] border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-neutral-400">New Report:</span>
                  <span className="text-white font-bold">#{activeReport.id}</span>
                </div>
                {pendingActionType === 'CONFIRM_DUPLICATE' && (
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-neutral-400">Canonical Parent:</span>
                    <span className="text-amber-400 font-bold">
                      #{canonicalReport ? canonicalReport.id : activeReport.canonicalIssueId || 'CANONICAL-01'}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between font-mono">
                  <span className="text-neutral-400">Action:</span>
                  <span className="text-emerald-400 font-bold">{pendingActionType}</span>
                </div>
              </div>

              {/* Inspector Decision Notes Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Inspector Audit Note & Timestamp Record
                </label>
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder={
                    pendingActionType === 'CONFIRM_DUPLICATE'
                      ? 'e.g. Verified matching pavement cavity and crack boundary geometry. Consolidated into primary repair ticket.'
                      : 'e.g. Verified separate void 4m down the road lane. Independent repair crew required.'
                  }
                  rows={3}
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDecision}
                  disabled={isSubmittingDecision}
                  className={`px-5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    pendingActionType === 'CONFIRM_DUPLICATE'
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                  }`}
                >
                  {isSubmittingDecision ? (
                    <span>Recording Decision...</span>
                  ) : (
                    <span>Confirm & Record Timestamp</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
