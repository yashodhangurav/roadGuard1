import React, { useState } from 'react';
import {
  X,
  MapPin,
  CheckCircle2,
  XCircle,
  Truck,
  Maximize2,
  Minimize2,
  Cpu,
  Layers,
  History,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { ReportStatus, useReports } from '../../context/ReportsContext';
import { SeverityBadge, StatusBadge } from './SeverityBadge';
import { RoadLocationMap } from '../citizen/RoadLocationMap';

interface ReportDetailsModalProps {
  reportId: string | null;
  onClose: () => void;
}

export const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  reportId,
  onClose,
}) => {
  const { getReportById, updateReportStatus } = useReports();
  const report = reportId ? getReportById(reportId) : undefined;

  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Duplicate submission or verified resolved');
  const [customRejectionText, setCustomRejectionText] = useState('');
  const [assignedCrewInput, setAssignedCrewInput] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  if (!report) return null;

  const handleUpdateStatus = (
    newStatus: ReportStatus,
    notes?: string,
    rejectReason?: string
  ) => {
    updateReportStatus(
      report.id,
      newStatus,
      notes || `Status updated to ${newStatus} by Municipal Road Administrator.`,
      rejectReason
    );
    setActionSuccessMsg(`Report ${report.id} updated to ${newStatus}`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleConfirmRejection = () => {
    const fullReason =
      rejectionReason === 'Other'
        ? customRejectionText.trim() || 'Unspecified administrative rejection.'
        : rejectionReason + (customRejectionText ? `: ${customRejectionText}` : '');

    handleUpdateStatus('Rejected', undefined, fullReason);
    setShowRejectDialog(false);
    setCustomRejectionText('');
  };

  // Simulated AI Computer Vision Telemetry based on report category and severity
  const aiTelemetry = {
    confidence: report.severity === 'Critical' ? 96.8 : report.severity === 'High' ? 93.4 : 88.9,
    depthEstimate: report.severity === 'Critical' ? '86 mm' : report.severity === 'High' ? '45 mm' : '18 mm',
    surfaceArea: report.severity === 'Critical' ? '0.64 m²' : report.severity === 'High' ? '0.42 m²' : '0.15 m²',
    pciDeduction: report.severity === 'Critical' ? '46 pts' : report.severity === 'High' ? '28 pts' : '14 pts',
    modelName: 'YOLOv11-RoadDefect-RT (TensorRT INT8)',
    inferenceLatency: '14.2 ms',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-5xl rounded-3xl bg-[#0d0e14] border border-white/10 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-4 bg-[#111218]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#d97757]/20 border border-[#d97757]/40 flex items-center justify-center text-[#d97757]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-base">{report.id}</span>
                <SeverityBadge severity={report.severity} />
                <StatusBadge status={report.status} />
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Submitted by {report.citizenName} ({report.citizenId}) · {report.submittedAt}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Banner */}
        {actionSuccessMsg && (
          <div className="bg-emerald-950/60 border-b border-emerald-500/40 px-4 py-2 text-xs font-mono text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Body Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Main Grid: Left Photo & AI Bounding Box, Right Telemetry & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: Visual Evidence & AI Overlay */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#d97757]" />
                  <span>Distress Evidence & Computer Vision</span>
                </span>
                <button
                  onClick={() => setIsPhotoZoomed(!isPhotoZoomed)}
                  className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1"
                >
                  {isPhotoZoomed ? (
                    <>
                      <Minimize2 className="w-3 h-3" />
                      <span>Standard View</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3 h-3" />
                      <span>Zoom Photo</span>
                    </>
                  )}
                </button>
              </div>

              {/* Photo Frame with AI Bounding Box */}
              <div
                className={`relative rounded-2xl overflow-hidden border border-white/15 bg-black transition-all ${
                  isPhotoZoomed ? 'aspect-[4/3] scale-102' : 'aspect-[16/10]'
                }`}
              >
                <img
                  src={report.imageUrl}
                  alt={report.category}
                  className="w-full h-full object-cover"
                />

                {/* Simulated Computer Vision Bounding Box Overlay */}
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    report.severity === 'Critical'
                      ? 'border-2 border-red-500/80 bg-red-500/10'
                      : 'border-2 border-[#d97757]/80 bg-[#d97757]/10'
                  } m-10 rounded-xl transition-all shadow-[0_0_20px_rgba(217,119,87,0.25)]`}
                >
                  {/* Bounding Box HUD Label */}
                  <div
                    className={`absolute -top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white ${
                      report.severity === 'Critical' ? 'bg-red-600' : 'bg-[#d97757]'
                    } shadow-md flex items-center gap-1`}
                  >
                    <span>{report.category.toUpperCase()}</span>
                    <span>·</span>
                    <span>{aiTelemetry.confidence}%</span>
                  </div>

                  {/* Corner targeting reticles */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white" />
                </div>

                {/* Bottom Model Telemetry HUD */}
                <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-300">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-[#d97757]" />
                    <span>{aiTelemetry.modelName}</span>
                  </div>
                  <span>Inference: {aiTelemetry.inferenceLatency}</span>
                </div>
              </div>

              {/* AI Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#111218] border border-white/5">
                  <div className="text-[10px] text-neutral-500 uppercase">Est. Depth</div>
                  <div className="text-sm font-bold text-white mt-0.5">{aiTelemetry.depthEstimate}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#111218] border border-white/5">
                  <div className="text-[10px] text-neutral-500 uppercase">Surface Area</div>
                  <div className="text-sm font-bold text-white mt-0.5">{aiTelemetry.surfaceArea}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#111218] border border-white/5">
                  <div className="text-[10px] text-neutral-500 uppercase">PCI Deduction</div>
                  <div className="text-sm font-bold text-red-400 mt-0.5">-{aiTelemetry.pciDeduction}</div>
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 rounded-xl bg-[#111218] border border-white/5 text-xs">
                <div className="text-[10px] font-mono text-neutral-500 uppercase mb-1">
                  Citizen Description
                </div>
                <p className="text-neutral-300 leading-relaxed">{report.description}</p>
              </div>
            </div>

            {/* RIGHT COLUMN: Location Map, Crew Assignment, & Status Actions */}
            <div className="space-y-4">
              {/* Location telemetry & Leaflet Mini-Map */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#d97757]" />
                    <span>GNSS Location & Road Network</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {report.location.latitude.toFixed(6)}°, {report.location.longitude.toFixed(6)}°
                  </span>
                </div>

                <RoadLocationMap
                  latitude={report.location.latitude}
                  longitude={report.location.longitude}
                  address={report.location.address}
                  isInteractive={false}
                  height="180px"
                />

                <div className="p-2.5 rounded-xl bg-[#111218] border border-white/5 text-xs mt-2 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#d97757] shrink-0" />
                  <span className="text-neutral-300 truncate">{report.location.address}</span>
                </div>
              </div>

              {/* Administrative Actions Panel */}
              <div className="p-4 rounded-2xl bg-[#111218] border border-white/10 space-y-3">
                <div className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center justify-between">
                  <span>Administrative Actions</span>
                  <span className="text-[10px] font-normal text-neutral-400">Current: {report.status}</span>
                </div>

                {/* Primary Quick Status Transition Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {/* Verify / Under Review */}
                  <button
                    onClick={() => handleUpdateStatus('Under Review', 'Verified by Municipal Inspector.')}
                    disabled={report.status === 'Under Review'}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      report.status === 'Under Review'
                        ? 'bg-purple-950/30 border border-purple-500/20 text-purple-400 opacity-60 cursor-not-allowed'
                        : 'bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 cursor-pointer'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Under Review</span>
                  </button>

                  {/* Dispatch / In Progress */}
                  <button
                    onClick={() =>
                      handleUpdateStatus(
                        'In Progress',
                        assignedCrewInput
                          ? `Work order issued to ${assignedCrewInput}`
                          : 'Work order issued to Municipal Rapid Patch Division.'
                      )
                    }
                    disabled={report.status === 'In Progress'}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      report.status === 'In Progress'
                        ? 'bg-[#d97757]/15 border border-[#d97757]/20 text-[#d97757] opacity-60 cursor-not-allowed'
                        : 'bg-[#d97757]/25 hover:bg-[#d97757]/35 border border-[#d97757]/40 text-[#d97757] cursor-pointer'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>In Progress</span>
                  </button>

                  {/* Resolve */}
                  <button
                    onClick={() =>
                      handleUpdateStatus('Resolved', 'Permanent repair completed. Quality inspected.')
                    }
                    disabled={report.status === 'Resolved'}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      report.status === 'Resolved'
                        ? 'bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 opacity-60 cursor-not-allowed'
                        : 'bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 cursor-pointer'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolve</span>
                  </button>

                  {/* Reject (Opens Rejection Dialog) */}
                  <button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={report.status === 'Rejected'}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      report.status === 'Rejected'
                        ? 'bg-red-950/30 border border-red-500/20 text-red-400 opacity-60 cursor-not-allowed'
                        : 'bg-red-950/50 hover:bg-red-900/60 border border-red-500/40 text-red-300 cursor-pointer'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>

                {/* Optional Crew Assignment Input */}
                <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-neutral-500 shrink-0" />
                  <input
                    type="text"
                    value={assignedCrewInput}
                    onChange={(e) => setAssignedCrewInput(e.target.value)}
                    placeholder={report.assignedCrew || 'Assign repair crew (e.g. Crew #12, Asphalt Mill 4)'}
                    className="flex-1 bg-[#0d0e14] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757]"
                  />
                  {report.assignedCrew && !assignedCrewInput && (
                    <span className="text-[10px] font-mono text-[#d97757] px-2 py-0.5 rounded bg-[#d97757]/10">
                      Assigned
                    </span>
                  )}
                </div>
              </div>

              {/* Status History & Audit Trail */}
              <div className="p-4 rounded-2xl bg-[#111218] border border-white/10 space-y-3">
                <div className="text-xs font-mono font-bold uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#d97757]" />
                  <span>Timeline & Audit Trail</span>
                </div>

                <div className="space-y-3 pl-2 border-l border-white/10">
                  {report.timeline.map((entry, idx) => (
                    <div key={idx} className="relative pl-4 space-y-0.5">
                      <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-[#d97757] border-2 border-[#0d0e14]" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{entry.status}</span>
                        <span className="text-[10px] font-mono text-neutral-500">{entry.timestamp}</span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-snug">{entry.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#111218] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Database Synchronized with Municipal Dispatch</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* MANDATORY REJECTION REASON DIALOG MODAL */}
        {showRejectDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div
              className="w-full max-w-md rounded-2xl bg-[#14151e] border border-red-500/40 p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Reject Road Incident Report</h4>
                  <p className="text-xs text-neutral-400">
                    A valid administrative reason is required to reject report {report.id}.
                  </p>
                </div>
              </div>

              {/* Preset Reason Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Rejection Category
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
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

              {/* Reason Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Detailed Explanation (Citizen will see this in their timeline)
                </label>
                <textarea
                  value={customRejectionText}
                  onChange={(e) => setCustomRejectionText(e.target.value)}
                  placeholder="Provide clarifying details on why this defect report cannot be serviced..."
                  rows={3}
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowRejectDialog(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejection}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
