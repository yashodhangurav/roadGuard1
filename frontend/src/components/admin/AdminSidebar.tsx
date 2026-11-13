import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Clock,
  Scan,
  Map,
  BarChart3,
  Users,
  Settings,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useReports } from '../../context/ReportsContext';

export type AdminTab =
  | 'overview'
  | 'reports'
  | 'pending'
  | 'detection'
  | 'map'
  | 'analytics'
  | 'citizens'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onBackToHome: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  onBackToHome,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { reports, stats } = useReports();

  const NAV_ITEMS: {
    id: AdminTab;
    label: string;
    icon: any;
    count?: number;
    badgeColor?: string;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'reports', label: 'All Reports', icon: FileText, count: reports.length },
    {
      id: 'pending',
      label: 'Pending Review',
      icon: Clock,
      count: stats.submitted + stats.underReview,
      badgeColor: 'bg-[#d97757] text-white',
    },
    { id: 'detection', label: 'AI Detection', icon: Scan },
    { id: 'map', label: 'Road Damage Map', icon: Map },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'citizens', label: 'Citizen Directory', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#0d0e14] border-r border-white/10 select-none">
      {/* Mobile Header with Close button */}
      <div className="lg:hidden p-4 flex items-center justify-between border-b border-white/10">
        <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
          Admin Console
        </span>
        <button
          onClick={onCloseMobile}
          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-neutral-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-neutral-400 tracking-wider">
          Management
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-[#d97757]/15 border border-[#d97757]/40 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#d97757]' : 'text-neutral-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {typeof item.count === 'number' && item.count > 0 && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    item.badgeColor || (isActive ? 'bg-[#d97757] text-white' : 'bg-white/10 text-neutral-400')
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Back Button */}
      <div className="p-3.5 border-t border-white/10">
        <button
          onClick={onBackToHome}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Public Website</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-64px)] sticky top-16">
        {content}
      </aside>

      {/* Mobile Slide-in Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-xs h-full z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

