import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  MapPin,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { ReportStatus, DamageCategory, useReports } from '../../context/ReportsContext';
import { SeverityBadge, StatusBadge } from './SeverityBadge';

interface ReportsTableProps {
  onSelectReport: (reportId: string) => void;
  initialStatus?: string;
  searchQuery?: string;
  onQuickVerify?: (reportId: string) => void;
  onQuickReject?: (reportId: string) => void;
}

export const ReportsTable: React.FC<ReportsTableProps> = ({
  onSelectReport,
  initialStatus = 'All',
  searchQuery = '',
  onQuickVerify,
  onQuickReject,
}) => {
  const { reports } = useReports();
  const [search, setSearch] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filtered and sorted reports
  const filtered = useMemo(() => {
    return reports
      .filter((r) => {
        // Status filter
        if (statusFilter !== 'All' && r.status !== statusFilter) return false;
        // Category filter
        if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
        // Severity filter
        if (severityFilter !== 'All' && r.severity !== severityFilter) return false;
        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchId = r.id.toLowerCase().includes(q);
          const matchCat = r.category.toLowerCase().includes(q);
          const matchAddr = r.location.address.toLowerCase().includes(q);
          const matchCitizen = r.citizenName.toLowerCase().includes(q);
          if (!matchId && !matchCat && !matchAddr && !matchCitizen) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.id.localeCompare(b.id);
        }
        return b.id.localeCompare(a.id);
      });
  }, [reports, statusFilter, categoryFilter, severityFilter, search, sortOrder]);

  const CATEGORIES: DamageCategory[] = [
    'Pothole',
    'Alligator Crack',
    'Longitudinal Crack',
    'Transverse Crack',
    'Surface Deterioration',
    'Other',
  ];

  const STATUSES: ReportStatus[] = [
    'Submitted',
    'Under Review',
    'In Progress',
    'Resolved',
    'Rejected',
  ];

  return (
    <div className="space-y-4">
      {/* Control Bar: Search & Multi-filter */}
      <div className="p-4 rounded-2xl bg-[#111218] border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by ID, location, or citizen..."
              className="w-full bg-[#0d0e14] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757]/60 font-mono transition"
            />
          </div>

          {/* Quick Stats & Sort toggle */}
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <span>
              Showing <strong className="text-white">{filtered.length}</strong> of{' '}
              <strong className="text-white">{reports.length}</strong>
            </span>
            <button
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-neutral-300 text-xs transition cursor-pointer"
            >
              <ArrowUpDown className="w-3 h-3 text-[#d97757]" />
              <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns & Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-mono mr-1">
            <Filter className="w-3.5 h-3.5 text-[#d97757]" />
            <span>Filters:</span>
          </div>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0d0e14] border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-300 font-mono text-[11px] focus:outline-none focus:border-[#d97757]"
          >
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Category Select */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0d0e14] border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-300 font-mono text-[11px] focus:outline-none focus:border-[#d97757]"
          >
            <option value="All">All Defect Types</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Severity Select */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#0d0e14] border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-300 font-mono text-[11px] focus:outline-none focus:border-[#d97757]"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Clear Filters Button */}
          {(statusFilter !== 'All' || categoryFilter !== 'All' || severityFilter !== 'All' || search) && (
            <button
              onClick={() => {
                setStatusFilter('All');
                setCategoryFilter('All');
                setSeverityFilter('All');
                setSearch('');
              }}
              className="text-[11px] text-[#d97757] hover:underline ml-auto font-mono"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Reports Table Container */}
      <div className="rounded-2xl border border-white/10 bg-[#111218] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d0e14] border-b border-white/10 font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Photo</th>
                <th className="py-3 px-4">Distress Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Citizen Submitter</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <AlertTriangle className="w-8 h-8 text-neutral-600 mx-auto" />
                      <p className="text-sm font-semibold text-neutral-300">No Road Reports Found</p>
                      <p className="text-xs text-neutral-400">
                        Try modifying search parameters or clearing filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-white/[0.03] transition group"
                  >
                    {/* Report ID */}
                    <td className="py-3 px-4 font-mono font-medium text-white whitespace-nowrap">
                      <button
                        onClick={() => onSelectReport(report.id)}
                        className="text-[#d97757] hover:underline font-bold"
                      >
                        {report.id}
                      </button>
                    </td>

                    {/* Image Thumbnail */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => onSelectReport(report.id)}
                        className="w-12 h-9 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 cursor-pointer group-hover:border-[#d97757]/50 transition"
                      >
                        <img
                          src={report.imageUrl}
                          alt={report.category}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 font-medium text-white whitespace-nowrap">
                      {report.category}
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <SeverityBadge severity={report.severity} />
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="flex items-start gap-1 text-neutral-300 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#d97757] shrink-0 mt-0.5" />
                        <span className="truncate" title={report.location.address}>
                          {report.location.address}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-neutral-400 pl-4.5">
                        {report.location.latitude.toFixed(4)}°, {report.location.longitude.toFixed(4)}°
                      </div>
                    </td>

                    {/* Citizen Submitter */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-white font-medium">{report.citizenName}</div>
                      <div className="text-[10px] font-mono text-neutral-400">{report.citizenId}</div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 font-mono text-neutral-400 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        <span>{report.submittedAt}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={report.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* View Button */}
                        <button
                          onClick={() => onSelectReport(report.id)}
                          title="Inspect Detailed Report"
                          className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Quick Verify (if submitted) */}
                        {report.status === 'Submitted' && (
                          <button
                            onClick={() => onQuickVerify && onQuickVerify(report.id)}
                            title="Verify Report and Classify"
                            className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Quick Reject */}
                        {report.status !== 'Rejected' && report.status !== 'Resolved' && (
                          <button
                            onClick={() => onQuickReject && onQuickReject(report.id)}
                            title="Reject Report"
                            className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
