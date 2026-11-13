import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Filter,
  MapPin,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { useReports, RoadDamageReport, ReportStatus } from '../context/ReportsContext';
import { useAuth } from '../context/AuthContext';
import { ReportDetailModal } from '../components/citizen/ReportDetailModal';
import { ReportIssueModal } from '../components/citizen/ReportIssueModal';
import { AuthModal } from '../components/auth/AuthModal';
import { EASE_SWIFT } from '../styles/motion';

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

export const Reports: React.FC = () => {
  const { reports } = useReports();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedReport, setSelectedReport] = useState<RoadDamageReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleCreateReportClick = () => {
    if (isAuthenticated) {
      setIsReportModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (selectedStatus !== 'All' && r.status !== selectedStatus) return false;
      if (selectedSeverity !== 'All' && r.severity !== selectedSeverity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAddress = r.location.address.toLowerCase().includes(q);
        const matchesDesc = r.description.toLowerCase().includes(q);
        const matchesCat = r.category.toLowerCase().includes(q);
        const matchesId = r.id.toLowerCase().includes(q);
        const matchesCitizen = r.citizenName.toLowerCase().includes(q);
        if (!matchesAddress && !matchesDesc && !matchesCat && !matchesId && !matchesCitizen) {
          return false;
        }
      }
      return true;
    });
  }, [reports, selectedStatus, selectedSeverity, searchQuery]);

  return (
    <div className="py-10 md:py-16">
      <div className="wrap">
        {/* Inspection Modal */}
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />

        {/* Auth Modal for Unauthenticated Users who click "Report Road Issue" */}
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode="login"
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            setIsAuthModalOpen(false);
            setIsReportModalOpen(true);
          }}
        />

        {/* Global Report Modal */}
        <ReportIssueModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-xs font-mono text-emerald-400 mb-3 shadow-sm">
              <FileText className="w-3.5 h-3.5" />
              <span>Community & Municipal Incident Ledger</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-white mb-2">
              Citizen Road Incident Reports
            </h1>
            <p className="text-sm sm:text-base text-text-2 max-w-2xl">
              Track reported potholes, cracks, and road hazards across urban corridors. Inspect real-time verification and municipal work-order repair stages.
            </p>
          </div>

          <button
            onClick={handleCreateReportClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber hover:bg-[#c66848] text-white text-xs font-semibold shadow-[0_0_20px_rgba(217,119,87,0.35)] transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Report a Road Issue</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="mb-6 p-4 rounded-2xl border border-line-2 bg-gradient-to-b from-[#13141d]/90 to-[#0e0f14]/90 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by ID, street address, or citizen..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface border border-line text-xs text-text placeholder-text-3 focus:outline-none focus:border-amber transition"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 text-xs font-mono overflow-x-auto">
            <span className="text-text-4 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status:
            </span>
            {['All', 'Submitted', 'Under Review', 'In Progress', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-amber text-white font-semibold shadow-sm'
                    : 'bg-white/[0.04] text-text-3 hover:text-white border border-line'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Dropdown */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-text-4">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-surface border border-line text-xs text-text focus:outline-none focus:border-amber cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Reports Ledger Grid */}
        {filteredReports.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-line bg-surface/40">
            <AlertTriangle className="w-10 h-10 text-amber mx-auto mb-3 opacity-60" />
            <div className="text-base font-semibold text-white">No reports match your filters</div>
            <div className="text-xs text-text-3 mt-1">Try adjusting your search criteria or clear status filters.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_SWIFT }}
                className="rounded-2xl border border-line-2 bg-gradient-to-b from-[#13141d]/90 to-[#0e0f14]/90 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between hover:border-line-3 hover:shadow-2xl transition group"
              >
                <div>
                  {/* Image Preview with Badges */}
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-line bg-black/40 mb-4">
                    <img
                      src={report.imageUrl}
                      alt={report.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/samples/road-pothole-1.jpg';
                      }}
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border backdrop-blur-md ${getStatusBadgeStyle(report.status)}`}>
                        {report.status}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border backdrop-blur-md ${
                          report.severity === 'Critical'
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : report.severity === 'High'
                            ? 'bg-amber/20 text-amber border-amber/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {report.severity}
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-text-3 border border-white/10">
                      {report.id}
                    </div>
                  </div>

                  {/* Title & Category */}
                  <h3 className="text-base font-semibold text-white tracking-tight mb-1">
                    {report.category}
                  </h3>
                  <p className="text-xs text-text-2 line-clamp-2 leading-relaxed mb-4">
                    {report.description}
                  </p>

                  {/* Location & Citizen */}
                  <div className="space-y-1.5 text-xs font-mono text-text-3 pt-3 border-t border-line/60">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-amber shrink-0" />
                      <span className="truncate">{report.location.address}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-text-4">
                      <span>Reported by: {report.citizenName}</span>
                      <span>{report.submittedAt}</span>
                    </div>
                  </div>
                </div>

                {/* Inspect Action */}
                <div className="mt-5 pt-3 border-t border-line/60">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="w-full py-2 rounded-xl bg-surface-2 hover:bg-surface border border-line-2 text-xs font-semibold text-white flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber" />
                    <span>Inspect Lifecycle & Timeline</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
