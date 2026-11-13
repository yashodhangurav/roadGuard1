/**
 * RoadGuard AI - Administrative Demonstration Data
 * Realistic municipal infrastructure management records, notifications, citizens, and telemetry.
 */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Administrator';
  title: string;
  department: string;
  badgeNumber: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  unread: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
  type: 'critical_defect' | 'new_report' | 'crew_dispatched' | 'resolved';
  reportId?: string;
}

export interface RegisteredCitizenProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  registeredAt: string;
  totalReports: number;
  status: 'Verified Citizen' | 'Active Reporter';
  city: string;
}

export interface AdminAuditEntry {
  id: string;
  adminName: string;
  action: string;
  reportId: string;
  timestamp: string;
  notes: string;
}

export const DEMO_ADMIN_USER: AdminUser = {
  id: 'ADM-2026-001',
  name: 'Chief Engineer Sarah Lin',
  email: 'admin@roadguard.ai',
  role: 'Administrator',
  title: 'Senior Municipal Infrastructure Supervisor',
  department: 'San Francisco Department of Public Works',
  badgeNumber: 'DPW-8419',
};

export const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  {
    id: 'NOTIF-01',
    title: 'Critical Pothole Hazard Logged',
    message: 'New high-depth pothole (86mm cavity) reported on 4th St & Mission St. Rapid patch unit requested.',
    timestamp: '12 minutes ago',
    unread: true,
    priority: 'critical',
    type: 'critical_defect',
    reportId: 'RGD-2026-7841',
  },
  {
    id: 'NOTIF-02',
    title: 'Citizen Report Awaiting Verification',
    message: 'Marcus Vance submitted Surface Deterioration report at Market St & 8th St.',
    timestamp: '1 hour ago',
    unread: true,
    priority: 'high',
    type: 'new_report',
    reportId: 'RGD-2026-8194',
  },
  {
    id: 'NOTIF-03',
    title: 'Work Order Dispatched to Crew #12',
    message: 'Asphalt milling machine and crew assigned to Columbus Ave & Broadway alligator cracking.',
    timestamp: '3 hours ago',
    unread: false,
    priority: 'normal',
    type: 'crew_dispatched',
    reportId: 'RGD-2026-7312',
  },
  {
    id: 'NOTIF-04',
    title: 'Pavement Repair Completed',
    message: 'Ticket RGD-2026-6920 on Van Ness Ave & Geary Blvd marked resolved by Rapid Patch Division.',
    timestamp: 'Yesterday at 5:10 PM',
    unread: false,
    priority: 'low',
    type: 'resolved',
    reportId: 'RGD-2026-6920',
  },
];

export const REGISTERED_CITIZENS: RegisteredCitizenProfile[] = [
  {
    id: 'CIT-2026-9041',
    name: 'Marcus Vance',
    email: 'citizen@roadguard.ai',
    mobile: '+1 (555) 392-8172',
    registeredAt: 'Jan 14, 2026',
    totalReports: 4,
    status: 'Verified Citizen',
    city: 'San Francisco, CA',
  },
  {
    id: 'CIT-2026-7128',
    name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    mobile: '+1 (555) 829-1049',
    registeredAt: 'Feb 02, 2026',
    totalReports: 7,
    status: 'Verified Citizen',
    city: 'San Francisco, CA',
  },
  {
    id: 'CIT-2026-6540',
    name: 'David K. Morales',
    email: 'dmorales.civil@example.net',
    mobile: '+1 (555) 472-9912',
    registeredAt: 'Feb 18, 2026',
    totalReports: 3,
    status: 'Active Reporter',
    city: 'Oakland, CA',
  },
  {
    id: 'CIT-2026-5192',
    name: 'Aisha Al-Mansoor',
    email: 'aisha.m@example.org',
    mobile: '+1 (555) 310-8841',
    registeredAt: 'Mar 10, 2026',
    totalReports: 5,
    status: 'Verified Citizen',
    city: 'San Francisco, CA',
  },
  {
    id: 'CIT-2026-4481',
    name: 'Liam Chen',
    email: 'liam.chen99@example.com',
    mobile: '+1 (555) 923-4410',
    registeredAt: 'Apr 05, 2026',
    totalReports: 2,
    status: 'Active Reporter',
    city: 'Daly City, CA',
  },
];

export const INITIAL_AUDIT_LOGS: AdminAuditEntry[] = [
  {
    id: 'LOG-101',
    adminName: 'Sarah Lin',
    action: 'Status Updated: Verified',
    reportId: 'RGD-2026-7841',
    timestamp: 'Today at 09:15 AM',
    notes: 'Confirmed ASTM D6433 Critical severity rating. Dispatched to Zone 4 queue.',
  },
  {
    id: 'LOG-102',
    adminName: 'Sarah Lin',
    action: 'Work Order Issued: Crew #12',
    reportId: 'RGD-2026-7312',
    timestamp: 'Yesterday at 04:30 PM',
    notes: 'Alligator crack remediation work order #WO-4921 generated.',
  },
  {
    id: 'LOG-103',
    adminName: 'David Zhang (Inspector)',
    action: 'Quality Inspection Approved',
    reportId: 'RGD-2026-6920',
    timestamp: 'Nov 05, 2026 at 02:40 PM',
    notes: 'Hot-mix asphalt patch compacted and sealed. Density test verified.',
  },
];

export const MONTHLY_TREND_DATA = [
  { month: 'Jun', submitted: 42, resolved: 38, critical: 8 },
  { month: 'Jul', submitted: 56, resolved: 49, critical: 11 },
  { month: 'Aug', submitted: 68, resolved: 62, critical: 14 },
  { month: 'Sep', submitted: 84, resolved: 78, critical: 17 },
  { month: 'Oct', submitted: 95, resolved: 88, critical: 21 },
  { month: 'Nov', submitted: 112, resolved: 98, critical: 24 },
];

export const CATEGORY_DISTRIBUTION = [
  { name: 'Pothole', count: 48, percentage: 42, color: '#ef4444' },
  { name: 'Alligator Crack', count: 32, percentage: 28, color: '#d97757' },
  { name: 'Longitudinal Crack', count: 18, percentage: 16, color: '#f59e0b' },
  { name: 'Surface Deterioration', count: 16, percentage: 14, color: '#10b981' },
];

export const SEVERITY_DISTRIBUTION = [
  { name: 'Critical', count: 24, color: '#ef4444' },
  { name: 'High', count: 44, color: '#d97757' },
  { name: 'Medium', count: 32, color: '#f59e0b' },
  { name: 'Low', count: 14, color: '#10b981' },
];

export const DISTRICT_DENSITY = [
  { district: 'Downtown / SoMa', reports: 38, avgResolutionDays: 2.1 },
  { district: 'Mission District', reports: 29, avgResolutionDays: 2.4 },
  { district: 'Richmond District', reports: 19, avgResolutionDays: 2.8 },
  { district: 'Sunset District', reports: 16, avgResolutionDays: 3.1 },
  { district: 'Bayview / Hunters Point', reports: 12, avgResolutionDays: 2.2 },
];
