import React, { useState } from 'react';
import {
  HardHat,
  LogOut,
  Star,
  ShieldCheck,
  Home,
} from 'lucide-react';
import { Maintainer, maintainerLogout } from '../../services/maintainerService';
import { MyAssignedTasksView } from '../../components/maintainer/MyAssignedTasksView';
import { useReports } from '../../context/ReportsContext';

interface MaintainerPortalProps {
  maintainerUser: Maintainer;
  onLogout: () => void;
  onBackToHome: () => void;
}

export const MaintainerPortal: React.FC<MaintainerPortalProps> = ({
  maintainerUser,
  onLogout,
  onBackToHome,
}) => {
  const { reports } = useReports();
  const [activeTab, setActiveTab] = useState<'tasks' | 'profile'>('tasks');

  const myTasks = reports.filter(
    (r) =>
      r.assignedMaintainerId === maintainerUser.id ||
      r.assignedCrew?.toLowerCase().includes(maintainerUser.name.toLowerCase().split(' ')[0]) ||
      r.assignedDepartment === 'Rapid Patch Division'
  );

  const activeCount = myTasks.filter((t) => t.status !== 'Resolved' && t.status !== 'Rejected').length;
  const completedCount = myTasks.filter((t) => t.status === 'Resolved').length;

  const handleLogoutClick = () => {
    maintainerLogout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-text flex flex-col antialiased selection:bg-[#d97757] selection:text-white select-none">
      {/* Top Maintainer Navbar */}
      <header className="sticky top-0 z-40 bg-[#0d0e14]/90 border-b border-white/10 backdrop-blur-xl px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#d97757]/10 text-[#d97757] border border-[#d97757]/20">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm sm:text-base">RoadGuard</span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#d97757]/20 text-[#d97757] border border-[#d97757]/30">
                Maintainer Field Portal
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono hidden sm:block">
              {maintainerUser.department} · Stationed Crew
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition"
            title="Public Site"
          >
            <Home className="w-4 h-4" />
          </button>

          {/* User Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d97757] to-amber-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {maintainerUser.name.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-white">{maintainerUser.name}</div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ON DUTY</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-neutral-400 hover:text-red-400 transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Profile / Workload Banner */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#111218] via-[#161720] to-[#111218] border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Welcome back, {maintainerUser.name}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{maintainerUser.rating.toFixed(1)} Rating</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Department: <span className="text-white font-medium">{maintainerUser.department}</span> · ID: <span className="font-mono text-neutral-400">{maintainerUser.id}</span>
            </p>
          </div>

          {/* KPI Metric Pills */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-[#07080b] border border-white/10 text-center">
              <span className="text-[10px] font-mono text-neutral-400 uppercase block">Active Tasks</span>
              <span className="text-lg font-bold text-amber-400 font-mono">{activeCount}</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-[#07080b] border border-white/10 text-center">
              <span className="text-[10px] font-mono text-neutral-400 uppercase block">Verified Repairs</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {Math.max(maintainerUser.completed_tasks_count, completedCount)}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono transition ${
              activeTab === 'tasks'
                ? 'bg-[#d97757] text-white shadow-lg shadow-[#d97757]/20'
                : 'text-neutral-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            My Assigned Tasks ({myTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono transition ${
              activeTab === 'profile'
                ? 'bg-[#d97757] text-white shadow-lg shadow-[#d97757]/20'
                : 'text-neutral-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            Technician Profile & Stats
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'tasks' ? (
          <MyAssignedTasksView
            maintainerId={maintainerUser.id}
            maintainerName={maintainerUser.name}
          />
        ) : (
          <div className="p-6 rounded-3xl bg-[#111218] border border-white/10 space-y-6">
            <h3 className="text-base font-bold text-white">Technician Profile & Station Assignment</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-[#07080b] border border-white/10 space-y-1">
                <span className="text-neutral-500 uppercase text-[10px]">EMPLOYEE NAME</span>
                <div className="text-sm font-bold text-white">{maintainerUser.name}</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#07080b] border border-white/10 space-y-1">
                <span className="text-neutral-500 uppercase text-[10px]">OFFICIAL EMAIL</span>
                <div className="text-sm font-bold text-neutral-300">{maintainerUser.email}</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#07080b] border border-white/10 space-y-1">
                <span className="text-neutral-500 uppercase text-[10px]">CONTACT PHONE</span>
                <div className="text-sm font-bold text-neutral-300">
                  {maintainerUser.phone || '+1 (555) 234-5678'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#07080b] border border-white/10 space-y-1">
                <span className="text-neutral-500 uppercase text-[10px]">DEPARTMENT DIVISION</span>
                <div className="text-sm font-bold text-[#d97757]">{maintainerUser.department}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Authorized AI Repair Verification Authority</span>
              </div>
              <p className="text-[11px] text-emerald-400/80">
                This credential is cryptographically authorized to execute on-site visual defect verification and register compacted hot-mix asphalt sign-offs.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
