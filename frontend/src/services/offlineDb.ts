import Dexie, { Table } from 'dexie';

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface OfflineReport {
  id: string; // Client-generated UUID (client_report_id)
  userId?: string;
  userName?: string;
  imageBlob: Blob; // Stored as binary Blob in IndexedDB (NOT Base64)
  imageFileName: string;
  imageMimeType: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  isManualCorrection: boolean;
  accuracyMeters?: number;
  submittedAt: string; // ISO 8601 string
  updatedAt: string;
  syncStatus: SyncStatus;
  retryCount: number;
  lastSyncError?: string;
  lastAttemptedAt?: string;
  backendReportId?: string; // MongoDB Atlas report ID once synced
  annotatedImageUrl?: string;
  aiVerified?: boolean;
  pciScore?: number;
  canonicalIssueId?: string;
  isDuplicate?: boolean;
  duplicateStatus?: string;
  // Geotag-Verified Telemetry Fields
  altitude?: number;
  gpsAccuracy?: number;
  captureTimestamp?: string;
  uploadTimestamp?: string;
  captureMethod?: 'in_app_camera' | 'existing_geotagged_upload' | 'standard_upload';
  geotagVerified?: boolean;
  exifMetadataAvailable?: boolean;
  cameraMake?: string;
  cameraModel?: string;
  originalImageBlob?: Blob;
  stampedImageBlob?: Blob;
}

export class RoadGuardOfflineDB extends Dexie {
  reports!: Table<OfflineReport, string>;

  constructor() {
    super('RoadGuardOfflineDB');
    this.version(1).stores({
      reports: 'id, syncStatus, submittedAt, userId, category, severity',
    });
  }
}

export const offlineDb = new RoadGuardOfflineDB();

/**
 * Save a newly submitted report to IndexedDB.
 * Defaults to 'PENDING' status and 0 retries.
 */
export async function saveOfflineReport(
  data: Omit<OfflineReport, 'syncStatus' | 'retryCount' | 'updatedAt'>
): Promise<OfflineReport> {
  const now = new Date().toISOString();
  const record: OfflineReport = {
    ...data,
    syncStatus: 'PENDING',
    retryCount: 0,
    updatedAt: now,
  };

  await offlineDb.reports.put(record);
  return record;
}

/**
 * Get all reports waiting for sync (PENDING or FAILED), sorted by original submission timestamp ascending.
 */
export async function getPendingReports(): Promise<OfflineReport[]> {
  return await offlineDb.reports
    .where('syncStatus')
    .anyOf('PENDING', 'FAILED')
    .sortBy('submittedAt');
}

/**
 * Get all offline reports regardless of status.
 */
export async function getAllOfflineReports(): Promise<OfflineReport[]> {
  return await offlineDb.reports.orderBy('submittedAt').reverse().toArray();
}

/**
 * Get a single offline report by UUID.
 */
export async function getOfflineReportById(id: string): Promise<OfflineReport | undefined> {
  return await offlineDb.reports.get(id);
}

/**
 * Update the synchronization status and any metadata of an offline report.
 */
export async function updateReportSyncStatus(
  id: string,
  syncStatus: SyncStatus,
  metadata?: Partial<OfflineReport>
): Promise<void> {
  await offlineDb.reports.update(id, {
    syncStatus,
    updatedAt: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Delete a local report (with user confirmation).
 */
export async function deleteOfflineReport(id: string): Promise<void> {
  await offlineDb.reports.delete(id);
}

/**
 * Delete all successfully synced reports to reclaim local storage.
 */
export async function clearSyncedReports(): Promise<number> {
  const synced = await offlineDb.reports.where('syncStatus').equals('SYNCED').toArray();
  const count = synced.length;
  await offlineDb.reports.bulkDelete(synced.map((r) => r.id));
  return count;
}

/**
 * Aggregated synchronization statistics.
 */
export async function getOfflineStats(): Promise<{
  total: number;
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
  lastSyncTime?: string;
}> {
  const all = await offlineDb.reports.toArray();
  const total = all.length;
  const pending = all.filter((r) => r.syncStatus === 'PENDING').length;
  const syncing = all.filter((r) => r.syncStatus === 'SYNCING').length;
  const synced = all.filter((r) => r.syncStatus === 'SYNCED').length;
  const failed = all.filter((r) => r.syncStatus === 'FAILED').length;

  const syncedItems = all
    .filter((r) => r.syncStatus === 'SYNCED' && r.updatedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return {
    total,
    pending,
    syncing,
    synced,
    failed,
    lastSyncTime: syncedItems[0]?.updatedAt,
  };
}

