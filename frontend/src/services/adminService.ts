/**
 * RoadGuard AI - Administrator Service
 * Coordinates admin operations, status transitions, notifications, and analytics.
 */

import {
  AdminUser,
  AdminNotification,
  AdminAuditEntry,
  RegisteredCitizenProfile,
  DEMO_ADMIN_USER,
  INITIAL_NOTIFICATIONS,
  REGISTERED_CITIZENS,
  INITIAL_AUDIT_LOGS,
} from '../data/adminDemoData';
import { RoadDamageReport, ReportStatus } from '../context/ReportsContext';

const ADMIN_STORAGE_KEY = 'roadguard_admin_auth';
const NOTIFICATIONS_STORAGE_KEY = 'roadguard_admin_notifications';
const AUDIT_STORAGE_KEY = 'roadguard_admin_audit_logs';
const CITIZENS_STORAGE_KEY = 'roadguard_admin_citizens';
const REPORTS_STORAGE_KEY = 'roadguard_citizen_reports';

/**
 * Checks if the current session has active administrator authentication.
 */
export function getStoredAdminUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Performs administrator authentication.
 */
export async function authenticateAdmin(
  email: string,
  pass: string
): Promise<{ success: boolean; error?: string; user?: AdminUser }> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please enter a valid administrator email address.' };
  }

  // Demo Admin credentials check
  if (
    (email.toLowerCase() === 'admin@roadguard.ai' || email.toLowerCase() === 'admin@city.gov') &&
    pass === 'admin2026'
  ) {
    const user = DEMO_ADMIN_USER;
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user));
    return { success: true, user };
  }

  // For flexible demonstration, any @roadguard.ai or @gov email with valid password
  if (email.endsWith('@roadguard.ai') || email.endsWith('.gov') || email.includes('admin')) {
    if (pass.length >= 6) {
      const user: AdminUser = {
        ...DEMO_ADMIN_USER,
        email,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      };
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user));
      return { success: true, user };
    }
  }

  return {
    success: false,
    error: 'Invalid administrator credentials. Try admin@roadguard.ai / admin2026 for demo access.',
  };
}

/**
 * Logs out the administrator.
 */
export function adminLogout(): void {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
}

/**
 * Retrieves all administrator notifications.
 */
export function getAdminNotifications(): AdminNotification[] {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_NOTIFICATIONS;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

/**
 * Marks all notifications as read.
 */
export function markAllNotificationsAsRead(): AdminNotification[] {
  const current = getAdminNotifications();
  const updated = current.map((n) => ({ ...n, unread: false }));
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Retrieves administrative audit entries.
 */
export function getAdminAuditLogs(): AdminAuditEntry[] {
  try {
    const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
    return INITIAL_AUDIT_LOGS;
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

/**
 * Appends an entry to the audit log.
 */
export function addAuditLog(action: string, reportId: string, notes: string): void {
  const admin = getStoredAdminUser();
  const logs = getAdminAuditLogs();
  const newEntry: AdminAuditEntry = {
    id: `LOG-${Date.now().toString().slice(-4)}`,
    adminName: admin?.name || 'Administrator',
    action,
    reportId,
    timestamp: 'Just now',
    notes,
  };
  const updated = [newEntry, ...logs];
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Retrieves all registered citizens.
 */
export function getRegisteredCitizens(): RegisteredCitizenProfile[] {
  try {
    const stored = localStorage.getItem(CITIZENS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(CITIZENS_STORAGE_KEY, JSON.stringify(REGISTERED_CITIZENS));
    return REGISTERED_CITIZENS;
  } catch {
    return REGISTERED_CITIZENS;
  }
}

/**
 * Updates a report's status and adds a timeline event.
 */
export function updateReportStatus(
  reportId: string,
  newStatus: ReportStatus,
  adminNotes?: string,
  rejectionReason?: string
): RoadDamageReport | null {
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!raw) return null;

    const reports: RoadDamageReport[] = JSON.parse(raw);
    const index = reports.findIndex((r) => r.id === reportId);
    if (index === -1) return null;

    const current = reports[index];
    const nowFormatted = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let timelineNote = adminNotes || `Status updated to ${newStatus} by Municipal Road Administrator.`;
    if (newStatus === 'Rejected' && rejectionReason) {
      timelineNote = `Report Rejected: ${rejectionReason}`;
    }

    const updatedReport: RoadDamageReport = {
      ...current,
      status: newStatus,
      updatedAt: nowFormatted,
      timeline: [
        ...current.timeline,
        {
          status: newStatus,
          timestamp: nowFormatted,
          note: timelineNote,
        },
      ],
    };

    reports[index] = updatedReport;
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));

    // Also add to admin audit log
    addAuditLog(
      `Status changed to ${newStatus}`,
      reportId,
      rejectionReason ? `Reason: ${rejectionReason}` : adminNotes || 'Standard status transition'
    );

    return updatedReport;
  } catch (e) {
    console.error('Error updating report status:', e);
    return null;
  }
}

