import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  MapPin,
  CheckCircle2,
  XCircle,
  Truck,
  Maximize2,
  Minimize2,
  Cpu,
  History,
  FileText,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Wrench,
  Gauge,
  Eye,
  Crosshair,
  Layers,
  Link2,
  PlusCircle,
  Calendar,
  Camera,
  Upload,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { ReportStatus, CanonicalProgressStage, useReports } from '../../context/ReportsContext';
import { SeverityBadge, StatusBadge } from './SeverityBadge';
import { RoadLocationMap } from '../citizen/RoadLocationMap';
import {
  analyzeRoadImage,
  DetectionResult,
  downloadInspectionPdf,
} from '../../services/detectionApi';
import { MUNICIPAL_STAFF_PROFILES, MunicipalStaffProfile } from '../../data/adminDemoData';
import {
  Maintainer,
  listMaintainers,
  assignReportToMaintainer,
  submitManualRepairDecision,
} from '../../services/maintainerService';

interface ReportDetailsModalProps {
  reportId: string | null;
  onClose: () => void;
}

const PROGRESS_STAGES_CONFIG: { stage: CanonicalProgressStage; label: string; number: number; desc: string }[] = [
  { stage: 'Reported', label: 'Reported', number: 1, desc: 'Logged with GNSS' },
  { stage: 'Admin verified', label: 'Admin Verified', number: 2, desc: 'Severity confirmed' },
  { stage: 'Assigned to department', label: 'Assigned', number: 3, desc: 'Dept dispatched' },
  { stage: 'Scheduled', label: 'Scheduled', number: 4, desc: 'Target date set' },
  { stage: 'Repair in progress', label: 'In Progress', number: 5, desc: 'Crews active on site' },
  { stage: 'Repair completed', label: 'Completed', number: 6, desc: 'Hot-mix compacted' },
  { stage: 'Final verification', label: 'QA Inspection', number: 7, desc: 'Quality audit signed' },
  { stage: 'Closed', label: 'Closed', number: 8, desc: 'ASTM D6433 Restored' },
];

export const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  reportId,
  onClose,
}) => {
  const {
    getReportById,
    updateReportStatus,
    reviewDuplicate,
    updateProgressStage,
    uploadProgressPhoto,
  } = useReports();
  const report = reportId ? getReportById(reportId) : undefined;

  // Visual & Inspection Studio State
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [viewMode, setViewMode] = useState<'annotated' | 'split' | 'raw'>('annotated');
  const [photoVariant, setPhotoVariant] = useState<'stamped' | 'original'>('stamped');
  const [showBoxes, setShowBoxes] = useState(true);
  const [showTags, setShowTags] = useState(true);

  // AI Detection State
  const [isScanning, setIsScanning] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Administrative Action State
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Duplicate submission or verified resolved');
  const [customRejectionText, setCustomRejectionText] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // 8-Stage Progress Lifecycle & Department Staff Persona State
  const [activeStaff, setActiveStaff] = useState<MunicipalStaffProfile>(MUNICIPAL_STAFF_PROFILES[0]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedDept, setSelectedDept] = useState('Rapid Patch Division');
  const [customCrewInput, setCustomCrewInput] = useState('');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [scheduleNote, setScheduleNote] = useState('');
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [reopenReasonText, setReopenReasonText] = useState('Edge joint gap and compaction deficit observed on site.');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadPhotoStage, setUploadPhotoStage] = useState<'during' | 'after' | 'before'>('during');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Maintainer Assignment & AI Verification State
  const [maintainersList, setMaintainersList] = useState<Maintainer[]>([]);
  const [selectedMaintainerId, setSelectedMaintainerId] = useState<string>('');
  const [assignmentPriority, setAssignmentPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [adminInstructions, setAdminInstructions] = useState<string>('');
  const [manualReviewNotes, setManualReviewNotes] = useState<string>('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);

  useEffect(() => {
    listMaintainers('ACTIVE').then(setMaintainersList).catch(() => {});
  }, []);

  // Run or load AI scan when report changes
  useEffect(() => {
    if (!report) return;

    let isMounted = true;
    const runScan = async () => {
      setIsScanning(true);
      try {
        const res = await analyzeRoadImage(report.imageUrl);
        if (isMounted) {
          setDetectionResult(res);
          setSelectedDefectId(res.defects[0]?.id || null);
        }
      } catch (err) {
        console.warn('AI analysis error in ReportDetailsModal:', err);
      } finally {
        if (isMounted) setIsScanning(false);
      }
    };

    runScan();
    return () => {
      isMounted = false;
    };
  }, [report?.id, report?.imageUrl]);

  if (!report) return null;

  const handleRescan = async () => {
    setIsScanning(true);
    try {
      const res = await analyzeRoadImage(report.imageUrl);
      setDetectionResult(res);
      setSelectedDefectId(res.defects[0]?.id || null);
      setActionSuccessMsg('AI inference re-calculated with dual-engine ensemble.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err) {
      console.warn('Rescan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateStatus = (
    newStatus: ReportStatus,
    notes?: string,
    rejectReason?: string
  ) => {
    updateReportStatus(
      report.id,
      newStatus,
      notes || `Status updated to ${newStatus} by Municipal Road Administrator.`,
      rejectReason
    );
    setActionSuccessMsg(`Report ${report.id} updated to ${newStatus}`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleConfirmRejection = () => {
    const fullReason =
      rejectionReason === 'Other'
        ? customRejectionText.trim() || 'Unspecified administrative rejection.'
        : rejectionReason + (customRejectionText ? `: ${customRejectionText}` : '');

    handleUpdateStatus('Rejected', undefined, fullReason);
    setShowRejectDialog(false);
    setCustomRejectionText('');
  };

  // 8-Stage Progress Lifecycle Handlers
  const handleAdvanceStage = async (
    targetStage: CanonicalProgressStage,
    extraData?: {
      department?: string;
      crew?: string;
      expected_completion_date?: string;
      notes?: string;
      reopen_reason?: string;
    }
  ) => {
    if (!report) return;

    await updateProgressStage(report.id, targetStage, {
      stage: targetStage,
      actor_name: activeStaff.name,
      actor_role: activeStaff.role,
      department: extraData?.department || activeStaff.department,
      crew: extraData?.crew || activeStaff.crew || report.assignedCrew,
      expected_completion_date: extraData?.expected_completion_date || report.expectedCompletionDate,
      notes: extraData?.notes,
      reopen_reason: extraData?.reopen_reason,
    });

    setActionSuccessMsg(`Stage advanced to ${targetStage} by ${activeStaff.name} (${activeStaff.role})`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleConfirmAssign = async () => {
    if (!report) return;
    const assignedM = maintainersList.find((m) => m.id === selectedMaintainerId);
    const maintainerName = assignedM ? assignedM.name : (customCrewInput.trim() || `${selectedDept} Unit #1`);

    if (selectedMaintainerId) {
      try {
        await assignReportToMaintainer(report.id, {
          maintainer_id: selectedMaintainerId,
          priority: assignmentPriority,
          admin_instructions: adminInstructions,
          target_completion_date: scheduleDate,
          assigned_by: activeStaff.name,
        });
      } catch (e) {
        console.warn('Backend assign dispatch completed or fallback used', e);
      }
    }

    await handleAdvanceStage('Assigned to department', {
      department: selectedDept,
      crew: maintainerName,
      expected_completion_date: scheduleDate,
      notes: `Dispatched to ${selectedDept} · Assigned Maintainer: ${maintainerName} (${assignmentPriority} Priority). Instructions: ${adminInstructions || 'Standard patch work.'}`,
    });

    report.assignedMaintainerId = selectedMaintainerId || undefined;
    report.assignedMaintainerName = maintainerName;
    report.assignmentPriority = assignmentPriority;
    report.adminInstructions = adminInstructions;
    report.assignedCrew = maintainerName;

    setShowAssignDialog(false);
  };

  const handleManualDecision = async (action: 'APPROVE' | 'REJECT') => {
    if (!report) return;
    setIsSubmittingDecision(true);
    try {
      await submitManualRepairDecision(report.id, action, manualReviewNotes, activeStaff.name);
      await handleAdvanceStage(action === 'APPROVE' ? 'Closed' : 'Reopened', {
        notes: manualReviewNotes || (action === 'APPROVE' ? 'Admin approved AI repair audit.' : 'Admin rejected repair; defect persists.'),
      });
      report.aiVerificationStatus = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
      setActionSuccessMsg(`Repair decision applied: ${action === 'APPROVE' ? 'Approved & Resolved' : 'Rejected & Reopened'}`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error recording repair decision');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleConfirmSchedule = async () => {
    if (!report) return;
    await handleAdvanceStage('Scheduled', {
      expected_completion_date: scheduleDate,
      notes: scheduleNote.trim() || `Field repair targeted for completion on ${scheduleDate}.`,
    });
    setShowScheduleDialog(false);
  };

  const handleConfirmReopen = async () => {
    if (!report) return;
    const reason = reopenReasonText.trim() || 'Incomplete asphalt compaction or joint bonding gap observed during inspection.';
    await handleAdvanceStage('Reopened', {
      reopen_reason: reason,
      notes: `Work order REOPENED for corrective repair: ${reason}`,
    });
    setShowReopenDialog(false);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleUploadPhotoSubmit = async () => {
    if (!report || !photoFile) return;
    setIsUploadingPhoto(true);

    try {
      await uploadProgressPhoto(
        report.id,
        photoFile,
        uploadPhotoStage,
        photoCaption.trim() || `${uploadPhotoStage.toUpperCase()} repair photograph uploaded by ${activeStaff.name}`,
        activeStaff.name,
        activeStaff.role,
        activeStaff.department
      );
      setActionSuccessMsg(`${uploadPhotoStage.charAt(0).toUpperCase() + uploadPhotoStage.slice(1)} photo uploaded successfully!`);
      setShowPhotoModal(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoCaption('');
    } catch (err) {
      console.warn('Error uploading photo:', err);
    } finally {
      setIsUploadingPhoto(false);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
  };

  const handleExportPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      // Use live detection result if ready, or synthetic fallback
      const payload: DetectionResult = detectionResult || {
        imageId: report.id,
        fileName: `${report.id}.jpg`,
        imageUrl: report.imageUrl,
        annotatedImageUrl: report.annotatedImageUrl,
        analyzedAt: report.submittedAt,
        defects: [
          {
            id: `DEF-${report.id}-01`,
            type: (report.aiDetection as any) || (report.category as any),
            severity: report.severity,
            confidence: report.aiConfidence || 94.2,
            box: { x: 25, y: 30, width: 50, height: 45 },
            dimensions: report.dimensions || {
              widthCm: report.severity === 'Critical' ? 72 : 45,
              heightCm: report.severity === 'Critical' ? 58 : 35,
              estimatedDepthMm: report.severity === 'Critical' ? 86 : 42,
              areaCm2: report.severity === 'Critical' ? 4176 : 1575,
            },
            urgency: report.severity === 'Critical' ? 'Immediate' : 'Priority (48h)',
            repairMethod: report.repairMethod || 'Hot-mix asphalt patch with edge milling and tack coat bonding',
          },
        ],
        stats: {
          totalDefects: 1,
          potholesCount: report.category === 'Pothole' ? 1 : 0,
          cracksCount: report.category.includes('Crack') ? 1 : 0,
          deteriorationCount: 0,
          criticalCount: report.severity === 'Critical' ? 1 : 0,
          overallCondition: report.severity === 'Critical' ? 'Critical' : report.severity === 'High' ? 'Poor' : 'Fair',
          hazardIndex: report.severity === 'Critical' ? 88 : 65,
          pciScore: report.severity === 'Critical' ? 46 : 68,
          estimatedPatchTons: report.severity === 'Critical' ? 1.05 : 0.65,
          scanDurationMs: 44,
        },
        backend: 'Live API',
        backendEndpoint: '/api/detect',
        modelInfo: {
          name: 'YOLO11n-RoadHazard-Ensemble',
          version: 'v2.0.0-dual-engine',
          inferenceTimeMs: 44,
        },
      };

      await downloadInspectionPdf(payload, {
        address: report.location.address,
        latitude: report.location.latitude,
        longitude: report.location.longitude,
      });
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const activeDefect =
    detectionResult?.defects.find((d) => d.id === selectedDefectId) ||
    detectionResult?.defects[0];

  const pciScore = detectionResult?.stats.pciScore ?? (report.severity === 'Critical' ? 44 : 68);
  const pciCondition =
    pciScore < 40 ? 'Critical' : pciScore < 55 ? 'Poor' : pciScore < 70 ? 'Fair' : pciScore < 85 ? 'Satisfactory' : 'Good';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-6xl rounded-3xl bg-[#0d0e14] border border-white/10 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-[#111218]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d97757]/20 border border-[#d97757]/40 flex items-center justify-center text-[#d97757] shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-base">{report.id}</span>
                <SeverityBadge severity={report.severity} />
                <StatusBadge status={report.status} />
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Submitted by <span className="text-white font-medium">{report.citizenName}</span> ({report.citizenId}) · {report.submittedAt}
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2">
            {/* Re-scan AI inference button */}
            <button
              type="button"
              onClick={handleRescan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-xs font-mono transition cursor-pointer disabled:opacity-50"
              title="Re-run dual engine YOLO inference"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-[#d97757] ${isScanning ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Re-scan AI'}</span>
            </button>

            {/* Official PDF Export Button */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-mono font-semibold shadow-md transition cursor-pointer disabled:opacity-50"
              title="Download ASTM D6433 Work Order Report (PDF)"
            >
              <FileText className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? 'Building PDF...' : 'Export PDF'}</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {actionSuccessMsg && (
          <div className="bg-emerald-950/60 border-b border-emerald-500/40 px-4 py-2 text-xs font-mono text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Body Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Main Grid: Left AI Visual Inspection Studio, Right Pavement Engineering Telemetry & Dispatch Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Visual Evidence & AI Studio (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Studio Mode Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-[#111218] border border-white/10">
                <div className="flex items-center gap-1.5 bg-[#090a0d] p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('annotated')}
                    className={`px-3 py-1 rounded-lg font-mono text-xs transition cursor-pointer ${
                      viewMode === 'annotated'
                        ? 'bg-[#d97757] text-white font-semibold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    AI Reticle
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('split')}
                    className={`px-3 py-1 rounded-lg font-mono text-xs transition cursor-pointer ${
                      viewMode === 'split'
                        ? 'bg-[#d97757] text-white font-semibold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Split Compare
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('raw')}
                    className={`px-3 py-1 rounded-lg font-mono text-xs transition cursor-pointer ${
                      viewMode === 'raw'
                        ? 'bg-[#d97757] text-white font-semibold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Raw Photo
                  </button>

                  {/* Stamped HUD vs Raw Frame Switcher */}
                  {report.originalImageUrl && (
                    <div className="flex items-center gap-1 pl-1.5 border-l border-white/10">
                      <button
                        type="button"
                        onClick={() => setPhotoVariant('stamped')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                          photoVariant === 'stamped'
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                        title="Display GPS Stamped Photo with permanent telemetry watermark"
                      >
                        Stamped HUD
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoVariant('original')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                          photoVariant === 'original'
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                        title="Display un-stamped raw camera frame"
                      >
                        Raw Frame
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pr-2">
                  <label className="flex items-center gap-1.5 text-neutral-300 font-mono text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBoxes}
                      onChange={(e) => setShowBoxes(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-black border-white/20 text-[#d97757] accent-[#d97757]"
                    />
                    <span>Boxes</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-neutral-300 font-mono text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTags}
                      onChange={(e) => setShowTags(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-black border-white/20 text-[#d97757] accent-[#d97757]"
                    />
                    <span>Tags</span>
                  </label>
                  <button
                    onClick={() => setIsPhotoZoomed(!isPhotoZoomed)}
                    className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1 pl-2 border-l border-white/10"
                  >
                    {isPhotoZoomed ? (
                      <>
                        <Minimize2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Fit</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Zoom</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Photo Frame / Split Comparison Canvas */}
              {viewMode === 'split' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-neutral-400 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{report.originalImageUrl ? 'Unstamped Raw Frame' : 'Citizen Raw Photo'}</span>
                      </span>
                      {report.originalImageUrl && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-neutral-300">Evidence Archive</span>
                      )}
                    </div>
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-black">
                      <img
                        src={report.originalImageUrl || report.imageUrl}
                        alt="Raw evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-[#d97757] uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Crosshair className="w-3 h-3" />
                        <span>GPS-Stamped & AI Reticle</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#d97757]/20 text-[#d97757]">Active Model</span>
                    </div>
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#d97757]/40 bg-black">
                      <img
                        src={report.annotatedImageUrl || detectionResult?.annotatedImageUrl || report.stampedImageUrl || report.imageUrl}
                        alt="AI annotated photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`relative rounded-2xl overflow-hidden border border-white/15 bg-black transition-all group select-none ${
                    isPhotoZoomed ? 'aspect-[4/3] scale-101' : 'aspect-[16/10]'
                  }`}
                >
                  <img
                    src={
                      viewMode === 'raw'
                        ? (photoVariant === 'original' && report.originalImageUrl)
                          ? report.originalImageUrl
                          : (report.stampedImageUrl || report.imageUrl)
                        : (report.annotatedImageUrl || detectionResult?.annotatedImageUrl || (photoVariant === 'original' && report.originalImageUrl ? report.originalImageUrl : (report.stampedImageUrl || report.imageUrl)))
                    }
                    alt={report.category}
                    className="w-full h-full object-cover"
                  />

                  {/* Scanning Laser Animation Bar */}
                  {isScanning && (
                    <motion.div
                      initial={{ top: '0%' }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#d97757] to-transparent shadow-[0_0_20px_#d97757] z-30 pointer-events-none"
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-0.5 rounded-full bg-black/90 border border-[#d97757] text-[#d97757] text-[10px] font-mono whitespace-nowrap shadow-xl">
                        SCANNING ROAD DISTRESS · YOLO ENSEMBLE
                      </div>
                    </motion.div>
                  )}

                  {/* Dynamic Bounding Boxes Overlay for Annotated Mode */}
                  {viewMode === 'annotated' &&
                    showBoxes &&
                    detectionResult?.defects.map((defect) => {
                      const isSelected = activeDefect?.id === defect.id;
                      const isCritical = defect.severity === 'Critical';

                      return (
                        <div
                          key={defect.id}
                          onClick={() => setSelectedDefectId(defect.id)}
                          style={{
                            position: 'absolute',
                            left: `${defect.box.x}%`,
                            top: `${defect.box.y}%`,
                            width: `${defect.box.width}%`,
                            height: `${defect.box.height}%`,
                          }}
                          className={`rounded-xl transition-all cursor-pointer ${
                            isSelected
                              ? 'border-2 border-red-500 bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.5)] z-20'
                              : isCritical
                              ? 'border-2 border-red-500/80 bg-red-500/10 hover:bg-red-500/20'
                              : 'border-2 border-[#d97757]/80 bg-[#d97757]/10 hover:bg-[#d97757]/20'
                          }`}
                        >
                          {/* Corner targeting reticles */}
                          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white" />
                          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white" />
                          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white" />
                          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white" />

                          {/* HUD Label Tag */}
                          {showTags && (
                            <div
                              className={`absolute -top-6 left-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white shadow-md flex items-center gap-1 whitespace-nowrap ${
                                isCritical ? 'bg-red-600' : 'bg-[#d97757]'
                              }`}
                            >
                              <span>{defect.id}</span>
                              <span>·</span>
                              <span>{defect.type.toUpperCase()}</span>
                              <span>·</span>
                              <span>{defect.confidence.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {/* Bottom Model Telemetry HUD */}
                  <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center justify-between text-[10px] font-mono text-neutral-300">
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-[#d97757]" />
                      <span>{detectionResult?.modelInfo.name || 'YOLO11n-RoadHazard-Ensemble'}</span>
                    </div>
                    <span>
                      Inference: {detectionResult?.stats.scanDurationMs || 42} ms ·{' '}
                      {detectionResult?.defects.length || 1} defect(s)
                    </span>
                  </div>
                </div>
              )}

              {/* Detected Defects Itemized List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-[#d97757]" />
                    <span>Identified Pavement Defects ({detectionResult?.defects.length || 1})</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    CLICK DEFECT TO INSPECT TELEMETRY
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detectionResult?.defects && detectionResult.defects.length > 0 ? (
                    detectionResult.defects.map((d) => {
                      const isSelected = activeDefect?.id === d.id;
                      return (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDefectId(d.id)}
                          className={`p-3 rounded-2xl border transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#151722] border-[#d97757] shadow-lg'
                              : 'bg-[#111218] border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white">{d.type}</span>
                              <span className="text-[10px] font-mono text-[#d97757] font-semibold">({d.id})</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                              {d.confidence.toFixed(1)}%
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] font-mono text-neutral-400">
                            <div>
                              Size:{' '}
                              <span className="text-white">
                                {d.dimensions.widthCm}×{d.dimensions.heightCm} cm
                              </span>
                            </div>
                            <div>
                              Depth:{' '}
                              <span className="text-amber-400">
                                {d.dimensions.estimatedDepthMm} mm
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 p-3 rounded-2xl bg-[#111218] border border-white/10 text-xs font-mono text-neutral-400">
                      Analyzing defect telemetry...
                    </div>
                  )}
                </div>
              </div>

              {/* Active Defect Engineering Remediation Card */}
              {activeDefect && (
                <div className="p-4 rounded-2xl bg-[#111218] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-[#d97757]" />
                      <span>Civil Engineering Remediation: {activeDefect.type}</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d97757]/15 text-[#d97757] font-semibold">
                      Urgency: {activeDefect.urgency}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {activeDefect.repairMethod}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-[#0d0e14] border border-white/5">
                      <div className="text-[10px] text-neutral-500 uppercase">Cavity Depth</div>
                      <div className="text-sm font-bold text-amber-400 mt-0.5">
                        {activeDefect.dimensions.estimatedDepthMm} mm
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0d0e14] border border-white/5">
                      <div className="text-[10px] text-neutral-500 uppercase">Surface Area</div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {(activeDefect.dimensions.areaCm2 / 10000).toFixed(2)} m²
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0d0e14] border border-white/5">
                      <div className="text-[10px] text-neutral-500 uppercase">PCI Deduction</div>
                      <div className="text-sm font-bold text-red-400 mt-0.5">
                        -{activeDefect.severity === 'Critical' ? '46' : '28'} pts
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Suspected / Confirmed Duplicate Cluster Linkage Card */}
              {(report.duplicateStatus === 'NEEDS_REVIEW' ||
                report.duplicateStatus === 'CONFIRMED_DUPLICATE' ||
                report.canonicalIssueId ||
                report.isDuplicate) && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-[#111218] to-orange-950/20 border border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                        Hybrid Duplicate Detection Telemetry
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        report.duplicateStatus === 'CONFIRMED_DUPLICATE' || report.isDuplicate
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {report.duplicateStatus || (report.isDuplicate ? 'CONFIRMED_DUPLICATE' : 'NEEDS_REVIEW')}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {report.duplicateMatchReason || 'Candidate duplicate road hazard detected by GNSS proximity and OpenCV ORB feature matching.'}
                  </p>

                  {report.canonicalIssueId && (
                    <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-xs font-mono">
                      <span className="text-neutral-400">Canonical Ticket:</span>
                      <a
                        href="/admin/duplicates"
                        className="text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1"
                      >
                        <span>#{report.canonicalIssueId}</span>
                        <Eye className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Quick Decision Actions in Modal */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        await reviewDuplicate(report.id, 'CONFIRM_DUPLICATE', report.canonicalIssueId, 'Confirmed via inspector modal');
                        setActionSuccessMsg(`Report ${report.id} confirmed as duplicate of #${report.canonicalIssueId || 'CANONICAL'}.`);
                        setTimeout(() => setActionSuccessMsg(null), 3000);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Confirm Duplicate</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await reviewDuplicate(report.id, 'DISMISS_DUPLICATE', undefined, 'Marked as independent new issue via inspector modal');
                        setActionSuccessMsg(`Report ${report.id} marked as independent new issue.`);
                        setTimeout(() => setActionSuccessMsg(null), 3000);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span>Mark Distinct</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="p-3.5 rounded-2xl bg-[#111218] border border-white/5 text-xs">
                <div className="text-[10px] font-mono text-neutral-500 uppercase mb-1">
                  Citizen Submission Note
                </div>
                <p className="text-neutral-300 leading-relaxed italic">&ldquo;{report.description}&rdquo;</p>
              </div>
            </div>

            {/* RIGHT COLUMN: ASTM D6433 Pavement Health, GNSS Map, Crew Assignment, & Status Actions (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* ASTM D6433 Condition Summary & PDF Action Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#12141f] to-[#0f1017] border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-[#d97757]" />
                    <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                      ASTM D6433 Pavement Health
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                      pciCondition === 'Critical'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : pciCondition === 'Poor'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    Rating: {pciCondition}
                  </span>
                </div>

                {/* PCI Score Gauge Meter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Pavement Condition Index (PCI):</span>
                    <span className="text-white font-bold text-base">{pciScore} / 100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${
                        pciScore < 40 ? 'bg-red-500' : pciScore < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, pciScore))}%` }}
                    />
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-[#090a0d] border border-white/5">
                    <span className="text-[10px] text-neutral-500 block uppercase">Hazard Index</span>
                    <span className="text-base font-bold text-white mt-0.5">
                      {detectionResult?.stats.hazardIndex ?? (report.severity === 'Critical' ? 88 : 65)} / 100
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#090a0d] border border-white/5">
                    <span className="text-[10px] text-neutral-500 block uppercase">Mix Requirement</span>
                    <span className="text-base font-bold text-[#d97757] mt-0.5">
                      {detectionResult?.stats.estimatedPatchTons ?? 0.85} Tons
                    </span>
                  </div>
                </div>

                {/* Prominent PDF Download Button */}
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isGeneratingPdf}
                  className="w-full h-10 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <FileText className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
                  <span>
                    {isGeneratingPdf ? 'Compiling Official Report...' : 'Download Official PDF Report'}
                  </span>
                </button>
              </div>

              {/* GEOTAG VERIFICATION & FORENSIC METADATA CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#101915] via-[#0f1416] to-[#0c0e12] border border-emerald-500/30 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between pb-2.5 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                      Geotag Verification & Evidence
                    </span>
                  </div>
                  {report.geotagVerified ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Geotag Verified</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Unverified
                    </span>
                  )}
                </div>

                {/* Method & Accuracy */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 uppercase block">Capture Method</span>
                    <span className="text-white font-bold text-[11px] block truncate">
                      {report.captureMethod === 'in_app_camera'
                        ? 'In-App Live GPS Camera'
                        : report.captureMethod === 'existing_geotagged_upload'
                        ? 'Device Photo (EXIF Geotag)'
                        : 'Web Submission'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 uppercase block">GPS Accuracy</span>
                    <span className="text-emerald-300 font-bold text-[11px] block">
                      {report.gpsAccuracy != null
                        ? `±${report.gpsAccuracy} meters`
                        : 'EXIF Sensor Fix'}
                    </span>
                  </div>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 uppercase block">Altitude</span>
                    <span className="text-white font-semibold text-[11px] block">
                      {report.altitude != null ? `${report.altitude} m ASL` : 'Sensor N/A'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 uppercase block">Camera / Hardware</span>
                    <span className="text-white font-semibold text-[11px] block truncate">
                      {report.cameraMake || report.cameraModel
                        ? `${report.cameraMake || ''} ${report.cameraModel || ''}`.trim()
                        : 'RoadGuard Sensor'}
                    </span>
                  </div>
                </div>

                {/* Timestamps & Discrepancy Auditing */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono space-y-1.5">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="text-neutral-500">Capture Time:</span>
                    <span className="text-white font-medium">
                      {report.captureTimestamp
                        ? new Date(report.captureTimestamp).toLocaleString()
                        : 'At Submission'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="text-neutral-500">Server Upload:</span>
                    <span className="text-white font-medium">
                      {new Date(report.uploadTimestamp || report.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  {/* Timestamp Discrepancy Calculation */}
                  {(() => {
                    if (!report.captureTimestamp) return null;
                    const captureMs = new Date(report.captureTimestamp).getTime();
                    const uploadMs = new Date(report.uploadTimestamp || report.submittedAt).getTime();
                    const diffMins = Math.abs(Math.round((uploadMs - captureMs) / 60000));
                    return (
                      <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px]">
                        <span className="text-neutral-400">Capture-to-Upload Delay:</span>
                        <span
                          className={`font-semibold ${
                            diffMins <= 5 ? 'text-emerald-400' : diffMins <= 60 ? 'text-amber-400' : 'text-blue-400'
                          }`}
                        >
                          {diffMins <= 1 ? 'Instant (<1m)' : `${diffMins} minutes latency`}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Evidence Photo Preservation Indicator */}
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 px-1">
                  <span>Dual Image Archival:</span>
                  <span className="text-emerald-400 font-medium">
                    {report.originalImageUrl ? '✓ Raw + Stamped Preserved' : '✓ Visual Evidence Verified'}
                  </span>
                </div>
              </div>

              {/* Location telemetry & Mini-Map */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#d97757]" />
                    <span>GNSS Location & Road Network</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {report.location.latitude.toFixed(6)}°, {report.location.longitude.toFixed(6)}°
                  </span>
                </div>

                <RoadLocationMap
                  latitude={report.location.latitude}
                  longitude={report.location.longitude}
                  address={report.location.address}
                  isInteractive={false}
                  height="160px"
                />

                <div className="p-2.5 rounded-xl bg-[#111218] border border-white/5 text-xs mt-2 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#d97757] shrink-0" />
                  <span className="text-neutral-300 truncate">{report.location.address}</span>
                </div>
              </div>

              {/* 8-STAGE ROAD DAMAGE PROGRESS MONITORING & REPAIR CONTROLLER */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#12141f] via-[#101119] to-[#0e0f16] border border-white/10 space-y-4 shadow-xl">
                {/* Header with Active Persona Pill Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#d97757] animate-pulse" />
                      <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                        Progress Monitoring & Repair Lifecycle
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono block">
                      Canonical Issue · 8-Stage Municipal Workflow
                    </span>
                  </div>

                  {/* Persona Switcher for Role Verification */}
                  <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 text-[10px] font-mono">
                    <span className="text-neutral-500 px-1 hidden sm:inline">Role:</span>
                    {MUNICIPAL_STAFF_PROFILES.map((staff) => (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => setActiveStaff(staff)}
                        className={`px-2 py-0.5 rounded-lg transition font-medium cursor-pointer ${
                          activeStaff.id === staff.id
                            ? 'bg-[#d97757] text-white font-bold shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                        title={`${staff.name} (${staff.title})`}
                      >
                        {staff.role === 'Administrator' ? 'Admin' : staff.role === 'Department Crew' ? 'Dept Crew' : 'QA'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Persona Banner */}
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-[#d97757]" />
                    <span className="text-white font-bold">{activeStaff.name}</span>
                    <span className="text-neutral-400">({activeStaff.title})</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-neutral-300 border border-white/10">
                    Badge #{activeStaff.badgeNumber}
                  </span>
                </div>

                {/* 8-Stage Progress Stepper Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400 uppercase text-[10px]">Current Stage:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        report.currentStage === 'Closed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : report.currentStage === 'Reopened'
                          ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                          : report.currentStage === 'Repair in progress' || report.currentStage === 'Repair completed'
                          ? 'bg-[#d97757]/20 text-[#d97757] border-[#d97757]/40'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      }`}
                    >
                      {report.currentStage || 'Reported'}
                    </span>
                  </div>

                  {/* Visual 8-Step Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 pt-1">
                    {PROGRESS_STAGES_CONFIG.map((st, idx) => {
                      const stagesOrder = PROGRESS_STAGES_CONFIG.map((s) => s.stage);
                      const currentIdx = stagesOrder.indexOf(report.currentStage as any);
                      const isReached = currentIdx >= idx;
                      const isCurrent = report.currentStage === st.stage;

                      return (
                        <div
                          key={st.stage}
                          className={`p-1.5 rounded-xl border text-center transition flex flex-col items-center justify-between min-h-[58px] ${
                            isCurrent
                              ? 'bg-[#d97757]/20 border-[#d97757] shadow-[0_0_12px_rgba(217,119,87,0.3)]'
                              : isReached
                              ? 'bg-white/[0.04] border-white/20'
                              : 'bg-black/30 border-white/5 opacity-40'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                              isCurrent
                                ? 'bg-[#d97757] text-white'
                                : isReached
                                ? 'bg-emerald-500 text-black'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            {isReached && !isCurrent ? '✓' : st.number}
                          </span>
                          <span className="text-[9px] font-semibold text-white truncate max-w-[50px] leading-tight">
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reopened Alert Banner if active */}
                  {report.currentStage === 'Reopened' && (
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-red-400 font-bold uppercase font-mono text-[10px]">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Work Order Reopened ({report.reopenedCount || 1}x) - Defect Correction Required</span>
                      </div>
                      <p className="text-red-200 text-xs italic">
                        &ldquo;{report.reopenReason || 'Incomplete repair reported during inspection.'}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Expected Completion Date & Department Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <span className="text-neutral-400 flex items-center gap-1 text-[11px]">
                        <Truck className="w-3.5 h-3.5 text-[#d97757]" />
                        <span>Assigned Dept:</span>
                      </span>
                      <span className="text-white font-bold truncate max-w-[130px]">
                        {report.assignedDepartment || report.assignedCrew || 'Unassigned'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <span className="text-neutral-400 flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Target Date:</span>
                      </span>
                      <span className="text-emerald-300 font-bold">
                        {report.expectedCompletionDate || 'Not Scheduled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* STAGE ACTION WORKFLOW BUTTONS */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">
                    Authorized Lifecycle Actions (Active Role: {activeStaff.role})
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-semibold">
                    {/* Stage 2 Action: Admin Verify */}
                    <button
                      type="button"
                      onClick={() => handleAdvanceStage('Admin verified', { notes: 'Pavement distress confirmed by municipal admin.' })}
                      disabled={report.currentStage !== 'Reported'}
                      className={`p-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                        report.currentStage === 'Reported'
                          ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-md'
                          : 'bg-white/5 text-neutral-500 opacity-50 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>2. Verify Distress</span>
                    </button>

                    {/* Stage 3 Action: Assign Department */}
                    <button
                      type="button"
                      onClick={() => setShowAssignDialog(true)}
                      className="p-2 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>3. Assign Dept</span>
                    </button>

                    {/* Stage 4 Action: Schedule Work Order */}
                    <button
                      type="button"
                      onClick={() => setShowScheduleDialog(true)}
                      className="p-2 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>4. Schedule Date</span>
                    </button>

                    {/* Stage 5 Action: Start Repair (Crew) */}
                    <button
                      type="button"
                      onClick={() => handleAdvanceStage('Repair in progress', { notes: 'Crew arrived on site; surface preparation underway.' })}
                      className={`p-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                        report.currentStage === 'Scheduled' || report.currentStage === 'Assigned to department' || report.currentStage === 'Reopened'
                          ? 'bg-[#d97757] hover:bg-[#c66848] text-white cursor-pointer shadow-md'
                          : 'bg-white/5 text-neutral-500 opacity-50 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>5. Start Repair</span>
                    </button>

                    {/* Stage 6 Action: Mark Repair Completed (Crew) */}
                    <button
                      type="button"
                      onClick={() => handleAdvanceStage('Repair completed', { notes: 'Asphalt laydown finished and compacted.' })}
                      className={`p-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                        report.currentStage === 'Repair in progress'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md'
                          : 'bg-white/5 text-neutral-500 opacity-50 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>6. Repair Done</span>
                    </button>

                    {/* Stage 7 Action: QA Final Verification */}
                    <button
                      type="button"
                      onClick={() => handleAdvanceStage('Final verification', { notes: 'Field QA inspection conducted.' })}
                      disabled={report.currentStage !== 'Repair completed'}
                      className={`p-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                        report.currentStage === 'Repair completed'
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md'
                          : 'bg-white/5 text-neutral-500 opacity-50 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>7. QA Verification</span>
                    </button>
                  </div>

                  {/* Stage 8 Actions: Approve & Close vs. Reopen */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {/* Close Ticket */}
                    <button
                      type="button"
                      onClick={() => handleAdvanceStage('Closed', { notes: 'Quality verified. Pavement restoration signed off and closed.' })}
                      disabled={report.currentStage === 'Closed'}
                      className={`p-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                        report.currentStage === 'Closed'
                          ? 'bg-white/5 text-neutral-500 opacity-50 cursor-not-allowed border border-white/5'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>8. Approve & Close</span>
                    </button>

                    {/* Reopen Issue */}
                    <button
                      type="button"
                      onClick={() => setShowReopenDialog(true)}
                      className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reopen (Incomplete)</span>
                    </button>

                    {/* Quick Photo Upload Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setUploadPhotoStage(report.currentStage === 'Repair completed' || report.currentStage === 'Final verification' ? 'after' : 'during');
                        setShowPhotoModal(true);
                      }}
                      className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#d97757]" />
                      <span>Upload Repair Photo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* BEFORE, DURING & AFTER PHOTOGRAPH MATRIX */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#111218] border border-white/10 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#d97757]" />
                    <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                      Repair Evidence: Before · During · After
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadPhotoStage('during');
                      setShowPhotoModal(true);
                    }}
                    className="text-[10px] font-mono text-[#d97757] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Attach Photo</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Column 1: Before Distress Photos */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-neutral-400 uppercase flex items-center justify-between">
                      <span className="font-bold text-amber-400">1. Before Distress</span>
                      <span>{(report.beforeImages || [report.imageUrl]).length} Photo(s)</span>
                    </div>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black relative group">
                      <img
                        src={(report.beforeImages && report.beforeImages[0]) || report.imageUrl}
                        alt="Before distress"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-amber-300">
                        Citizen Evidence
                      </span>
                    </div>
                  </div>

                  {/* Column 2: During Repair Photos */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-neutral-400 uppercase flex items-center justify-between">
                      <span className="font-bold text-[#d97757]">2. During Repair</span>
                      <span>{(report.duringImages || []).length} Photo(s)</span>
                    </div>
                    {report.duringImages && report.duringImages.length > 0 ? (
                      <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[#d97757]/40 bg-black relative group">
                        <img
                          src={report.duringImages[0].startsWith('http') ? report.duringImages[0] : `http://127.0.0.1:8000${report.duringImages[0]}`}
                          alt="During repair work"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-[#d97757]">
                          Active Worksite
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadPhotoStage('during');
                          setShowPhotoModal(true);
                        }}
                        className="aspect-[4/3] w-full rounded-xl border border-dashed border-white/20 hover:border-[#d97757]/60 bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 text-neutral-500 hover:text-white transition cursor-pointer"
                      >
                        <Camera className="w-5 h-5 text-neutral-500" />
                        <span className="text-[10px] font-mono">+ Upload During Photo</span>
                      </button>
                    )}
                  </div>

                  {/* Column 3: After Restored Photos */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-neutral-400 uppercase flex items-center justify-between">
                      <span className="font-bold text-emerald-400">3. After Restored</span>
                      <span>{(report.afterImages || []).length} Photo(s)</span>
                    </div>
                    {report.afterImages && report.afterImages.length > 0 ? (
                      <div className="aspect-[4/3] rounded-xl overflow-hidden border border-emerald-500/40 bg-black relative group">
                        <img
                          src={report.afterImages[0].startsWith('http') ? report.afterImages[0] : `http://127.0.0.1:8000${report.afterImages[0]}`}
                          alt="After restoration"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-emerald-300">
                          Restored Pavement
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadPhotoStage('after');
                          setShowPhotoModal(true);
                        }}
                        className="aspect-[4/3] w-full rounded-xl border border-dashed border-white/20 hover:border-emerald-500/60 bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 text-neutral-500 hover:text-white transition cursor-pointer"
                      >
                        <Camera className="w-5 h-5 text-neutral-500" />
                        <span className="text-[10px] font-mono">+ Upload After Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* AI REPAIR VERIFICATION CARD */}
              {(report.aiVerificationStatus || report.repairBeforeImage || report.repairAfterImage) && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#111218] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#d97757]" />
                      <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                        AI Repair Verification Studio
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        report.aiVerificationStatus === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : report.aiVerificationStatus === 'REJECTED'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {report.aiVerificationStatus || 'PENDING'}
                    </span>
                  </div>

                  {/* Side-by-side Before & After Evidence */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase">
                        Before Repair Work
                      </span>
                      <div className="aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black relative">
                        {report.repairBeforeImage ? (
                          <img
                            src={report.repairBeforeImage.startsWith('http') ? report.repairBeforeImage : `http://127.0.0.1:8000${report.repairBeforeImage}`}
                            alt="Repair before"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={report.imageUrl}
                            alt="Original"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-amber-400">
                          Distress Frame
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase">
                        After Repair Work
                      </span>
                      <div className="aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black relative">
                        {report.repairAfterImage ? (
                          <img
                            src={report.repairAfterImage.startsWith('http') ? report.repairAfterImage : `http://127.0.0.1:8000${report.repairAfterImage}`}
                            alt="Repair after"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-[11px] font-mono">
                            Awaiting upload
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-emerald-400">
                          Compacted Surface
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic Metrics */}
                  {report.aiVerificationReport && (
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                        <span className="text-[10px] text-neutral-400">DEFECT REDUCTION</span>
                        <div className="text-sm font-bold text-emerald-400">
                          {report.aiVerificationReport.areaReductionPercentage || 100}%
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                        <span className="text-[10px] text-neutral-400">RESTORATION SCORE</span>
                        <div className="text-sm font-bold text-white">
                          {report.aiVerificationReport.surfaceRestorationScore || 95}%
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                        <span className="text-[10px] text-neutral-400">AI CONFIDENCE</span>
                        <div className="text-sm font-bold text-[#d97757]">
                          {Math.round((report.aiVerificationReport.confidence || 0.95) * 100)}%
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reason Text */}
                  {report.aiVerificationReport?.reason && (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-neutral-300">
                      <span className="font-mono text-[10px] text-neutral-400 uppercase block mb-0.5">
                        DIAGNOSTIC SUMMARY:
                      </span>
                      {report.aiVerificationReport.reason}
                    </div>
                  )}

                  {/* Admin QA Actions for NEEDS_REVIEW */}
                  {report.aiVerificationStatus === 'NEEDS_REVIEW' && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Action Required: Municipal Administrator Quality Sign-Off</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Optional QA review notes..."
                        value={manualReviewNotes}
                        onChange={(e) => setManualReviewNotes(e.target.value)}
                        className="w-full bg-[#07080b] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                      />
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isSubmittingDecision}
                          onClick={() => handleManualDecision('APPROVE')}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
                        >
                          Approve Repair & Close Issue
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingDecision}
                          onClick={() => handleManualDecision('REJECT')}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow transition"
                        >
                          Reject (Require Re-work)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status History & Audit Trail */}
              <div className="p-4 rounded-2xl bg-[#111218] border border-white/10 space-y-3">
                <div className="text-xs font-mono font-bold uppercase text-neutral-400 tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#d97757]" />
                    <span>Progress Timeline & Audit Trail</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-normal">
                    {report.timeline.length} Milestones
                  </span>
                </div>

                <div className="space-y-3 pl-2 border-l border-white/10 max-h-[180px] overflow-y-auto">
                  {report.timeline.map((entry, idx) => (
                    <div key={idx} className="relative pl-4 space-y-0.5">
                      <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-[#d97757] border-2 border-[#0d0e14]" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{entry.status}</span>
                        <span className="text-[10px] font-mono text-neutral-500">{entry.timestamp}</span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-snug">{entry.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#111218] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Dual-Engine YOLO AI Verified · Municipal Dispatch Ready</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* MANDATORY REJECTION REASON DIALOG MODAL */}
        {showRejectDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div
              className="w-full max-w-md rounded-2xl bg-[#14151e] border border-red-500/40 p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Reject Road Incident Report</h4>
                  <p className="text-xs text-neutral-400">
                    A valid administrative reason is required to reject report {report.id}.
                  </p>
                </div>
              </div>

              {/* Preset Reason Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Rejection Category
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                >
                  <option value="Duplicate submission or already scheduled">
                    Duplicate submission or already scheduled
                  </option>
                  <option value="Private property / Non-municipal roadway">
                    Private property / Non-municipal roadway
                  </option>
                  <option value="Distress below minimum hazard threshold">
                    Distress below minimum hazard threshold
                  </option>
                  <option value="Photograph unreadable, blurred or obstructed">
                    Photograph unreadable, blurred or obstructed
                  </option>
                  <option value="Invalid GPS coordinates / location mismatch">
                    Invalid GPS coordinates / location mismatch
                  </option>
                  <option value="Other">Other (custom explanation)</option>
                </select>
              </div>

              {/* Reason Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Detailed Explanation (Citizen will see this in their timeline)
                </label>
                <textarea
                  value={customRejectionText}
                  onChange={(e) => setCustomRejectionText(e.target.value)}
                  placeholder="Provide clarifying details on why this defect report cannot be serviced..."
                  rows={3}
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowRejectDialog(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejection}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 1. ASSIGN DEPARTMENT & MAINTAINER DIALOG MODAL */}
        {showAssignDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div
              className="w-full max-w-md rounded-2xl bg-[#14151e] border border-blue-500/40 p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Dispatch to Maintainer</h4>
                  <p className="text-xs text-neutral-400">
                    Assign issue #{report.id} to a dedicated road technician or department.
                  </p>
                </div>
              </div>

              {/* Maintainer Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Select Field Maintainer
                </label>
                <select
                  value={selectedMaintainerId}
                  onChange={(e) => {
                    setSelectedMaintainerId(e.target.value);
                    const m = maintainersList.find((item) => item.id === e.target.value);
                    if (m) {
                      setSelectedDept(m.department);
                      setCustomCrewInput(m.name);
                    }
                  }}
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Direct Maintainer Assignment --</option>
                  {maintainersList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.department}) · {m.assigned_tasks_count} Active Task(s)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-neutral-400 uppercase">
                    Priority Tier
                  </label>
                  <select
                    value={assignmentPriority}
                    onChange={(e) => setAssignmentPriority(e.target.value as any)}
                    className="w-full bg-[#0d0e14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-neutral-400 uppercase">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-[#0d0e14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Department
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="Rapid Patch Division">Rapid Patch Division</option>
                  <option value="Heavy Asphalt Works">Heavy Asphalt Works</option>
                  <option value="Arterial Corridor Maintenance">Arterial Corridor Maintenance</option>
                  <option value="Quality Assurance & Patch Inspection">QA & Patch Inspection</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Work Order Instructions
                </label>
                <textarea
                  rows={2}
                  value={adminInstructions}
                  onChange={(e) => setAdminInstructions(e.target.value)}
                  placeholder="e.g. Mill cavity 50mm, apply tack coat emulsion, compact hot-mix asphalt."
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAssignDialog(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssign}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Confirm Dispatch</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. SCHEDULE WORK ORDER DIALOG MODAL */}
        {showScheduleDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div
              className="w-full max-w-md rounded-2xl bg-[#14151e] border border-amber-500/40 p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Schedule Repair Work Order</h4>
                  <p className="text-xs text-neutral-400">
                    Record target completion date for issue #{report.id}.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Expected Completion Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Scheduling Notes & Dispatch Instructions
                </label>
                <textarea
                  value={scheduleNote}
                  onChange={(e) => setScheduleNote(e.target.value)}
                  placeholder="e.g. Night shift deployment. Traffic lane closure 22:00-04:00. Hot-mix tack coat required."
                  rows={3}
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowScheduleDialog(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSchedule}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Save Schedule</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. REOPEN ISSUE (INCOMPLETE REPAIR) DIALOG MODAL */}
        {showReopenDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div
              className="w-full max-w-md rounded-2xl bg-[#14151e] border border-red-500/50 p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Reopen Incomplete Repair</h4>
                  <p className="text-xs text-neutral-400">
                    Returns issue #{report.id} to department queue for rework and correction.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Deficiency / Incomplete Repair Reason (Mandatory)
                </label>
                <textarea
                  value={reopenReasonText}
                  onChange={(e) => setReopenReasonText(e.target.value)}
                  placeholder="Detail defect: e.g. Edge bonding gap, insufficient hot-mix compaction, surface ponding, loose aggregate..."
                  rows={3}
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-[11px] text-neutral-300">
                <span className="font-bold text-red-400">Notice:</span> The maintenance department will be notified immediately to re-dispatch a compaction and edge-sealing unit.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowReopenDialog(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReopen}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Confirm Reopen Ticket</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. DEPARTMENT REPAIR PHOTOGRAPH UPLOAD MODAL */}
        {showPhotoModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div
              className="w-full max-w-md rounded-2xl bg-[#14151e] border border-white/20 p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d97757]/20 border border-[#d97757]/40 flex items-center justify-center text-[#d97757]">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Upload Repair Photograph</h4>
                  <p className="text-xs text-neutral-400">
                    Attach photographic evidence for ticket #{report.id}.
                  </p>
                </div>
              </div>

              {/* Stage selector: during vs after */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Repair Stage Classification
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadPhotoStage('during')}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      uploadPhotoStage === 'during'
                        ? 'bg-[#d97757]/20 border-[#d97757] text-[#d97757]'
                        : 'bg-black/40 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>During Repair</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadPhotoStage('after')}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      uploadPhotoStage === 'after'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-black/40 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>After Restoration</span>
                  </button>
                </div>
              </div>

              {/* File upload input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Select Photograph File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#d97757] file:text-white hover:file:bg-[#c66848] cursor-pointer"
                />
              </div>

              {/* Preview */}
              {photoPreview && (
                <div className="aspect-[16/9] rounded-xl overflow-hidden border border-white/10 bg-black">
                  <img src={photoPreview} alt="Upload preview" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Caption Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-neutral-400 uppercase">
                  Work Notes & Specification Caption
                </label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder={
                    uploadPhotoStage === 'during'
                      ? 'e.g. Cavity milled 80mm deep with tack coat applied.'
                      : 'e.g. Hot-mix asphalt compacted flush with roadway.'
                  }
                  className="w-full bg-[#0d0e14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757]"
                />
              </div>

              <div className="text-[10px] font-mono text-neutral-400 flex items-center justify-between">
                <span>Uploader: {activeStaff.name}</span>
                <span>Role: {activeStaff.role}</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoModal(false);
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadPhotoSubmit}
                  disabled={!photoFile || isUploadingPhoto}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#d97757] hover:bg-[#c66848] shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingPhoto ? 'Uploading...' : 'Save & Attach Photo'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
