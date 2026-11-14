import React, { useState } from 'react';
import {
  MapPin,
  CheckCircle2,
  Navigation,
  Camera,
  Wrench,
  Calendar,
  Search,
} from 'lucide-react';
import { RoadDamageReport, useReports } from '../../context/ReportsContext';
import { StatusBadge } from '../admin/SeverityBadge';
import { startRepairWork, AIRepairVerificationResult } from '../../services/maintainerService';
import { RepairCameraCapture } from './RepairCameraCapture';

interface MyAssignedTasksViewProps {
  maintainerId: string;
  maintainerName: string;
}

export const MyAssignedTasksView: React.FC<MyAssignedTasksViewProps> = ({
  maintainerId,
  maintainerName,
}) => {
  const { reports } = useReports();
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'NEEDS_REVIEW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Active camera modal state
  const [activeCameraReport, setActiveCameraReport] = useState<RoadDamageReport | null>(null);

  // Match tasks assigned to this maintainer, or demo tasks if empty
  const assignedReports = reports.filter(
    (r) =>
      r.assignedMaintainerId === maintainerId ||
      r.assignedCrew?.toLowerCase().includes(maintainerName.toLowerCase().split(' ')[0]) ||
      r.assignedDepartment === 'Rapid Patch Division'
  );

  const filteredTasks = assignedReports.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.address.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'COMPLETED') {
      return r.status === 'Resolved' || r.currentStage === 'Closed';
    }
    if (filter === 'IN_PROGRESS') {
      return r.status === 'In Progress' || r.currentStage === 'Repair in progress';
    }
    if (filter === 'NEEDS_REVIEW') {
      return r.aiVerificationStatus === 'NEEDS_REVIEW' || r.status === 'Under Review';
    }
    return true;
  });

  const handleStartWork = async (reportId: string) => {
    try {
      await startRepairWork(reportId, maintainerId);
      // Update local report
      const r = reports.find((item) => item.id === reportId);
      if (r) {
        r.status = 'In Progress';
        r.currentStage = 'Repair in progress';
        r.repairStartedAt = new Date().toISOString();
      }
      alert('Repair work initiated! Proceed with surface remediation.');
    } catch {
      alert('Repair work marked in progress locally.');
    }
  };

  const handleVerificationDone = (result: AIRepairVerificationResult) => {
    if (activeCameraReport) {
      activeCameraReport.aiVerificationStatus = result.verificationStatus;
      activeCameraReport.aiVerificationReport = result;
      if (result.verificationStatus === 'VERIFIED') {
        activeCameraReport.status = 'Resolved';
        activeCameraReport.currentStage = 'Closed';
      } else if (result.verificationStatus === 'REJECTED') {
        activeCameraReport.status = 'In Progress';
        activeCameraReport.currentStage = 'Reopened';
      } else {
        activeCameraReport.status = 'Under Review';
        activeCameraReport.currentStage = 'Final verification';
      }
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#111218] border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search assigned work orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#07080b] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'IN_PROGRESS', 'NEEDS_REVIEW', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition ${
                filter === tab
                  ? 'bg-[#d97757] text-white shadow-md'
                  : 'bg-[#07080b] border border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              {tab === 'ALL'
                ? 'All Tasks'
                : tab === 'IN_PROGRESS'
                ? 'In Progress'
                : tab === 'NEEDS_REVIEW'
                ? 'Needs QA Review'
                : 'Resolved'}
            </button>
          ))}
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-16 text-center text-neutral-500 rounded-3xl border border-white/10 bg-[#111218]">
            <CheckCircle2 className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
            <h4 className="text-sm font-semibold text-white">No Assigned Work Orders</h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              You are all caught up! When municipal administration dispatches new road hazard tasks, they will appear here.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${task.location.latitude},${task.location.longitude}`;

            return (
              <div
                key={task.id}
                className="p-5 rounded-3xl bg-[#111218] border border-white/10 space-y-4 hover:border-white/20 transition-all shadow-xl flex flex-col justify-between"
              >
                {/* Header Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
                        {task.id}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          task.assignmentPriority === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : task.assignmentPriority === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                        }`}
                      >
                        {task.assignmentPriority || 'MEDIUM'} PRIORITY
                      </span>
                    </div>

                    <StatusBadge status={task.status} />
                  </div>

                  {/* Thumbnail & Defect Details */}
                  <div className="flex gap-3">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-black shrink-0 relative">
                      <img
                        src={task.imageUrl}
                        alt="Hazard"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/80 text-[8px] font-mono text-white">
                        {task.category}
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">
                        {task.category} Defect
                      </h4>
                      <p className="text-xs text-neutral-400 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#d97757] shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{task.location.address}</span>
                      </p>
                      {task.targetCompletionDate && (
                        <p className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Deadline: {task.targetCompletionDate}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Admin Instructions if present */}
                  {task.adminInstructions && (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-neutral-300">
                      <span className="font-mono text-[9px] uppercase text-neutral-500 block mb-0.5">
                        DISPATCH INSTRUCTIONS:
                      </span>
                      {task.adminInstructions}
                    </div>
                  )}

                  {/* AI Verification Status Badge if exists */}
                  {task.aiVerificationStatus && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5 text-xs font-mono">
                      <span className="text-neutral-400">AI Verification:</span>
                      <span
                        className={`font-bold ${
                          task.aiVerificationStatus === 'VERIFIED'
                            ? 'text-emerald-400'
                            : task.aiVerificationStatus === 'REJECTED'
                            ? 'text-red-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {task.aiVerificationStatus}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition flex items-center gap-1.5 text-xs font-medium"
                    title="Open in Google Maps Navigation"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Navigate</span>
                  </a>

                  {task.status !== 'Resolved' && task.currentStage !== 'Closed' && (
                    <>
                      {task.currentStage !== 'Repair in progress' && (
                        <button
                          onClick={() => handleStartWork(task.id)}
                          className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 transition flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Start Repair</span>
                        </button>
                      )}

                      <button
                        onClick={() => setActiveCameraReport(task)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#d97757] hover:bg-[#c26244] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#d97757]/20 transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Camera AI Verify</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Camera Capture Modal */}
      {activeCameraReport && (
        <RepairCameraCapture
          report={activeCameraReport}
          maintainerId={maintainerId}
          onClose={() => setActiveCameraReport(null)}
          onVerificationComplete={handleVerificationDone}
        />
      )}
    </div>
  );
};
