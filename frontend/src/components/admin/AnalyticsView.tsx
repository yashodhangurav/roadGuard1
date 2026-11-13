import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  Layers,
  MapPin,
} from 'lucide-react';
import {
  MonthlyTrendChart,
  CategoryPieChart,
  SeverityBarChart,
  DistrictDensityChart,
} from './AdminCharts';
import { StatCard } from './StatCard';
import { useReports } from '../../context/ReportsContext';

export const AnalyticsView: React.FC = () => {
  const { reports } = useReports();
  const [dateRange, setDateRange] = useState('Last 6 Months');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportCSV = () => {
    // Generate CSV string
    const headers = ['Report ID', 'Category', 'Severity', 'Status', 'Address', 'Latitude', 'Longitude', 'Citizen', 'Submitted At'];
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
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `roadguard_infrastructure_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Header */}
      <div className="p-5 rounded-3xl bg-[#111218] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-white">Municipal Infrastructure Analytics</h3>
          <p className="text-xs text-neutral-400 mt-1">
            Corridor defect velocity, pavement degradation rates, and municipal repair turnaround metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-[#0d0e14] border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-300 font-mono focus:outline-none focus:border-[#d97757]"
          >
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 90 Days">Last 90 Days</option>
            <option value="Last 6 Months">Last 6 Months</option>
            <option value="Year to Date">Year to Date (2026)</option>
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#d97757]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Export Confirmation */}
      {downloadSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Road damage telemetry spreadsheet generated and downloaded successfully.</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Road Defects"
          value={reports.length + 420}
          subtitle="+14% vs previous quarter"
          icon={Layers}
          accentColor="#d97757"
          trend={{ value: '14.2%', isPositive: true }}
        />
        <StatCard
          title="Mean Time To Resolve"
          value="2.3 Days"
          subtitle="48h SLA on Critical defects"
          icon={Clock}
          accentColor="#10b981"
          trend={{ value: '-0.8d', isPositive: true }}
        />
        <StatCard
          title="Resolution Rate"
          value="88.4%"
          subtitle="378 of 427 work orders"
          icon={CheckCircle2}
          accentColor="#3b82f6"
          trend={{ value: '4.1%', isPositive: true }}
        />
        <StatCard
          title="Pavement Index (PCI)"
          value="72 / 100"
          subtitle="Municipal Roadway Rating: Good"
          icon={TrendingUp}
          accentColor="#f59e0b"
          trend={{ value: '+2 pts', isPositive: true }}
        />
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Incident Velocity Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-[#111218] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#d97757]" />
              <span>Report Velocity vs Resolution Trends</span>
            </h4>
            <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d97757]" /> Submitted
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Resolved
              </span>
            </div>
          </div>
          <MonthlyTrendChart height={280} />
        </div>

        {/* Defect Category Breakdown Pie (1 col) */}
        <div className="p-5 rounded-3xl bg-[#111218] border border-white/10 space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#d97757]" />
            <span>Defect Category Share</span>
          </h4>
          <CategoryPieChart height={280} />
        </div>
      </div>

      {/* Secondary Charts Row: Severity Distribution & District Density */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Histogram */}
        <div className="p-5 rounded-3xl bg-[#111218] border border-white/10 space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#d97757]" />
            <span>Severity Distribution</span>
          </h4>
          <SeverityBarChart height={240} />
        </div>

        {/* District Density & Response Times */}
        <div className="p-5 rounded-3xl bg-[#111218] border border-white/10 space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#d97757]" />
            <span>District Density & Response Times</span>
          </h4>
          <DistrictDensityChart height={240} />
        </div>
      </div>
    </div>
  );
};
