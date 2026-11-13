import React, { useState } from 'react';
import {
  Shield,
  Search,
  LogOut,
  User,
  Menu,
} from 'lucide-react';
import { NotificationsDropdown } from './Notifications';
import { AdminUser } from '../../data/adminDemoData';
import { adminLogout } from '../../services/adminService';

interface AdminNavbarProps {
  adminUser: AdminUser | null;
  onLogout: () => void;
  onOpenMobileMenu?: () => void;
  onSearch?: (query: string) => void;
  onSelectReport?: (reportId: string) => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  adminUser,
  onLogout,
  onOpenMobileMenu,
  onSearch,
  onSelectReport,
}) => {
  const [searchVal, setSearchVal] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-[#0d0e14]/90 backdrop-blur-xl">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white bg-white/[0.03] transition"
            aria-label="Open Navigation Drawer"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d97757]/20 border border-[#d97757]/40 flex items-center justify-center text-[#d97757] shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white uppercase">
                  ROADGUARD <span className="text-[#d97757]">ADMIN</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400">
                  MUNICIPAL AUTHORITY
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 block -mt-0.5">
                DEPARTMENT OF PUBLIC WORKS
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search Field */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchVal}
              onChange={handleSearchChange}
              placeholder="Search reports by ticket ID, street, or citizen name..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757] transition font-sans"
            />
          </div>
        </div>

        {/* Right: Notifications & Admin Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Dropdown */}
          <NotificationsDropdown onSelectReport={onSelectReport} />

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="w-8 h-8 rounded-full bg-[#d97757]/20 border border-[#d97757]/40 flex items-center justify-center text-xs font-semibold text-[#d97757]">
              {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>

            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-white leading-none">
                {adminUser?.name || 'Administrator'}
              </div>
              <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                {adminUser?.badgeNumber || 'DPW Staff'}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                adminLogout();
                onLogout();
              }}
              className="w-8 h-8 rounded-xl bg-white/[0.03] hover:bg-red-950/40 hover:text-red-400 border border-white/10 hover:border-red-500/30 flex items-center justify-center text-neutral-400 transition cursor-pointer ml-1"
              title="Log Out of Administrator Console"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

