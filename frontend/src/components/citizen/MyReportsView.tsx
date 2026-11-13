import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  MapPin,
  Calendar,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { useReports, RoadDamageReport, ReportStatus } from '../../context/ReportsContext';
import { ReportDetailModal } from './ReportDetailModal';

interface MyReportsViewProps {
  onOpenReportModal: () => void;
}

const FILTER_TABS = ['All', 'Submitted', 'Under Review', 'In Progress', 'Resolved'];

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

export const MyReportsView: React.FC<MyReportsViewProps> = ({ onOpenReportModal }) => {
  const { reports, filterStatus, setFilterStatus, filteredReports, resetToSampleReports } =
    useReports();
  const [selectedReport, setSelectedReport] = useState<RoadDamageReport | null>(null);

  return (
    <div className="space-y-6">
      {/* Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />

      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            My Road Damage Reports
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Track live remediation progress, engineering assessments, and dispatch work orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetToSampleReports}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 flex items-center gap-1.5 transition cursor-pointer"
            title="Reset to default demonstration reports"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>

          <button
            type="button"
            onClick={onOpenReportModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#d97757] hover:bg-[#c66848] text-white shadow-[0_0_20px_rgba(217,119,87,0.4)] flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Report Road Issue</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const isActive = filterStatus === tab;
          const count =
            tab === 'All'
              ? reports.length
              : reports.filter((r) => r.status.toLowerCase() === tab.toLowerCase()).length;

          return (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-[#d97757]/20 border-[#d97757] text-white shadow-sm'
                  : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-[#d97757] text-white' : 'bg-white/10 text-neutral-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-white/[0.02] border border-white/10 p-6">
            <FileText className="w-10 h-10 text-neutral-500 mx-auto mb-3 opacity-60" />
            <div className="text-base font-semibold text-white">No reports found</div>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              There are no reports matching the &ldquo;{filterStatus}&rdquo; status filter. Click the
              button below to submit a new road defect report.
            </p>
            <button
              type="button"
              onClick={onOpenReportModal}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#d97757] text-white hover:bg-[#c66848] transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Report Road Issue</span>
            </button>
          </div>
        ) : (
          filteredReports.map((report) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedReport(report)}
              className="p-4 sm:p-5 rounded-2xl bg-[#111218]/90 hover:bg-[#14151e] border border-white/10 hover:border-[#d97757]/40 transition-all cursor-pointer shadow-md group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              {/* Left: Thumbnail & Details */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-white/15 bg-black shrink-0 relative">
                  <img
                    src={report.imageUrl}
                    alt={report.category}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white">
                    {report.severity}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#d97757]">
                      {report.id}
                    </span>
                    <span className="text-neutral-500 font-mono text-xs">·</span>
                    <span className="text-sm font-bold text-white">{report.category}</span>
                  </div>

                  <p className="text-xs text-neutral-300 line-clamp-1 max-w-md">
                    {report.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#d97757] shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">
                        {report.location.address}
                      </span>
                    </span>
                    <span className="hidden sm:inline text-neutral-600">·</span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Calendar className="w-3 h-3 text-neutral-500" />
                      <span>{report.submittedAt}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Status Pill & View Arrow */}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <span
                  className={`text-[11px] font-semibold uppercase px-3 py-1 rounded-full border ${getStatusBadgeStyle(
                    report.status
                  )}`}
                >
                  {report.status}
                </span>

                <div className="w-8 h-8 rounded-full bg-white/[0.04] group-hover:bg-[#d97757]/20 group-hover:text-[#d97757] text-neutral-400 flex items-center justify-center transition shrink-0">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
