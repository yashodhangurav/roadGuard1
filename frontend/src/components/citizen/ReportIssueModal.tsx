import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  Upload,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Crosshair,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useReports, DamageCategory, ReportLocation } from '../../context/ReportsContext';
import { useAuth } from '../../context/AuthContext';
import { RoadLocationMap } from './RoadLocationMap';
import { modalBackdrop, modalFrame } from '../../styles/motion';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRedirect?: (reportId: string) => void;
}

const DAMAGE_CATEGORIES: { id: DamageCategory; label: string; desc: string }[] = [
  { id: 'Pothole', label: 'Pothole', desc: 'Cavity or depression in road pavement' },
  { id: 'Alligator Crack', label: 'Alligator Crack', desc: 'Interconnected fatigue cracks' },
  { id: 'Longitudinal Crack', label: 'Longitudinal Crack', desc: 'Cracks parallel to road centerline' },
  { id: 'Transverse Crack', label: 'Transverse Crack', desc: 'Cracks perpendicular to road centerline' },
  { id: 'Surface Deterioration', label: 'Surface Deterioration', desc: 'Raveling, stripping or aggregate loss' },
  { id: 'Other', label: 'Other Distress', desc: 'Edge break, rutting or sinkhole' },
];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  onSuccessRedirect,
}) => {
  const { user } = useAuth();
  const { createReport } = useReports();

  // Photo Source Mode: 'upload' | 'camera'
  const [photoSource, setPhotoSource] = useState<'upload' | 'camera'>('upload');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Form Fields
  const [category, setCategory] = useState<DamageCategory>('Pothole');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [description, setDescription] = useState<string>('');

  // GPS Location State
  const [latitude, setLatitude] = useState<number>(37.774929);
  const [longitude, setLongitude] = useState<number>(-122.419416);
  const [readableAddress, setReadableAddress] = useState<string>('Market St & 8th St, San Francisco, CA');
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'detecting' | 'detected' | 'denied' | 'manual'
  >('idle');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isManualCorrection, setIsManualCorrection] = useState<boolean>(false);
  const [manualAddressInput, setManualAddressInput] = useState<string>('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<any | null>(null);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera on unmount or mode switch
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Open Device Camera
  const startCamera = async () => {
    setCameraError(null);
    stopCameraStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setPhotoSource('camera');
    } catch (err: any) {
      console.warn('Camera access denied or unavailable', err);
      setCameraError(
        'Camera permission was denied or no camera device was found. Please upload a photo from your device instead.'
      );
      setPhotoSource('upload');
    }
  };

  // Capture Still Frame from Camera
  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setPreviewImage(dataUrl);
      stopCameraStream();
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
        setValidationError('Please upload a valid image file (JPG, PNG, or WEBP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewImage(event.target.result as string);
          setValidationError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reverse Geocoding with OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'RoadGuardAI/1.0 (info@roadguard.ai)' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          const road = data.address?.road || '';
          const suburb = data.address?.suburb || data.address?.neighbourhood || '';
          const city = data.address?.city || data.address?.town || data.address?.county || '';
          const state = data.address?.state ? `, ${data.address.state}` : '';
          const shortAddress = road
            ? `${road}${suburb ? `, ${suburb}` : ''}${city ? `, ${city}` : ''}${state}`
            : data.display_name.split(',').slice(0, 3).join(',');
          setReadableAddress(shortAddress || data.display_name);
          return;
        }
      }
    } catch {
      // Graceful fallback to formatted coordinate address
    }
    setReadableAddress(`${lat.toFixed(5)}° N, ${Math.abs(lng).toFixed(5)}° W`);
  };

  // Automatic GPS Geolocation Detection
  const detectLocation = () => {
    setLocationStatus('detecting');
    setValidationError(null);

    if (!('geolocation' in navigator)) {
      setLocationStatus('denied');
      setValidationError('Browser does not support Geolocation API. Please enter location manually.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy;

        setLatitude(lat);
        setLongitude(lng);
        setGpsAccuracy(Math.round(acc));
        setLocationStatus('detected');
        setIsManualCorrection(false);

        // Fetch readable street address
        await reverseGeocode(lat, lng);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocationStatus('denied');
        // Do not fake coordinates when denied; allow explicit manual entry
        setValidationError(
          'Location permission was denied. Please enter the street or landmark address manually below.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Handle Pin Drag or Map Click Correction
  const handleMapLocationChange = async (newLat: number, newLng: number) => {
    setLatitude(newLat);
    setLongitude(newLng);
    setIsManualCorrection(true);
    await reverseGeocode(newLat, newLng);
  };

  // Handle Manual Address Submission
  const handleApplyManualAddress = () => {
    if (manualAddressInput.trim()) {
      setReadableAddress(manualAddressInput.trim());
      setIsManualCorrection(true);
      setLocationStatus('manual');
    }
  };

  // Submit Handler
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!previewImage) {
      setValidationError('A road damage photograph is required. Please capture or upload a photo.');
      return;
    }

    if (!category) {
      setValidationError('Please select a damage category.');
      return;
    }

    if (locationStatus === 'denied' && !manualAddressInput.trim() && !readableAddress.trim()) {
      setValidationError('Please provide the road location or street address.');
      return;
    }

    setIsSubmitting(true);

    const reportLocation: ReportLocation = {
      latitude,
      longitude,
      address: manualAddressInput.trim() || readableAddress || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      city: 'San Francisco',
      isManualCorrection,
      accuracyMeters: gpsAccuracy || undefined,
    };

    try {
      const created = await createReport(
        {
          category,
          severity,
          description,
          imageUrl: previewImage,
          location: reportLocation,
        },
        user?.name || 'Citizen Reporter',
        user?.id || 'CIT-ANON'
      );

      setSubmittedReport(created);
    } catch (err: any) {
      setValidationError(err.message || 'Could not submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset and close
  const handleClose = () => {
    stopCameraStream();
    setSubmittedReport(null);
    setPreviewImage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">
        {/* Backdrop */}
        <motion.div
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
          onClick={handleClose}
        />

        {/* Modal Window */}
        <motion.div
          variants={modalFrame}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0e0f14]/98 border border-white/15 p-5 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.9)] z-10 text-left my-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Ambient Glow */}
          <div
            className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-[#d97757]/15 blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
            aria-label="Close Report Modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* SUCCESS SCREEN */}
          {submittedReport ? (
            <div className="text-center py-4 sm:py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <span className="text-[11px] font-mono uppercase text-emerald-400 tracking-wider font-semibold">
                Report Successfully Logged
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                Thank you for making our roads safer!
              </h2>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1.5">
                Your road damage report has been assigned a priority work ticket and queued for
                municipal road crew inspection.
              </p>

              {/* Submitted Report Summary Card */}
              <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-left max-w-lg mx-auto">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="font-mono text-xs text-neutral-400">
                    REPORT ID:{' '}
                    <span className="text-white font-semibold">{submittedReport.id}</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#d97757]/20 border border-[#d97757]/40 text-[#d97757]">
                    {submittedReport.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="col-span-1 rounded-lg overflow-hidden border border-white/10 aspect-video bg-black">
                    <img
                      src={submittedReport.imageUrl}
                      alt="Submitted Road Defect"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="col-span-2 space-y-1 text-xs">
                    <div className="font-semibold text-white">{submittedReport.category}</div>
                    <div className="text-neutral-400 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#d97757] shrink-0" />
                      <span className="truncate">{submittedReport.location.address}</span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500">
                      Coordinates: {submittedReport.location.latitude.toFixed(5)}°,{' '}
                      {submittedReport.location.longitude.toFixed(5)}°
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500">
                      Submitted: {submittedReport.submittedAt}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    if (onSuccessRedirect) onSuccessRedirect(submittedReport.id);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#d97757] hover:bg-[#c66848] text-white shadow-[0_0_20px_rgba(217,119,87,0.4)] flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View in My Reports</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedReport(null);
                    setPreviewImage(null);
                    setDescription('');
                    setLocationStatus('idle');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Report Another Road Issue</span>
                </button>
              </div>
            </div>
          ) : (
            /* REPORT SUBMISSION FORM */
            <form onSubmit={handleSubmitReport} className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d97757]" />
                  <span className="text-[11px] font-mono uppercase text-[#d97757] tracking-wider font-semibold">
                    Citizen Road Incident Report
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                  Report Road Damage or Pothole
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Capture a photo, verify GPS location, and dispatch an automated repair ticket to
                  the municipal maintenance queue.
                </p>
              </div>

              {/* Validation Alert */}
              {validationError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* SECTION A: ROAD DAMAGE PHOTO (Capture or Upload) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>1. Road Damage Photo</span>
                    <span className="text-red-400">*</span>
                  </label>

                  {/* Toggle between Camera and Upload */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoSource('upload');
                        stopCameraStream();
                      }}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                        photoSource === 'upload'
                          ? 'bg-[#d97757] text-white font-medium'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                        photoSource === 'camera'
                          ? 'bg-[#d97757] text-white font-medium'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Camera className="w-3 h-3" />
                      <span>Live Camera</span>
                    </button>
                  </div>
                </div>

                {/* Photo Viewport Area */}
                <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] rounded-xl overflow-hidden border border-white/15 bg-black flex items-center justify-center">
                  {/* LIVE CAMERA MODE */}
                  {photoSource === 'camera' && isCameraActive && (
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Viewfinder Overlay */}
                      <div className="absolute inset-8 border border-white/30 rounded-lg pointer-events-none flex flex-col justify-between p-3">
                        <div className="flex justify-between text-[10px] font-mono text-white/70">
                          <span>CAM-01 · 60 FPS</span>
                          <span className="flex items-center gap-1 text-red-400">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                          </span>
                        </div>
                        <div className="text-center text-[11px] font-mono text-white/80 bg-black/60 py-1 rounded">
                          Frame pothole or crack in center reticle
                        </div>
                      </div>

                      {/* Snap Photo Button */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                        <button
                          type="button"
                          onClick={capturePhotoFromCamera}
                          className="px-5 py-2 rounded-full bg-[#d97757] hover:bg-[#c66848] text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Snap Photo</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PREVIEW OF CAPTURED / UPLOADED IMAGE */}
                  {previewImage ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={previewImage}
                        alt="Road damage preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(null);
                            if (photoSource === 'camera') startCamera();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-white text-xs border border-white/20 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retake / Replace</span>
                        </button>
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 border border-white/20 text-[10px] font-mono text-white">
                        PHOTO ATTACHED
                      </div>
                    </div>
                  ) : (
                    /* UPLOAD DROPZONE */
                    photoSource === 'upload' && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-full border-2 border-dashed border-white/15 hover:border-[#d97757]/60 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition bg-white/[0.01] hover:bg-white/[0.03]"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#d97757] mb-2.5">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-semibold text-white">
                          Click to select road image or drag and drop
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          Supports JPG, JPEG, PNG, WEBP (high clarity recommended)
                        </p>
                      </div>
                    )
                  )}

                  {/* Camera Error Message */}
                  {cameraError && (
                    <div className="absolute bottom-2 inset-x-2 p-2 rounded bg-red-950/80 border border-red-500/40 text-[11px] text-red-200 text-center">
                      {cameraError}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: DAMAGE INFORMATION */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span>2. Defect Category & Severity</span>
                  <span className="text-red-400">*</span>
                </label>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DAMAGE_CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#d97757]/20 border-[#d97757] text-white shadow-[0_0_12px_rgba(217,119,87,0.3)]'
                            : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="text-xs font-semibold">{cat.label}</div>
                        <div className="text-[10px] text-neutral-400 truncate mt-0.5">{cat.desc}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Severity Pill Selector */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-mono text-neutral-400 mr-1">Severity:</span>
                  {(['Low', 'Medium', 'High', 'Critical'] as const).map((sev) => {
                    const isSelected = severity === sev;
                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                          isSelected
                            ? sev === 'Critical'
                              ? 'bg-red-950/60 border-red-500 text-red-300'
                              : 'bg-[#d97757]/20 border-[#d97757] text-white'
                            : 'bg-white/[0.02] border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {sev}
                      </button>
                    );
                  })}
                </div>

                {/* Optional Description */}
                <div>
                  <label className="text-[11px] font-mono text-neutral-300 uppercase tracking-wider block mb-1">
                    Description / Landmark Notes (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Deep hole near bus stop, hazardous for two-wheelers and cyclists..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757] transition resize-none"
                  />
                </div>
              </div>

              {/* SECTION C: AUTOMATIC GPS LOCATION DETECTION */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>3. Road Location (GPS Geotag)</span>
                    <span className="text-red-400">*</span>
                  </label>

                  {/* Detect My Location Button */}
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locationStatus === 'detecting'}
                    className="px-3 py-1.5 rounded-lg bg-[#d97757] hover:bg-[#c66848] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(217,119,87,0.35)] transition cursor-pointer"
                  >
                    <Crosshair className={`w-3.5 h-3.5 ${locationStatus === 'detecting' ? 'animate-spin' : ''}`} />
                    <span>
                      {locationStatus === 'detecting'
                        ? 'Acquiring GPS...'
                        : 'Detect My Location'}
                    </span>
                  </button>
                </div>

                {/* GPS Status Indicators */}
                {locationStatus === 'detected' && (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold">GPS Coordinates Locked</span>
                      {gpsAccuracy && (
                        <span className="font-mono text-[10px] text-emerald-400/80">
                          (±{gpsAccuracy}m accuracy)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-white truncate max-w-xs">
                      {readableAddress}
                    </span>
                  </div>
                )}

                {locationStatus === 'denied' && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>GPS location permission denied or timed out.</span>
                    </div>
                    <div className="text-[11px] text-neutral-300">
                      Please type the street address or nearest landmark below, or click on the map:
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualAddressInput}
                        onChange={(e) => setManualAddressInput(e.target.value)}
                        placeholder="e.g. 500 Market St, San Francisco, CA"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d97757]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyManualAddress}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                {/* React Leaflet Interactive Map */}
                <div className="space-y-1.5">
                  <RoadLocationMap
                    latitude={latitude}
                    longitude={longitude}
                    address={readableAddress}
                    isInteractive={true}
                    onLocationChange={handleMapLocationChange}
                    height="240px"
                  />
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono px-1">
                    <span>
                      {latitude.toFixed(6)}° N, {longitude.toFixed(6)}° W
                    </span>
                    <span className="text-amber-400/90">
                      {isManualCorrection ? 'Manual pin adjustment applied' : 'Draggable marker active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION D: SUBMIT BUTTON */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 sticky -bottom-5 sm:-bottom-7 bg-[#0e0f14]/95 py-3 -mx-5 px-5 sm:-mx-7 sm:px-7 backdrop-blur-md z-30">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-semibold text-white transition flex items-center justify-center gap-2 cursor-pointer ${
                    isSubmitting
                      ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed'
                      : 'bg-[#d97757] hover:bg-[#c66848] shadow-[0_0_20px_rgba(217,119,87,0.4)]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Submit Road Damage Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
