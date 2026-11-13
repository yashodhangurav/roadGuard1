import React from 'react';
import { Severity } from '../../services/detectionApi';
import { ReportStatus } from '../../context/ReportsContext';

interface SeverityBadgeProps {
  severity: Severity | 'Low' | 'Medium' | 'High' | 'Critical';
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = '' }) => {
  const getStyles = () => {
    switch (severity) {
      case 'Critical':
        return 'text-red-400 bg-red-950/50 border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.25)]';
      case 'High':
        return 'text-[#d97757] bg-[#d97757]/15 border-[#d97757]/40 shadow-[0_0_8px_rgba(217,119,87,0.25)]';
      case 'Medium':
        return 'text-amber-300 bg-amber-950/40 border-amber-500/40';
      default:
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider border ${getStyles()} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          severity === 'Critical'
            ? 'bg-red-400 animate-pulse'
            : severity === 'High'
            ? 'bg-[#d97757]'
            : severity === 'Medium'
            ? 'bg-amber-400'
            : 'bg-emerald-400'
        }`}
      />
      <span>{severity}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ReportStatus | string; className?: string }> = ({
  status,
  className = '',
}) => {
  const getStyles = () => {
    switch (status) {
      case 'Submitted':
        return 'bg-blue-950/50 border-blue-500/40 text-blue-300';
      case 'Under Review':
        return 'bg-purple-950/50 border-purple-500/40 text-purple-300';
      case 'In Progress':
        return 'bg-[#d97757]/15 border-[#d97757]/40 text-[#d97757]';
      case 'Resolved':
        return 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300';
      case 'Rejected':
        return 'bg-red-950/50 border-red-500/40 text-red-300';
      default:
        return 'bg-neutral-800 border-neutral-700 text-neutral-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${getStyles()} ${className}`}
    >
      {status}
    </span>
  );
};
