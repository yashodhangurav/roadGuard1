import {
  OfflineReport,
  getPendingReports,
  updateReportSyncStatus,
  getOfflineStats,
} from './offlineDb';

// Backend sync URL (defaults to localhost:8000 in development)
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export type SyncEventCallback = (event: {
  type: 'SYNC_START' | 'SYNC_PROGRESS' | 'SYNC_SUCCESS' | 'SYNC_FAILED' | 'ONLINE_STATUS_CHANGE';
  report?: OfflineReport;
  stats?: any;
  message?: string;
}) => void;

class SyncManager {
  private isSyncing = false;
  private listeners: Set<SyncEventCallback> = new Set();
  private online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private retryTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Listen for Service Worker background sync messages
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_REPORTS_REQUESTED') {
            console.log('[SyncManager] Background sync message received from SW');
            this.syncPendingReports();
          }
        });
      }

      // Initial check on boot
      setTimeout(() => {
        if (this.isOnline()) {
          this.syncPendingReports();
        }
      }, 1500);
    }
  }

  public isOnline(): boolean {
    return this.online;
  }

  public subscribe(callback: SyncEventCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(event: {
    type: 'SYNC_START' | 'SYNC_PROGRESS' | 'SYNC_SUCCESS' | 'SYNC_FAILED' | 'ONLINE_STATUS_CHANGE';
    report?: OfflineReport;
    stats?: any;
    message?: string;
  }) {
    this.listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('Error in sync listener callback:', err);
      }
    });

    // Also dispatch a DOM window event for general React components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('roadguard:sync_update', { detail: event }));
    }
  }

  private handleOnline = () => {
    console.log('[SyncManager] Browser reported ONLINE');
    this.online = true;
    this.notify({ type: 'ONLINE_STATUS_CHANGE', message: 'Internet connection restored.' });
    this.syncPendingReports();
  };

  private handleOffline = () => {
    console.log('[SyncManager] Browser reported OFFLINE');
    this.online = false;
    this.notify({ type: 'ONLINE_STATUS_CHANGE', message: 'Internet connection lost. Local-first mode active.' });
  };

  /**
   * Request browser Background Sync API if supported.
   * Gracefully falls back to online-event sync on non-supporting browsers (e.g. Safari, iOS).
   */
  public async requestBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Register tag for Background Sync
        await (registration as any).sync.register('roadguard-report-sync');
        console.log('[SyncManager] Registered Background Sync: roadguard-report-sync');
        return;
      } catch (e) {
        console.warn('[SyncManager] Background Sync registration failed, using immediate fallback:', e);
      }
    }

    // Fallback: Immediate sync if online
    if (this.isOnline()) {
      this.syncPendingReports();
    }
  }

  /**
   * Ping backend to verify real connectivity before bulk uploading.
   */
  public async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Upload all pending reports in chronological order.
   * Protected with concurrency lock so only one sync run executes at a time.
   */
  public async syncPendingReports(): Promise<{ syncedCount: number; failedCount: number }> {
    if (this.isSyncing) {
      console.log('[SyncManager] Sync already in progress, skipping duplicate invocation.');
      return { syncedCount: 0, failedCount: 0 };
    }

    if (!this.isOnline()) {
      console.log('[SyncManager] Offline, holding reports in IndexedDB queue.');
      return { syncedCount: 0, failedCount: 0 };
    }

    // Verify backend is reachable
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      console.warn('[SyncManager] Backend unreachable despite online flag. Retrying in 10s...');
      this.scheduleRetry(10000);
      return { syncedCount: 0, failedCount: 0 };
    }

    this.isSyncing = true;
    let syncedCount = 0;
    let failedCount = 0;

    try {
      const pending = await getPendingReports();
      if (pending.length === 0) {
        this.isSyncing = false;
        return { syncedCount: 0, failedCount: 0 };
      }

      this.notify({
        type: 'SYNC_START',
        message: `Synchronizing ${pending.length} pending report${pending.length === 1 ? '' : 's'} with MongoDB Atlas...`,
      });

      for (const report of pending) {
        // Mark as SYNCING in IndexedDB
        await updateReportSyncStatus(report.id, 'SYNCING', {
          lastAttemptedAt: new Date().toISOString(),
        });

        try {
          const syncResult = await this.uploadSingleReport(report);

          // Success confirmation from FastAPI + MongoDB Atlas
          await updateReportSyncStatus(report.id, 'SYNCED', {
            backendReportId: syncResult.report_id,
            annotatedImageUrl: syncResult.annotated_image_url,
            aiVerified: syncResult.ai_verified,
            pciScore: syncResult.pci_score,
            canonicalIssueId: syncResult.canonical_issue_id,
            isDuplicate: syncResult.is_duplicate,
            duplicateStatus: syncResult.duplicate_status,
            lastSyncError: undefined,
          });

          syncedCount++;
          const stats = await getOfflineStats();
          this.notify({
            type: 'SYNC_PROGRESS',
            report: { ...report, syncStatus: 'SYNCED' },
            stats,
            message: `Report ${report.id} synced successfully to MongoDB Atlas!`,
          });
        } catch (uploadError: any) {
          failedCount++;
          const newRetryCount = (report.retryCount || 0) + 1;
          const errorMsg = uploadError.message || 'Network error during upload';

          console.error(`[SyncManager] Failed to sync report ${report.id}:`, uploadError);

          await updateReportSyncStatus(report.id, 'FAILED', {
            retryCount: newRetryCount,
            lastSyncError: errorMsg,
          });

          this.notify({
            type: 'SYNC_FAILED',
            report: { ...report, syncStatus: 'FAILED', lastSyncError: errorMsg },
            message: `Failed to sync report ${report.id}: ${errorMsg}`,
          });

          // If network went down completely, stop processing further items in this run
          if (!this.isOnline()) {
            break;
          }
        }
      }

      const finalStats = await getOfflineStats();
      this.notify({
        type: 'SYNC_SUCCESS',
        stats: finalStats,
        message: `${syncedCount} report${syncedCount === 1 ? '' : 's'} synchronized with MongoDB Atlas.`,
      });
    } finally {
      this.isSyncing = false;
      if (failedCount > 0) {
        this.scheduleRetry(15000);
      }
    }

    return { syncedCount, failedCount };
  }

  /**
   * Send single report as multipart/form-data to POST /api/reports/sync.
   */
  private async uploadSingleReport(report: OfflineReport): Promise<any> {
    const formData = new FormData();

    // Attach binary image Blob
    const file = new File(
      [report.imageBlob],
      report.imageFileName || `${report.id}.jpg`,
      { type: report.imageMimeType || 'image/jpeg' }
    );
    formData.append('image', file);

    // Form fields
    formData.append('client_report_id', report.id);
    formData.append('category', report.category);
    formData.append('severity', report.severity);
    formData.append('description', report.description || '');
    formData.append('latitude', String(report.latitude));
    formData.append('longitude', String(report.longitude));
    formData.append('address', report.address || '');
    formData.append('city', report.city || 'San Francisco');
    formData.append('is_manual_correction', String(report.isManualCorrection));
    if (report.accuracyMeters != null) {
      formData.append('accuracy_meters', String(report.accuracyMeters));
    }
    if (report.userId) {
      formData.append('citizen_id', report.userId);
    }
    if (report.userName) {
      formData.append('citizen_name', report.userName);
    }
    formData.append('submitted_at', report.submittedAt);

    // Geotag Telemetry & In-App Camera Dual Photo Support
    if (report.originalImageBlob) {
      const origFile = new File(
        [report.originalImageBlob],
        `raw_${report.id}.jpg`,
        { type: 'image/jpeg' }
      );
      formData.append('original_image', origFile);
    }
    if (report.altitude != null) {
      formData.append('altitude', String(report.altitude));
    }
    if (report.captureTimestamp) {
      formData.append('capture_timestamp', report.captureTimestamp);
    }
    formData.append('capture_method', report.captureMethod || 'in_app_camera');
    if (report.cameraMake) {
      formData.append('camera_make', report.cameraMake);
    }
    if (report.cameraModel) {
      formData.append('camera_model', report.cameraModel);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for large uploads/inference

    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/sync`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errText = 'Server error';
        try {
          const errJson = await response.json();
          errText = errJson.detail || errJson.message || response.statusText;
        } catch {
          errText = `HTTP ${response.status} ${response.statusText}`;
        }
        throw new Error(errText);
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private scheduleRetry(delayMs: number) {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (this.isOnline()) {
        this.syncPendingReports();
      }
    }, delayMs);
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }
}

export const syncManager = new SyncManager();
