import io
import os
import uuid
from fractions import Fraction
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from main import app
from app.services.exif_service import exif_service

client = TestClient(app)
SAMPLE_PATH = os.path.join(os.path.dirname(__file__), "sample_road.jpg")


def create_geotagged_jpeg(lat: float = 37.774928, lng: float = -122.419414) -> bytes:
    """Helper to generate an in-memory JPEG with genuine EXIF GPS metadata."""
    im = Image.new("RGB", (120, 120), color=(128, 128, 128))
    exif = im.getexif()
    gps_ifd = exif.get_ifd(0x8825)

    # Convert lat/lng to DMS Fractions
    lat_deg = int(abs(lat))
    lat_min = int((abs(lat) - lat_deg) * 60)
    lat_sec = round(((abs(lat) - lat_deg) * 60 - lat_min) * 60, 2)

    lng_deg = int(abs(lng))
    lng_min = int((abs(lng) - lng_deg) * 60)
    lng_sec = round(((abs(lng) - lng_deg) * 60 - lng_min) * 60, 2)

    gps_ifd[1] = "N" if lat >= 0 else "S"
    gps_ifd[2] = (Fraction(lat_deg, 1), Fraction(lat_min, 1), Fraction(int(lat_sec * 100), 100))
    gps_ifd[3] = "E" if lng >= 0 else "W"
    gps_ifd[4] = (Fraction(lng_deg, 1), Fraction(lng_min, 1), Fraction(int(lng_sec * 100), 100))

    buf = io.BytesIO()
    im.save(buf, format="JPEG", exif=exif)
    return buf.getvalue()


def create_raw_jpeg_without_exif() -> bytes:
    """Helper to generate a clean JPEG without any EXIF GPS metadata."""
    im = Image.new("RGB", (120, 120), color=(80, 80, 80))
    buf = io.BytesIO()
    im.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture(scope="session")
def sample_image_bytes():
    assert os.path.exists(SAMPLE_PATH), "sample_road.jpg must exist"
    with open(SAMPLE_PATH, "rb") as f:
        return f.read()


# ----------------------------------------------------------------------
# 1. In-App Live GPS Camera Capture Submission
# ----------------------------------------------------------------------
def test_01_in_app_gps_camera_capture_submission(sample_image_bytes):
    run_id = uuid.uuid4().hex[:6]
    client_id = f"cam-test-{run_id}"

    stamped_bytes = sample_image_bytes
    raw_frame_bytes = create_raw_jpeg_without_exif()

    files = [
        ("image", ("stamped_camera_frame.jpg", stamped_bytes, "image/jpeg")),
        ("original_image", ("raw_sensor_frame.jpg", raw_frame_bytes, "image/jpeg")),
    ]
    data = {
        "client_report_id": client_id,
        "latitude": 37.774928,
        "longitude": -122.419414,
        "category": "Pothole",
        "severity": "High",
        "description": "Captured via RoadGuard in-app GPS Camera with permanent HUD stamp.",
        "citizen_id": "CIT-CAM-01",
        "citizen_name": "Surveyor Dave",
        "address": "Market St & 7th St, San Francisco, CA",
        "accuracy_meters": 3.8,
        "altitude": 18.4,
        "capture_timestamp": "2026-11-14T03:45:00Z",
        "capture_method": "in_app_camera",
        "camera_make": "RoadGuard Live Camera",
        "camera_model": "Canvas HUD Stamp Engine",
    }

    res = client.post("/api/reports/sync", data=data, files=files)
    assert res.status_code == 200, f"Sync failed: {res.text}"
    body = res.json()

    assert body["client_report_id"] == client_id
    assert body["geotag_verified"] is True
    assert body["capture_method"] == "in_app_camera"
    assert body["gps_accuracy"] == 3.8
    assert body["altitude"] == 18.4
    assert body["capture_timestamp"] is not None
    assert body["camera_make"] == "RoadGuard Live Camera"
    assert body["camera_model"] == "Canvas HUD Stamp Engine"
    assert body["original_image_url"] is not None
    assert body["stamped_image_url"] is not None


# ----------------------------------------------------------------------
# 2. In-App Camera Gating: Reject Accuracy > 100 meters
# ----------------------------------------------------------------------
def test_02_in_app_camera_inaccurate_gps_rejection(sample_image_bytes):
    run_id = uuid.uuid4().hex[:6]
    client_id = f"cam-inacc-{run_id}"

    files = {"image": ("stamped_frame.jpg", sample_image_bytes, "image/jpeg")}
    data = {
        "client_report_id": client_id,
        "latitude": 37.7749,
        "longitude": -122.4194,
        "category": "Pothole",
        "severity": "Medium",
        "description": "Low accuracy GPS attempt.",
        "citizen_id": "CIT-CAM-02",
        "citizen_name": "Inaccurate Dave",
        "accuracy_meters": 135.0,  # > 100m gate
        "capture_method": "in_app_camera",
    }

    res = client.post("/api/reports/sync", data=data, files=files)
    assert res.status_code == 422, f"Should reject poor accuracy: {res.text}"
    err_msg = res.json().get("detail", "")
    assert "Must be within ±100m" in err_msg or "100" in err_msg


# ----------------------------------------------------------------------
# 3. Existing Photo Upload with Valid EXIF GPS Metadata
# ----------------------------------------------------------------------
def test_03_existing_geotagged_photo_upload_success():
    run_id = uuid.uuid4().hex[:6]
    client_id = f"upload-valid-{run_id}"

    geotagged_bytes = create_geotagged_jpeg(lat=37.774928, lng=-122.419414)

    files = {"image": ("iphone_pothole_exif.jpg", geotagged_bytes, "image/jpeg")}
    data = {
        "client_report_id": client_id,
        "latitude": 37.774928,
        "longitude": -122.419414,
        "category": "Pothole",
        "severity": "Critical",
        "description": "Genuine geotagged photo from citizen smartphone.",
        "citizen_id": "CIT-EXIF-01",
        "citizen_name": "Photographer Alice",
        "capture_method": "existing_geotagged_upload",
    }

    res = client.post("/api/reports/sync", data=data, files=files)
    assert res.status_code == 200, f"Upload failed: {res.text}"
    body = res.json()

    assert body["client_report_id"] == client_id
    assert body["geotag_verified"] is True
    assert body["capture_method"] == "existing_geotagged_upload"
    assert body["exif_metadata_available"] is True


# ----------------------------------------------------------------------
# 4. Existing Photo Upload Rejection: Missing EXIF GPS Metadata
# ----------------------------------------------------------------------
def test_04_non_geotagged_photo_upload_rejection():
    run_id = uuid.uuid4().hex[:6]
    client_id = f"upload-nogps-{run_id}"

    raw_bytes = create_raw_jpeg_without_exif()

    files = {"image": ("screenshot_no_gps.jpg", raw_bytes, "image/jpeg")}
    data = {
        "client_report_id": client_id,
        "latitude": 37.774928,
        "longitude": -122.419414,
        "category": "Pothole",
        "severity": "High",
        "description": "Image without GPS tags.",
        "citizen_id": "CIT-EXIF-02",
        "citizen_name": "No-GPS Bob",
        "capture_method": "existing_geotagged_upload",
    }

    res = client.post("/api/reports/sync", data=data, files=files)
    assert res.status_code == 422, f"Should reject photo missing EXIF GPS: {res.text}"
    err_detail = res.json().get("detail", "")
    expected_msg = (
        "This photo does not contain GPS location metadata. Please capture a new photo using the RoadGuard AI camera."
    )
    assert expected_msg in err_detail, f"Expected exact message '{expected_msg}', got '{err_detail}'"


# ----------------------------------------------------------------------
# 5. Coordinate Tampering / Significant Deviation Detection
# ----------------------------------------------------------------------
def test_05_coordinate_tampering_deviation_rejection():
    run_id = uuid.uuid4().hex[:6]
    client_id = f"upload-tamper-{run_id}"

    # Photo is embedded with San Francisco coordinates
    geotagged_sf_bytes = create_geotagged_jpeg(lat=37.774928, lng=-122.419414)

    files = {"image": ("tampered_photo.jpg", geotagged_sf_bytes, "image/jpeg")}
    # But submitted data claims to be in New York (deviation > tolerance)
    data = {
        "client_report_id": client_id,
        "latitude": 40.7128,
        "longitude": -74.0060,
        "category": "Pothole",
        "severity": "High",
        "description": "Tampered coordinates attempt.",
        "citizen_id": "CIT-TAMPER-01",
        "citizen_name": "Tamper Tom",
        "capture_method": "existing_geotagged_upload",
    }

    res = client.post("/api/reports/sync", data=data, files=files)
    assert res.status_code == 422, f"Should reject tampered coordinates: {res.text}"
    err_detail = res.json().get("detail", "")
    assert "deviate significantly from embedded EXIF GPS coordinates" in err_detail


# ----------------------------------------------------------------------
# 6. Dual Image Archival & Individual Report Fetch
# ----------------------------------------------------------------------
def test_06_dual_image_archival_and_report_detail():
    run_id = uuid.uuid4().hex[:6]
    client_id = f"dual-img-{run_id}"

    stamped_bytes = create_geotagged_jpeg(37.7750, -122.4190)
    raw_frame_bytes = create_raw_jpeg_without_exif()

    files = [
        ("image", ("stamped.jpg", stamped_bytes, "image/jpeg")),
        ("original_image", ("raw.jpg", raw_frame_bytes, "image/jpeg")),
    ]
    data = {
        "client_report_id": client_id,
        "latitude": 37.7750,
        "longitude": -122.4190,
        "category": "Alligator Crack",
        "severity": "Medium",
        "description": "Dual image archival verification.",
        "citizen_id": "CIT-DUAL-01",
        "citizen_name": "Archivist Zara",
        "accuracy_meters": 2.1,
        "capture_method": "in_app_camera",
    }

    res = client.post("/api/reports/sync", data=data, files=files)
    assert res.status_code == 200
    report_id = res.json()["id"]

    # Fetch individual report via GET /api/reports/{id}
    detail_res = client.get(f"/api/reports/{report_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()

    assert detail["id"] in (report_id, client_id)
    assert detail["geotag_verified"] is True
    assert detail["capture_method"] == "in_app_camera"
    assert detail["gps_accuracy"] == 2.1
    assert detail["original_image_url"] is not None
    assert detail["stamped_image_url"] is not None
    assert detail["original_image_url"] != detail["stamped_image_url"]


# ----------------------------------------------------------------------
# 7. Reports Listing Returns Geotag Telemetry
# ----------------------------------------------------------------------
def test_07_reports_listing_includes_geotag_telemetry():
    res = client.get("/api/reports?limit=10")
    assert res.status_code == 200
    reports = res.json()
    assert isinstance(reports, list)
    assert len(reports) > 0

    # Find the report we submitted
    verified_reports = [r for r in reports if r.get("geotag_verified") is True]
    assert len(verified_reports) > 0, "At least one geotag_verified report should appear in listing"

    first_verified = verified_reports[0]
    assert "geotag_verified" in first_verified
    assert "capture_method" in first_verified
    assert first_verified["geotag_verified"] is True
