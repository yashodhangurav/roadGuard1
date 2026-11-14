

/**
 * RoadGuard AI - Maintainer Service
 * Coordinates Maintainer CRUD, authentication, assignment dispatch,
 * mobile-first camera verification, and AI repair verification queries.
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
const MAINTAINER_STORAGE_KEY = 'roadguard_maintainer_auth';

export interface Maintainer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  assigned_tasks_count: number;
  completed_tasks_count: number;
  rating: number;
  created_at?: string;
  updated_at?: string;
}

export interface MaintainerAuthResponse {
  success: boolean;
  user?: Maintainer;
  token?: string;
  role: string;
  error?: string;
}

export interface TaskAssignmentPayload {
  maintainer_id: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  admin_instructions?: string;
  target_completion_date?: string;
  assigned_by?: string;
}

export interface DefectAnalysisDetails {
  potholeDetected: boolean;
  defectCount: number;
  damageAreaCm2: number;
  confidence: number;
  severity: string;
  boundingBoxes?: any[];
}

export interface AIRepairVerificationResult {
  issueId: string;
  verificationStatus: 'VERIFIED' | 'REJECTED' | 'NEEDS_REVIEW';
  repairSuccess: boolean;
  confidence: number;
  remainingDamage: boolean;
  areaReductionPercentage: number;
  surfaceRestorationScore: number;
  locationVerified: boolean;
  distanceFromTicketMeters?: number;
  beforeAnalysis: DefectAnalysisDetails;
  afterAnalysis: DefectAnalysisDetails;
  reason: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  verifiedAt: string;
}

export const DEMO_MAINTAINERS: Maintainer[] = [
  {
    id: 'MNT-2026-001',
    name: 'Carlos Mendez',
    email: 'carlos.mendez@roadguard.ai',
    phone: '+1 (555) 234-5678',
    department: 'Rapid Patch Division',
    status: 'ACTIVE',
    assigned_tasks_count: 5,
    completed_tasks_count: 42,
    rating: 4.9,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-11-14T04:00:00Z',
  },
  {
    id: 'MNT-2026-002',
    name: 'Aisha Khan',
    email: 'aisha.khan@roadguard.ai',
    phone: '+1 (555) 345-6789',
    department: 'Heavy Asphalt Works',
    status: 'ACTIVE',
    assigned_tasks_count: 3,
    completed_tasks_count: 38,
    rating: 4.85,
    created_at: '2026-01-15T09:30:00Z',
    updated_at: '2026-11-13T16:00:00Z',
  },
  {
    id: 'MNT-2026-003',
    name: 'Liam O\'Connor',
    email: 'liam.oconnor@roadguard.ai',
    phone: '+1 (555) 456-7890',
    department: 'Arterial Corridor Maintenance',
    status: 'ACTIVE',
    assigned_tasks_count: 4,
    completed_tasks_count: 29,
    rating: 4.78,
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-11-12T11:20:00Z',
  },
  {
    id: 'MNT-2026-004',
    name: 'Elena Rostova',
    email: 'elena.rostova@roadguard.ai',
    phone: '+1 (555) 567-8901',
    department: 'Quality Assurance & Patch Inspection',
    status: 'ON_LEAVE',
    assigned_tasks_count: 0,
    completed_tasks_count: 55,
    rating: 4.95,
    created_at: '2025-11-20T08:00:00Z',
    updated_at: '2026-11-10T14:00:00Z',
  },
];

/**
 * Storage helpers for maintainer session persistence
 */
export function getStoredMaintainer(): Maintainer | null {
  try {
    const raw = localStorage.getItem(MAINTAINER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredMaintainer(user: Maintainer | null, token?: string) {
  if (user) {
    localStorage.setItem(MAINTAINER_STORAGE_KEY, JSON.stringify(user));
    if (token) localStorage.setItem('roadguard_maintainer_token', token);
  } else {
    localStorage.removeItem(MAINTAINER_STORAGE_KEY);
    localStorage.removeItem('roadguard_maintainer_token');
  }
}

export function maintainerLogout() {
  setStoredMaintainer(null);
}

/**
 * Maintainer authentication against backend API with demo fallback
 */
export async function maintainerLogin(
  email: string,
  pass: string
): Promise<MaintainerAuthResponse> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const res = await fetch(`${API_BASE}/api/maintainers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: pass }),
    });

    if (res.ok) {
      const data = await res.json();
      setStoredMaintainer(data.user, data.token);
      return data;
    }
  } catch {
    // Backend offline fallback
  }

  // Fallback demo match
  const demoMatch = DEMO_MAINTAINERS.find(
    (m) => m.email.toLowerCase() === cleanEmail
  );
  if (demoMatch && (pass === 'maintainer2026' || pass === 'password123')) {
    const fallbackData: MaintainerAuthResponse = {
      success: true,
      user: demoMatch,
      token: `token_demo_${demoMatch.id}`,
      role: 'maintainer',
    };
    setStoredMaintainer(demoMatch, fallbackData.token);
    return fallbackData;
  }

  return {
    success: false,
    role: 'maintainer',
    error: 'Invalid maintainer credentials. Use carlos.mendez@roadguard.ai / maintainer2026',
  };
}

/**
 * Fetch list of maintainers
 */
export async function listMaintainers(status?: string): Promise<Maintainer[]> {
  try {
    const url = status
      ? `${API_BASE}/api/maintainers?status=${encodeURIComponent(status)}`
      : `${API_BASE}/api/maintainers`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // Backend unavailable
  }

  return DEMO_MAINTAINERS.filter((m) => !status || m.status === status.toUpperCase());
}

/**
 * Create a new maintainer
 */
export async function createMaintainer(payload: {
  name: string;
  email: string;
  phone?: string;
  department: string;
  password?: string;
  status?: string;
}): Promise<Maintainer> {
  try {
    const res = await fetch(`${API_BASE}/api/maintainers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        password: payload.password || 'maintainer2026',
        status: payload.status || 'ACTIVE',
      }),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json();
    throw new Error(err.detail || 'Failed to create maintainer');
  } catch (err: any) {
    // If backend unreachable, create local mock maintainer
    const newM: Maintainer = {
      id: `MNT-2026-${Math.floor(Math.random() * 900 + 100)}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone || '+1 (555) 000-0000',
      department: payload.department,
      status: (payload.status as any) || 'ACTIVE',
      assigned_tasks_count: 0,
      completed_tasks_count: 0,
      rating: 5.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return newM;
  }
}

/**
 * Update maintainer details or status
 */
export async function updateMaintainer(
  id: string,
  payload: Partial<Maintainer>
): Promise<Maintainer> {
  try {
    const res = await fetch(`${API_BASE}/api/maintainers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }

  return {
    ...DEMO_MAINTAINERS[0],
    ...payload,
    id,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Assign a road defect report to a maintainer
 */
export async function assignReportToMaintainer(
  reportId: string,
  payload: TaskAssignmentPayload
): Promise<any> {
  const res = await fetch(`${API_BASE}/api/reports/${reportId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to dispatch issue to maintainer');
  }
  return await res.json();
}

/**
 * Fetch assigned tasks for a specific maintainer
 */
export async function getMaintainerTasks(
  maintainerId: string,
  status?: string
): Promise<{ total: number; tasks: any[] }> {
  try {
    const url = status
      ? `${API_BASE}/api/maintainers/${maintainerId}/tasks?status=${encodeURIComponent(status)}`
      : `${API_BASE}/api/maintainers/${maintainerId}/tasks`;
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return { total: 0, tasks: [] };
}

/**
 * Mark repair work initiated on site
 */
export async function startRepairWork(reportId: string, maintainerId?: string): Promise<any> {
  const url = maintainerId
    ? `${API_BASE}/api/reports/${reportId}/repair/start?maintainer_id=${encodeURIComponent(maintainerId)}`
    : `${API_BASE}/api/reports/${reportId}/repair/start`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to mark repair work started');
  }
  return await res.json();
}

/**
 * Submit Before and After repair photographs for AI Verification
 */
export async function submitRepairEvidence(
  reportId: string,
  formData: FormData
): Promise<AIRepairVerificationResult> {
  const res = await fetch(`${API_BASE}/api/reports/${reportId}/repair/submit-evidence`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to submit repair evidence');
  }

  return await res.json();
}

/**
 * Administrator manual decision on uncertain repair verification
 */
export async function submitManualRepairDecision(
  reportId: string,
  action: 'APPROVE' | 'REJECT',
  notes: string = '',
  adminName: string = 'Administrator'
): Promise<any> {
  const res = await fetch(`${API_BASE}/api/reports/${reportId}/repair/manual-decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, notes, admin_name: adminName }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to record manual repair decision');
  }
  return await res.json();
}
