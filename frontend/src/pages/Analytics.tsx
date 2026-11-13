import React, { useState } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  MapPin,
  FileSpreadsheet,
  Activity,
} from 'lucide-react';
import {
  MonthlyTrendChart,
  DistrictDensityChart,
  CategoryPieChart,
  SeverityBarChart,
} from '../components/admin/AdminCharts';
import { useReports } from '../context/ReportsContext';
import { DISTRICT_DENSITY } from '../data/adminDemoData';

export const Analytics: React.FC = () => {
  const { reports } = useReports();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportCSV = () => {
    const headers = [
      'Report ID',
      'Category',
      'Severity',
      'Status',
      'Address',
      'Latitude',
      'Longitude',
      'Citizen Reporter',
      'Submitted At',
    ];

    const rows = reports.map((r) => [
      r.id,
      r.category,
      r.severity,
      r.status,
      `"${r.location.address}"`,
      r.location.latitude,
      r.location.longitude,
      `"${r.citizenName}"`,
      `"${r.submittedAt}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `roadguard_infrastructure_telemetry_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <div className="py-10 md:py-16">
      <div className="wrap">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber/40 bg-amber/10 text-xs font-mono text-amber mb-3 shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Infrastructure Performance Telemetry</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-white mb-2">
              Municipal Infrastructure Analytics
            </h1>
            <p className="text-sm sm:text-base text-text-2 max-w-2xl">
              Turnaround velocity, Mean Time to Repair (MTTR), incident resolution ratios, and district roadway hazard densities.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-mono font-semibold transition cursor-pointer shrink-0 shadow-sm ${
              downloadSuccess
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-surface hover:bg-surface-2 border-line-2 text-white'
            }`}
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Telemetry CSV Exported!</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-amber" />
                <span>Export Municipal CSV</span>
              </>
            )}
          </button>
        </div>

        {/* Top 4 Performance KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="p-5 rounded-2xl border border-line-2 bg-gradient-to-b from-[#14151e]/90 to-[#0e0f14]/90 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono text-text-3 mb-2">
              <span>Mean Time to Repair</span>
              <Clock className="w-4 h-4 text-amber" />
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              2.4 <span className="text-sm text-text-3 font-normal">Days</span>
            </div>
            <div className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <span>↓ 18%</span>
              <span className="text-text-4">vs previous quarter</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-line-2 bg-gradient-to-b from-[#14151e]/90 to-[#0e0f14]/90 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono text-text-3 mb-2">
              <span>Resolution Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              89.2%
            </div>
            <div className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <span>↑ 6.4%</span>
              <span className="text-text-4">98 of 112 addressed</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-line-2 bg-gradient-to-b from-[#14151e]/90 to-[#0e0f14]/90 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono text-text-3 mb-2">
              <span>Dispatched Crews</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              14 <span className="text-sm text-text-3 font-normal">Active</span>
            </div>
            <div className="text-xs text-blue-400 font-mono">
              3 Rapid Patch response units
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-line-2 bg-gradient-to-b from-[#14151e]/90 to-[#0e0f14]/90 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono text-text-3 mb-2">
              <span>Monitored Corridors</span>
              <MapPin className="w-4 h-4 text-amber" />
            </div>
            <div className="text-3xl font-bold font-mono text-white mb-1">
              342 <span className="text-sm text-text-3 font-normal">Miles</span>
            </div>
            <div className="text-xs text-text-3 font-mono">
              5 urban transit sectors
            </div>
          </div>
        </div>

        {/* Charts Row: Monthly Trend & District Density */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Monthly Trend Area Chart */}
          <div className="rounded-2xl border border-line-2 bg-gradient-to-b from-[#13141d]/90 to-[#0e0f14]/90 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Defect Submissions vs. Repairs
                </h3>
                <p className="text-xs text-text-3 font-mono mt-0.5">
                  6-month municipal work-order velocity
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-amber">
                  <span className="w-2 h-2 rounded-full bg-amber" /> Submitted
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Resolved
                </span>
              </div>
            </div>

            <MonthlyTrendChart height={280} />
          </div>

          {/* District Density Bar Chart */}
          <div className="rounded-2xl border border-line-2 bg-gradient-to-b from-[#13141d]/90 to-[#0e0f14]/90 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  District Defect Density
                </h3>
                <p className="text-xs text-text-3 font-mono mt-0.5">
                  Incidents logged per municipal zone
                </p>
              </div>
            </div>

            <DistrictDensityChart height={280} />
          </div>
        </div>

        {/* Secondary Charts: Defect Distribution & Severity Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="rounded-2xl border border-line-2 bg-gradient-to-b from-[#13141d]/90 to-[#0e0f14]/90 backdrop-blur-xl p-6 shadow-xl">
            <h3 className="text-base font-semibold text-white tracking-tight mb-1">
              Defect Classification Ratios
            </h3>
            <p className="text-xs text-text-3 font-mono mb-4">
              Proportion of pavement distress across surveyed corridors
            </p>
            <CategoryPieChart height={240} />
          </div>

          <div className="rounded-2xl border border-line-2 bg-gradient-to-b from-[#13141d]/90 to-[#0e0f14]/90 backdrop-blur-xl p-6 shadow-xl">
            <h3 className="text-base font-semibold text-white tracking-tight mb-1">
              Urgency & Severity Profiling
            </h3>
            <p className="text-xs text-text-3 font-mono mb-4">
              Active backlog sorted by civil infrastructure impact
            </p>
            <SeverityBarChart height={240} />
          </div>
        </div>

        {/* District Detail Table */}
        <div className="rounded-2xl border border-line-2 bg-gradient-to-b from-[#13141d]/90 to-[#0e0f14]/90 backdrop-blur-xl p-6 shadow-xl overflow-hidden">
          <h3 className="text-base font-semibold text-white tracking-tight mb-1">
            District Performance Breakdown
          </h3>
          <p className="text-xs text-text-3 font-mono mb-5">
            Zone-by-zone incident totals and average resolution turnaround times
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-line text-text-4 uppercase text-[11px]">
                  <th className="pb-3 font-semibold">Municipal District</th>
                  <th className="pb-3 font-semibold">Total Hazards</th>
                  <th className="pb-3 font-semibold">Avg. Resolution Time</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {DISTRICT_DENSITY.map((d) => (
                  <tr key={d.district} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 text-white font-sans font-medium">{d.district}</td>
                    <td className="py-3.5 text-text-2">{d.reports} reports</td>
                    <td className="py-3.5 text-amber">{d.avgResolutionDays} days</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Optimal</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
