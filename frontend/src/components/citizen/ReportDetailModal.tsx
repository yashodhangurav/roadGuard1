import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { RoadDamageReport, ReportStatus } from '../../context/ReportsContext';
import { RoadLocationMap } from './RoadLocationMap';
import { modalBackdrop, modalFrame } from '../../styles/motion';

interface ReportDetailModalProps {
  report: RoadDamageReport | null;
  onClose: () => void;
}

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

const STATUS_STEPS: ReportStatus[] = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose }) => {
  if (!report) return null;

  const currentStepIndex = STATUS_STEPS.indexOf(report.status);

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
          className="relative w-full max-w-2xl rounded-2xl bg-[#0e0f14]/98 border border-white/15 p-5 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.9)] z-10 text-left overflow-hidden my-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-neutral-400">TICKET:</span>
                <span className="font-mono text-sm font-bold text-white">{report.id}</span>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                    report.status
                  )}`}
                >
                  {report.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                {report.category} Incident Details
              </h2>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Progress Bar (for standard flow) */}
          {report.status !== 'Rejected' && (
            <div className="my-5 p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="text-[10px] font-mono uppercase text-neutral-400 mb-3 tracking-wider">
                Municipal Repair Lifecycle
              </div>
              <div className="flex items-center justify-between relative">
                {/* Connecting Track */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
                <div
                  className="absolute top-1/2 left-0 h-0.5 bg-[#d97757] -translate-y-1/2 z-0 transition-all duration-500"
                  style={{
                    width: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%`,
                  }}
                />

                {STATUS_STEPS.map((step, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                          isDone
                            ? 'bg-[#d97757] text-white shadow-[0_0_12px_rgba(217,119,87,0.5)]'
                            : 'bg-black border border-white/20 text-neutral-500'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] font-medium mt-1.5 whitespace-nowrap ${
                          isCurrent
                            ? 'text-white font-semibold'
                            : isDone
                            ? 'text-neutral-300'
                            : 'text-neutral-500'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Grid: Photo + Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {/* Left: Road Damage Photo */}
            <div>
              <div className="text-[11px] font-mono uppercase text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <span>Pavement Image Evidence</span>
              </div>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black">
                <img
                  src={report.imageUrl}
                  alt={report.category}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-white/20 text-[10px] font-mono text-white">
                  {report.category} · {report.severity}
                </div>
              </div>

              {/* Description */}
              <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="text-[10px] uppercase font-mono text-neutral-400">
                  Citizen Description
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

          {/* Timeline History Entries */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <h3 className="text-xs font-semibold text-white uppercase font-mono tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Inspection & Dispatch Audit Log</span>
            </h3>

            <div className="space-y-2.5">
              {report.timeline.map((entry, idx) => (
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
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="mt-6 pt-3 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition cursor-pointer"
            >
              Close Ticket
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
