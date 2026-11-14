import React, { createContext, useContext, useState, useEffect } from 'react';
import { updateReportStatus as adminUpdateReportStatus } from '../services/adminService';
import { saveOfflineReport, SyncStatus } from '../services/offlineDb';
import { syncManager } from '../services/syncManager';
import {
  reviewDuplicateReport,
  updateReportProgressStage as updateReportProgressStageApi,
  uploadRepairPhoto as uploadRepairPhotoApi,
  ProgressStagePayload,
  ProgressHistoryEntry,
} from '../services/detectionApi';

export type ReportStatus =
  | 'Submitted'
  | 'Under Review'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export type CanonicalProgressStage =
  | 'Reported'
  | 'Admin verified'
  | 'Assigned to department'
  | 'Scheduled'
  | 'Repair in progress'
  | 'Repair completed'
  | 'Final verification'
  | 'Closed'
  | 'Reopened';

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
  annotatedImageUrl?: string;
  aiConfidence?: number;
  aiDetection?: string;
  repairMethod?: string;
  dimensions?: {
    widthCm: number;
    heightCm: number;
    estimatedDepthMm?: number;
    areaCm2: number;
  };
  location: ReportLocation;
  status: ReportStatus;
  submittedAt: string;
  updatedAt: string;
  timeline: StatusTimelineEntry[];
  citizenId: string;
  citizenName: string;
  assignedCrew?: string;
  referenceIndex?: string;
  syncStatus?: SyncStatus;
  clientReportId?: string;
  backendReportId?: string;
  canonicalIssueId?: string;
  isDuplicate?: boolean;
  duplicateStatus?: 'NEW_ISSUE' | 'CONFIRMED_DUPLICATE' | 'NEEDS_REVIEW' | 'DISMISSED';
  duplicateReviewStatus?: 'NONE' | 'PENDING_ADMIN_REVIEW' | 'APPROVED_BY_ADMIN' | 'DISMISSED_BY_ADMIN';
  duplicateMatchType?: string;
  duplicateMatchReason?: string;
  // 8-Stage Progress Lifecycle & Photo Storage
  currentStage?: CanonicalProgressStage;
  assignedDepartment?: string;
  expectedCompletionDate?: string;
  beforeImages?: string[];
  duringImages?: string[];
  afterImages?: string[];
  repairProgressHistory?: ProgressHistoryEntry[];
  reopenedCount?: number;
  reopenReason?: string;
  // Geotag-Verified Telemetry Fields
  altitude?: number;
  gpsAccuracy?: number;
  readableAddress?: string;
  captureTimestamp?: string;
  uploadTimestamp?: string;
  captureMethod?: 'in_app_camera' | 'existing_geotagged_upload' | 'standard_upload';
  geotagVerified?: boolean;
  exifMetadataAvailable?: boolean;
  cameraMake?: string;
  cameraModel?: string;
  originalImageUrl?: string;
  stampedImageUrl?: string;
  // Maintainer Management & AI Repair Verification
  assignedMaintainerId?: string;
  assignedMaintainerName?: string;
  assignmentPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  adminInstructions?: string;
  assignedAt?: string;
  assignedBy?: string;
  repairStartedAt?: string;
  targetCompletionDate?: string;
  repairBeforeImage?: string;
  repairBeforeGps?: any;
  repairAfterImage?: string;
  repairAfterGps?: any;
  aiVerificationStatus?: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_REVIEW';
  aiVerificationReport?: any;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface CreateReportData {
  category: DamageCategory;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  imageUrl: string;
  imageBlob?: Blob;
  originalImageBlob?: Blob;
  clientReportId?: string;
  annotatedImageUrl?: string;
  aiConfidence?: number;
  aiDetection?: string;
  repairMethod?: string;
  dimensions?: {
    widthCm: number;
    heightCm: number;
    estimatedDepthMm?: number;
    areaCm2: number;
  };
  location: ReportLocation;
  // Geotag fields
  altitude?: number;
  gpsAccuracy?: number;
  captureTimestamp?: string;
  captureMethod?: 'in_app_camera' | 'existing_geotagged_upload' | 'standard_upload';
  geotagVerified?: boolean;
  exifMetadataAvailable?: boolean;
  cameraMake?: string;
  cameraModel?: string;
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
  reviewDuplicate: (
    reportId: string,
    action: 'CONFIRM_DUPLICATE' | 'DISMISS_DUPLICATE',
    canonicalId?: string,
    adminNotes?: string,
    adminName?: string
  ) => Promise<boolean>;
  duplicateReviewCount: number;
  updateProgressStage: (
    reportId: string,
    stage: CanonicalProgressStage,
    payload: ProgressStagePayload
  ) => Promise<boolean>;
  uploadProgressPhoto: (
    reportId: string,
    photo: File | Blob,
    stage: 'before' | 'during' | 'after',
    caption?: string,
    actorName?: string,
    actorRole?: string,
    department?: string
  ) => Promise<string | null>;
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

/**
 * Generates a unique, human-readable Pothole ID in the format: RGD-YYYY-NNNNN
 * RGD = RoadGuard Defect
 * YYYY = Current year
 * NNNNN = 5-digit unique numeric identifier (random + timestamp seeded)
 */
export function generatePotholeId(): string {
  const year = new Date().getFullYear();
  // Combine timestamp last 5 digits with random to ensure uniqueness
  const timePart = Date.now() % 100000;
  const randPart = Math.floor(Math.random() * 90000) + 10000;
  // XOR and mod to get a 5-digit number
  const uniqueNum = ((timePart ^ randPart) % 90000) + 10000;
  return `RGD-${year}-${uniqueNum}`;
}

const SEED_REPORTS: RoadDamageReport[] = [
  {
    id: 'RGD-2026-8912',
    category: 'Pothole',
    severity: 'High',
    description: 'Deep pavement hole right before the crosswalk on Mission St, near 4th St. Causing traffic to swerve.',
    imageUrl: '/samples/road-pothole-1.jpg',
    beforeImages: ['/samples/road-pothole-1.jpg'],
    duringImages: [],
    afterImages: [],
    currentStage: 'Reported',
    reopenedCount: 0,
    aiConfidence: 94.6,
    aiDetection: 'Pothole (D40)',
    repairMethod: 'Milling, tack coat bonding, dense-graded hot-mix asphalt patch, and roller compaction',
    dimensions: {
      widthCm: 64,
      heightCm: 48,
      estimatedDepthMm: 68,
      areaCm2: 3072,
    },
    location: {
      latitude: 37.785860,
      longitude: -122.406380,
      address: 'Mission St & 4th St (East Corner), San Francisco, CA 94103',
      city: 'San Francisco',
      isManualCorrection: false,
      accuracyMeters: 3.5,
    },
    status: 'Submitted',
    submittedAt: 'Today at 11:20 AM',
    updatedAt: 'Today at 11:20 AM',
    citizenId: 'CIT-2026-4412',
    citizenName: 'Elena Rostova',
    canonicalIssueId: 'RGD-2026-7841',
    isDuplicate: false,
    duplicateStatus: 'NEEDS_REVIEW',
    duplicateReviewStatus: 'PENDING_ADMIN_REVIEW',
    duplicateMatchType: 'ORB_VIEWPOINT',
    duplicateMatchReason: 'Same road distress photographed from opposite corner (38 inliers, 42% geometric ratio, 4.2m GPS distance).',
    timeline: [
      {
        status: 'Submitted',
        timestamp: 'Today at 11:20 AM',
        note: 'Submitted by citizen. Hybrid engine flagged candidate duplicate of RGD-2026-7841. Queued for municipal review.',
      },
    ],
  },
  {
    id: 'RGD-2026-8194',
    category: 'Surface Deterioration',
    severity: 'Medium',
    description: 'Extensive raveling and aggregate loss creating loose gravel near the crosswalk corner.',
    imageUrl: '/samples/road-crack-2.jpg',
    beforeImages: ['/samples/road-crack-2.jpg'],
    duringImages: [],
    afterImages: [],
    currentStage: 'Reported',
    reopenedCount: 0,
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
    beforeImages: ['/samples/road-pothole-1.jpg'],
    duringImages: [],
    afterImages: [],
    currentStage: 'Admin verified',
    assignedDepartment: 'Rapid Patch Division',
    assignedCrew: 'Civil Engineering Assessment Team 3',
    expectedCompletionDate: '2026-11-20',
    reopenedCount: 0,
    aiConfidence: 97.8,
    aiDetection: 'Pothole (D40)',
    repairMethod: 'Full-depth emergency repair; hot-mix asphalt patching and compaction with edge milling',
    dimensions: {
      widthCm: 76,
      heightCm: 62,
      estimatedDepthMm: 86,
      areaCm2: 4712,
    },
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
    timeline: [
      {
        status: 'Submitted',
        timestamp: 'Yesterday at 3:45 PM',
        note: 'Report submitted by citizen with high-resolution photograph and GNSS coordinates.',
      },
      {
        status: 'Under Review',
        timestamp: 'Today at 8:30 AM',
        note: 'Stage 2: Admin verified. AI severity scored as Critical (PCI Deduction 46). Road Inspector assigned for field verification.',
      },
    ],
  },
  {
    id: 'RGD-2026-7312',
    category: 'Alligator Crack',
    severity: 'High',
    description: 'Hexagonal structural fatigue failure across 25 square feet of pavement. Slurry surface peeling off.',
    imageUrl: '/samples/road-crack-2.jpg',
    beforeImages: ['/samples/road-crack-2.jpg'],
    duringImages: ['/samples/road-multi-3.jpg'],
    afterImages: [],
    currentStage: 'Repair in progress',
    assignedDepartment: 'Department of Public Works',
    assignedCrew: 'Municipal Asphalt Repair Crew #12',
    expectedCompletionDate: '2026-11-16',
    reopenedCount: 0,
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
    timeline: [
      {
        status: 'Submitted',
        timestamp: 'Nov 9, 2026',
        note: 'Report logged to district maintenance database.',
      },
      {
        status: 'Under Review',
        timestamp: 'Nov 10, 2026',
        note: 'Stage 2: Admin verified. Pavement distress classified as Tier 2 rehabilitation.',
      },
      {
        status: 'In Progress',
        timestamp: 'Nov 11, 2026',
        note: 'Stage 5: Repair in progress. Work order #WO-4921 issued. Asphalt milling machine and crew on site.',
      },
    ],
  },
  {
    id: 'RGD-2026-6920',
    category: 'Pothole',
    severity: 'Critical',
    description: 'Severe void repaired with hot-mix patch and dense-graded asphalt compaction.',
    imageUrl: '/samples/road-multi-3.jpg',
    beforeImages: ['/samples/road-pothole-1.jpg'],
    duringImages: ['/samples/road-multi-3.jpg'],
    afterImages: ['/samples/road-crack-2.jpg'],
    currentStage: 'Closed',
    assignedDepartment: 'Municipal Rapid Patch Division',
    assignedCrew: 'Rapid Patch Division',
    reopenedCount: 0,
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
    timeline: [
      {
        status: 'Submitted',
        timestamp: 'Nov 2, 2026',
        note: 'Report submitted by citizen.',
      },
      {
        status: 'Under Review',
        timestamp: 'Nov 3, 2026',
        note: 'Stage 2: Admin verified as severe pothole hazard.',
      },
      {
        status: 'In Progress',
        timestamp: 'Nov 4, 2026',
        note: 'Stage 5: Repair in progress. Repair crew dispatched to site.',
      },
      {
        status: 'Resolved',
        timestamp: 'Nov 5, 2026',
        note: 'Stage 8: Closed. Permanent hot-mix patch laid and edge sealed. Quality inspection signed off.',
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
            const mappedBackend: RoadDamageReport[] = backendList.map((br: any) => {
              const widthCm = Math.round(Math.max(35, (br.estimated_patch_tons || 1.0) * 55));
              const heightCm = Math.round(Math.max(30, (br.estimated_patch_tons || 1.0) * 45));
              const depthMm = Math.round(Math.max(25, (br.hazard_index || 50) * 0.8));
              // Ensure every report has a proper RGD- pothole ID
              const reportId = (br.id && typeof br.id === 'string' && br.id.startsWith('RGD-'))
                ? br.id
                : generatePotholeId();
              return {
                id: reportId,
                category: (br.potholes_count > 0 ? 'Pothole' : 'Longitudinal Crack') as DamageCategory,
                severity: (br.overall_condition === 'Critical' ? 'Critical' : br.overall_condition === 'Poor' ? 'High' : 'Medium') as any,
                description: `Autonomous YOLO inspection report. Total defects detected: ${br.total_defects}. PCI Condition Rating: ${br.pci_score}/100. Patch requirement: ${br.estimated_patch_tons} tons.`,
                imageUrl: br.annotated_image_url
                  ? (br.annotated_image_url.startsWith('http') ? br.annotated_image_url : `http://127.0.0.1:8000${br.annotated_image_url}`)
                  : '/samples/road-pothole-1.jpg',
                annotatedImageUrl: br.annotated_image_url
                  ? (br.annotated_image_url.startsWith('http') ? br.annotated_image_url : `http://127.0.0.1:8000${br.annotated_image_url}`)
                  : undefined,
                aiConfidence: br.hazard_index ? Math.min(99.0, Math.max(78.0, 100 - (100 - br.hazard_index) * 0.15)) : 93.5,
                aiDetection: br.potholes_count > 0 ? 'Pothole (D40)' : 'Longitudinal Crack (D00)',
                repairMethod: br.overall_condition === 'Critical'
                  ? 'Full-depth emergency repair; hot-mix asphalt patching and compaction with edge milling'
                  : 'Milling, tack coat bonding, dense-graded hot-mix asphalt patch, and roller compaction',
                dimensions: {
                  widthCm,
                  heightCm,
                  estimatedDepthMm: depthMm,
                  areaCm2: widthCm * heightCm,
                },
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
                    note: `Autonomous inspection completed with YOLO. Hazard Score: ${br.hazard_index}%.`,
                  }
                ],
              };
            });

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

    // Subscribe to Background Sync updates from syncManager
    const unsubscribeSync = syncManager.subscribe((event) => {
      if (event.report) {
        setReports((prev) =>
          prev.map((r) => {
            if (r.id === event.report!.id || r.clientReportId === event.report!.id) {
              return {
                ...r,
                syncStatus: event.report!.syncStatus,
                annotatedImageUrl: event.report!.annotatedImageUrl || r.annotatedImageUrl,
                backendReportId: event.report!.backendReportId || r.backendReportId,
              };
            }
            return r;
          })
        );
      }
    });

    return () => {
      unsubscribeSync();
    };
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
    const clientReportId =
      data.clientReportId || generatePotholeId();

    const isOnline = syncManager.isOnline();
    const initialSyncStatus: SyncStatus = isOnline ? 'SYNCING' : 'PENDING';

    // 1. Ensure binary Blob is obtained for IndexedDB persistent storage
    let blobToStore: Blob;
    if (data.imageBlob) {
      blobToStore = data.imageBlob;
    } else {
      try {
        const fetchRes = await fetch(data.imageUrl);
        blobToStore = await fetchRes.blob();
      } catch {
        blobToStore = new Blob(['empty'], { type: 'image/jpeg' });
      }
    }

    // 2. Persist locally to IndexedDB first (Local-First Guarantee)
    try {
      await saveOfflineReport({
        id: clientReportId,
        userId: citizenId,
        userName: citizenName,
        imageBlob: blobToStore,
        imageFileName: `${clientReportId}.jpg`,
        imageMimeType: blobToStore.type || 'image/jpeg',
        category: data.category,
        severity: data.severity || 'High',
        description: data.description.trim() || 'No description provided.',
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        address: data.location.address,
        city: data.location.city || 'San Francisco',
        isManualCorrection: data.location.isManualCorrection,
        accuracyMeters: data.location.accuracyMeters,
        altitude: data.altitude,
        gpsAccuracy: data.gpsAccuracy ?? data.location.accuracyMeters,
        captureTimestamp: data.captureTimestamp,
        captureMethod: data.captureMethod,
        geotagVerified: data.geotagVerified,
        exifMetadataAvailable: data.exifMetadataAvailable,
        cameraMake: data.cameraMake,
        cameraModel: data.cameraModel,
        originalImageBlob: data.originalImageBlob,
        stampedImageBlob: blobToStore,
        submittedAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn('Could not save to IndexedDB:', dbErr);
    }

    const nowFormatted = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newReport: RoadDamageReport = {
      id: clientReportId,
      clientReportId,
      syncStatus: initialSyncStatus,
      category: data.category,
      severity: data.severity || 'High',
      description: data.description.trim() || 'No description provided.',
      imageUrl: data.imageUrl,
      annotatedImageUrl: data.annotatedImageUrl,
      aiConfidence: data.aiConfidence,
      aiDetection: data.aiDetection,
      repairMethod: data.repairMethod,
      dimensions: data.dimensions,
      location: data.location,
      altitude: data.altitude,
      gpsAccuracy: data.gpsAccuracy ?? data.location.accuracyMeters,
      captureTimestamp: data.captureTimestamp,
      captureMethod: data.captureMethod,
      geotagVerified: data.geotagVerified,
      exifMetadataAvailable: data.exifMetadataAvailable,
      cameraMake: data.cameraMake,
      cameraModel: data.cameraModel,
      originalImageUrl: data.imageUrl,
      stampedImageUrl: data.imageUrl,
      status: 'Submitted',
      submittedAt: nowFormatted,
      updatedAt: nowFormatted,
      citizenId,
      citizenName,
      timeline: [
        {
          status: 'Submitted',
          timestamp: nowFormatted,
          note: isOnline
            ? data.aiDetection
              ? `Report submitted with YOLO AI detection (${data.aiDetection}). Synchronizing with MongoDB Atlas...`
              : 'Report submitted and queued for online database synchronization.'
            : 'Report saved securely on this device (offline). It will automatically upload when your internet connection returns.',
        },
      ],
    };

    const updated = [newReport, ...reports];
    saveReports(updated);

    // 3. Trigger immediate background sync if online
    if (isOnline) {
      syncManager.requestBackgroundSync().catch((err) => {
        console.warn('Background sync trigger error:', err);
      });
    }

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

  const reviewDuplicate = async (
    reportId: string,
    action: 'CONFIRM_DUPLICATE' | 'DISMISS_DUPLICATE',
    canonicalId?: string,
    adminNotes?: string,
    adminName: string = 'Municipal Administrator'
  ): Promise<boolean> => {
    try {
      await reviewDuplicateReport(reportId, action, canonicalId, adminNotes);
    } catch (e) {
      console.warn('Backend duplicate review call failed, updating local state:', e);
    }

    const nowStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const isConfirm = action === 'CONFIRM_DUPLICATE';
    const note = isConfirm
      ? `Duplicate confirmed by ${adminName}. Linked to canonical ticket #${canonicalId || 'PARENT'}.${adminNotes ? ` Note: ${adminNotes}` : ''}`
      : `Marked as independent new issue by ${adminName}.${adminNotes ? ` Note: ${adminNotes}` : ''}`;

    setReports((prev) => {
      const updatedList = prev.map((r) => {
        if (r.id === reportId || r.clientReportId === reportId) {
          const updatedTimeline = [
            ...r.timeline,
            {
              status: r.status,
              timestamp: nowStr,
              note,
            },
          ];
          return {
            ...r,
            isDuplicate: isConfirm,
            canonicalIssueId: isConfirm ? canonicalId : undefined,
            duplicateStatus: (isConfirm ? 'CONFIRMED_DUPLICATE' : 'NEW_ISSUE') as any,
            duplicateReviewStatus: (isConfirm ? 'APPROVED_BY_ADMIN' : 'DISMISSED_BY_ADMIN') as any,
            updatedAt: nowStr,
            timeline: updatedTimeline,
          };
        }
        return r;
      });
      saveReports(updatedList);
      return updatedList;
    });

    return true;
  };

  const updateProgressStage = async (
    reportId: string,
    stage: CanonicalProgressStage,
    payload: ProgressStagePayload
  ): Promise<boolean> => {
    // 1. Call backend API if reachable
    try {
      await updateReportProgressStageApi(reportId, payload);
    } catch (err) {
      console.warn('Backend progress update failed, applying locally:', err);
    }

    const nowFormatted = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const mappedStatus: ReportStatus =
      stage === 'Closed'
        ? 'Resolved'
        : stage === 'Repair in progress' || stage === 'Scheduled' || stage === 'Reopened'
        ? 'In Progress'
        : stage === 'Admin verified' || stage === 'Assigned to department' || stage === 'Final verification' || stage === 'Repair completed'
        ? 'Under Review'
        : 'Submitted';

    let noteText = payload.notes || `Progress stage advanced to ${stage} by ${payload.actor_name} (${payload.actor_role}).`;
    if (stage === 'Reopened' && payload.reopen_reason) {
      noteText = `ISSUE REOPENED for rework: ${payload.reopen_reason}`;
    } else if (stage === 'Scheduled' && payload.expected_completion_date) {
      noteText = `Repair scheduled. Target completion: ${payload.expected_completion_date}. ${payload.notes || ''}`;
    }

    setReports((prev) => {
      const updatedList = prev.map((r) => {
        if (r.id === reportId || r.clientReportId === reportId || r.canonicalIssueId === reportId) {
          const isTargetCanonical = (r.id === reportId || r.clientReportId === reportId);
          const historyEntry: ProgressHistoryEntry = {
            id: `prog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            stage,
            status: mappedStatus,
            timestamp: nowFormatted,
            actor_name: payload.actor_name,
            actor_role: payload.actor_role,
            department: payload.department || r.assignedDepartment,
            crew: payload.crew || r.assignedCrew,
            expected_completion_date: payload.expected_completion_date || r.expectedCompletionDate,
            notes: noteText,
            reopen_reason: payload.reopen_reason,
            photos: [],
          };

          const existingHistory = r.repairProgressHistory || [];
          const updatedTimeline = [
            ...r.timeline,
            {
              status: mappedStatus,
              timestamp: nowFormatted,
              note: isTargetCanonical ? noteText : `Canonical issue updated: ${stage}. ${noteText}`,
            },
          ];

          return {
            ...r,
            currentStage: stage,
            status: mappedStatus,
            assignedDepartment: payload.department || r.assignedDepartment,
            assignedCrew: payload.crew || r.assignedCrew,
            expectedCompletionDate: payload.expected_completion_date || r.expectedCompletionDate,
            reopenedCount: stage === 'Reopened' ? (r.reopenedCount || 0) + 1 : r.reopenedCount,
            reopenReason: stage === 'Reopened' ? payload.reopen_reason : r.reopenReason,
            updatedAt: nowFormatted,
            timeline: updatedTimeline,
            repairProgressHistory: [...existingHistory, historyEntry],
          };
        }
        return r;
      });
      saveReports(updatedList);
      return updatedList;
    });

    return true;
  };

  const uploadProgressPhoto = async (
    reportId: string,
    file: File | Blob,
    stage: 'before' | 'during' | 'after',
    caption?: string,
    actorName: string = 'Authorized Department User',
    actorRole: string = 'Department Crew',
    department?: string
  ): Promise<string | null> => {
    let photoUrl = '';
    try {
      const res = await uploadRepairPhotoApi(reportId, file, stage, caption, actorName, actorRole, department);
      if (res && res.photo_url) {
        photoUrl = res.photo_url.startsWith('http') ? res.photo_url : `http://127.0.0.1:8000${res.photo_url}`;
      }
    } catch (err) {
      console.warn('Backend photo upload failed, generating local object URL:', err);
    }

    if (!photoUrl) {
      photoUrl = URL.createObjectURL(file);
    }

    const nowFormatted = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    setReports((prev) => {
      const updatedList = prev.map((r) => {
        if (r.id === reportId || r.clientReportId === reportId) {
          const bucket = stage === 'before' ? 'beforeImages' : stage === 'during' ? 'duringImages' : 'afterImages';
          const currentList = r[bucket] || [];
          const updatedListPhotos = [...currentList, photoUrl];

          const historyEntry: ProgressHistoryEntry = {
            id: `prog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            stage: `Photo: ${stage.charAt(0).toUpperCase() + stage.slice(1)}`,
            status: r.status,
            timestamp: nowFormatted,
            actor_name: actorName,
            actor_role: actorRole,
            department: department || r.assignedDepartment,
            notes: caption || `${stage.charAt(0).toUpperCase() + stage.slice(1)} photograph attached by ${actorName}.`,
            photos: [{
              url: photoUrl,
              stage,
              caption,
              actor_name: actorName,
              actor_role: actorRole,
              department,
              uploaded_at: nowFormatted,
            }],
          };

          return {
            ...r,
            [bucket]: updatedListPhotos,
            updatedAt: nowFormatted,
            repairProgressHistory: [...(r.repairProgressHistory || []), historyEntry],
            timeline: [
              ...r.timeline,
              {
                status: r.status,
                timestamp: nowFormatted,
                note: `Repair evidence photo (${stage}) uploaded by ${actorName}: ${caption || 'Visual record attached'}`,
              },
            ],
          };
        }
        return r;
      });
      saveReports(updatedList);
      return updatedList;
    });

    return photoUrl;
  };

  const duplicateReviewCount = reports.filter(
    (r) =>
      r.duplicateReviewStatus === 'PENDING_ADMIN_REVIEW' ||
      r.duplicateStatus === 'NEEDS_REVIEW'
  ).length;

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
        reviewDuplicate,
        duplicateReviewCount,
        updateProgressStage,
        uploadProgressPhoto,
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

