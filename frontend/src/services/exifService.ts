/**
 * RoadGuard AI - EXIF Geolocation Extraction & Verification Service
 *
 * Parses EXIF metadata from user-selected image files using exifr.
 * Extracts GPS coordinates, altitude, capture timestamp, and camera metadata.
 * Strictly rejects photographs without valid GPS coordinates.
 */

import exifr from 'exifr';

export interface ExifGpsMetadata {
  latitude: number;
  longitude: number;
  altitude?: number;
  captureTimestamp?: string;
  cameraMake?: string;
  cameraModel?: string;
  hasGps: boolean;
  rawExif?: Record<string, any>;
}

export interface ExifExtractionResult {
  success: boolean;
  metadata?: ExifGpsMetadata;
  error?: string;
}

/**
 * Validates that GPS coordinates are within legitimate global bounds.
 */
export function isValidCoordinate(latitude: number, longitude: number): boolean {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  // Reject exact 0,0 Null Island unless verified
  if (latitude === 0 && longitude === 0) return false;
  return true;
}

/**
 * Parses an uploaded File or Blob for genuine EXIF GPS metadata.
 * Returns structured metadata if valid GPS is found, or an error message explaining rejection.
 */
export async function extractExifGps(file: File | Blob): Promise<ExifExtractionResult> {
  try {
    // Parse GPS tags and camera tags
    const data = await exifr.parse(file, {
      gps: true,
      exif: true,
      tiff: true,
      pick: [
        'latitude',
        'longitude',
        'altitude',
        'GPSAltitude',
        'DateTimeOriginal',
        'CreateDate',
        'ModifyDate',
        'Make',
        'Model',
        'GPSDateStamp',
        'GPSTimeStamp',
      ],
    });

    if (!data) {
      return {
        success: false,
        error: 'This photo does not contain GPS location metadata. Please capture a new photo using the RoadGuard AI camera.',
      };
    }

    const lat = typeof data.latitude === 'number' ? data.latitude : null;
    const lng = typeof data.longitude === 'number' ? data.longitude : null;

    if (lat === null || lng === null || !isValidCoordinate(lat, lng)) {
      return {
        success: false,
        error: 'This photo does not contain GPS location metadata. Please capture a new photo using the RoadGuard AI camera.',
      };
    }

    // Extract altitude (meters above sea level)
    let altitude: number | undefined = undefined;
    if (typeof data.altitude === 'number' && !isNaN(data.altitude)) {
      altitude = Math.round(data.altitude * 10) / 10;
    } else if (typeof data.GPSAltitude === 'number' && !isNaN(data.GPSAltitude)) {
      altitude = Math.round(data.GPSAltitude * 10) / 10;
    }

    // Extract capture timestamp
    let captureTimestamp: string | undefined = undefined;
    const rawDate = data.DateTimeOriginal || data.CreateDate || data.ModifyDate;
    if (rawDate instanceof Date) {
      captureTimestamp = rawDate.toISOString();
    } else if (typeof rawDate === 'string' && rawDate.trim()) {
      try {
        captureTimestamp = new Date(rawDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')).toISOString();
      } catch {
        captureTimestamp = rawDate;
      }
    }

    const cameraMake = typeof data.Make === 'string' ? data.Make.trim() : undefined;
    const cameraModel = typeof data.Model === 'string' ? data.Model.trim() : undefined;

    return {
      success: true,
      metadata: {
        latitude: lat,
        longitude: lng,
        altitude,
        captureTimestamp,
        cameraMake,
        cameraModel,
        hasGps: true,
        rawExif: data,
      },
    };
  } catch (err: any) {
    console.warn('[ExifService] Failed to extract EXIF data:', err);
    return {
      success: false,
      error: 'This photo does not contain GPS location metadata. Please capture a new photo using the RoadGuard AI camera.',
    };
  }
}

