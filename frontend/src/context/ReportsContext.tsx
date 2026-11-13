import React, { createContext, useContext, useState, useEffect } from 'react';
import { updateReportStatus as adminUpdateReportStatus } from '../services/adminService';

export type ReportStatus =
  | 'Submitted'
  | 'Under Review'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export type DamageCategory =
  | 'Pothole'
  | 'Longitudinal Crack'
  | 'Transverse Crack'
  | 'Alligator Crack'
  | 'Surface Deterioration'
  | 'Other';

export interface ReportLocation {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  postalCode?: string;
  isManualCorrection: boolean;
  accuracyMeters?: number;
}

export interface StatusTimelineEntry {
  status: ReportStatus;
  timestamp: string;
  note: string;
}

export interface RoadDamageReport {
  id: string;
  category: DamageCategory;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  imageUrl: string;
  location: ReportLocation;
  status: ReportStatus;
  submittedAt: string;
  updatedAt: string;
  timeline: StatusTimelineEntry[];
  citizenId: string;
  citizenName: string;
  assignedCrew?: string;
  referenceIndex?: string;
}

interface CreateReportData {
  category: DamageCategory;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  imageUrl: string;
  location: ReportLocation;
}

interface ReportsContextType {
  reports: RoadDamageReport[];
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filteredReports: RoadDamageReport[];
  createReport: (data: CreateReportData, citizenName: string, citizenId: string) => Promise<RoadDamageReport>;
  getReportById: (id: string) => RoadDamageReport | undefined;
  updateReportStatus: (
    id: string,
    newStatus: ReportStatus,
    notes?: string,
    rejectionReason?: string
  ) => RoadDamageReport | null;
  stats: {
    total: number;
    submitted: number;
    underReview: number;
    inProgress: number;
    resolved: number;
    rejected: number;
  };
  resetToSampleReports: () => void;
}

const STORAGE_KEY = 'roadguard_citizen_reports';

const SEED_REPORTS: RoadDamageReport[] = [
  {
    id: 'RGD-2026-8194',
    category: 'Surface Deterioration',
    severity: 'Medium',
    description: 'Extensive raveling and aggregate loss creating loose gravel near the crosswalk corner.',
    imageUrl: '/samples/road-crack-2.jpg',
    location: {
      latitude: 37.778102,
      longitude: -122.414234,
      address: 'Market St & 8th St, San Francisco, CA 94102',
      city: 'San Francisco',
      isManualCorrection: false,
      accuracyMeters: 4.8,
    },
    status: 'Submitted',
    submittedAt: 'Today at 10:14 AM',
    updatedAt: 'Today at 10:14 AM',
    citizenId: 'CIT-2026-9041',
    citizenName: 'Marcus Vance',
    timeline: [
      {
        status: 'Submitted',
        timestamp: 'Today at 10:14 AM',
        note: 'Report received and queued for automated computer vision distress validation.',
      },
    ],
  },
  {
    id: 'RGD-2026-7841',
    category: 'Pothole',
    severity: 'Critical',
    description: 'High-impact wheelpath cavity on Route 101 Northbound ramp. Cavity depth exceeds 80mm with sharp asphalt edges.',
    imageUrl: '/samples/road-pothole-1.jpg',
    location: {
      latitude: 37.785834,
      longitude: -122.406417,
      address: '4th St & Mission St, San Francisco, CA 94103',
      city: 'San Francisco',
      isManualCorrection: false,
      accuracyMeters: 3.2,
    },
    status: 'Under Review',
    submittedAt: 'Yesterday at 3:45 PM',
    updatedAt: 'Today at 8:30 AM',
    citizenId: 'CIT-2026-9041',
    citizenName: 'Marcus Vance',
    assignedCrew: 'Civil Engineering Assessment Team 3',
    timeline: [
      {
        status: 'Submitted',
        timestamp: 'Yesterday at 3:45 PM',
        note: 'Report submitted by citizen with high-resolution photograph and GNSS coordinates.',
      },
      {
        status: 'Under Review',
        timestamp: 'Today at 8:30 AM',
        note: 'AI severity scored as Critical (PCI Deduction 46). Road Inspector assigned for field verification.',
      },
    ],
  },
  {
    id: 'RGD-2026-7312',
    category: 'Alligator Crack',
    severity: 'High',
    description: 'Hexagonal structural fatigue failure across 25 square feet of pavement. Slurry surface peeling off.',
    imageUrl: '/samples/road-crack-2.jpg',
    location: {
      latitude: 37.798124,
      longitude: -122.407231,
      address: 'Columbus Ave & Broadway, San Francisco, CA 94133',
      city: 'San Francisco',
      isManualCorrection: true,
      accuracyMeters: 6.5,
    },
    status: 'In Progress',
    submittedAt: 'Nov 9, 2026',
    updatedAt: 'Nov 11, 2026',
    citizenId: 'CIT-2026-9041',
    citizenName: 'Marcus Vance',
    assignedCrew: 'Municipal Asphalt Repair Crew #12',
    timeline: [
      {
        status: 'Submitted',
        timestamp: 'Nov 9, 2026',
        note: 'Report logged to district maintenance database.',
      },
      {
        status: 'Under Review',
        timestamp: 'Nov 10, 2026',
        note: 'Pavement distress classified as Tier 2 rehabilitation.',
      },
      {
        status: 'In Progress',
        timestamp: 'Nov 11, 2026',
        note: 'Work order #WO-4921 issued. Asphalt milling machine and crew scheduled.',
      },
    ],
  },
  {
    id: 'RGD-2026-6920',
    category: 'Pothole',
    severity: 'Critical',
    description: 'Severe void repaired with hot-mix patch and dense-graded asphalt compaction.',
    imageUrl: '/samples/road-multi-3.jpg',
    location: {
      latitude: 37.785512,
      longitude: -122.421190,
      address: 'Van Ness Ave & Geary Blvd, San Francisco, CA 94109',
      city: 'San Francisco',
      isManualCorrection: false,
      accuracyMeters: 4.0,
    },
    status: 'Resolved',
    submittedAt: 'Nov 2, 2026',
    updatedAt: 'Nov 5, 2026',
    citizenId: 'CIT-2026-9041',
    citizenName: 'Marcus Vance',
    assignedCrew: 'Municipal Rapid Patch Division',
    timeline: [
      {
        status: 'Submitted',
        timestamp: 'Nov 2, 2026',
        note: 'Report submitted by citizen.',
      },
      {
        status: 'Under Review',
        timestamp: 'Nov 3, 2026',
        note: 'Verified as severe pothole hazard.',
      },
      {
        status: 'In Progress',
        timestamp: 'Nov 4, 2026',
        note: 'Repair crew dispatched to site.',
      },
      {
        status: 'Resolved',
        timestamp: 'Nov 5, 2026',
        note: 'Permanent hot-mix patch laid and edge sealed. Quality inspection signed off.',
      },
    ],
  },
];

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export const ReportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<RoadDamageReport[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Load from localStorage and merge with live FastAPI backend database
  useEffect(() => {
    let baseList = SEED_REPORTS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        baseList = JSON.parse(stored);
      }
    } catch {
      baseList = SEED_REPORTS;
    }
    setReports(baseList);

    // Fetch live reports from SQLite backend
    const syncBackendReports = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/reports');
        if (res.ok) {
          const backendList = await res.json();
          if (Array.isArray(backendList) && backendList.length > 0) {
            const mappedBackend: RoadDamageReport[] = backendList.map((br: any) => ({
              id: br.id,
              category: (br.potholes_count > 0 ? 'Pothole' : 'Longitudinal Crack') as DamageCategory,
              severity: (br.overall_condition === 'Critical' ? 'Critical' : br.overall_condition === 'Poor' ? 'High' : 'Medium') as any,
              description: `Autonomous YOLOv8 inspection report. Total defects detected: ${br.total_defects}. PCI Condition Rating: ${br.pci_score}/100. Patch requirement: ${br.estimated_patch_tons} tons.`,
              imageUrl: br.annotated_image_url
                ? (br.annotated_image_url.startsWith('http') ? br.annotated_image_url : `http://127.0.0.1:8000${br.annotated_image_url}`)
                : '/samples/road-pothole-1.jpg',
              location: {
                latitude: br.latitude || 37.7749,
                longitude: br.longitude || -122.4194,
                address: br.location_name || 'Highway Route 101, MP 14.2',
                isManualCorrection: false,
                accuracyMeters: 2.5,
              },
              status: (br.overall_condition === 'Critical' ? 'In Progress' : 'Under Review') as ReportStatus,
              submittedAt: br.analyzed_at ? new Date(br.analyzed_at).toLocaleDateString() : 'Today',
              updatedAt: 'Live Synced',
              citizenId: 'AUTONOMOUS-CV-SCANNER',
              citizenName: 'RoadSentinel Edge Detector',
              assignedCrew: 'Municipal Highway Maintenance Crew',
              timeline: [
                {
                  status: 'Submitted' as ReportStatus,
                  timestamp: br.analyzed_at ? new Date(br.analyzed_at).toLocaleTimeString() : 'Earlier',
                  note: `Autonomous inspection completed with YOLOv8. Hazard Score: ${br.hazard_index}%.`,
                }
              ],
            }));

            // Merge avoiding ID duplication
            setReports((prev) => {
              const prevIds = new Set(prev.map((p) => p.id));
              const newItems = mappedBackend.filter((mb) => !prevIds.has(mb.id));
              const combined = [...newItems, ...prev];
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
              } catch {}
              return combined;
            });
          }
        }
      } catch (err) {
        console.warn('Could not sync with live backend reports:', err);
      }
    };

    syncBackendReports();
  }, []);

  const saveReports = (newReports: RoadDamageReport[]) => {
    setReports(newReports);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newReports));
    } catch (e) {
      console.warn('Could not save reports to localStorage', e);
    }
  };

  const createReport = async (
    data: CreateReportData,
    citizenName: string,
    citizenId: string
  ): Promise<RoadDamageReport> => {
    await new Promise((resolve) => setTimeout(resolve, 700));

    const nowFormatted = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newReport: RoadDamageReport = {
      id: `RGD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      category: data.category,
      severity: data.severity || 'High',
      description: data.description.trim() || 'No description provided.',
      imageUrl: data.imageUrl,
      location: data.location,
      status: 'Submitted',
      submittedAt: nowFormatted,
      updatedAt: nowFormatted,
      citizenId,
      citizenName,
      timeline: [
        {
          status: 'Submitted',
          timestamp: nowFormatted,
          note: 'Report submitted by citizen with photograph and location telemetry. Queued for validation.',
        },
      ],
    };

    const updated = [newReport, ...reports];
    saveReports(updated);
    return newReport;
  };

  const getReportById = (id: string) => {
    return reports.find((r) => r.id === id);
  };

  const updateReportStatus = (
    id: string,
    newStatus: ReportStatus,
    notes?: string,
    rejectionReason?: string
  ): RoadDamageReport | null => {
    const updated = adminUpdateReportStatus(id, newStatus, notes, rejectionReason);
    if (updated) {
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
    return updated;
  };

  const resetToSampleReports = () => {
    saveReports(SEED_REPORTS);
  };

  const filteredReports = reports.filter((r) => {
    if (filterStatus === 'All') return true;
    return r.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const stats = {
    total: reports.length,
    submitted: reports.filter((r) => r.status === 'Submitted').length,
    underReview: reports.filter((r) => r.status === 'Under Review').length,
    inProgress: reports.filter((r) => r.status === 'In Progress').length,
    resolved: reports.filter((r) => r.status === 'Resolved').length,
    rejected: reports.filter((r) => r.status === 'Rejected').length,
  };

  return (
    <ReportsContext.Provider
      value={{
        reports,
        filterStatus,
        setFilterStatus,
        filteredReports,
        createReport,
        getReportById,
        updateReportStatus,
        stats,
        resetToSampleReports,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};

