import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  AlertTriangle,
  FileText,
  Wrench,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { AdminNotification } from '../../data/adminDemoData';
import { getAdminNotifications, markAllNotificationsAsRead } from '../../services/adminService';

interface NotificationsProps {
  onSelectReport?: (reportId: string) => void;
}

export const NotificationsDropdown: React.FC<NotificationsProps> = ({ onSelectReport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>(getAdminNotifications());

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    const updated = markAllNotificationsAsRead();
    setNotifications(updated);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'critical_defect':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
      case 'new_report':
        return <FileText className="w-3.5 h-3.5 text-[#d97757]" />;
      case 'crew_dispatched':
        return <Wrench className="w-3.5 h-3.5 text-amber-400" />;
      case 'resolved':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center text-neutral-300 hover:text-white transition cursor-pointer"
        aria-label="View Administrator Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click closer */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl bg-[#121319]/98 border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-4 text-left backdrop-blur-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    System Alerts
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/60 border border-red-500/40 text-red-300">
                      {unreadCount} New
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#d97757] hover:text-[#ff8f6b] flex items-center gap-1 transition cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* List */}
              <div className="mt-3 space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.reportId && onSelectReport) {
                        onSelectReport(item.reportId);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      item.unread
                        ? 'bg-[#181924] border-white/15 hover:border-[#d97757]/40'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0 mt-0.5">
                        {getNotificationIcon(item.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-white truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 mt-0.5 leading-snug line-clamp-2">
                          {item.message}
                        </p>
                        {item.reportId && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-[#d97757]">
                            <span>View Ticket {item.reportId}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
