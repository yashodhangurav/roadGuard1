import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Activity,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useReports, RoadDamageReport, ReportStatus } from '../../context/ReportsContext';
import { ReportDetailModal } from './ReportDetailModal';
import { OfflineSyncBanner } from './OfflineSyncBanner';

interface CitizenDashboardProps {
  onOpenReportModal: () => void;
  onNavigateToMyReports: () => void;
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

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  onOpenReportModal,
  onNavigateToMyReports,
}) => {
  const { user } = useAuth();
  const { reports, stats } = useReports();
  const [selectedReport, setSelectedReport] = useState<RoadDamageReport | null>(null);

  const recentReports = reports.slice(0, 4);

  return (
    <div className="space-y-7">
      {/* Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />

      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#121319] via-[#161722] to-[#121319] border border-white/10 p-6 sm:p-8 shadow-xl overflow-hidden">
        {/* Glow */}
        <div
          className="absolute right-0 top-0 w-96 h-96 bg-[#d97757]/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase text-emerald-400 font-semibold tracking-wider">
                Active Citizen Reporter Portal
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, {user?.name || 'Citizen'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed">
              Report potholes, road cracks, and pavement hazards in real time. Your submissions
              directly alert municipal road maintenance crews and civil engineering teams.
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={onOpenReportModal}
              className="px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-[#d97757] hover:bg-[#c66848] text-white shadow-[0_0_25px_rgba(217,119,87,0.45)] transition flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Report a Road Issue</span>
              <Sparkles className="w-4 h-4 text-amber-200" />
            </button>
          </div>
        </div>
      </div>

      {/* Offline-First Background Sync Dashboard Banner */}
      <OfflineSyncBanner />

      {/* Statistics Pillar Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Stat 1: Total Reports */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#101116] border border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase">Total Reports</span>
            <FileText className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-2">
            {stats.total}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Submitted from your account
          </div>
        </div>

        {/* Stat 2: Pending / Under Review */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#101116] border border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-[11px] font-mono uppercase">Under Review</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-400 mt-2">
            {stats.submitted + stats.underReview}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {stats.submitted} new · {stats.underReview} inspecting
          </div>
        </div>

        {/* Stat 3: In Progress */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#101116] border border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-[#d97757]">
            <span className="text-[11px] font-mono uppercase">In Progress</span>
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#d97757] mt-2">
            {stats.inProgress}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Work order issued to crew
          </div>
        </div>

        {/* Stat 4: Resolved */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#101116] border border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-mono uppercase">Resolved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-2">
            {stats.resolved}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Permanent repair completed
          </div>
        </div>
      </div>

      {/* Recent Submissions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Recent Road Incident Reports
            </h2>
            <p className="text-xs text-neutral-400">
              Latest pavement inspections submitted via mobile and web geotagging.
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateToMyReports}
            className="text-xs font-semibold text-[#d97757] hover:text-[#ff8f6b] flex items-center gap-1 transition cursor-pointer"
          >
            <span>View All ({reports.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recent Reports Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {recentReports.map((report) => (
            <motion.div
              key={report.id}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedReport(report)}
              className="p-4 rounded-2xl bg-[#111218] hover:bg-[#151620] border border-white/10 hover:border-[#d97757]/40 transition-all cursor-pointer shadow-md group flex gap-3.5"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-black shrink-0 relative">
                <img
                  src={report.annotatedImageUrl || report.imageUrl}
                  alt={report.category}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white">
                  {report.severity}
                </span>
                {report.aiDetection && (
                  <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-[#d97757]/90 text-[8px] font-mono font-semibold text-white">
                    AI
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-[#d97757]">
                    {report.id}
                  </span>
                  <span
                    className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                      report.status
                    )}`}
                  >
                    {report.status}
                  </span>
                </div>

                <div className="text-sm font-bold text-white truncate">
                  {report.category}
                </div>

                <div className="text-[11px] text-neutral-400 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-[#d97757] shrink-0" />
                  <span className="truncate">{report.location.address}</span>
                </div>

                <div className="text-[10px] font-mono text-neutral-500 pt-0.5">
                  {report.submittedAt}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
