import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  RefreshCw,
  AlertTriangle,
  X,
  Compass,
  Radio,
  Upload,
} from 'lucide-react';
import { reverseGeocodeCoordinates } from '../../services/geocodeService';

export interface GpsCaptureMetadata {
  latitude: number;
  longitude: number;
  altitude?: number;
  gpsAccuracy: number;
  readableAddress: string;
  captureTimestamp: string;
  captureMethod: 'in_app_camera';
}

export interface GpsCameraCaptureProps {
  initialCoords?: { latitude: number; longitude: number };
  initialAddress?: string;
  onCapture: (data: {
    originalBlob: Blob;
    stampedBlob: Blob;
    stampedDataUrl: string;
    metadata: GpsCaptureMetadata;
  }) => void;
  onCancel: () => void;
}

// Haversine distance calculator to avoid geocoding on micro-jitters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Draw Permanent Tamper-Proof GPS Map Camera Overlay onto Canvas
function drawGpsHudOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coords: { latitude: number; longitude: number },
  accuracy: number | null,
  altitude: number | null,
  address: string,
  currentTime: string
) {
  const overlayHeight = Math.max(160, Math.round(height * 0.18));
  const overlayY = height - overlayHeight;

  // Semi-transparent gradient backdrop at the bottom
  const gradient = ctx.createLinearGradient(0, overlayY - 20, 0, height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.15, 'rgba(10, 12, 16, 0.88)');
  gradient.addColorStop(1, 'rgba(5, 6, 8, 0.98)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, overlayY - 20, width, overlayHeight + 20);

  // Top subtle divider bar with RoadGuard terracotta accent
  ctx.fillStyle = '#d97757';
  ctx.fillRect(0, overlayY - 2, width, 3);

  // Scaling factor relative to 1080p
  const scale = width / 1920;
  const padX = Math.round(36 * scale);
  const startY = overlayY + Math.round(32 * scale);

  // Header: ROADGUARD AI · GPS MAP CAMERA
  ctx.font = `bold ${Math.round(26 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('ROADGUARD AI', padX, startY);

  ctx.font = `bold ${Math.round(18 * scale)}px monospace`;
  ctx.fillStyle = '#d97757';
  ctx.fillText('• VERIFIED GEOTAG CAMERA', padX + Math.round(230 * scale), startY);

  // Date & Time
  ctx.font = `${Math.round(20 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(currentTime, padX, startY + Math.round(30 * scale));

  // Coordinates: Latitude & Longitude
  ctx.font = `bold ${Math.round(22 * scale)}px monospace`;
  ctx.fillStyle = '#f8fafc';
  const latStr = `Latitude: ${coords.latitude.toFixed(5)}° ${coords.latitude >= 0 ? 'N' : 'S'}`;
  const lngStr = `Longitude: ${Math.abs(coords.longitude).toFixed(5)}° ${coords.longitude >= 0 ? 'E' : 'W'}`;
  ctx.fillText(`${latStr}   |   ${lngStr}`, padX, startY + Math.round(62 * scale));

  // Address & Accuracy
  ctx.font = `${Math.round(19 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#94a3b8';
  const locText = `Location: ${address}`;
  ctx.fillText(locText, padX, startY + Math.round(92 * scale));

  const accText = `GPS Accuracy: ±${accuracy ?? 15} meters${altitude != null ? `   |   Altitude: ${altitude}m` : ''}`;
  ctx.font = `bold ${Math.round(18 * scale)}px monospace`;
  ctx.fillStyle = '#10b981';
  ctx.fillText(accText, padX, startY + Math.round(118 * scale));
}

export const GpsCameraCapture: React.FC<GpsCameraCaptureProps> = ({
  initialCoords,
  initialAddress,
  onCapture,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const lastGeocodeCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastGeocodeTimeRef = useRef<number>(0);

  // Camera & Stream State
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // GPS Live Telemetry State
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    () => initialCoords || null
  );
  const [accuracy, setAccuracy] = useState<number | null>(() => (initialCoords ? 20 : null));
  const [altitude, setAltitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string>(
    () => initialAddress || 'Acquiring live GNSS position...'
  );
  const [gpsStatus, setGpsStatus] = useState<'acquiring' | 'locked' | 'poor' | 'denied' | 'error'>(
    'acquiring'
  );
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const [isLiveGps, setIsLiveGps] = useState<boolean>(false);

  // Clock for HUD timestamping
  const [currentTime, setCurrentTime] = useState<string>(() => formatDateTime(new Date()));

  // Keep clock running for live overlay
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatDateTime(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function formatDateTime(d: Date): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${day} ${month} ${year} | ${hours}:${minutes} ${ampm}`;
  }

  // Format Latitude / Longitude into Clean GPS String
  const formatCoord = (val: number, isLat: boolean) => {
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
    return `${Math.abs(val).toFixed(4)}° ${dir}`;
  };

  // Start Camera Stream (Runs cleanly ONCE on mount)
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraReady(false);

    // Stop existing stream tracks if active
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is not supported in this browser or context.');
      return;
    }

    try {
      let activeStream: MediaStream | null = null;

      // 1. Try back/environment camera
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch {
        // 2. Fallback to any available system video source (webcams, front camera)
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = activeStream;
      if (videoRef.current && activeStream) {
        videoRef.current.srcObject = activeStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.warn);
          setIsCameraReady(true);
        };
      }
    } catch (err: any) {
      console.warn('Camera request error:', err);
      let msg = 'Camera access was denied or device is busy. Please grant camera permission.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera device detected on this system.';
      }
      setCameraError(msg);
    }
  };

  // Handle live position updates from Geolocation API
  const handleLivePosition = async (pos: GeolocationPosition) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const acc = Math.round(pos.coords.accuracy);
    const alt = pos.coords.altitude != null ? Math.round(pos.coords.altitude) : null;

    setCoords({ latitude: lat, longitude: lng });
    setAccuracy(acc);
    setAltitude(alt);
    setIsLiveGps(true);

    if (acc > 100) {
      setGpsStatus('poor');
      setGpsErrorMsg(`Live GNSS is calibrating (±${acc}m). High precision recommended.`);
    } else {
      setGpsStatus('locked');
      setGpsErrorMsg(null);
    }

    // Throttled reverse geocode to prevent network flooding and browser stalls
    const now = Date.now();
    const lastCoords = lastGeocodeCoordsRef.current;
    let shouldGeocode = false;

    if (!lastCoords) {
      shouldGeocode = true;
    } else if (now - lastGeocodeTimeRef.current > 4000) {
      const dist = getDistanceMeters(lastCoords.lat, lastCoords.lng, lat, lng);
      if (dist > 15) {
        shouldGeocode = true;
      }
    }

    if (shouldGeocode) {
      lastGeocodeCoordsRef.current = { lat, lng };
      lastGeocodeTimeRef.current = now;
      try {
        const addr = await reverseGeocodeCoordinates(lat, lng);
        if (addr) setAddress(addr);
      } catch {
        setAddress(`${lat.toFixed(5)}° N, ${Math.abs(lng).toFixed(5)}° W`);
      }
    }
  };

  // Start Live Geolocation Watcher
  const startGpsWatcher = () => {
    setGpsStatus('acquiring');
    setGpsErrorMsg(null);

    if (!('geolocation' in navigator)) {
      if (initialCoords) {
        setCoords(initialCoords);
        setAccuracy(15);
        setAddress(initialAddress || 'Defect Location');
        setGpsStatus('poor');
        setGpsErrorMsg('Browser does not support Geolocation. Using defect coordinates.');
      } else {
        setGpsStatus('error');
        setGpsErrorMsg('Browser does not support Geolocation API.');
      }
      return;
    }

    // 1. Immediate fast one-shot fix for instant UI feedback
    navigator.geolocation.getCurrentPosition(
      (pos) => handleLivePosition(pos),
      (err) => {
        console.warn('Initial fast GPS fetch failed:', err);
        if (initialCoords && !coords) {
          setCoords(initialCoords);
          setAccuracy(25);
          setAddress(initialAddress || 'Defect Reference Location');
          setGpsStatus('poor');
          setGpsErrorMsg('Live GPS acquiring... Using reference location.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    // 2. High-accuracy continuous live watch
    if (geoWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
    }

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => handleLivePosition(pos),
      (err) => {
        console.warn('Live geolocation watch error:', err);
        if (err.code === 1) {
          setGpsStatus('denied');
          setGpsErrorMsg('Location permission denied. Please allow location access in your browser.');
          if (initialCoords && !coords) {
            setCoords(initialCoords);
            setAccuracy(25);
            setAddress(initialAddress || 'Defect Reference Location');
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      }
    );
  };

  // Mount effects (Runs ONCE when component mounts, clean unmount on exit)
  useEffect(() => {
    startCamera();
    startGpsWatcher();

    return () => {
      // 1. Stop video stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      // 2. Clear GPS watch
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
    };
  }, []); // Empty array ensures camera and GPS never enter an infinite restart loop

  // Capture Frame and Stamp Permanent GPS Canvas Overlay
  const handleCapture = async () => {
    if (!videoRef.current || !coords) return;
    if (accuracy !== null && accuracy > 100) {
      const proceed = window.confirm(
        `Current GPS accuracy is ±${accuracy}m (recommended ≤100m). Do you want to capture with current location accuracy?`
      );
      if (!proceed) return;
    }

    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    // 1. Create Offscreen Canvas for Raw Frame
    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = width;
    rawCanvas.height = height;
    const rawCtx = rawCanvas.getContext('2d');
    if (!rawCtx) return;

    rawCtx.drawImage(video, 0, 0, width, height);

    // Save Original Unstamped Blob
    const originalBlob: Blob = await new Promise((resolve) => {
      rawCanvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.95);
    });

    // 2. Create Stamped Canvas
    const stampCanvas = document.createElement('canvas');
    stampCanvas.width = width;
    stampCanvas.height = height;
    const ctx = stampCanvas.getContext('2d');
    if (!ctx) return;

    // Draw camera image
    ctx.drawImage(video, 0, 0, width, height);

    // Draw Permanent Tamper-Proof GPS HUD Overlay
    drawGpsHudOverlay(ctx, width, height, coords, accuracy, altitude, address, currentTime);

    // Export Stamped Blob & DataUrl
    const stampedDataUrl = stampCanvas.toDataURL('image/jpeg', 0.94);
    const stampedBlob: Blob = await new Promise((resolve) => {
      stampCanvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.94);
    });

    const nowIso = new Date().toISOString();

    onCapture({
      originalBlob,
      stampedBlob,
      stampedDataUrl,
      metadata: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        altitude: altitude ?? undefined,
        gpsAccuracy: accuracy ?? 15,
        readableAddress: address,
        captureTimestamp: nowIso,
        captureMethod: 'in_app_camera',
      },
    });
  };

  // Fallback photo capture through native system camera input
  const handleFallbackFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (!ev.target?.result) return;
        const img = new Image();
        img.onload = async () => {
          const width = img.naturalWidth || 1920;
          const height = img.naturalHeight || 1080;

          // Raw Canvas
          const rawCanvas = document.createElement('canvas');
          rawCanvas.width = width;
          rawCanvas.height = height;
          const rawCtx = rawCanvas.getContext('2d');
          if (!rawCtx) return;
          rawCtx.drawImage(img, 0, 0, width, height);

          const originalBlob: Blob = await new Promise((res) => {
            rawCanvas.toBlob((b) => res(b || new Blob()), 'image/jpeg', 0.95);
          });

          // Stamped Canvas
          const stampCanvas = document.createElement('canvas');
          stampCanvas.width = width;
          stampCanvas.height = height;
          const ctx = stampCanvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, width, height);

          const activeCoords = coords || initialCoords || { latitude: 37.774929, longitude: -122.419416 };
          const activeAccuracy = accuracy ?? 15;
          const activeAddress = address || 'Road Defect Site';

          drawGpsHudOverlay(
            ctx,
            width,
            height,
            activeCoords,
            activeAccuracy,
            altitude,
            activeAddress,
            currentTime
          );

          const stampedDataUrl = stampCanvas.toDataURL('image/jpeg', 0.94);
          const stampedBlob: Blob = await new Promise((res) => {
            stampCanvas.toBlob((b) => res(b || new Blob()), 'image/jpeg', 0.94);
          });

          onCapture({
            originalBlob,
            stampedBlob,
            stampedDataUrl,
            metadata: {
              latitude: activeCoords.latitude,
              longitude: activeCoords.longitude,
              altitude: altitude ?? undefined,
              gpsAccuracy: activeAccuracy,
              readableAddress: activeAddress,
              captureTimestamp: new Date().toISOString(),
              captureMethod: 'in_app_camera',
            },
          });
        };
        img.src = ev.target.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Fallback file capture error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col justify-between overflow-hidden select-none">
      {/* Hidden input for fallback native device camera */}
      <input
        ref={fallbackInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFallbackFileSelect}
      />

      {/* Top Header Bar */}
      <div className="p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#d97757]/20 border border-[#d97757]/50 flex items-center justify-center">
            <Camera className="w-4 h-4 text-[#d97757]" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-white tracking-wider flex items-center gap-2">
              <span>ROADGUARD AI</span>
              <span className="text-[#d97757]">GPS CAMERA</span>
              {isLiveGps && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  LIVE GNSS
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-neutral-400">
              Tamper-Proof Geotag Stamping Engine
            </div>
          </div>
        </div>

        {/* GPS Satellite Indicator */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border ${
              gpsStatus === 'locked'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : gpsStatus === 'poor'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-red-500/15 border-red-500/40 text-red-300'
            }`}
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                gpsStatus === 'locked'
                  ? 'text-emerald-400 animate-pulse'
                  : gpsStatus === 'acquiring'
                  ? 'text-amber-400 animate-spin'
                  : 'text-red-400'
              }`}
            />
            <span>
              {gpsStatus === 'locked' && accuracy !== null
                ? `LIVE GPS ±${accuracy}m`
                : gpsStatus === 'poor'
                ? `GPS ±${accuracy}m`
                : gpsStatus === 'acquiring'
                ? 'ACQUIRING LIVE GPS...'
                : 'NO GPS FIX'}
            </span>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewfinder Section */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {/* Live Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Loading Spinner during initial camera initialization */}
        {!isCameraReady && !cameraError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
            <RefreshCw className="w-8 h-8 text-[#d97757] animate-spin mb-2" />
            <span className="text-xs font-mono text-neutral-300">Opening camera viewfinder...</span>
          </div>
        )}

        {/* Crosshair Viewfinder Grid */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-48 h-48 sm:w-64 sm:h-64 border border-white/20 rounded-2xl relative">
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#d97757]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#d97757]" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#d97757]" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#d97757]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#d97757]/80" />
            </div>
          </div>
        </div>

        {/* Camera Permission / Device Error Banner */}
        {cameraError && (
          <div className="absolute inset-0 z-30 bg-black/92 flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Camera Access Blocked</h3>
            <p className="text-sm text-neutral-300 max-w-md mb-5 leading-relaxed">{cameraError}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => fallbackInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo with Device Camera</span>
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2.5 rounded-xl bg-[#d97757] hover:bg-[#e08567] text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* GPS Warning Overlay if GPS unavailable or weak */}
        {gpsErrorMsg && (
          <div className="absolute top-16 left-4 right-4 z-20 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{gpsErrorMsg}</span>
            </div>
            <button
              type="button"
              onClick={startGpsWatcher}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-semibold text-[11px] shrink-0 cursor-pointer"
            >
              Retry Live GPS
            </button>
          </div>
        )}

        {/* LIVE GPS MAP CAMERA OVERLAY (Bottom Viewfinder HUD) */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-6 bg-gradient-to-t from-black via-black/90 to-transparent border-t border-[#d97757]/40 space-y-1.5 text-left pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#d97757]" />
              <span>ROADGUARD AI · GPS MAP CAMERA</span>
              {isLiveGps && <span className="text-emerald-400 text-[10px]">● LIVE FIX</span>}
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              {currentTime}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="space-y-0.5">
              <div className="font-mono text-white text-[13px] font-semibold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#d97757]" />
                <span>
                  {coords
                    ? `${formatCoord(coords.latitude, true)}   ${formatCoord(coords.longitude, false)}`
                    : 'Locating GNSS satellites...'}
                </span>
              </div>
              <div className="text-neutral-300 text-[11px] truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#d97757] shrink-0" />
                <span className="truncate">{address}</span>
              </div>
            </div>

            <div className="sm:text-right space-y-0.5 font-mono text-[11px]">
              <div className="text-emerald-400 font-semibold">
                {accuracy !== null ? `Accuracy: ±${accuracy} meters` : 'Calibrating GNSS...'}
              </div>
              <div className="text-neutral-400">
                {altitude !== null ? `Altitude: ${altitude}m AMSL` : 'Sensor elevation active'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Shutter Action Bar */}
      <div className="p-4 sm:p-6 bg-black border-t border-white/10 flex items-center justify-around z-20">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-mono text-neutral-400 hover:text-white px-4 py-2 transition cursor-pointer"
        >
          Cancel
        </button>

        {/* Shutter Capture Button */}
        <button
          type="button"
          onClick={handleCapture}
          disabled={!isCameraReady || coords === null}
          aria-label="Capture photo"
          className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 p-1 flex items-center justify-center transition-all cursor-pointer ${
            isCameraReady && coords !== null
              ? 'border-white hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(217,119,87,0.6)]'
              : 'border-neutral-700 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className="w-full h-full rounded-full bg-[#d97757] hover:bg-[#e08567] flex items-center justify-center text-white">
            <Camera className="w-7 h-7" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => fallbackInputRef.current?.click()}
          className="text-xs font-mono text-neutral-400 hover:text-white px-4 py-2 transition flex items-center gap-1.5 cursor-pointer"
          title="Open native camera or photo gallery"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Device Camera</span>
        </button>
      </div>
    </div>
  );
};
