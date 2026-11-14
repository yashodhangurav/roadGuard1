import os
import io
import uuid
from datetime import datetime
from fastapi.testclient import TestClient
import numpy as np
from PIL import Image
import pytest

from main import app
from app.services.repair_verification_service import repair_verification_service, haversine_distance

client = TestClient(app)
SAMPLE_PATH = os.path.join(os.path.dirname(__file__), "sample_road.jpg")

def create_synthetic_pavement(color=(65, 65, 70), width=640, height=480) -> bytes:
    """Creates a clean synthetic asphalt pavement image (no potholes)."""
    np.random.seed(42)
    # Base asphalt color with slight texture noise
    base = np.full((height, width, 3), color, dtype=np.uint8)
    noise = np.random.randint(-10, 10, (height, width, 3), dtype=np.int16)
    asphalt = np.clip(base.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(asphalt)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()

def test_01_maintainers_crud_and_listing():
    """Verify listing maintainers, creating a new maintainer, and updating profile."""
    # 1. List maintainers
    res = client.get("/api/maintainers")
    assert res.status_code == 200
    maintainers = res.json()
    assert isinstance(maintainers, list)
    assert len(maintainers) >= 4  # Includes seeded demo maintainers

    # 2. Create new maintainer
    new_email = f"field.tech.{uuid.uuid4().hex[:6]}@roadguard.ai"
    payload = {
        "name": "Marcus Vance",
        "email": new_email,
        "phone": "+1 (555) 888-9999",
        "department": "Rapid Patch Division",
        "password": "maintainer2026",
        "status": "ACTIVE"
    }
    create_res = client.post("/api/maintainers", json=payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["name"] == "Marcus Vance"
    assert created_data["email"] == new_email
    assert created_data["id"].startswith("MNT-2026-")
    maintainer_id = created_data["id"]

    # 3. Duplicate email rejection
    dup_res = client.post("/api/maintainers", json=payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 4. Fetch specific maintainer
    get_res = client.get(f"/api/maintainers/{maintainer_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == maintainer_id

    # 5. Update maintainer
    patch_res = client.patch(
        f"/api/maintainers/{maintainer_id}",
        json={"department": "Arterial Corridor Maintenance", "status": "ON_LEAVE"}
    )
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert updated_data["department"] == "Arterial Corridor Maintenance"
    assert updated_data["status"] == "ON_LEAVE"


def test_02_maintainer_authentication():
    """Verify maintainer login endpoint with valid credentials and error handling."""
    # 1. Valid login for seeded demo maintainer
    login_payload = {
        "email": "carlos.mendez@roadguard.ai",
        "password": "maintainer2026"
    }
    res = client.post("/api/maintainers/login", json=login_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["role"] == "maintainer"
    assert data["user"]["email"] == "carlos.mendez@roadguard.ai"
    assert "token" in data

    # 2. Invalid password
    bad_res = client.post(
        "/api/maintainers/login",
        json={"email": "carlos.mendez@roadguard.ai", "password": "wrong_password_xyz"}
    )
    assert bad_res.status_code == 401

    # 3. Nonexistent maintainer email
    none_res = client.post(
        "/api/maintainers/login",
        json={"email": "nonexistent.tech@nowhere.com", "password": "maintainer2026"}
    )
    assert none_res.status_code == 401


def test_03_admin_dispatch_and_assignment_workflow():
    """Verify assigning a reported pothole issue to a maintainer with priority and deadline."""
    assert os.path.exists(SAMPLE_PATH)
    with open(SAMPLE_PATH, "rb") as f:
        img_bytes = f.read()

    run_token = uuid.uuid4().hex[:6]
    client_id = f"test-assign-{run_token}"

    # 1. Submit citizen report
    files = {"image": ("pothole.jpg", img_bytes, "image/jpeg")}
    data = {
        "client_report_id": client_id,
        "latitude": 37.7749,
        "longitude": -122.4194,
        "category": "Pothole",
        "severity": "Critical",
        "description": "Hazardous pothole on 8th St.",
        "citizen_name": "Citizen Jordan",
    }
    sync_res = client.post("/api/reports/sync", files=files, data=data)
    assert sync_res.status_code == 200
    report_id = sync_res.json()["report_id"]

    # 2. Admin dispatches to Carlos Mendez (MNT-2026-001)
    assign_payload = {
        "maintainer_id": "MNT-2026-001",
        "priority": "HIGH",
        "admin_instructions": "Excavate damaged base, apply bitumen tack coat, compact 75mm asphalt.",
        "target_completion_date": "2026-11-20",
        "assigned_by": "Administrator Sarah"
    }
    assign_res = client.post(f"/api/reports/{client_id}/assign", json=assign_payload)
    assert assign_res.status_code == 200
    assign_data = assign_res.json()
    assert assign_data["success"] is True
    assert assign_data["assigned_maintainer_id"] == "MNT-2026-001"
    assert assign_data["priority"] == "HIGH"
    assert assign_data["status"] == "In Progress"
    assert assign_data["current_stage"] == "Assigned to department"

    # 3. Verify task appears in maintainer's task queue
    tasks_res = client.get("/api/maintainers/MNT-2026-001/tasks")
    assert tasks_res.status_code == 200
    tasks_data = tasks_res.json()
    assert tasks_data["total"] >= 1
    task_ids = [t.get("id") or t.get("client_report_id") for t in tasks_data["tasks"]]
    assert client_id in task_ids or report_id in task_ids

    # 4. Maintainer arrives on site and starts work
    start_res = client.post(f"/api/reports/{client_id}/repair/start?maintainer_id=MNT-2026-001")
    assert start_res.status_code == 200
    assert start_res.json()["success"] is True


def test_04_fraud_detection_identical_photo_rejection():
    """Verify that submitting identical before and after photos is rejected via pHash tamper check."""
    assert os.path.exists(SAMPLE_PATH)
    with open(SAMPLE_PATH, "rb") as f:
        img_bytes = f.read()

    run_token = uuid.uuid4().hex[:6]
    client_id = f"test-tamper-{run_token}"

    # Submit ticket
    sync_res = client.post(
        "/api/reports/sync",
        files={"image": ("pothole.jpg", img_bytes, "image/jpeg")},
        data={
            "client_report_id": client_id,
            "latitude": 37.7800,
            "longitude": -122.4100,
            "category": "Pothole",
        }
    )
    assert sync_res.status_code == 200

    # Submit identical photos for Before and After
    files = {
        "before_image": ("before.jpg", img_bytes, "image/jpeg"),
        "after_image": ("after.jpg", img_bytes, "image/jpeg"),  # Exactly identical binary
    }
    data = {
        "capture_lat": 37.7800,
        "capture_lng": -122.4100,
        "gps_accuracy": 4.5,
        "maintainer_id": "MNT-2026-001",
    }
    evidence_res = client.post(f"/api/reports/{client_id}/repair/submit-evidence", files=files, data=data)
    assert evidence_res.status_code == 200
    res_data = evidence_res.json()
    assert res_data["verificationStatus"] == "REJECTED"
    assert res_data["repairSuccess"] is False
    assert "identical" in res_data["reason"].lower() or "fraudulent" in res_data["reason"].lower()


def test_05_location_proximity_mismatch_check():
    """Verify that photo evidence captured >150m away triggers NEEDS_REVIEW with distance flag."""
    assert os.path.exists(SAMPLE_PATH)
    with open(SAMPLE_PATH, "rb") as f:
        before_bytes = f.read()

    clean_after_bytes = create_synthetic_pavement()

    run_token = uuid.uuid4().hex[:6]
    client_id = f"test-gps-mismatch-{run_token}"

    # Submit ticket at Market St (37.7800, -122.4100)
    sync_res = client.post(
        "/api/reports/sync",
        files={"image": ("pothole.jpg", before_bytes, "image/jpeg")},
        data={
            "client_report_id": client_id,
            "latitude": 37.7800,
            "longitude": -122.4100,
            "category": "Pothole",
        }
    )
    assert sync_res.status_code == 200

    # Submit repair evidence taken 500m away (37.7850, -122.4100 is ~550m north)
    files = {
        "before_image": ("before.jpg", before_bytes, "image/jpeg"),
        "after_image": ("after.jpg", clean_after_bytes, "image/jpeg"),
    }
    data = {
        "capture_lat": 37.7850,
        "capture_lng": -122.4100,
        "gps_accuracy": 3.0,
        "maintainer_id": "MNT-2026-001",
    }
    evidence_res = client.post(f"/api/reports/{client_id}/repair/submit-evidence", files=files, data=data)
    assert evidence_res.status_code == 200
    res_data = evidence_res.json()
    assert res_data["verificationStatus"] == "NEEDS_REVIEW"
    assert res_data["locationVerified"] is False
    assert res_data["distanceFromTicketMeters"] > 150.0
    assert "location discrepancy" in res_data["reason"].lower()


def test_06_successful_ai_repair_verification_and_auto_resolution():
    """Verify that complete defect remediation passes AI verification and automatically resolves the issue."""
    assert os.path.exists(SAMPLE_PATH)
    with open(SAMPLE_PATH, "rb") as f:
        before_bytes = f.read()

    # Clean compacted pavement
    clean_after_bytes = create_synthetic_pavement()

    run_token = uuid.uuid4().hex[:6]
    client_id = f"test-verify-success-{run_token}"

    # 1. Submit ticket
    sync_res = client.post(
        "/api/reports/sync",
        files={"image": ("pothole.jpg", before_bytes, "image/jpeg")},
        data={
            "client_report_id": client_id,
            "latitude": 37.7749,
            "longitude": -122.4194,
            "category": "Pothole",
        }
    )
    assert sync_res.status_code == 200

    # 2. Submit valid Before (damaged) and After (clean pavement) photos within 10 meters
    files = {
        "before_image": ("before.jpg", before_bytes, "image/jpeg"),
        "after_image": ("after.jpg", clean_after_bytes, "image/jpeg"),
    }
    data = {
        "capture_lat": 37.77492,
        "capture_lng": -122.41938,
        "gps_accuracy": 2.5,
        "maintainer_id": "MNT-2026-001",
    }
    evidence_res = client.post(f"/api/reports/{client_id}/repair/submit-evidence", files=files, data=data)
    assert evidence_res.status_code == 200
    res_data = evidence_res.json()

    assert res_data["verificationStatus"] == "VERIFIED"
    assert res_data["repairSuccess"] is True
    assert res_data["areaReductionPercentage"] >= 85.0
    assert res_data["locationVerified"] is True

    # 3. Verify the report in database automatically transitioned to Resolved / Closed
    detail_res = client.get(f"/api/reports/{client_id}")
    assert detail_res.status_code == 200
    report_detail = detail_res.json()
    assert report_detail["status"] == "Resolved"
    assert report_detail["current_stage"] == "Closed"
    assert report_detail["ai_verification_status"] == "VERIFIED"


def test_07_admin_manual_decision_for_uncertain_review():
    """Verify administrator manual QA decision (APPROVE and REJECT) for issues flagged for review."""
    run_token = uuid.uuid4().hex[:6]
    client_id = f"test-manual-qa-{run_token}"

    assert os.path.exists(SAMPLE_PATH)
    with open(SAMPLE_PATH, "rb") as f:
        img_bytes = f.read()

    # Submit ticket
    sync_res = client.post(
        "/api/reports/sync",
        files={"image": ("pothole.jpg", img_bytes, "image/jpeg")},
        data={
            "client_report_id": client_id,
            "latitude": 37.7850,
            "longitude": -122.4050,
            "category": "Pothole",
        }
    )
    assert sync_res.status_code == 200

    # Admin Manual Decision: APPROVE
    approve_res = client.post(
        f"/api/reports/{client_id}/repair/manual-decision",
        json={
            "action": "APPROVE",
            "notes": "Verified surface compaction and drainage slope via municipal drive-by QA.",
            "admin_name": "Chief Inspector Davies"
        }
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["success"] is True
    assert approve_res.json()["status"] == "Resolved"
    assert approve_res.json()["current_stage"] == "Closed"

    # Admin Manual Decision: REJECT
    reject_res = client.post(
        f"/api/reports/{client_id}/repair/manual-decision",
        json={
            "action": "REJECT",
            "notes": "Surface level uneven; water ponding risk identified.",
            "admin_name": "Chief Inspector Davies"
        }
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["success"] is True
    assert reject_res.json()["status"] == "In Progress"
    assert reject_res.json()["current_stage"] == "Reopened"

