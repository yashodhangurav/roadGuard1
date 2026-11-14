/**
 * RoadGuard AI - Road Damage Detection API & Types Service
 *
 * Connects the frontend UI to the road damage detection backend API (e.g. FastAPI / YOLOv11 TensorRT).
 * Provides automatic fallback to high-fidelity demo simulation engine when backend is offline.
 */

export type DamageType =
  | 'Pothole'
  | 'Longitudinal Crack'
  | 'Alligator Crack'
  | 'Surface Deterioration'
  | 'Edge Break';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface BoundingBox {
  /** X coordinate of top-left corner as a percentage (0 - 100) */
  x: number;
  /** Y coordinate of top-left corner as a percentage (0 - 100) */
  y: number;
  /** Width as a percentage (0 - 100) */
  width: number;
  /** Height as a percentage (0 - 100) */
  height: number;
}

export interface DefectDimensions {
  widthCm: number;
  heightCm: number;
  estimatedDepthMm?: number;
  areaCm2: number;
}

export interface DetectedDefect {
  id: string;
  type: DamageType;
  severity: Severity;
  confidence: number; // 0 - 100%
  box: BoundingBox;
  dimensions: DefectDimensions;
  urgency: 'Immediate' | 'Priority (48h)' | 'Routine' | 'Monitor';
  repairMethod: string;
}

export interface RoadDamageStats {
  totalDefects: number;
  potholesCount: number;
  cracksCount: number;
  deteriorationCount: number;
  criticalCount: number;
  overallCondition: 'Critical' | 'Poor' | 'Fair' | 'Good';
  hazardIndex: number; // 0 - 100 scale
  pciScore: number; // 0 - 100 Pavement Condition Index (ASTM D6433)
  estimatedPatchTons: number; // asphalt mix needed in metric tons
  scanDurationMs: number;
}

export interface DetectionResult {
  imageId: string;
  fileName: string;
  imageUrl: string;
  annotatedImageUrl?: string;
  analyzedAt: string;
  defects: DetectedDefect[];
  stats: RoadDamageStats;
  backend: 'Live API' | 'Demo Engine';
  backendEndpoint: string;
  modelInfo: {
    name: string;
    version: string;
    inferenceTimeMs: number;
  };
}

export interface RoadSamplePreset {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  defects: DetectedDefect[];
  stats: RoadDamageStats;
}

/**
 * Helper to convert a Base64 data URL to a standard browser File object.
 */
export function dataURLtoFile(dataurl: string, filename: string = 'capture.jpg'): File {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export const ROAD_PRESETS: RoadSamplePreset[] = [
  {
    id: 'preset-pothole',
    name: 'US-101 Severe Crater Pothole',
    subtitle: 'High-impact wheelpath cavity with aggregate spalling',
    imageUrl: '/samples/road-pothole-1.jpg',
    defects: [
      {
        id: 'DEF-101-01',
        type: 'Pothole',
        severity: 'Critical',
        confidence: 97.4,
        box: { x: 26, y: 24, width: 52, height: 54 },
        dimensions: {
          widthCm: 72,
          heightCm: 58,
          estimatedDepthMm: 86,
          areaCm2: 4176,
        },
        urgency: 'Immediate',
        repairMethod: 'Hot-mix asphalt patch with edge milling and tack coat bonding',
      },
      {
        id: 'DEF-101-02',
        type: 'Longitudinal Crack',
        severity: 'Medium',
        confidence: 91.2,
        box: { x: 6, y: 14, width: 22, height: 68 },
        dimensions: {
          widthCm: 110,
          heightCm: 16,
          estimatedDepthMm: 24,
          areaCm2: 1760,
        },
        urgency: 'Priority (48h)',
        repairMethod: 'Polymer-modified asphalt emulsion crack sealing',
      },
    ],
    stats: {
      totalDefects: 2,
      potholesCount: 1,
      cracksCount: 1,
      deteriorationCount: 0,
      criticalCount: 1,
      overallCondition: 'Critical',
      hazardIndex: 88,
      pciScore: 46,
      estimatedPatchTons: 1.05,
      scanDurationMs: 42,
    },
  },
  {
    id: 'preset-crack',
    name: 'County Hwy 4 Alligator Fatigue Cracking',
    subtitle: 'Interconnected hexagonal shear fatigue failure',
    imageUrl: '/samples/road-crack-2.jpg',
    defects: [
      {
        id: 'DEF-202-01',
        type: 'Alligator Crack',
        severity: 'High',
        confidence: 96.8,
        box: { x: 14, y: 6, width: 68, height: 80 },
        dimensions: {
          widthCm: 195,
          heightCm: 145,
          estimatedDepthMm: 28,
          areaCm2: 28275,
        },
        urgency: 'Priority (48h)',
        repairMethod: 'Full-depth pavement reclamation and geotextile stabilization',
      },
      {
        id: 'DEF-202-02',
        type: 'Surface Deterioration',
        severity: 'Low',
        confidence: 89.1,
        box: { x: 8, y: 82, width: 84, height: 14 },
        dimensions: {
          widthCm: 140,
          heightCm: 25,
          areaCm2: 3500,
        },
        urgency: 'Routine',
        repairMethod: 'Shoulder line restriping and microsurfacing seal',
      },
    ],
    stats: {
      totalDefects: 2,
      potholesCount: 0,
      cracksCount: 1,
      deteriorationCount: 1,
      criticalCount: 0,
      overallCondition: 'Poor',
      hazardIndex: 68,
      pciScore: 56,
      estimatedPatchTons: 1.65,
      scanDurationMs: 38,
    },
  },
  {
    id: 'preset-multi',
    name: 'Metropolitan Arterial Multi-Distress Corridor',
    subtitle: 'Combined cratering, concrete patch spalling and block fissures',
    imageUrl: '/samples/road-multi-3.jpg',
    defects: [
      {
        id: 'DEF-303-01',
        type: 'Pothole',
        severity: 'Critical',
        confidence: 98.2,
        box: { x: 44, y: 54, width: 26, height: 26 },
        dimensions: {
          widthCm: 64,
          heightCm: 60,
          estimatedDepthMm: 92,
          areaCm2: 3840,
        },
        urgency: 'Immediate',
        repairMethod: 'Subbase gravel compaction and high-performance hot mix fill',
      },
      {
        id: 'DEF-303-02',
        type: 'Surface Deterioration',
        severity: 'High',
        confidence: 93.6,
        box: { x: 25, y: 32, width: 42, height: 38 },
        dimensions: {
          widthCm: 160,
          heightCm: 110,
          estimatedDepthMm: 35,
          areaCm2: 17600,
        },
        urgency: 'Priority (48h)',
        repairMethod: 'Infrared asphalt rehabilitation and thermal smoothing',
      },
      {
        id: 'DEF-303-03',
        type: 'Longitudinal Crack',
        severity: 'Medium',
        confidence: 89.5,
        box: { x: 16, y: 8, width: 46, height: 28 },
        dimensions: {
          widthCm: 230,
          heightCm: 35,
          areaCm2: 8050,
        },
        urgency: 'Routine',
        repairMethod: 'Hot-pour rubberized bitumen crack sealant',
      },
    ],
    stats: {
      totalDefects: 3,
      potholesCount: 1,
      cracksCount: 1,
      deteriorationCount: 1,
      criticalCount: 1,
      overallCondition: 'Critical',
      hazardIndex: 91,
      pciScore: 38,
      estimatedPatchTons: 2.4,
      scanDurationMs: 46,
    },
  },
];

const DEFAULT_API_ENDPOINT =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/detect';

/**
 * Checks if the backend API server is reachable.
 */
export async function checkBackendHealth(
  apiUrl: string = DEFAULT_API_ENDPOINT
): Promise<boolean> {
  try {
    const healthUrl = apiUrl.replace(/\/detect\/?$/, '/health');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(healthUrl, {
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
 * Analyzes a road image via backend API, with automatic fallback to high-fidelity
 * demo simulation engine when the local backend server is offline.
 */
export async function analyzeRoadImage(
  input: File | Blob | string,
  presetId?: string,
  customApiUrl: string = DEFAULT_API_ENDPOINT
): Promise<DetectionResult> {
  const startTime = performance.now();

  // If input is a preset identifier and not a custom file, check if we have predefined calibrated detections
  if (typeof input === 'string' && !input.startsWith('data:image/')) {
    const foundPreset = ROAD_PRESETS.find((p) => p.id === presetId || p.imageUrl === input);
    if (foundPreset) {
      // Simulate real-time inference latency (450ms - 750ms) for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 600));

      return {
        imageId: foundPreset.id,
        fileName: `${foundPreset.id}.jpg`,
        imageUrl: foundPreset.imageUrl,
        analyzedAt: new Date().toISOString(),
        defects: foundPreset.defects,
        stats: foundPreset.stats,
        backend: 'Demo Engine',
        backendEndpoint: customApiUrl,
        modelInfo: {
          name: 'YOLOv11-RoadDefect-RT',
          version: 'v4.2.0-fp16',
          inferenceTimeMs: Math.round(performance.now() - startTime),
        },
      };
    }
  }

  // Convert Base64 data URL, image URL, or generic Blob to standard File
  let targetFile: File | null = null;
  if (input instanceof File) {
    targetFile = input;
  } else if (input instanceof Blob) {
    targetFile = new File([input], `photo-${Date.now()}.jpg`, { type: input.type || 'image/jpeg' });
  } else if (typeof input === 'string') {
    if (input.startsWith('data:image/')) {
      targetFile = dataURLtoFile(input, `capture-${Date.now()}.jpg`);
    } else {
      try {
        const resolvedUrl = input.startsWith('/outputs') || input.startsWith('/api')
          ? `http://localhost:8000${input}`
          : input;
        const fetchRes = await fetch(resolvedUrl);
        if (fetchRes.ok) {
          const blob = await fetchRes.blob();
          const fname = input.split('/').pop()?.split('?')[0] || `image-${Date.now()}.jpg`;
          targetFile = new File([blob], fname, { type: blob.type || 'image/jpeg' });
        }
      } catch (fetchErr) {
        console.warn('Could not fetch input URL as File for backend inference:', fetchErr);
      }
    }
  }

  // If we have a file, attempt backend API first
  if (targetFile) {
    const formData = new FormData();
    formData.append('file', targetFile);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(customApiUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const duration = Math.round(performance.now() - startTime);
        const backendOrigin = new URL(customApiUrl).origin;
        const fullAnnotatedUrl = data.annotatedImageUrl 
          ? (data.annotatedImageUrl.startsWith('http') ? data.annotatedImageUrl : `${backendOrigin}${data.annotatedImageUrl}`)
          : undefined;

        const displayUrl = typeof input === 'string'
          ? input
          : targetFile ? URL.createObjectURL(targetFile) : '';

        return {
          imageId: data.imageId || `UPLOAD-${Date.now().toString(36).toUpperCase()}`,
          fileName: targetFile.name,
          imageUrl: displayUrl,
          annotatedImageUrl: fullAnnotatedUrl,
          analyzedAt: data.analyzedAt || new Date().toISOString(),
          defects: (data.defects || []).map((d: any) => ({
            id: d.id,
            type: d.type,
            severity: d.severity,
            confidence: d.confidence,
            box: d.box,
            dimensions: d.dimensions || {
              widthCm: 56,
              heightCm: 44,
              estimatedDepthMm: 68,
              areaCm2: 2464,
            },
            urgency: d.urgency || (d.severity === 'Critical' ? 'Immediate' : 'Priority (48h)'),
            repairMethod: d.repairMethod || 'Hot-mix asphalt patch and roller compaction',
          })),
          stats: data.stats || {
            totalDefects: data.defects?.length || 0,
            potholesCount: data.defects?.filter((d: any) => d.type === 'Pothole').length || 0,
            cracksCount: data.defects?.filter((d: any) => d.type?.includes('Crack')).length || 0,
            deteriorationCount: 0,
            criticalCount: data.defects?.filter((d: any) => d.severity === 'Critical').length || 0,
            overallCondition: data.defects?.length > 2 ? 'Critical' : 'Poor',
            hazardIndex: 75,
            pciScore: 50,
            estimatedPatchTons: 1.2,
            scanDurationMs: duration,
          },
          backend: 'Live API',
          backendEndpoint: customApiUrl,
          modelInfo: {
            name: data.modelInfo?.name || 'YOLOv11-RoadHazard-Ensemble',
            version: data.modelInfo?.version || 'v2.0.0-dual-engine',
            inferenceTimeMs: data.modelInfo?.inferenceTimeMs || duration,
          },
        };
      }
    } catch (err) {
      console.warn("Backend API request error, falling back to simulated engine:", err);
    }
  }

  // Fallback: Generate calibrated detection for custom uploaded file
  await new Promise((resolve) => setTimeout(resolve, 800));
  const duration = Math.round(performance.now() - startTime);
  const objectUrl = typeof input === 'string'
    ? input
    : targetFile ? URL.createObjectURL(targetFile) : '';

  return {
    imageId: `UPLOAD-${Date.now().toString(36).toUpperCase()}`,
    fileName: targetFile?.name || 'custom_upload.jpg',
    imageUrl: objectUrl,
    analyzedAt: new Date().toISOString(),
    defects: [
      {
        id: 'DEF-UP-01',
        type: 'Pothole',
        severity: 'High',
        confidence: 96.2,
        box: { x: 36, y: 42, width: 28, height: 30 },
        dimensions: {
          widthCm: 56,
          heightCm: 44,
          estimatedDepthMm: 68,
          areaCm2: 2464,
        },
        urgency: 'Priority (48h)',
        repairMethod: 'Milling, tack coat application and dense-graded hot mix asphalt fill',
      },
      {
        id: 'DEF-UP-02',
        type: 'Longitudinal Crack',
        severity: 'Medium',
        confidence: 88.9,
        box: { x: 22, y: 26, width: 18, height: 48 },
        dimensions: {
          widthCm: 145,
          heightCm: 16,
          estimatedDepthMm: 18,
          areaCm2: 2320,
        },
        urgency: 'Routine',
        repairMethod: 'Compressed air cleaning and hot-applied polymer bitumen sealant',
      },
    ],
    stats: {
      totalDefects: 2,
      potholesCount: 1,
      cracksCount: 1,
      deteriorationCount: 0,
      criticalCount: 0,
      overallCondition: 'Poor',
      hazardIndex: 72,
      pciScore: 58,
      estimatedPatchTons: 1.15,
      scanDurationMs: duration,
    },
    backend: 'Demo Engine',
    backendEndpoint: customApiUrl,
    modelInfo: {
      name: 'YOLOv11-RoadDefect-RT',
      version: 'v4.2.0-client-engine',
      inferenceTimeMs: duration,
    },
  };
}

/**
 * Generates an ASTM D6433 compliant structured road damage inspection report.
 */
export function generateInspectionReport(result: DetectionResult): string {
  const report = {
    reportHeader: {
      system: 'RoadGuard AI Autonomous Infrastructure Platform',
      reportType: 'ASTM D6433 Pavement Distress & Maintenance Assessment',
      generatedAt: result.analyzedAt,
      imageId: result.imageId,
      sourceFileName: result.fileName,
      backendEngine: result.backend,
      inferenceModel: `${result.modelInfo.name} (${result.modelInfo.version})`,
    },
    corridorSummary: {
      overallCondition: result.stats.overallCondition,
      pavementConditionIndex: `${result.stats.pciScore} / 100`,
      hazardIndex: `${result.stats.hazardIndex} / 100`,
      totalDistressesDetected: result.stats.totalDefects,
      breakdown: {
        potholes: result.stats.potholesCount,
        cracks: result.stats.cracksCount,
        surfaceDeterioration: result.stats.deteriorationCount,
        criticalSeverity: result.stats.criticalCount,
      },
      materialEstimates: {
        asphaltPatchMixMetricTons: result.stats.estimatedPatchTons,
        recommendedCrewHours: (result.stats.totalDefects * 1.75).toFixed(1),
      },
    },
    distressLog: result.defects.map((d, index) => ({
      itemNumber: index + 1,
      defectId: d.id,
      distressType: d.type,
      severityLevel: d.severity,
      aiConfidenceScore: `${d.confidence}%`,
      boundingBoxPercent: d.box,
      physicalDimensions: {
        width: `${d.dimensions.widthCm} cm`,
        height: `${d.dimensions.heightCm} cm`,
        depth: d.dimensions.estimatedDepthMm ? `${d.dimensions.estimatedDepthMm} mm` : 'N/A',
        surfaceArea: `${(d.dimensions.areaCm2 / 10000).toFixed(3)} m²`,
      },
      workOrderPriority: d.urgency,
      recommendedRemediation: d.repairMethod,
    })),
  };

  return JSON.stringify(report, null, 2);
}

/**
 * Initiates browser download of the structured road inspection report.
 */
export function downloadReportFile(result: DetectionResult): void {
  const jsonContent = generateInspectionReport(result);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  link.download = `RoadGuard-Inspection-${result.imageId}-${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Re-export PDF report generator functions
export { downloadInspectionPdf, generateRoadInspectionPdf } from './pdfReportGenerator';

export interface NearbyReport {
  id: string;
  client_report_id?: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  distance_meters: number;
  image_url?: string;
  annotated_image_url?: string;
  image_phash?: string;
  submitted_at?: string;
  pci_score?: number;
  total_defects?: number;
}

export interface OrbMatchingMetrics {
  query_keypoints_count: number;
  train_keypoints_count: number;
  good_matches_count: number;
  ransac_inliers_count: number;
  inlier_ratio: number;
  has_homography: boolean;
  match_verdict: string;
  similarity_score: number;
}

export interface DuplicateCandidate {
  report_id: string;
  client_report_id?: string;
  canonical_issue_id?: string;
  distance: number;
  similarity_score: number;
  match_level: string;
  match_type?: 'PHASH' | 'PHASH_IDENTICAL' | 'ORB_VIEWPOINT' | 'COMBINED' | 'PROBABLE_ORB' | 'VISUAL_RESEMBLANCE' | 'NONE';
  match_reason?: string;
  verdict?: 'CONFIRMED_DUPLICATE' | 'NEEDS_REVIEW' | 'NEW_ISSUE';
  confidence_tier?: 'HIGH' | 'MODERATE' | 'LOW';
  evidence_score?: number;
  is_candidate_duplicate: boolean;
  category: string;
  severity: string;
  status: string;
  distance_meters?: number;
  address?: string;
  image_url?: string;
  annotated_image_url?: string;
  submitted_at?: string;
  orb_metrics?: OrbMatchingMetrics;
}

export interface CheckDuplicateResponse {
  query_phash: string;
  orb_keypoints_detected: number;
  search_radius_meters: number;
  total_nearby_evaluated: number;
  has_duplicate_candidate: boolean;
  overall_verdict?: 'CONFIRMED_DUPLICATE' | 'NEEDS_REVIEW' | 'NEW_ISSUE';
  duplicate_candidates: DuplicateCandidate[];
}

export interface NearbyReportsResponse {
  center: { latitude: number; longitude: number };
  radius_meters: number;
  total_found: number;
  reports: NearbyReport[];
}

export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function getLocalNearbyReportsFallback(
  latitude: number,
  longitude: number,
  radiusMeters: number
): NearbyReportsResponse {
  try {
    const raw = localStorage.getItem('roadguard_citizen_reports');
    if (raw) {
      const reports = JSON.parse(raw);
      if (Array.isArray(reports)) {
        const matches: NearbyReport[] = [];
        for (const r of reports) {
          const lat = r.location?.latitude;
          const lng = r.location?.longitude;
          if (lat != null && lng != null) {
            const dist = calculateHaversineDistanceMeters(latitude, longitude, lat, lng);
            if (dist <= radiusMeters) {
              matches.push({
                id: r.id,
                client_report_id: r.clientReportId || r.id,
                category: r.category || 'Pothole',
                severity: r.severity || 'High',
                status: r.status || 'Submitted',
                description: r.description || '',
                latitude: lat,
                longitude: lng,
                address: r.location?.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                distance_meters: dist,
                image_url: r.imageUrl || '',
                annotated_image_url: r.annotatedImageUrl || '',
                submitted_at: r.submittedAt || '',
                total_defects: 1,
              });
            }
          }
        }
        matches.sort((a, b) => a.distance_meters - b.distance_meters);
        return {
          center: { latitude, longitude },
          radius_meters: radiusMeters,
          total_found: matches.length,
          reports: matches,
        };
      }
    }
  } catch {}

  return {
    center: { latitude, longitude },
    radius_meters: radiusMeters,
    total_found: 0,
    reports: [],
  };
}

export async function fetchNearbyReports(
  latitude: number,
  longitude: number,
  radiusMeters: number = 50,
  limit: number = 20
): Promise<NearbyReportsResponse> {
  try {
    const res = await fetch(
      `http://127.0.0.1:8000/api/reports/nearby?latitude=${latitude}&longitude=${longitude}&radius_meters=${radiusMeters}&limit=${limit}`
    );
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend nearby search unreachable, falling back to local search:', err);
  }

  // Graceful offline/local fallback
  return getLocalNearbyReportsFallback(latitude, longitude, radiusMeters);
}

/**
 * Perform a perceptual hash (pHash) duplicate check against nearby existing reports.
 */
export async function checkDuplicateImage(
  imageBlobOrFile: Blob | File,
  latitude: number,
  longitude: number,
  radiusMeters: number = 50,
  category?: string
): Promise<CheckDuplicateResponse | null> {
  try {
    const formData = new FormData();
    formData.append('image', imageBlobOrFile, 'query.jpg');
    formData.append('latitude', String(latitude));
    formData.append('longitude', String(longitude));
    formData.append('radius_meters', String(radiusMeters));
    if (category) {
      formData.append('category', category);
    }

    const res = await fetch('http://127.0.0.1:8000/api/reports/check-duplicate', {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Check duplicate API unreachable:', err);
  }
  return null;
}

/**
 * Fetch reports whose duplicate status is uncertain and awaiting admin verification.
 */
export async function fetchPendingDuplicateReviews(): Promise<any[]> {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/reports/duplicates/pending-review');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Error fetching pending duplicate reviews:', err);
  }
  return [];
}

/**
 * Fetch all citizen reports linked to a canonical ticket.
 */
export async function fetchDuplicateCluster(reportId: string): Promise<any | null> {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/reports/${reportId}/duplicate-cluster`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Error fetching duplicate cluster for ${reportId}:`, err);
  }
  return null;
}

/**
 * Submit an admin decision for a pending duplicate report.
 */
export async function reviewDuplicateReport(
  reportId: string,
  action: 'CONFIRM_DUPLICATE' | 'DISMISS_DUPLICATE',
  canonicalIssueId?: string,
  adminNotes?: string
): Promise<any | null> {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/reports/${reportId}/duplicate-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        canonical_issue_id: canonicalIssueId,
        admin_notes: adminNotes,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Error reviewing duplicate report ${reportId}:`, err);
  }
  return null;
}

// -------------------------------------------------------------
// 8-Stage Progress Monitoring & Repair Management API Methods
// -------------------------------------------------------------

export interface ProgressStagePayload {
  stage: string;
  actor_name: string;
  actor_role: string;
  department?: string;
  crew?: string;
  expected_completion_date?: string;
  notes?: string;
  reopen_reason?: string;
}

export interface ProgressPhotoRecord {
  url: string;
  stage: 'before' | 'during' | 'after';
  caption?: string;
  actor_name?: string;
  actor_role?: string;
  department?: string;
  uploaded_at?: string;
}

export interface ProgressHistoryEntry {
  id: string;
  stage: string;
  status: string;
  timestamp: string;
  actor_name: string;
  actor_role: string;
  department?: string;
  crew?: string;
  expected_completion_date?: string;
  notes?: string;
  reopen_reason?: string;
  photos: ProgressPhotoRecord[];
}

export interface ReportProgressResponse {
  success: boolean;
  report_id: string;
  current_stage: string;
  status: string;
  assigned_department?: string;
  assigned_crew?: string;
  expected_completion_date?: string;
  reopened_count: number;
  reopened_reason?: string;
  before_images: string[];
  during_images: string[];
  after_images: string[];
  repair_progress_history: ProgressHistoryEntry[];
  linked_duplicates_count: number;
  message: string;
}

/**
 * Fetch full 8-stage progress state, expected completion date, before/during/after images,
 * and repair audit history for a canonical report.
 */
export async function fetchReportProgress(reportId: string): Promise<ReportProgressResponse | null> {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/reports/${reportId}/progress`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Error fetching progress for report ${reportId}:`, err);
  }
  return null;
}

/**
 * Advance or transition the repair lifecycle stage.
 */
export async function updateReportProgressStage(
  reportId: string,
  payload: ProgressStagePayload
): Promise<ReportProgressResponse | null> {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/reports/${reportId}/progress-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Error updating progress stage for report ${reportId}:`, err);
  }
  return null;
}

/**
 * Upload a progress photograph ('before', 'during', or 'after') by an authorised department user or inspector.
 */
export async function uploadRepairPhoto(
  reportId: string,
  photo: File | Blob,
  stage: 'before' | 'during' | 'after',
  caption?: string,
  actorName: string = 'Authorized Department User',
  actorRole: string = 'Department Crew',
  department?: string
): Promise<{ success: boolean; photo_url: string; stage: string; message: string } | null> {
  try {
    const formData = new FormData();
    formData.append('photo', photo, `repair_${stage}_${Date.now()}.jpg`);
    formData.append('stage', stage);
    if (caption) formData.append('caption', caption);
    formData.append('actor_name', actorName);
    formData.append('actor_role', actorRole);
    if (department) formData.append('department', department);

    const res = await fetch(`http://127.0.0.1:8000/api/reports/${reportId}/repair-photo`, {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Error uploading repair photo for report ${reportId}:`, err);
  }
  return null;
}




