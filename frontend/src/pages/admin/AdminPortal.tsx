import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Cpu,
  History,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { AdminNavbar } from '../../components/admin/AdminNavbar';
import { AdminSidebar, AdminTab } from '../../components/admin/AdminSidebar';
import { StatCard } from '../../components/admin/StatCard';
import { MonthlyTrendChart, CategoryPieChart } from '../../components/admin/AdminCharts';
import { ReportsTable } from '../../components/admin/ReportsTable';
import { ReportDetailsModal } from '../../components/admin/ReportDetailsModal';
import { AdminMap } from '../../components/admin/AdminMap';
import { PendingReviewView } from '../../components/admin/PendingReviewView';
import { DuplicateReviewView } from '../../components/admin/DuplicateReviewView';
import { MaintainersView } from '../../components/admin/MaintainersView';
import { AnalyticsView } from '../../components/admin/AnalyticsView';
import { CitizensView } from '../../components/admin/CitizensView';
import { SettingsView } from '../../components/admin/SettingsView';
import { SeverityBadge, StatusBadge } from '../../components/admin/SeverityBadge';
import { useReports } from '../../context/ReportsContext';
import { AdminUser } from '../../data/adminDemoData';
import { getAdminAuditLogs, adminLogout } from '../../services/adminService';

interface AdminPortalProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onBackToHome: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  adminUser,
  onLogout,
  onBackToHome,
}) => {
  const { reports, stats, updateReportStatus } = useReports();
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = (path: string): AdminTab => {
    const segment = path.replace(/^\/admin\/?/, '').split('/')[0]?.toLowerCase();
    if (segment === 'reports') return 'reports';
    if (segment === 'pending') return 'pending';
    if (segment === 'duplicates') return 'duplicates';
    if (segment === 'maintainers') return 'maintainers';
    if (segment === 'map') return 'map';
    if (segment === 'analytics') return 'analytics';
    if (segment === 'citizens') return 'citizens';
    if (segment === 'settings') return 'settings';
    return 'overview';
  };

  const activeTab = getTabFromPath(location.pathname);

  const handleSelectTab = (tab: AdminTab) => {
    setGlobalSearch('');
    navigate(`/admin/${tab}`);
  };

  // Redirect legacy /admin/detection or /admin directly
  useEffect(() => {
    const segment = location.pathname.replace(/^\/admin\/?/, '').split('/')[0]?.toLowerCase();
    if (segment === 'detection') {
      navigate('/admin/pending', { replace: true });
    }
  }, [location.pathname, navigate]);

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const auditLogs = getAdminAuditLogs();
  const criticalReports = reports.filter((r) => r.severity === 'Critical');

  const handleQuickVerify = (reportId: string) => {
    updateReportStatus(reportId, 'Under Review', 'Verified by Municipal Road Inspector via Quick Action.');
  };

  const handleQuickReject = (reportId: string) => {
    // Open the report details modal where the mandatory rejection reason dialog is handled cleanly
    setSelectedReportId(reportId);
  };

  const handleLogout = () => {
    adminLogout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-text flex flex-col antialiased selection:bg-[#d97757] selection:text-white">
      {/* Top Navbar */}
      <AdminNavbar
        adminUser={adminUser}
        onLogout={handleLogout}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onSearch={(query) => {
          setGlobalSearch(query);
          if (query && activeTab === 'overview') {
            handleSelectTab('reports');
          }
        }}
        onSelectReport={(id) => setSelectedReportId(id)}
      />

      {/* Main Layout: Sidebar + View Content */}
      <div className="flex-1 flex w-full">
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onBackToHome={onBackToHome}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-[#111218] via-[#151622] to-[#111218] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                      Municipal Command Active · {adminUser.department}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Welcome back, {adminUser.name}
                  </h1>
                  <p className="text-xs text-neutral-400">
                    Badge #{adminUser.badgeNumber} · {criticalReports.length} critical hazard alerts currently requiring response coordination.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectTab('pending')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d97757] hover:bg-[#c66848] text-white text-xs font-semibold shadow-md transition cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Review Pending ({stats.submitted})</span>
                  </button>
                  <button
                    onClick={() => handleSelectTab('map')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition cursor-pointer"
                  >
                    <span>View Damage Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 6 Key Performance Metric StatCards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <StatCard
                  title="Total Reports"
                  value={reports.length}
                  icon={FileText}
                  accentColor="#3b82f6"
                  trend={{ value: '+12% wk', isPositive: true }}
                />
                <StatCard
                  title="Pending Review"
                  value={stats.submitted}
                  icon={Clock}
                  accentColor="#d97757"
                  isAlert={stats.submitted > 0}
                />
                <StatCard
                  title="In Progress"
                  value={stats.inProgress}
                  icon={RefreshCw}
                  accentColor="#f59e0b"
                />
                <StatCard
                  title="Resolved"
                  value={stats.resolved}
                  icon={CheckCircle2}
                  accentColor="#10b981"
                  trend={{ value: '88% SLA', isPositive: true }}
                />
                <StatCard
                  title="Critical Hazards"
                  value={criticalReports.length}
                  icon={AlertTriangle}
                  accentColor="#ef4444"
                  isAlert={criticalReports.length > 0}
                />
                <StatCard
                  title="AI Accuracy"
                  value="94.2%"
                  icon={Cpu}
                  accentColor="#a855f7"
                  trend={{ value: 'mAP@50', isPositive: true }}
                />
              </div>

              {/* Analytics Visualization Previews */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-5 rounded-3xl bg-[#111218] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#d97757]" />
                      <span>Monthly Incident & Resolution Velocity</span>
                    </h3>
                    <button
                      onClick={() => handleSelectTab('analytics')}
                      className="text-xs font-mono text-[#d97757] hover:underline"
                    >
                      Deep Analytics →
                    </button>
                  </div>
                  <MonthlyTrendChart height={240} />
                </div>

                <div className="p-5 rounded-3xl bg-[#111218] border border-white/10 space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
                    <span>Defect Classification Breakdown</span>
                  </h3>
                  <CategoryPieChart height={240} />
                </div>
              </div>

              {/* Recent Reports Quick Inspection & Live Audit Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Reports (2 cols) */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                      Recent Road Incident Reports
                    </h3>
                    <button
                      onClick={() => handleSelectTab('reports')}
                      className="text-xs font-mono text-[#d97757] hover:underline"
                    >
                      View All Reports ({reports.length}) →
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#111218] overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#0d0e14] border-b border-white/10 font-mono text-[11px] text-neutral-400 uppercase">
                          <tr>
                            <th className="py-2.5 px-4">ID</th>
                            <th className="py-2.5 px-4">Defect</th>
                            <th className="py-2.5 px-4">Severity</th>
                            <th className="py-2.5 px-4">Location</th>
                            <th className="py-2.5 px-4">Status</th>
                            <th className="py-2.5 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {reports.slice(0, 5).map((r) => (
                            <tr key={r.id} className="hover:bg-white/[0.02]">
                              <td className="py-3 px-4 font-mono font-bold text-white">
                                <button
                                  onClick={() => setSelectedReportId(r.id)}
                                  className="text-[#d97757] hover:underline"
                                >
                                  {r.id}
                                </button>
                              </td>
                              <td className="py-3 px-4 font-medium text-white">{r.category}</td>
                              <td className="py-3 px-4">
                                <SeverityBadge severity={r.severity} />
                              </td>
                              <td className="py-3 px-4 text-neutral-400 truncate max-w-[180px]">
                                {r.location.address}
                              </td>
                              <td className="py-3 px-4">
                                <StatusBadge status={r.status} />
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => setSelectedReportId(r.id)}
                                  className="text-xs text-neutral-300 hover:text-white font-mono underline"
                                >
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Live Audit Log (1 col) */}
                <div className="p-5 rounded-3xl bg-[#111218] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
                      <History className="w-4 h-4 text-[#d97757]" />
                      <span>Live Audit Feed</span>
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-500">REALTIME</span>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {auditLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-[#0d0e14] border border-white/5 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{log.action}</span>
                          <span className="text-[10px] font-mono text-neutral-500">{log.timestamp}</span>
                        </div>
                        <div className="text-[11px] font-mono text-[#d97757]">
                          Ticket: {log.reportId} · by {log.adminName}
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-snug">{log.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL REPORTS TABLE */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    All Road Incident Reports
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Comprehensive ledger of citizen and telematics road defect records.
                  </p>
                </div>
              </div>

              <ReportsTable
                onSelectReport={(id) => setSelectedReportId(id)}
                searchQuery={globalSearch}
                onQuickVerify={handleQuickVerify}
                onQuickReject={handleQuickReject}
              />
            </div>
          )}

          {/* TAB 3: PENDING REVIEW WITH AI DETECTION STUDIO */}
          {activeTab === 'pending' && (
            <PendingReviewView
              onSelectReport={(id) => setSelectedReportId(id)}
              searchQuery={globalSearch}
            />
          )}

          {/* TAB 4: SUSPECTED DUPLICATE REVIEWS */}
          {activeTab === 'duplicates' && (
            <DuplicateReviewView
              onSelectReport={(id) => setSelectedReportId(id)}
              searchQuery={globalSearch}
            />
          )}

          {/* TAB: MAINTAINER MANAGEMENT & DISPATCH */}
          {activeTab === 'maintainers' && (
            <MaintainersView onSelectReport={(id) => setSelectedReportId(id)} />
          )}

          {/* TAB 5: ROAD DAMAGE MAP */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Interactive Road Defect GIS Map
                </h2>
                <p className="text-xs text-neutral-400">
                  Geographical visualization of reported potholes, alligator cracks, and pavement hazards.
                </p>
              </div>
              <AdminMap onSelectReport={(id) => setSelectedReportId(id)} />
            </div>
          )}

          {/* TAB 6: INFRASTRUCTURE ANALYTICS */}
          {activeTab === 'analytics' && <AnalyticsView />}

          {/* TAB 7: CITIZEN DIRECTORY */}
          {activeTab === 'citizens' && (
            <CitizensView onSelectReport={(id) => setSelectedReportId(id)} />
          )}

          {/* TAB 8: MUNICIPAL SETTINGS */}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Detailed Report Modal */}
      {selectedReportId && (
        <ReportDetailsModal
          reportId={selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      )}
    </div>
  );
};
