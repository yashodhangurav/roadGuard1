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
  Search,
  Radio,
  Check,
  RefreshCw,
  Compass,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useReports, DamageCategory, ReportLocation, generatePotholeId } from '../../context/ReportsContext';
import { useAuth } from '../../context/AuthContext';
import { RoadLocationMap } from './RoadLocationMap';
import { modalBackdrop, modalFrame } from '../../styles/motion';
import {
  analyzeRoadImage,
  DetectionResult,
  fetchNearbyReports,
  NearbyReport,
  checkDuplicateImage,
  DuplicateCandidate,
} from '../../services/detectionApi';
import { syncManager } from '../../services/syncManager';
import { GpsCameraCapture, GpsCaptureMetadata } from './GpsCameraCapture';
import { extractExifGps } from '../../services/exifService';
import { reverseGeocodeCoordinates } from '../../services/geocodeService';

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

const SEVERITY_RANKS: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

const mapDamageTypeToCategory = (detectedType: string): DamageCategory => {
  const t = detectedType.toLowerCase();
  if (t.includes('pothole') || t.includes('cavity') || t.includes('depression') || t.includes('d40')) {
    return 'Pothole';
  }
  if (t.includes('alligator') || t.includes('fatigue') || t.includes('d20')) {
    return 'Alligator Crack';
  }
  if (t.includes('longitudinal') || t.includes('d00')) {
    return 'Longitudinal Crack';
  }
  if (t.includes('transverse') || t.includes('d10')) {
    return 'Transverse Crack';
  }
  if (
    t.includes('deterioration') ||
    t.includes('raveling') ||
    t.includes('stripping') ||
    t.includes('spalling')
  ) {
    return 'Surface Deterioration';
  }
  return 'Other';
};

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
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [showAnnotated, setShowAnnotated] = useState<boolean>(false);

  // AI Scanning State
  const [isScanningAI, setIsScanningAI] = useState<boolean>(false);
  const [aiScanDone, setAiScanDone] = useState<boolean>(false);
  const [aiDetectedDefect, setAiDetectedDefect] = useState<{
    id?: string;
    type: string;
    category: DamageCategory;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    confidence: number;
    count: number;
    repairMethod?: string;
    dimensions?: any;
    urgency?: string;
  } | null>(null);

  // Form Fields
  const [category, setCategory] = useState<DamageCategory>('Pothole');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [description, setDescription] = useState<string>('');

  // GPS Location & Telemetry State
  const [latitude, setLatitude] = useState<number>(37.774929);
  const [longitude, setLongitude] = useState<number>(-122.419416);
  const [readableAddress, setReadableAddress] = useState<string>('Market St & 8th St, San Francisco, CA');
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'detecting' | 'detected' | 'denied' | 'unavailable' | 'timeout' | 'error' | 'manual'
  >('idle');
  const [locationErrorMessage, setLocationErrorMessage] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isManualCorrection, setIsManualCorrection] = useState<boolean>(false);
  const [manualAddressInput, setManualAddressInput] = useState<string>('');
  const [isGeocodingManualAddress, setIsGeocodingManualAddress] = useState<boolean>(false);

  // Nearby Road Issues State (Default 50m search radius)
  const [searchRadius, setSearchRadius] = useState<number>(50);
  const [nearbyReports, setNearbyReports] = useState<NearbyReport[]>([]);
  const [isSearchingNearby, setIsSearchingNearby] = useState<boolean>(false);
  const [hasSearchedNearby, setHasSearchedNearby] = useState<boolean>(false);

  // Perceptual Hash Duplicate Detection State
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<any | null>(null);
  const [wasOnlineAtSubmission, setWasOnlineAtSubmission] = useState<boolean>(true);

  // Geotag-Verified Telemetry & Capture State
  const [showGpsCamera, setShowGpsCamera] = useState<boolean>(false);
  const [captureMethod, setCaptureMethod] = useState<'in_app_camera' | 'existing_geotagged_upload' | 'standard_upload' | null>(null);
  const [geotagVerified, setGeotagVerified] = useState<boolean>(false);
  const [altitude, setAltitude] = useState<number | undefined>(undefined);
  const [captureTimestamp, setCaptureTimestamp] = useState<string | undefined>(undefined);
  const [cameraMake, setCameraMake] = useState<string | undefined>(undefined);
  const [cameraModel, setCameraModel] = useState<string | undefined>(undefined);
  const [originalImageBlob, setOriginalImageBlob] = useState<Blob | null>(null);
  const [isExtractingExif, setIsExtractingExif] = useState<boolean>(false);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera on unmount or mode switch
  const stopCameraStream = () => {
    setShowGpsCamera(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Run AI YOLO Model Scan on uploaded or captured image
  const runAIScan = async (fileOrDataUrl: File | string) => {
    setIsScanningAI(true);
    setValidationError(null);

    try {
      const result: DetectionResult = await analyzeRoadImage(fileOrDataUrl);

      if (result.defects && result.defects.length > 0) {
        // Sort defects: highest severity first, then highest confidence
        const sorted = [...result.defects].sort((a, b) => {
          const rankA = SEVERITY_RANKS[a.severity] || 0;
          const rankB = SEVERITY_RANKS[b.severity] || 0;
          if (rankB !== rankA) return rankB - rankA;
          return b.confidence - a.confidence;
        });

        const top = sorted[0];
        const mappedCat = mapDamageTypeToCategory(top.type);
        const mappedSev = (top.severity as 'Low' | 'Medium' | 'High' | 'Critical') || 'High';

        // Automatically select Category & Severity Level
        setCategory(mappedCat);
        setSeverity(mappedSev);

        if (result.annotatedImageUrl) {
          setAnnotatedImage(result.annotatedImageUrl);
          setShowAnnotated(true);
        }

        setAiDetectedDefect({
          id: top.id,
          type: top.type,
          category: mappedCat,
          severity: mappedSev,
          confidence: top.confidence,
          count: result.defects.length,
          repairMethod: top.repairMethod,
          dimensions: top.dimensions,
          urgency: top.urgency,
        });

        // Pre-fill description if currently empty
        setDescription((prev) => {
          if (!prev || prev.trim().length === 0) {
            const repairNote = top.repairMethod ? ` Remediation: ${top.repairMethod}.` : '';
            return `AI YOLO Model Detected: ${top.type} (${mappedSev} severity, ${top.confidence.toFixed(1)}% confidence).${repairNote}`;
          }
          return prev;
        });
      } else {
        setAiDetectedDefect(null);
      }

      // Execute perceptual hash (pHash) duplicate check against nearby reports
      try {
        let targetBlob: Blob | null = null;
        if (fileOrDataUrl instanceof Blob) {
          targetBlob = fileOrDataUrl;
        } else if (typeof fileOrDataUrl === 'string') {
          const fetchRes = await fetch(fileOrDataUrl);
          targetBlob = await fetchRes.blob();
        }
        if (targetBlob) {
          runDuplicateCheck(targetBlob, latitude, longitude);
        }
      } catch (dupErr) {
        console.warn('Could not run duplicate check in AI scan:', dupErr);
      }
    } catch (err: any) {
      console.warn('AI scan error:', err);
    } finally {
      setIsScanningAI(false);
      setAiScanDone(true);
    }
  };

  // Handle in-app Live GPS Camera capture with permanent canvas watermark
  const handleGpsCameraCapture = (data: {
    originalBlob: Blob;
    stampedBlob: Blob;
    stampedDataUrl: string;
    metadata: GpsCaptureMetadata;
  }) => {
    setShowGpsCamera(false);
    setPreviewImage(data.stampedDataUrl);
    setImageBlob(data.stampedBlob);
    setOriginalImageBlob(data.originalBlob);
    setAnnotatedImage(null);
    setShowAnnotated(false);
    setValidationError(null);

    // Synchronize GPS Telemetry
    setLatitude(data.metadata.latitude);
    setLongitude(data.metadata.longitude);
    if (data.metadata.altitude != null) setAltitude(data.metadata.altitude);
    setGpsAccuracy(data.metadata.gpsAccuracy);
    setReadableAddress(data.metadata.readableAddress);
    setCaptureTimestamp(data.metadata.captureTimestamp);
    setCaptureMethod('in_app_camera');
    setGeotagVerified(true);
    setCameraMake('RoadGuard AI Live Camera');
    setCameraModel('Canvas Stamped HUD');
    setLocationStatus('detected');
    setLocationErrorMessage(null);
    setIsManualCorrection(false);

    // Trigger AI Scan and Nearby Search
    runAIScan(data.stampedDataUrl);
    searchNearby(data.metadata.latitude, data.metadata.longitude, searchRadius);
  };

  const openGpsCamera = () => {
    setShowGpsCamera(true);
  };

  // Handle File Upload with mandatory EXIF GPS verification
  // Handle File Upload (Geotag EXIF is optional and automatically extracted when present)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
        setValidationError('Please upload a valid image file (JPG, PNG, or WEBP).');
        return;
      }

      setIsExtractingExif(true);
      setValidationError(null);

      // Read preview Data URL immediately
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setPreviewImage(dataUrl);
          setAnnotatedImage(null);
          setShowAnnotated(false);
        }
      };
      reader.readAsDataURL(file);

      setImageBlob(file);
      setOriginalImageBlob(file);

      try {
        const exifResult = await extractExifGps(file);

        if (exifResult.success && exifResult.metadata) {
          const {
            latitude: lat,
            longitude: lng,
            altitude: alt,
            captureTimestamp: capTime,
            cameraMake: make,
            cameraModel: model,
          } = exifResult.metadata;

          setLatitude(lat);
          setLongitude(lng);
          setAltitude(alt);
          setGpsAccuracy(null);
          setCaptureTimestamp(capTime || new Date().toISOString());
          setCameraMake(make);
          setCameraModel(model);
          setCaptureMethod('existing_geotagged_upload');
          setGeotagVerified(true);
          setLocationStatus('detected');
          setLocationErrorMessage(null);
          setIsManualCorrection(false);

          // Reverse geocode extracted coordinates
          try {
            const resolvedAddress = await reverseGeocodeCoordinates(lat, lng);
            setReadableAddress(resolvedAddress);
          } catch {
            await reverseGeocode(lat, lng);
          }

          searchNearby(lat, lng, searchRadius);
        } else {
          // EXIF GPS not present — accept the photo using current device or map location
          setCaptureMethod('standard_upload');
          setGeotagVerified(false);
          setAltitude(undefined);
          setCameraMake(undefined);
          setCameraModel(undefined);

          if (locationStatus === 'idle') {
            detectLocation();
          } else {
            searchNearby(latitude, longitude, searchRadius);
          }
        }
      } catch (err: any) {
        console.warn('EXIF extraction skipped:', err);
        setCaptureMethod('standard_upload');
        setGeotagVerified(false);
        if (locationStatus === 'idle') {
          detectLocation();
        } else {
          searchNearby(latitude, longitude, searchRadius);
        }
      } finally {
        setIsExtractingExif(false);
      }

      // Run AI scan on uploaded photo
      runAIScan(file);
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

  // Perform perceptual hash (pHash) duplicate check against nearby reports
  const runDuplicateCheck = async (blobOrFile: Blob | File, lat: number = latitude, lng: number = longitude) => {
    setIsCheckingDuplicates(true);
    try {
      const res = await checkDuplicateImage(blobOrFile, lat, lng, searchRadius, category);
      if (res && res.has_duplicate_candidate) {
        setDuplicateCandidates(res.duplicate_candidates || []);
      } else {
        setDuplicateCandidates([]);
      }
    } catch (e) {
      console.warn('pHash duplicate check error:', e);
      setDuplicateCandidates([]);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Query nearby existing reports within configurable radius (default: 50m)
  const searchNearby = async (lat: number, lng: number, radiusMeters: number = searchRadius) => {
    setIsSearchingNearby(true);
    try {
      const resp = await fetchNearbyReports(lat, lng, radiusMeters);
      setNearbyReports(resp.reports || []);
      setHasSearchedNearby(true);

      // If an image is already present, evaluate pHash duplicates against nearby reports
      if (imageBlob) {
        runDuplicateCheck(imageBlob, lat, lng);
      }
    } catch (e) {
      console.warn('Nearby search error:', e);
      setNearbyReports([]);
    } finally {
      setIsSearchingNearby(false);
    }
  };

  // Change search radius dynamically
  const handleRadiusChange = (newRadius: number) => {
    setSearchRadius(newRadius);
    searchNearby(latitude, longitude, newRadius);
  };

  // Automatic GPS Geolocation Detection with browser Geolocation API
  const detectLocation = () => {
    setLocationStatus('detecting');
    setLocationErrorMessage(null);
    setValidationError(null);

    if (!('geolocation' in navigator)) {
      setLocationStatus('unavailable');
      setLocationErrorMessage(
        'Browser does not support the Geolocation API. Please place your pin manually on the map or type an address below.'
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);

        setLatitude(lat);
        setLongitude(lng);
        setGpsAccuracy(acc);
        setLocationStatus('detected');
        setIsManualCorrection(false);
        setLocationErrorMessage(null);

        // Fetch readable street address and search nearby reports simultaneously
        await Promise.all([
          reverseGeocode(lat, lng),
          searchNearby(lat, lng, searchRadius),
        ]);
      },
      (err: GeolocationPositionError) => {
        console.warn('Geolocation error code:', err.code, err.message);
        let errorMsg = 'Could not acquire GPS position. Please select location manually on the map.';
        if (err.code === 1) {
          setLocationStatus('denied');
          errorMsg = 'Location permission was denied. Please allow location access in your browser settings or choose a location on the map.';
        } else if (err.code === 2) {
          setLocationStatus('unavailable');
          errorMsg = 'GPS positioning unavailable. Please verify device location services or place pin on the map.';
        } else if (err.code === 3) {
          setLocationStatus('timeout');
          errorMsg = 'GPS acquisition timed out. Please retry or adjust the pin manually on the map.';
        } else {
          setLocationStatus('error');
        }
        setLocationErrorMessage(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Auto-detect GPS when modal opens if still idle
  useEffect(() => {
    if (isOpen) {
      if (locationStatus === 'idle') {
        detectLocation();
      } else {
        searchNearby(latitude, longitude, searchRadius);
      }
    }
  }, [isOpen]);

  // Handle Pin Drag or Map Click Correction
  const handleMapLocationChange = async (newLat: number, newLng: number) => {
    setLatitude(newLat);
    setLongitude(newLng);
    setIsManualCorrection(true);
    setLocationStatus('manual');
    setLocationErrorMessage(null);
    await Promise.all([
      reverseGeocode(newLat, newLng),
      searchNearby(newLat, newLng, searchRadius),
    ]);
  };

  // Handle Manual Address Geocoding / Submission
  const handleApplyManualAddress = async () => {
    const query = manualAddressInput.trim();
    if (!query) return;

    setIsGeocodingManualAddress(true);
    setLocationErrorMessage(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'User-Agent': 'RoadGuardAI/1.0 (info@roadguard.ai)' } }
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const first = results[0];
          const newLat = parseFloat(first.lat);
          const newLng = parseFloat(first.lon);
          setLatitude(newLat);
          setLongitude(newLng);
          setReadableAddress(first.display_name.split(',').slice(0, 3).join(','));
          setIsManualCorrection(true);
          setLocationStatus('manual');
          setGpsAccuracy(null);
          await searchNearby(newLat, newLng, searchRadius);
          setIsGeocodingManualAddress(false);
          return;
        }
      }
      setReadableAddress(query);
      setIsManualCorrection(true);
      setLocationStatus('manual');
    } catch {
      setReadableAddress(query);
      setIsManualCorrection(true);
      setLocationStatus('manual');
    } finally {
      setIsGeocodingManualAddress(false);
    }
  };

  // Submit Handler
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!previewImage) {
      setValidationError('Please select or capture a road damage photograph.');
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

    const isOnline = syncManager.isOnline();
    setWasOnlineAtSubmission(isOnline);

    const clientReportId = generatePotholeId();

    // Ensure binary Blob is available
    let finalBlob = imageBlob;
    if (!finalBlob && previewImage) {
      try {
        const res = await fetch(previewImage);
        finalBlob = await res.blob();
      } catch {
        finalBlob = new Blob(['image'], { type: 'image/jpeg' });
      }
    }

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
          clientReportId,
          imageBlob: finalBlob || undefined,
          originalImageBlob: originalImageBlob || undefined,
          category,
          severity,
          description,
          imageUrl: previewImage,
          annotatedImageUrl: annotatedImage || undefined,
          aiConfidence: aiDetectedDefect?.confidence,
          aiDetection: aiDetectedDefect?.type,
          repairMethod: aiDetectedDefect?.repairMethod,
          dimensions: aiDetectedDefect?.dimensions,
          location: reportLocation,
          altitude,
          gpsAccuracy: gpsAccuracy || undefined,
          captureTimestamp: captureTimestamp || new Date().toISOString(),
          captureMethod: captureMethod || (photoSource === 'upload' ? 'standard_upload' : 'in_app_camera'),
          geotagVerified: geotagVerified,
          exifMetadataAvailable: captureMethod === 'existing_geotagged_upload',
          cameraMake,
          cameraModel,
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
    setShowGpsCamera(false);
    setSubmittedReport(null);
    setPreviewImage(null);
    setImageBlob(null);
    setOriginalImageBlob(null);
    setAnnotatedImage(null);
    setShowAnnotated(false);
    setAiDetectedDefect(null);
    setAiScanDone(false);
    setIsScanningAI(false);
    setGeotagVerified(false);
    setCaptureMethod(null);
    setAltitude(undefined);
    setCaptureTimestamp(undefined);
    setCameraMake(undefined);
    setCameraModel(undefined);
    onClose();
  };

  if (!isOpen) return null;

  const currentDisplayImage = showAnnotated && annotatedImage ? annotatedImage : previewImage;

  return (
    <>
      <AnimatePresence>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none ${showGpsCamera ? 'hidden' : ''}`}>
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
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${
                  wasOnlineAtSubmission
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                }`}
              >
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <span
                className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${
                  wasOnlineAtSubmission ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {wasOnlineAtSubmission ? 'ONLINE SUBMISSION' : 'OFFLINE STORAGE ACTIVE'}
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-1 max-w-lg mx-auto">
                {wasOnlineAtSubmission
                  ? 'Report submitted successfully.'
                  : 'Report saved securely on this device. It will automatically upload when your internet connection returns.'}
              </h2>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mt-2 leading-relaxed">
                {wasOnlineAtSubmission
                  ? 'Your road damage report has been assigned a priority work ticket and queued for municipal road crew inspection.'
                  : 'Your road distress report and photograph are saved in IndexedDB. Once your device reconnects to Wi-Fi or cellular network, our background sync engine will transmit the report to MongoDB Atlas automatically.'}
              </p>

              {/* Submitted Report Summary Card */}
              <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-left max-w-lg mx-auto">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="font-mono text-xs text-neutral-400">
                    REPORT ID:{' '}
                    <span className="text-white font-semibold">{submittedReport.id}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#d97757]/20 border border-[#d97757]/40 text-[#d97757]">
                      {submittedReport.status}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                      {submittedReport.severity}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="col-span-1 rounded-lg overflow-hidden border border-white/10 aspect-video bg-black relative">
                    <img
                      src={submittedReport.annotatedImageUrl || submittedReport.imageUrl}
                      alt="Submitted Road Defect"
                      className="w-full h-full object-cover"
                    />
                    {submittedReport.aiDetection && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono text-emerald-300 border border-emerald-500/30">
                        AI Verified
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1 text-xs">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{submittedReport.category}</span>
                      {submittedReport.aiConfidence && (
                        <span className="text-[10px] font-mono text-emerald-400">
                          ({submittedReport.aiConfidence.toFixed(1)}% confidence)
                        </span>
                      )}
                    </div>
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
                    setAnnotatedImage(null);
                    setShowAnnotated(false);
                    setAiDetectedDefect(null);
                    setAiScanDone(false);
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
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI Auto-Scan Active
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                  Report Road Damage or Pothole
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Attach or capture a photo. RoadGuard&apos;s YOLO AI will automatically scan the hazard,
                  classify the defect category, and evaluate the severity level.
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
                      <span>Upload Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoSource('camera');
                        openGpsCamera();
                      }}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                        photoSource === 'camera'
                          ? 'bg-[#d97757] text-white font-medium'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Camera className="w-3 h-3" />
                      <span>Live GPS Camera</span>
                    </button>
                  </div>
                </div>

                {/* Photo Viewport Area */}
                <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] rounded-xl overflow-hidden border border-white/15 bg-black flex items-center justify-center">
                  {/* IN-APP GPS CAMERA LAUNCH SCREEN */}
                  {photoSource === 'camera' && !previewImage && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-black via-[#0d0f17] to-black">
                      <div className="w-14 h-14 rounded-full bg-[#d97757]/20 border border-[#d97757]/40 flex items-center justify-center text-[#d97757] mb-3 shadow-[0_0_20px_rgba(217,119,87,0.3)]">
                        <Camera className="w-7 h-7" />
                      </div>
                      <div className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                        <span>Live GPS Map Camera</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                          Auto Watermark
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 max-w-sm mb-4">
                        Opens in-app camera viewfinder with real-time GNSS telemetry, alignment reticle, and accuracy validation (≤100m).
                      </p>
                      <button
                        type="button"
                        onClick={openGpsCamera}
                        className="px-5 py-2.5 rounded-full bg-[#d97757] hover:bg-[#c66848] text-white text-xs font-semibold flex items-center gap-2 shadow-[0_0_25px_rgba(217,119,87,0.45)] transition cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Launch Live GPS Camera</span>
                      </button>
                    </div>
                  )}

                  {/* PREVIEW OF CAPTURED / UPLOADED IMAGE */}
                  {previewImage ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={currentDisplayImage || previewImage}
                        alt="Road damage preview"
                        className="w-full h-full object-cover"
                      />

                      {/* AI Scanning Animated Laser Overlay */}
                      {isScanningAI && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                          <motion.div
                            initial={{ top: '0%' }}
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d97757] to-transparent shadow-[0_0_20px_#d97757]"
                          />
                          <div className="absolute inset-0 bg-[#d97757]/10 animate-pulse" />
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-black/85 border border-[#d97757]/60 text-white text-[11px] font-mono flex items-center gap-2 backdrop-blur-md shadow-2xl">
                            <div className="w-2 h-2 rounded-full bg-[#d97757] animate-ping" />
                            <span>AI YOLO Scanning Road Defect & Severity...</span>
                          </div>
                        </div>
                      )}

                      {/* Toggle Bounding Box / Original Pill (if annotated image exists) */}
                      {annotatedImage && !isScanningAI && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-lg border border-white/20 z-20">
                          <button
                            type="button"
                            onClick={() => setShowAnnotated(false)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                              !showAnnotated
                                ? 'bg-[#d97757] text-white font-semibold'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            Original
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAnnotated(true)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer flex items-center gap-1 ${
                              showAnnotated
                                ? 'bg-[#d97757] text-white font-semibold'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>AI Bounding Box</span>
                          </button>
                        </div>
                      )}

                      {/* Retake / Replace Hover Controls */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 z-10">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(null);
                            setImageBlob(null);
                            setOriginalImageBlob(null);
                            setAnnotatedImage(null);
                            setShowAnnotated(false);
                            setAiDetectedDefect(null);
                            setAiScanDone(false);
                            setGeotagVerified(false);
                            setCaptureMethod(null);
                            setAltitude(undefined);
                            setCaptureTimestamp(undefined);
                            setCameraMake(undefined);
                            setCameraModel(undefined);
                            if (photoSource === 'camera') openGpsCamera();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-white text-xs border border-white/20 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retake / Replace</span>
                        </button>
                      </div>

                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 border border-white/20 text-[10px] font-mono text-white z-10 flex items-center gap-1.5">
                        {geotagVerified ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>{showAnnotated ? 'AI ANNOTATED VIEW' : 'GEOTAGGED PHOTO'}</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-3 h-3 text-[#d97757]" />
                            <span>{showAnnotated ? 'AI ANNOTATED VIEW' : 'ROAD DAMAGE PHOTO'}</span>
                          </>
                        )}
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
                        {isExtractingExif ? (
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="w-8 h-8 animate-spin text-[#d97757] mb-1" />
                            <span className="text-xs font-semibold text-white">Validating EXIF Geotag Metadata...</span>
                            <span className="text-[11px] text-neutral-400">Extracting embedded GPS coordinates and altitude</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#d97757] mb-2.5">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div className="text-xs font-semibold text-white">
                              Click to select road damage photo
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-1 max-w-sm">
                              Upload any pothole or road hazard photo (JPG, PNG, WEBP). Geotag will be automatically extracted if present.
                            </p>
                          </>
                        )}
                      </div>
                    )
                  )}
                </div>

                {/* GEOTAG VERIFICATION CARD */}
                {previewImage && geotagVerified && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-black/50 to-[#0e1017] border border-emerald-500/40 space-y-2.5 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2 font-mono">
                            <span>GEOTAG VERIFIED</span>
                            <span className="text-[9px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                              Forensic Authenticity Confirmed
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {captureMethod === 'in_app_camera'
                              ? 'Captured via RoadGuard AI In-App Camera · Permanent Canvas HUD Watermark'
                              : 'Uploaded Photo with Authenticated EXIF GPS Geotag'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono text-[10px]">
                        {captureMethod === 'in_app_camera' && gpsAccuracy != null ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                            Accuracy: ±{gpsAccuracy}m
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold">
                            EXIF GNSS Lock
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20 text-[10px] font-mono">
                      <div className="p-1.5 rounded bg-black/40 border border-white/5">
                        <span className="text-neutral-500 block uppercase">GNSS Coordinates</span>
                        <span className="text-white font-semibold truncate block mt-0.5">
                          {latitude.toFixed(5)}°, {longitude.toFixed(5)}°
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-black/40 border border-white/5">
                        <span className="text-neutral-500 block uppercase">Altitude</span>
                        <span className="text-white font-semibold block mt-0.5">
                          {altitude != null ? `${altitude} m ASL` : 'Sensor N/A'}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-black/40 border border-white/5">
                        <span className="text-neutral-500 block uppercase">Capture Time</span>
                        <span className="text-white font-semibold truncate block mt-0.5">
                          {captureTimestamp ? new Date(captureTimestamp).toLocaleTimeString() : 'Current'}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-black/40 border border-white/5">
                        <span className="text-neutral-500 block uppercase">Camera / Device</span>
                        <span className="text-white font-semibold truncate block mt-0.5">
                          {cameraMake || cameraModel ? `${cameraMake || ''} ${cameraModel || ''}`.trim() : 'RoadGuard Sensor'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STANDARD PHOTO UPLOAD CARD */}
                {previewImage && !geotagVerified && (
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-neutral-300">
                      <MapPin className="w-4 h-4 text-[#d97757] shrink-0" />
                      <div>
                        <span className="font-semibold text-white">Road Photo Attached</span>
                        <div className="text-[10px] text-neutral-400">
                          Location assigned from device GNSS / map position ({readableAddress})
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-white/10 font-mono shrink-0">
                      Standard Upload
                    </span>
                  </div>
                )}

                {/* AI SCAN OUTCOME BANNER */}
                {previewImage && (
                  <div className="pt-1">
                    {aiDetectedDefect ? (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#d97757]/15 via-black/40 to-emerald-500/10 border border-[#d97757]/40 space-y-3 shadow-[0_0_25px_rgba(217,119,87,0.15)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#d97757]/20 border border-[#d97757]/40 flex items-center justify-center text-[#d97757] shrink-0 mt-0.5">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-white tracking-tight">
                                  AI Auto-Detected: {aiDetectedDefect.type}
                                </span>
                                {aiDetectedDefect.id && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#d97757]/20 text-[#d97757] border border-[#d97757]/40">
                                    {aiDetectedDefect.id}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  {aiDetectedDefect.confidence.toFixed(1)}% Confidence
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                                    aiDetectedDefect.severity === 'Critical'
                                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                      : aiDetectedDefect.severity === 'High'
                                      ? 'bg-[#d97757]/20 text-[#d97757] border-[#d97757]/40'
                                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  }`}
                                >
                                  Severity: {aiDetectedDefect.severity}
                                </span>
                                {aiDetectedDefect.urgency && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                    Urgency: {aiDetectedDefect.urgency}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-300 mt-1">
                                Category automatically selected as{' '}
                                <strong className="text-white">{aiDetectedDefect.category}</strong> and severity as{' '}
                                <strong className="text-white">{aiDetectedDefect.severity}</strong> (
                                {aiDetectedDefect.count} {aiDetectedDefect.count === 1 ? 'hazard' : 'hazards'} identified).
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {annotatedImage && (
                              <button
                                type="button"
                                onClick={() => setShowAnnotated((prev) => !prev)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition cursor-pointer flex items-center gap-1 ${
                                  showAnnotated
                                    ? 'bg-[#d97757] text-white border-[#d97757]'
                                    : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'
                                }`}
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>{showAnnotated ? 'Showing AI Box' : 'View AI Box'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => previewImage && runAIScan(previewImage)}
                              disabled={isScanningAI}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                              title="Re-run AI inspection"
                            >
                              <RotateCcw className={`w-3 h-3 ${isScanningAI ? 'animate-spin' : ''}`} />
                              <span>Re-scan</span>
                            </button>
                          </div>
                        </div>

                        {/* DETAILED POTHOLE METRICS & REMEDIATION GRID */}
                        {aiDetectedDefect.dimensions && (
                          <div className="pt-2 border-t border-white/10 space-y-2">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                              <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                                <span className="text-neutral-400 block uppercase text-[9px]">Pothole Dimensions</span>
                                <span className="text-white font-bold text-xs mt-0.5 block">
                                  {aiDetectedDefect.dimensions.widthCm} cm × {aiDetectedDefect.dimensions.heightCm} cm
                                </span>
                                <span className="text-neutral-500 text-[8px]">Width × Length</span>
                              </div>
                              <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                                <span className="text-neutral-400 block uppercase text-[9px]">Estimated Depth</span>
                                <span className={`font-bold text-xs mt-0.5 block ${
                                  (aiDetectedDefect.dimensions.estimatedDepthMm || 0) >= 60 ? 'text-red-400' : 'text-amber-300'
                                }`}>
                                  {aiDetectedDefect.dimensions.estimatedDepthMm ? `${aiDetectedDefect.dimensions.estimatedDepthMm} mm` : 'N/A'}
                                </span>
                                <span className="text-neutral-500 text-[8px]">
                                  {(aiDetectedDefect.dimensions.estimatedDepthMm || 0) >= 60 ? '⚠️ High Rim Impact' : 'Cavity depression'}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                                <span className="text-neutral-400 block uppercase text-[9px]">Surface Area</span>
                                <span className="text-emerald-300 font-bold text-xs mt-0.5 block">
                                  {aiDetectedDefect.dimensions.areaCm2?.toLocaleString()} cm²
                                </span>
                                <span className="text-neutral-500 text-[8px]">
                                  ~{Math.max(0.1, (aiDetectedDefect.dimensions.areaCm2 * 0.00025)).toFixed(2)} tons mix
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                                <span className="text-neutral-400 block uppercase text-[9px]">Repair Urgency</span>
                                <span className={`font-bold text-xs mt-0.5 block ${
                                  aiDetectedDefect.urgency === 'Immediate' || aiDetectedDefect.severity === 'Critical' ? 'text-red-400' : 'text-[#d97757]'
                                }`}>
                                  {aiDetectedDefect.urgency || (aiDetectedDefect.severity === 'Critical' ? 'Immediate' : 'Priority (48h)')}
                                </span>
                                <span className="text-neutral-500 text-[8px]">Dispatch tier</span>
                              </div>
                            </div>

                            {aiDetectedDefect.repairMethod && (
                              <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] flex items-start gap-2">
                                <span className="text-[10px] font-mono uppercase text-[#d97757] font-semibold shrink-0 mt-0.5">
                                  Remediation:
                                </span>
                                <span className="text-neutral-200">
                                  {aiDetectedDefect.repairMethod}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : aiScanDone ? (
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-2 text-xs text-neutral-300">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            AI Scan Complete: Pavement surface scanned. No severe defects auto-detected. You can manually classify below.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => previewImage && runAIScan(previewImage)}
                          disabled={isScanningAI}
                          className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-neutral-400 hover:text-white transition cursor-pointer"
                        >
                          Re-scan
                        </button>
                      </div>
                    ) : null}

                    {/* Duplicate Check Progress Indicator */}
                    {previewImage && isCheckingDuplicates && (
                      <div className="mt-2 p-2 rounded-lg bg-black/40 border border-white/5 flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                        <RefreshCw className="w-3 h-3 animate-spin text-[#d97757]" />
                        <span>Comparing image perceptual hash & OpenCV ORB keypoints against nearby reports...</span>
                      </div>
                    )}

                    {/* CANDIDATE DUPLICATE PHOTOGRAPH WARNING BANNER (pHash + OpenCV ORB) */}
                    {previewImage && duplicateCandidates.length > 0 && (
                      <div className="mt-2.5 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-black/40 to-orange-950/30 border border-amber-500/50 space-y-2.5 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-amber-200 tracking-tight">
                                {duplicateCandidates[0].verdict === 'CONFIRMED_DUPLICATE'
                                  ? 'Confirmed Duplicate Issue'
                                  : duplicateCandidates[0].verdict === 'NEEDS_REVIEW'
                                  ? 'Uncertain Match (Queued for Admin Review)'
                                  : duplicateCandidates[0].match_type === 'ORB_VIEWPOINT'
                                  ? 'Same Pothole Detected (Different Viewpoint Angle)'
                                  : duplicateCandidates[0].match_type === 'COMBINED'
                                  ? 'Confirmed Road Defect Match (pHash + ORB)'
                                  : duplicateCandidates[0].match_level === 'IDENTICAL'
                                  ? 'Exact Image Duplicate (Identical pHash)'
                                  : `Visual Duplicate Match: ${duplicateCandidates[0].match_level.replace('_', ' ')}`}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                {duplicateCandidates[0].similarity_score}% Evidence Score
                              </span>
                              {duplicateCandidates[0].canonical_issue_id && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-neutral-300 bg-white/10 border border-white/20">
                                  Canonical #{duplicateCandidates[0].canonical_issue_id.slice(-8)}
                                </span>
                              )}
                              {duplicateCandidates[0].orb_metrics && duplicateCandidates[0].orb_metrics.ransac_inliers_count > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                  ORB Inliers: {duplicateCandidates[0].orb_metrics.ransac_inliers_count} ({Math.round(duplicateCandidates[0].orb_metrics.inlier_ratio * 100)}% match)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-300 mt-1 leading-snug">
                              {duplicateCandidates[0].match_reason ? (
                                <span>{duplicateCandidates[0].match_reason} </span>
                              ) : (
                                <span>
                                  A matching photograph was detected for nearby report{' '}
                                  <strong className="text-white">#{duplicateCandidates[0].report_id.slice(-8)}</strong>
                                  {duplicateCandidates[0].distance_meters != null && ` (${duplicateCandidates[0].distance_meters}m away)`}.{' '}
                                </span>
                              )}
                              {duplicateCandidates[0].verdict === 'CONFIRMED_DUPLICATE' ? (
                                <span>This report will be linked to the canonical ticket while <strong className="text-emerald-300">fully preserving your submission</strong>.</span>
                              ) : (
                                <span>Reports are <strong className="text-amber-200">not automatically merged</strong>. Your report will be kept independent and queued for municipal verification.</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Top duplicate card preview */}
                        {duplicateCandidates[0].image_url && (
                          <div className="p-2 rounded-lg bg-black/60 border border-white/10 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <img
                                src={duplicateCandidates[0].annotated_image_url || duplicateCandidates[0].image_url}
                                alt="Existing report"
                                className="w-10 h-10 rounded object-cover border border-white/10"
                              />
                              <div>
                                <span className="font-semibold text-white">Existing #{duplicateCandidates[0].report_id.slice(-8)}</span>
                                <div className="text-[10px] text-neutral-400">
                                  {duplicateCandidates[0].category} • {duplicateCandidates[0].severity}
                                  {duplicateCandidates[0].distance_meters != null && ` • ${duplicateCandidates[0].distance_meters}m away`}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-mono text-amber-400 font-semibold">
                                {duplicateCandidates[0].match_type === 'ORB_VIEWPOINT'
                                  ? 'ORB Viewpoint Inliers'
                                  : duplicateCandidates[0].match_level === 'IDENTICAL'
                                  ? 'Exact Photo'
                                  : 'Near-Identical Photo'}
                              </div>
                              {duplicateCandidates[0].orb_metrics && duplicateCandidates[0].orb_metrics.ransac_inliers_count > 0 && (
                                <div className="text-[9px] font-mono text-cyan-400">
                                  {duplicateCandidates[0].orb_metrics.good_matches_count} matches / {duplicateCandidates[0].orb_metrics.ransac_inliers_count} inliers
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION B: DAMAGE INFORMATION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>2. Defect Category & Severity Level</span>
                    <span className="text-red-400">*</span>
                  </label>
                  {aiDetectedDefect && (
                    <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#d97757]" />
                      Auto-populated by AI model
                    </span>
                  )}
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DAMAGE_CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    const isAISuggested = aiDetectedDefect?.category === cat.id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative ${
                          isSelected
                            ? 'bg-[#d97757]/20 border-[#d97757] text-white shadow-[0_0_12px_rgba(217,119,87,0.3)]'
                            : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold">{cat.label}</div>
                          {isAISuggested && (
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#d97757]/30 text-[#d97757] border border-[#d97757]/50">
                              AI
                            </span>
                          )}
                        </div>
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
                    const isAISuggested = aiDetectedDefect?.severity === sev;

                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? sev === 'Critical'
                              ? 'bg-red-950/60 border-red-500 text-red-300'
                              : 'bg-[#d97757]/20 border-[#d97757] text-white'
                            : 'bg-white/[0.02] border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <span>{sev}</span>
                        {isAISuggested && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-emerald-300 border border-emerald-500/40">
                            AI
                          </span>
                        )}
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

              {/* SECTION C: AUTOMATIC GPS LOCATION DETECTION & NEARBY SEARCH */}
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span>3. Road Location & GPS Telemetry</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Browser Geolocation API captures latitude, longitude, and accuracy radius.
                    </p>
                  </div>

                  {/* Detect / Refresh GPS Button */}
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locationStatus === 'detecting'}
                    className="px-3 py-1.5 rounded-lg bg-[#d97757] hover:bg-[#c66848] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(217,119,87,0.35)] transition cursor-pointer"
                  >
                    <Crosshair className={`w-3.5 h-3.5 ${locationStatus === 'detecting' ? 'animate-spin' : ''}`} />
                    <span>
                      {locationStatus === 'detecting'
                        ? 'Acquiring GNSS Lock...'
                        : 'Detect My Location'}
                    </span>
                  </button>
                </div>

                {/* GPS Telemetry & Accuracy Bar */}
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Status Pill */}
                    <div className="flex items-center gap-2">
                      {locationStatus === 'detecting' ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          Acquiring Satellite Fix...
                        </span>
                      ) : locationStatus === 'detected' ? (
                        <div className="flex items-center gap-2">
                          {gpsAccuracy != null && gpsAccuracy <= 15 ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              High Precision (±{gpsAccuracy}m)
                            </span>
                          ) : gpsAccuracy != null && gpsAccuracy <= 50 ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Moderate Accuracy (±{gpsAccuracy}m)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-red-500/20 text-red-300 border border-red-500/40">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Low Accuracy (±{gpsAccuracy || '>50'}m)
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-emerald-400">GPS Locked</span>
                        </div>
                      ) : locationStatus === 'manual' ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-sky-500/20 text-sky-300 border border-sky-500/40">
                          <MapPin className="w-2.5 h-2.5" />
                          Manual Pin Adjusted
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/10 text-neutral-300 border border-white/20">
                          Default Coordinates
                        </span>
                      )}
                    </div>

                    {/* Coordinates Monospace Display */}
                    <div className="text-[11px] font-mono text-neutral-300 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-2">
                      <span className="text-neutral-400">LAT</span>
                      <strong className="text-white">{latitude.toFixed(6)}°</strong>
                      <span className="text-neutral-500">|</span>
                      <span className="text-neutral-400">LNG</span>
                      <strong className="text-white">{longitude.toFixed(6)}°</strong>
                    </div>
                  </div>

                  {/* Reverse Geocoded Address */}
                  <div className="flex items-center gap-2 text-xs text-neutral-300 pt-1 border-t border-white/5">
                    <MapPin className="w-3.5 h-3.5 text-[#d97757] shrink-0" />
                    <span className="truncate">{readableAddress}</span>
                  </div>

                  {/* Warning if GPS Accuracy is low (>30m) */}
                  {gpsAccuracy != null && gpsAccuracy > 30 && (
                    <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        GPS drift detected (±{gpsAccuracy}m). Please tap or drag the pin on the map below to pinpoint the exact pothole.
                      </span>
                    </div>
                  )}
                </div>

                {/* Location Error / Denial Banner */}
                {locationErrorMessage && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{locationErrorMessage}</span>
                    </div>
                    <p className="text-[11px] text-neutral-300">
                      You can position the marker directly on the interactive map below or enter a street address.
                    </p>
                  </div>
                )}

                {/* Geotag Lock Notice for uploaded EXIF photo */}
                {captureMethod === 'existing_geotagged_upload' && (
                  <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-200 text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      <strong>EXIF Location Locked:</strong> Coordinates are strictly bound to the photo&apos;s embedded EXIF GPS metadata. Manual coordinate overrides are disabled to preserve forensic authenticity.
                    </span>
                  </div>
                )}

                {/* Manual Address Search / Placement Input (only if not locked by photo EXIF) */}
                {captureMethod !== 'existing_geotagged_upload' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                      Manual Street / Intersection Lookup
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={manualAddressInput}
                          onChange={(e) => setManualAddressInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyManualAddress();
                            }
                          }}
                          placeholder="e.g. 500 Market St, San Francisco, CA"
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757] transition"
                        />
                        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyManualAddress}
                        disabled={isGeocodingManualAddress || !manualAddressInput.trim()}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                      >
                        {isGeocodingManualAddress ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Searching...</span>
                          </>
                        ) : (
                          <span>Locate on Map</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Leaflet Map with Search Radius & Nearby Defects */}
                <div className="space-y-1.5">
                  <RoadLocationMap
                    latitude={latitude}
                    longitude={longitude}
                    address={readableAddress}
                    gpsAccuracy={gpsAccuracy}
                    searchRadiusMeters={searchRadius}
                    showSearchRadius={true}
                    nearbyReports={nearbyReports}
                    isInteractive={captureMethod !== 'existing_geotagged_upload'}
                    onLocationChange={handleMapLocationChange}
                    height="250px"
                  />
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono px-1">
                    <span>
                      {latitude.toFixed(6)}° N, {longitude.toFixed(6)}° W
                    </span>
                    <span className="text-amber-400/90 flex items-center gap-1">
                      <Compass className="w-3 h-3" />
                      {captureMethod === 'existing_geotagged_upload'
                        ? 'Locked to Photo EXIF Metadata'
                        : isManualCorrection
                        ? 'Manual pin adjustment applied'
                        : 'Interactive Draggable Pin'}
                    </span>
                  </div>
                </div>

                {/* SECTION C.2: NEARBY ROAD ISSUE SEARCH (Configurable 50m radius) */}
                <div className="p-3.5 rounded-xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-[#d97757] animate-pulse" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Nearby Road Issues Search
                      </span>
                      {nearbyReports.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {nearbyReports.length} Detected
                        </span>
                      ) : hasSearchedNearby && !isSearchingNearby ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          0 Nearby
                        </span>
                      ) : null}
                    </div>

                    {/* Search Radius Selector Chips (Initial 50m default) */}
                    <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/10 text-[10px] font-mono">
                      <span className="text-neutral-500 px-1">Radius:</span>
                      {[25, 50, 100, 250].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleRadiusChange(r)}
                          className={`px-2 py-0.5 rounded transition cursor-pointer ${
                            searchRadius === r
                              ? 'bg-[#d97757] text-white font-semibold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {r}m{r === 50 ? ' (Default)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nearby Search Loading State */}
                  {isSearchingNearby && (
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-2 text-xs text-neutral-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#d97757]" />
                      <span>Scanning database for existing road damage reports within {searchRadius}m...</span>
                    </div>
                  )}

                  {/* Nearby Reports Alert List */}
                  {!isSearchingNearby && nearbyReports.length > 0 && (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/40 text-[11px] text-amber-200 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-100">
                            {nearbyReports.length} road hazard{nearbyReports.length === 1 ? '' : 's'} already reported within {searchRadius} meters.
                          </strong>
                          <p className="text-neutral-300 mt-0.5">
                            Please check if your pothole is already listed below to prevent duplicate municipal work orders.
                          </p>
                        </div>
                      </div>

                      {/* Nearby Cards Scroll */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                        {nearbyReports.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-xl bg-black/60 border border-white/15 hover:border-amber-500/50 transition flex items-start gap-2.5"
                          >
                            {item.image_url ? (
                              <img
                                src={item.annotated_image_url || item.image_url}
                                alt={item.category}
                                className="w-12 h-12 rounded-lg object-cover bg-neutral-900 border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-500 shrink-0">
                                <MapPin className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-white truncate">{item.category}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                                    item.severity === 'Critical'
                                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                      : item.severity === 'High'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                  }`}
                                >
                                  {item.severity}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-amber-400 font-mono mt-0.5">
                                <span>📍 {item.distance_meters}m away</span>
                                <span className="text-neutral-500">•</span>
                                <span className="text-neutral-400 capitalize">{item.status}</span>
                              </div>
                              <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                                {item.address || `${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state when search found 0 reports */}
                  {!isSearchingNearby && hasSearchedNearby && nearbyReports.length === 0 && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-2 text-[11px] text-emerald-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        No existing road hazards detected within {searchRadius}m. This appears to be a new, unique report!
                      </span>
                    </div>
                  )}
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

    {/* Live In-App GPS Camera Capture Viewfinder */}
    {showGpsCamera && (
      <GpsCameraCapture
        initialCoords={
          locationStatus === 'detected' || locationStatus === 'manual'
            ? { latitude, longitude }
            : undefined
        }
        initialAddress={
          locationStatus === 'detected' || locationStatus === 'manual'
            ? readableAddress
            : undefined
        }
        onCapture={handleGpsCameraCapture}
        onCancel={() => setShowGpsCamera(false)}
      />
    )}
  </>
  );
};
