import React, { useState } from 'react';
import {
  Shield,
  LayoutDashboard,
  FileText,
  Plus,
  LogOut,
  ArrowLeft,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportsContext';
import { CitizenDashboard } from './CitizenDashboard';
import { MyReportsView } from './MyReportsView';
import { ReportIssueModal } from './ReportIssueModal';

interface CitizenPortalProps {
  onBackToHome: () => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({ onBackToHome }) => {
  const { user, logout } = useAuth();
  const { reports } = useReports();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'my-reports'>('dashboard');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col select-none">
      {/* Report Damage Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccessRedirect={() => {
          setActiveTab('my-reports');
        }}
      />

      {/* Top Portal Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0d0e14]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand & Back to Public Site */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition py-1.5 px-2.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.03] cursor-pointer"
              title="Return to RoadGuard AI Landing Page"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Website</span>
              <span className="sm:hidden">Home</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#d97757]/20 border border-[#d97757]/40 flex items-center justify-center text-[#d97757]">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-tight text-white uppercase">
                  RoadGuard <span className="text-[#d97757]">Portal</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400 hidden sm:block">
                  Citizen Reporting Engine
                </span>
              </div>
            </div>
          </div>

          {/* Center: Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-[#d97757] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('my-reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'my-reports'
                  ? 'bg-[#d97757] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>My Reports</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeTab === 'my-reports'
                    ? 'bg-black/40 text-white'
                    : 'bg-white/10 text-neutral-400'
                }`}
              >
                {reports.length}
              </span>
            </button>
          </nav>

          {/* Right: Quick Action & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="hidden md:flex px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#d97757] hover:bg-[#c66848] text-white shadow-[0_0_15px_rgba(217,119,87,0.35)] items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>

            {/* User chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-7 h-7 rounded-full bg-[#d97757]/20 border border-[#d97757]/40 flex items-center justify-center text-xs font-semibold text-[#d97757]">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>

              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-white leading-none">
                  {user?.name || 'Citizen'}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                  Verified Reporter
                </div>
              </div>

              <button
                onClick={logout}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-950/40 hover:text-red-400 border border-white/10 hover:border-red-500/30 flex items-center justify-center text-neutral-400 transition cursor-pointer ml-1"
                title="Log Out of Citizen Account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'dashboard' ? (
          <CitizenDashboard
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onNavigateToMyReports={() => setActiveTab('my-reports')}
          />
        ) : (
          <MyReportsView onOpenReportModal={() => setIsReportModalOpen(true)} />
        )}
      </main>

      {/* Floating Mobile Report Action Button */}
      <div className="md:hidden fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="w-13 h-13 rounded-full bg-[#d97757] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(217,119,87,0.6)] cursor-pointer"
          aria-label="Report a Road Issue"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
