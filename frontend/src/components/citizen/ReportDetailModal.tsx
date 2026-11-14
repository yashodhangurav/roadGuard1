import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Clock,
  Users,
  Sparkles,
  Calendar,
  Camera,
  Building2,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { RoadDamageReport, ReportStatus, CanonicalProgressStage } from '../../context/ReportsContext';
import { RoadLocationMap } from './RoadLocationMap';
import { modalBackdrop, modalFrame } from '../../styles/motion';

interface ReportDetailModalProps {
  report: RoadDamageReport | null;
  onClose: () => void;
}

const PROGRESS_STAGES_CONFIG: { stage: CanonicalProgressStage; label: string; number: number; desc: string }[] = [
  { stage: 'Reported', label: 'Reported', number: 1, desc: 'Logged with GNSS' },
  { stage: 'Admin verified', label: 'Verified', number: 2, desc: 'Severity confirmed' },
  { stage: 'Assigned to department', label: 'Assigned', number: 3, desc: 'Dept dispatched' },
  { stage: 'Scheduled', label: 'Scheduled', number: 4, desc: 'Target date set' },
  { stage: 'Repair in progress', label: 'In Repair', number: 5, desc: 'Crews active on site' },
  { stage: 'Repair completed', label: 'Repaired', number: 6, desc: 'Patch completed' },
  { stage: 'Final verification', label: 'QA Audit', number: 7, desc: 'Quality inspected' },
  { stage: 'Closed', label: 'Closed', number: 8, desc: 'Restoration complete' },
];

const getStatusBadgeStyle = (status: ReportStatus) => {
  switch (status) {
    case 'Submitted':
      return 'bg-blue-950/50 border-blue-500/40 text-blue-300';
    case 'Under Review':
      return 'bg-purple-950/50 border-purple-500/40 text-purple-300';
    case 'In Progress':
      return 'bg-amber-950/50 border-amber-500/40 text-amber-300';
    case 'Resolved':
      return 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300';
    case 'Rejected':
      return 'bg-red-950/50 border-red-500/40 text-red-300';
    default:
      return 'bg-neutral-800 border-neutral-700 text-neutral-300';
  }
};

const resolveImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  return `http://127.0.0.1:8000${url}`;
};

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose }) => {
  const [showAnnotated, setShowAnnotated] = useState<boolean>(true);
  const [activePhotoTab, setActivePhotoTab] = useState<'before' | 'during' | 'after'>('before');

  if (!report) return null;

  const currentStage: CanonicalProgressStage = report.currentStage || 'Reported';
  const isReopened = currentStage === 'Reopened' || (report.reopenedCount && report.reopenedCount > 0 && currentStage !== 'Closed');

  // Compute active stage index (0 to 7)
  let activeStageIndex = PROGRESS_STAGES_CONFIG.findIndex((s) => s.stage === currentStage);
  if (activeStageIndex === -1) {
    if (currentStage === 'Reopened') {
      activeStageIndex = 4; // position near repair in progress
    } else {
      switch (report.status) {
        case 'Submitted': activeStageIndex = 0; break;
        case 'Under Review': activeStageIndex = 1; break;
        case 'In Progress': activeStageIndex = 4; break;
        case 'Resolved': activeStageIndex = 7; break;
        default: activeStageIndex = 0;
      }
    }
  }

  const beforeImgs = (report.beforeImages && report.beforeImages.length > 0)
    ? report.beforeImages
    : [report.imageUrl];
  const duringImgs = report.duringImages || [];
  const afterImgs = report.afterImages || [];

  const displayImage =
    showAnnotated && report.annotatedImageUrl ? report.annotatedImageUrl : report.imageUrl;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">
        {/* Backdrop */}
        <motion.div
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          variants={modalFrame}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-3xl rounded-2xl bg-[#0e0f14]/98 border border-white/15 p-5 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.9)] z-10 text-left overflow-hidden my-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-neutral-400">TICKET:</span>
                <span className="font-mono text-sm font-bold text-white">{report.id}</span>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                    report.status
                  )}`}
                >
                  {report.status}
                </span>

                {/* Canonical Stage Pill */}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-[#d97757]/15 text-[#d97757] border-[#d97757]/30 font-semibold">
                  Stage: {report.currentStage || 'Reported'}
                </span>

                {report.syncStatus && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      report.syncStatus === 'SYNCED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : report.syncStatus === 'SYNCING'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {report.syncStatus === 'SYNCED'
                      ? 'Cloud Synced'
                      : report.syncStatus === 'SYNCING'
                      ? 'Syncing...'
                      : 'Pending Sync'}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                {report.category} Incident Tracking
              </h2>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Canonical Duplicate Cluster Notice */}
          {report.canonicalIssueId && (
            <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="text-xs text-purple-200">
                <span className="font-semibold text-white">Consolidated Work Order:</span> This submission is linked to master ticket <span className="font-mono text-purple-300 font-bold">#{report.canonicalIssueId}</span>. All dispatch schedules, crew repairs, and photo audits are synchronized.
              </div>
            </div>
          )}

          {/* Reopened Alert Banner */}
          {isReopened && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200">
                <div className="font-semibold text-amber-300 flex items-center gap-2">
                  <span>Work Order Reopened for Supplemental Work</span>
                  {report.reopenedCount && (
                    <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-amber-500/30 text-amber-200">
                      Rework Cycle #{report.reopenedCount}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-amber-100/90 text-[11px]">
                  {report.reopenReason || 'Quality inspector flagged repair for resurfacing and compaction adjustment.'}
                </p>
              </div>
            </div>
          )}

          {/* 8-STAGE MUNICIPAL REPAIR PROGRESS STEPPER */}
          {report.status !== 'Rejected' && (
            <div className="my-5 p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#d97757]" />
                  <span>Municipal Pavement Repair Lifecycle (8 Stages)</span>
                </div>
                <div className="text-[11px] font-mono text-[#d97757] font-semibold">
                  Step {activeStageIndex + 1} of 8: {currentStage}
                </div>
              </div>

              {/* Responsive 8-Step Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 relative">
                {PROGRESS_STAGES_CONFIG.map((st, idx) => {
                  const isDone = activeStageIndex > idx || currentStage === 'Closed';
                  const isCurrent = activeStageIndex === idx;

                  return (
                    <div
                      key={st.stage}
                      className={`relative p-2 rounded-lg border text-center transition-all ${
                        isCurrent
                          ? 'bg-[#d97757]/20 border-[#d97757] shadow-[0_0_15px_rgba(217,119,87,0.3)]'
                          : isDone
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-white/[0.02] border-white/10 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCurrent
                              ? 'bg-[#d97757] text-white shadow-sm'
                              : isDone
                              ? 'bg-emerald-500 text-black'
                              : 'bg-white/10 text-neutral-400'
                          }`}
                        >
                          {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : st.number}
                        </div>
                      </div>
                      <div className="text-[10px] font-semibold leading-tight text-white truncate">
                        {st.label}
                      </div>
                      <div className="text-[8px] font-mono text-neutral-400 mt-0.5 hidden sm:block truncate">
                        {st.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Department Dispatch & Schedule Telemetry Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-[#d97757] shrink-0" />
              <div className="text-xs truncate">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block">Department</span>
                <span className="font-semibold text-white truncate">
                  {report.assignedDepartment || 'Department of Public Works'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5">
              <Users className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="text-xs truncate">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block">Assigned Crew</span>
                <span className="font-semibold text-white truncate">
                  {report.assignedCrew || 'Municipal Patch Unit'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-xs truncate">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block">Target Completion</span>
                <span className="font-semibold text-emerald-300 font-mono text-xs">
                  {report.expectedCompletionDate || 'Pending Crew Scheduling'}
                </span>
              </div>
            </div>
          </div>

          {/* Main Grid: Photo Evidence & Map Telemetry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Road Damage Photo */}
            <div>
              <div className="text-[11px] font-mono uppercase text-neutral-400 mb-1.5 flex items-center justify-between">
                <span>Citizen Incident Evidence</span>
                {report.annotatedImageUrl && (
                  <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded border border-white/10 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setShowAnnotated(false)}
                      className={`px-1.5 py-0.5 rounded transition ${
                        !showAnnotated ? 'bg-[#d97757] text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAnnotated(true)}
                      className={`px-1.5 py-0.5 rounded transition flex items-center gap-1 ${
                        showAnnotated ? 'bg-[#d97757] text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>AI Box</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black">
                <img
                  src={resolveImageUrl(displayImage)}
                  alt={report.category}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-white/20 text-[10px] font-mono text-white flex items-center gap-1.5">
                  <span>{report.category}</span>
                  <span className="text-neutral-400">·</span>
                  <span className={`${report.severity === 'Critical' ? 'text-red-400' : report.severity === 'High' ? 'text-[#d97757]' : 'text-amber-300'}`}>
                    {report.severity}
                  </span>
                </div>
              </div>

              {/* AI Vision Model Classification Card */}
              {(report.aiDetection || report.aiConfidence || report.repairMethod || report.dimensions) && (
                <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-[#d97757]/15 to-transparent border border-[#d97757]/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-[#d97757] flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      YOLO Model Detection & Pothole Metrics
                    </span>
                    {report.aiConfidence && (
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                        {report.aiConfidence.toFixed(1)}% Confidence
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-white">{report.aiDetection || report.category}</span>
                    <span className="text-[10px] font-mono text-[#d97757] font-semibold">({report.id})</span>
                    <span className="text-neutral-500 font-mono">·</span>
                    <span className={`font-mono text-[11px] font-semibold ${
                      report.severity === 'Critical'
                        ? 'text-red-400'
                        : report.severity === 'High'
                        ? 'text-[#d97757]'
                        : 'text-amber-300'
                    }`}>
                      {report.severity} Severity
                    </span>
                  </div>

                  {/* 4-Column Pothole Dimensions Grid */}
                  {report.dimensions && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono pt-1">
                      <div className="p-1.5 rounded bg-black/40 border border-white/5">
                        <span className="text-neutral-400 block uppercase text-[8px]">Dimensions</span>
                        <span className="text-white font-bold block mt-0.5">
                          {report.dimensions.widthCm} × {report.dimensions.heightCm} cm
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-black/40 border border-white/5">
                        <span className="text-neutral-400 block uppercase text-[8px]">Est. Depth</span>
                        <span className="text-amber-300 font-bold block mt-0.5">
                          {report.dimensions.estimatedDepthMm ? `${report.dimensions.estimatedDepthMm} mm` : 'N/A'}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-black/40 border border-white/5">
                        <span className="text-neutral-400 block uppercase text-[8px]">Surface Area</span>
                        <span className="text-emerald-300 font-bold block mt-0.5">
                          {report.dimensions.areaCm2?.toLocaleString()} cm²
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-black/40 border border-white/5">
                        <span className="text-neutral-400 block uppercase text-[8px]">Est. Patch</span>
                        <span className="text-[#d97757] font-bold block mt-0.5">
                          ~{Math.max(0.1, report.dimensions.areaCm2 * 0.00025).toFixed(2)} tons
                        </span>
                      </div>
                    </div>
                  )}

                  {report.repairMethod && (
                    <div className="text-[11px] text-neutral-300 pt-0.5">
                      <span className="text-[10px] font-mono text-neutral-400 block uppercase text-[9px]">Recommended Remediation:</span>
                      <span className="text-neutral-200 mt-0.5 block">{report.repairMethod}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="text-[10px] uppercase font-mono text-neutral-400">
                  Citizen Description & Notes
                </div>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                  {report.description}
                </p>
              </div>
            </div>

            {/* Right: Map & Location Telemetry */}
            <div className="space-y-3">
              <div>
                <div className="text-[11px] font-mono uppercase text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#d97757]" />
                  <span>Geographical Position</span>
                </div>
                <RoadLocationMap
                  latitude={report.location.latitude}
                  longitude={report.location.longitude}
                  address={report.location.address}
                  isInteractive={false}
                  height="180px"
                />
              </div>

              {/* Meta details list */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <span className="text-neutral-400 font-mono text-[11px]">Address:</span>
                  <span className="text-white font-medium text-right truncate max-w-[200px]">
                    {report.location.address}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <span className="text-neutral-400 font-mono text-[11px]">GNSS Coordinates:</span>
                  <span className="text-white font-mono text-[11px]">
                    {report.location.latitude.toFixed(5)}°, {report.location.longitude.toFixed(5)}°
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <span className="text-neutral-400 font-mono text-[11px]">Submitted On:</span>
                  <span className="text-white font-medium">{report.submittedAt}</span>
                </div>

                {report.assignedCrew && (
                  <div className="p-2.5 rounded-lg bg-[#d97757]/10 border border-[#d97757]/30 flex items-center justify-between">
                    <span className="text-[#d97757] font-mono text-[11px] flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Assigned Crew:
                    </span>
                    <span className="text-white font-medium">{report.assignedCrew}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BEFORE · DURING · AFTER REPAIR PHOTO GALLERY */}
          <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#d97757]" />
                <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                  Repair Photographic Evidence Gallery
                </span>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded border border-white/10 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('before')}
                  className={`px-2 py-0.5 rounded transition ${
                    activePhotoTab === 'before'
                      ? 'bg-[#d97757] text-white font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Before ({beforeImgs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('during')}
                  className={`px-2 py-0.5 rounded transition ${
                    activePhotoTab === 'during'
                      ? 'bg-[#d97757] text-white font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  During ({duringImgs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('after')}
                  className={`px-2 py-0.5 rounded transition ${
                    activePhotoTab === 'after'
                      ? 'bg-[#d97757] text-white font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  After ({afterImgs.length})
                </button>
              </div>
            </div>

            {/* Gallery View */}
            <div>
              {activePhotoTab === 'before' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {beforeImgs.map((img, idx) => (
                    <div key={idx} className="aspect-[4/3] rounded-lg overflow-hidden border border-white/10 bg-black relative group">
                      <img
                        src={resolveImageUrl(img)}
                        alt={`Before distress ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-amber-300">
                        Citizen Evidence #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activePhotoTab === 'during' && (
                <div>
                  {duringImgs.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {duringImgs.map((img, idx) => (
                        <div key={idx} className="aspect-[4/3] rounded-lg overflow-hidden border border-[#d97757]/40 bg-black relative group">
                          <img
                            src={resolveImageUrl(img)}
                            alt={`During repair ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-[#d97757]">
                            Crew In-Progress #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-neutral-500 font-mono border border-dashed border-white/10 rounded-lg">
                      No mid-repair photographs uploaded by crew yet.
                    </div>
                  )}
                </div>
              )}

              {activePhotoTab === 'after' && (
                <div>
                  {afterImgs.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {afterImgs.map((img, idx) => (
                        <div key={idx} className="aspect-[4/3] rounded-lg overflow-hidden border border-emerald-500/40 bg-black relative group">
                          <img
                            src={resolveImageUrl(img)}
                            alt={`After repair ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-emerald-300">
                            Post-Repair Completed #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-neutral-500 font-mono border border-dashed border-white/10 rounded-lg">
                      Post-restoration photographs will appear here once work is finished.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timeline History Entries / Repair Audit Log */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <h3 className="text-xs font-semibold text-white uppercase font-mono tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Inspection & Dispatch Audit Log</span>
            </h3>

            <div className="space-y-2.5">
              {/* Show repairProgressHistory if available, else standard timeline */}
              {report.repairProgressHistory && report.repairProgressHistory.length > 0 ? (
                report.repairProgressHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#d97757] mt-1.5 shrink-0" />
                    <div className="text-xs w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">Stage {idx + 1}: {entry.stage}</span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {entry.timestamp}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2">
                        {entry.actor_name && (
                          <span className="font-mono text-neutral-300">By: {entry.actor_name} ({entry.actor_role || 'Staff'})</span>
                        )}
                        {entry.crew && (
                          <span className="text-neutral-400">· Crew: {entry.crew}</span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-neutral-300 text-[11px] mt-1 leading-relaxed">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                report.timeline.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#d97757] mt-1.5 shrink-0" />
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{entry.status}</span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {entry.timestamp}
                        </span>
                      </div>
                      <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">
                        {entry.note}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="mt-6 pt-3 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
