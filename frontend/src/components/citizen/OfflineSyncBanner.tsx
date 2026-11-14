import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Database,
  CloudUpload,
  MapPin,
  XCircle,
} from 'lucide-react';
import {
  getAllOfflineReports,
  getOfflineStats,
  deleteOfflineReport,
  OfflineReport,
  SyncStatus,
} from '../../services/offlineDb';
import { syncManager } from '../../services/syncManager';

export const OfflineSyncBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(syncManager.isOnline());
  const [isSyncing, setIsSyncing] = useState<boolean>(syncManager.getIsSyncing());
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    syncing: number;
    synced: number;
    failed: number;
    lastSyncTime?: string;
  }>({
    total: 0,
    pending: 0,
    syncing: 0,
    synced: 0,
    failed: 0,
    lastSyncTime: undefined,
  });
  const [offlineReports, setOfflineReports] = useState<OfflineReport[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [newStats, allReports] = await Promise.all([
        getOfflineStats(),
        getAllOfflineReports(),
      ]);
      setStats(newStats);
      setOfflineReports(allReports);
    } catch (err) {
      console.warn('Error loading offline sync state:', err);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to SyncManager events
    const unsubscribe = syncManager.subscribe((event) => {
      setIsOnline(syncManager.isOnline());
      setIsSyncing(syncManager.getIsSyncing());
      if (event.message) {
        setStatusMessage(event.message);
      }
      loadData();
    });

    // Also listen to general window online/offline events
    const handleNetChange = () => {
      setIsOnline(navigator.onLine);
      loadData();
    };
    window.addEventListener('online', handleNetChange);
    window.addEventListener('offline', handleNetChange);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleNetChange);
      window.removeEventListener('offline', handleNetChange);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setStatusMessage('Initiating immediate synchronization with MongoDB Atlas...');
    await syncManager.syncPendingReports();
    await loadData();
  };

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return;
    try {
      await deleteOfflineReport(reportToDelete);
      setReportToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete offline report:', err);
    }
  };

  const getSyncStatusBadge = (status: SyncStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            <span>PENDING</span>
          </span>
        );
      case 'SYNCING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1 animate-pulse">
            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
            <span>SYNCING</span>
          </span>
        );
      case 'SYNCED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>SYNCED</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>FAILED</span>
          </span>
        );
    }
  };

  // Determine current headline state
  let headlineTitle = 'Connected – All reports synchronized.';
  let headlineDesc = 'Your device is online and synchronized with the municipal database.';
  let statusColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';

  if (!isOnline) {
    headlineTitle = 'No internet connection – Your reports are safely stored locally.';
    headlineDesc = 'Reports submitted now will be stored in IndexedDB and uploaded when network is restored.';
    statusColor = 'text-amber-400 border-amber-500/30 bg-amber-950/20';
  } else if (isSyncing) {
    headlineTitle = `Synchronizing ${stats.pending + stats.syncing} pending report${stats.pending + stats.syncing === 1 ? '' : 's'}...`;
    headlineDesc = 'Uploading binary image payloads and running dual-engine YOLO analysis.';
    statusColor = 'text-blue-400 border-blue-500/30 bg-blue-950/20';
  } else if (stats.failed > 0) {
    headlineTitle = 'Some reports could not be synchronized. They will be retried automatically.';
    headlineDesc = 'A temporary network glitch occurred. You can click "Sync Now" to retry immediately.';
    statusColor = 'text-red-400 border-red-500/30 bg-red-950/20';
  } else if (stats.pending > 0) {
    headlineTitle = `${stats.pending} pending report${stats.pending === 1 ? '' : 's'} awaiting background synchronization.`;
    headlineDesc = 'Ready for immediate transmission to MongoDB Atlas.';
    statusColor = 'text-amber-400 border-amber-500/30 bg-amber-950/20';
  }

  // Format last sync time
  const formattedLastSync = stats.lastSyncTime
    ? new Date(stats.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Never';

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${statusColor} shadow-xl`}>
      {/* Main Top Banner */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Connection Status & State Title */}
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isOnline
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}
          >
            {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-neutral-400">
                {isOnline ? 'ONLINE (MONGODB ATLAS CONNECTED)' : 'OFFLINE (LOCAL-FIRST ACTIVE)'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {headlineTitle}
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed max-w-xl">
              {statusMessage || headlineDesc}
            </p>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {/* Manual Sync Trigger */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={!isOnline || isSyncing || (stats.pending === 0 && stats.failed === 0)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold font-mono bg-[#d97757] hover:bg-[#c66848] text-white shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Upload pending reports immediately"
          >
            <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          {/* Toggle Pending Queue Drawer */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-2 rounded-xl text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-[#d97757]" />
            <span>Queue ({stats.total})</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Sync Telemetry Strip */}
      <div className="px-4 py-2.5 bg-black/40 border-t border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono text-neutral-400">
        <div>
          Total Local:{' '}
          <span className="text-white font-bold">{stats.total}</span>
        </div>
        <div>
          Pending:{' '}
          <span className={`font-bold ${stats.pending > 0 ? 'text-amber-400' : 'text-neutral-400'}`}>
            {stats.pending}
          </span>
        </div>
        <div>
          Synced:{' '}
          <span className="text-emerald-400 font-bold">{stats.synced}</span>
        </div>
        <div>
          Failed:{' '}
          <span className={`font-bold ${stats.failed > 0 ? 'text-red-400' : 'text-neutral-400'}`}>
            {stats.failed}
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1 text-right truncate">
          Last Sync: <span className="text-white">{formattedLastSync}</span>
        </div>
      </div>

      {/* Expandable Local Storage & Pending Queue List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-[#0b0c10] p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#d97757]" />
                <span>IndexedDB Persistent Storage Ledger ({offlineReports.length})</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                Dexie.js · Blobs stored in browser
              </span>
            </div>

            {offlineReports.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500 font-mono rounded-xl bg-white/[0.02] border border-white/5">
                No local reports currently stored in IndexedDB.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {offlineReports.map((report) => {
                  const blobUrl = URL.createObjectURL(report.imageBlob);

                  return (
                    <div
                      key={report.id}
                      className="p-3 rounded-xl bg-[#12131a] border border-white/5 hover:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-black shrink-0 relative">
                          <img
                            src={report.annotatedImageUrl || blobUrl}
                            alt="Road defect"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Telemetry info */}
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-white text-xs">{report.id}</span>
                            {getSyncStatusBadge(report.syncStatus)}
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-white/10 text-neutral-300">
                              {report.category} · {report.severity}
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-1 truncate max-w-md">
                            <MapPin className="w-3 h-3 text-[#d97757] shrink-0" />
                            <span className="truncate">{report.address}</span>
                          </div>
                          {report.lastSyncError && (
                            <div className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                              <XCircle className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">Error: {report.lastSyncError}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {report.syncStatus === 'SYNCED' && report.backendReportId && (
                          <span className="text-[10px] font-mono text-emerald-400">
                            MongoDB Atlas: {report.backendReportId.substring(0, 8)}...
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setReportToDelete(report.id)}
                          className="w-7 h-7 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 flex items-center justify-center text-red-400 hover:text-red-300 transition cursor-pointer"
                          title="Delete local report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-2xl bg-[#14151e] border border-red-500/40 p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Delete Local Report?</h4>
                <p className="text-xs text-neutral-400">
                  This will remove report <span className="font-mono text-white">{reportToDelete}</span> from this device.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
