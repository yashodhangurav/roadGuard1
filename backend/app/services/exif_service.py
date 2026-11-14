import io
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from PIL import Image, ExifTags

logger = logging.getLogger("roadguard.exif_service")


class ExifService:
    """
    Production-grade server-side EXIF inspection and Geotag verification service.
    Extracts embedded GNSS latitude, longitude, altitude, timestamp, and camera hardware
    metadata from uploaded binary images using Pillow.
    """

    @staticmethod
    def _convert_to_degrees(value) -> float:
        """
        Helper function to convert the GPS coordinates stored in EXIF to decimal degrees.
        Handles tuples/IFDRational of (degrees, minutes, seconds).
        """
        try:
            d = float(value[0])
            m = float(value[1])
            s = float(value[2])
            return d + (m / 60.0) + (s / 3600.0)
        except Exception:
            return float(value)

    def extract_exif_metadata(self, content: bytes) -> Dict[str, Any]:
        """
        Extracts GPS coordinates, capture timestamp, and camera metadata from image bytes.
        """
        result = {
            "has_exif": False,
            "has_gps": False,
            "latitude": None,
            "longitude": None,
            "altitude": None,
            "capture_timestamp": None,
            "camera_make": None,
            "camera_model": None,
        }

        try:
            with Image.open(io.BytesIO(content)) as img:
                exif = img.getexif()
                if not exif:
                    return result

                result["has_exif"] = True

                # Extract Camera Make & Model
                make = exif.get(ExifTags.Base.Make) or exif.get(0x010F)
                model = exif.get(ExifTags.Base.Model) or exif.get(0x0110)
                if make:
                    result["camera_make"] = str(make).strip()
                if model:
                    result["camera_model"] = str(model).strip()

                # Extract Capture Timestamp
                dt_str = exif.get(ExifTags.Base.DateTimeOriginal) or exif.get(ExifTags.Base.DateTime) or exif.get(0x9003)
                if dt_str:
                    try:
                        clean_dt = str(dt_str).strip()
                        # Format "YYYY:MM:DD HH:MM:SS"
                        if len(clean_dt) >= 19 and clean_dt[4] == ":" and clean_dt[7] == ":":
                            parts = clean_dt[:10].replace(":", "-") + clean_dt[10:]
                            result["capture_timestamp"] = datetime.fromisoformat(parts).isoformat()
                        else:
                            result["capture_timestamp"] = clean_dt
                    except Exception:
                        result["capture_timestamp"] = str(dt_str)

                # Extract GPS IFD
                gps_ifd = None
                try:
                    gps_ifd = exif.get_ifd(ExifTags.IFD.GPSInfo)
                except Exception:
                    # Fallback for older PIL
                    gps_ifd = exif.get(34853)

                if not gps_ifd:
                    return result

                # Parse GPS Latitude & Longitude
                gps_lat = gps_ifd.get(ExifTags.GPS.GPSLatitude) or gps_ifd.get(2)
                gps_lat_ref = gps_ifd.get(ExifTags.GPS.GPSLatitudeRef) or gps_ifd.get(1)
                gps_lng = gps_ifd.get(ExifTags.GPS.GPSLongitude) or gps_ifd.get(4)
                gps_lng_ref = gps_ifd.get(ExifTags.GPS.GPSLongitudeRef) or gps_ifd.get(3)

                if gps_lat is not None and gps_lng is not None:
                    lat_deg = self._convert_to_degrees(gps_lat)
                    if gps_lat_ref and str(gps_lat_ref).upper().startswith("S"):
                        lat_deg = -lat_deg

                    lng_deg = self._convert_to_degrees(gps_lng)
                    if gps_lng_ref and str(gps_lng_ref).upper().startswith("W"):
                        lng_deg = -lng_deg

                    # Validate range
                    if -90.0 <= lat_deg <= 90.0 and -180.0 <= lng_deg <= 180.0:
                        # Exclude 0,0 Null Island
                        if not (abs(lat_deg) < 1e-6 and abs(lng_deg) < 1e-6):
                            result["has_gps"] = True
                            result["latitude"] = round(lat_deg, 6)
                            result["longitude"] = round(lng_deg, 6)

                # Parse Altitude
                gps_alt = gps_ifd.get(ExifTags.GPS.GPSAltitude) or gps_ifd.get(6)
                gps_alt_ref = gps_ifd.get(ExifTags.GPS.GPSAltitudeRef) or gps_ifd.get(5)
                if gps_alt is not None:
                    try:
                        alt_val = float(gps_alt)
                        if gps_alt_ref and int(gps_alt_ref) == 1:
                            alt_val = -alt_val
                        result["altitude"] = round(alt_val, 1)
                    except Exception:
                        pass

                return result
        except Exception as e:
            logger.warning(f"Error extracting EXIF metadata: {e}")
            return result

    def validate_uploaded_geotag(
        self,
        content: bytes,
        reported_lat: Optional[float] = None,
        reported_lng: Optional[float] = None,
        tolerance_deg: float = 0.005  # ~500 meters tolerance
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates an existing photograph upload:
        - Must contain legitimate embedded EXIF GPS tags.
        - Embedded coordinates must match client-submitted coordinates (tamper check).
        """
        metadata = self.extract_exif_metadata(content)
        if not metadata["has_gps"]:
            return False, "This photo does not contain GPS location metadata. Please capture a new photo using the RoadGuard AI camera.", metadata

        exif_lat = metadata["latitude"]
        exif_lng = metadata["longitude"]

        if reported_lat is not None and reported_lng is not None:
            lat_diff = abs(reported_lat - exif_lat)
            lng_diff = abs(reported_lng - exif_lng)
            if lat_diff > tolerance_deg or lng_diff > tolerance_deg:
                return (
                    False,
                    f"Reported coordinates ({reported_lat:.4f}, {reported_lng:.4f}) deviate significantly from "
                    f"embedded EXIF GPS coordinates ({exif_lat:.4f}, {exif_lng:.4f}).",
                    metadata
                )

        return True, "EXIF GPS metadata verified successfully.", metadata


exif_service = ExifService()

