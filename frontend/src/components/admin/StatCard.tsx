import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: string;
  isAlert?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = '#d97757',
  isAlert = false,
}) => {
  return (
    <div className="relative p-5 rounded-2xl bg-[#111218] border border-white/10 hover:border-white/15 transition-all shadow-md overflow-hidden group">
      {/* Glow on hover */}
      <div
        className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition pointer-events-none"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between">
        <span className="text-[11px] font-mono uppercase text-neutral-400 tracking-wider">
          {title}
        </span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center border transition"
          style={{
            backgroundColor: `${accentColor}15`,
            borderColor: `${accentColor}30`,
            color: accentColor,
          }}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2.5 mt-3">
        <span
          className={`text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono ${
            isAlert ? 'text-red-400' : ''
          }`}
        >
          {value}
        </span>
        {trend && (
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              trend.isPositive
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-950/60 text-red-400 border border-red-500/30'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-[11px] text-neutral-400 mt-1.5">{subtitle}</p>}
    </div>
  );
};
