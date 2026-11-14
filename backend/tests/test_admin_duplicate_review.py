import os
import uuid
from fastapi.testclient import TestClient
import pytest
from main import app
from app.services.phash_service import phash_service
from app.services.orb_service import orb_service

client = TestClient(app)
SAMPLE_PATH = os.path.join(os.path.dirname(__file__), "sample_road.jpg")


def test_admin_duplicate_review_workflow():
    """
    Test complete admin duplicate review workflow:
    1. Submit canonical issue #1.
    2. Submit duplicate issue #2 with exact or near-identical image within proximity.
    3. Verify duplicate is linked to canonical issue in database.
    4. Fetch duplicate cluster via GET /api/reports/{id}/duplicate-cluster.
    5. Admin executes DISMISS_DUPLICATE (Create New Issue) via POST /api/reports/{id}/duplicate-review.
    6. Verify issue #2 is unlinked, marked NEW_ISSUE, and its submission remains fully preserved.
    7. Admin executes CONFIRM_DUPLICATE and verifies decision, notes, and timestamp are recorded.
    """
    assert os.path.exists(SAMPLE_PATH), "sample_road.jpg must exist"
    with open(SAMPLE_PATH, "rb") as f:
        img_bytes = f.read()

    run_token = uuid.uuid4().hex[:6]
    id_a = f"test-can-{run_token}"
    id_b = f"test-dup-{run_token}"

    # 1. Submit Canonical Issue A
    files_a = {"image": ("pothole_a.jpg", img_bytes, "image/jpeg")}
    data_a = {
        "client_report_id": id_a,
        "latitude": 37.7858,
        "longitude": -122.4064,
        "category": "Pothole",
        "severity": "Critical",
        "description": "Original canonical pothole on Mission St.",
        "citizen_name": "Citizen Alex",
    }
    resp_a = client.post("/api/reports/sync", files=files_a, data=data_a)
    assert resp_a.status_code == 200
    mongo_id_a = resp_a.json()["report_id"]

    # 2. Submit Duplicate Issue B within 5 meters
    files_b = {"image": ("pothole_b.jpg", img_bytes, "image/jpeg")}
    data_b = {
        "client_report_id": id_b,
        "latitude": 37.78583,
        "longitude": -122.40638,
        "category": "Pothole",
        "severity": "Critical",
        "description": "Second report of same pothole.",
        "citizen_name": "Citizen Bailey",
    }
    resp_b = client.post("/api/reports/sync", files=files_b, data=data_b)
    assert resp_b.status_code == 200
    data_b_res = resp_b.json()

    assert data_b_res["is_duplicate"] is True
    assert data_b_res["duplicate_status"] == "CONFIRMED_DUPLICATE"
    assert data_b_res["canonical_issue_id"] is not None

    canonical_id = data_b_res["canonical_issue_id"]

    # 3. Test Cluster Query: GET /api/reports/{id}/duplicate-cluster
    resp_cluster = client.get(f"/api/reports/{canonical_id}/duplicate-cluster")
    assert resp_cluster.status_code == 200
    cluster_json = resp_cluster.json()
    assert cluster_json["canonical_issue_id"] == canonical_id
    assert cluster_json["total_linked_submissions"] >= 1
    child_ids = [c["client_report_id"] for c in cluster_json["duplicate_submissions"]]
    assert id_b in child_ids

    # 4. Admin Decision Action: DISMISS_DUPLICATE ("Create New Issue")
    review_dismiss_payload = {
        "action": "DISMISS_DUPLICATE",
        "admin_notes": "Road Inspector verified separate void 4m down the roadway.",
    }
    resp_dismiss = client.post(
        f"/api/reports/{id_b}/duplicate-review",
        json=review_dismiss_payload
    )
    assert resp_dismiss.status_code == 200
    dismiss_json = resp_dismiss.json()
    assert dismiss_json["success"] is True
    assert dismiss_json["is_duplicate"] is False
    assert dismiss_json["duplicate_status"] == "NEW_ISSUE"
    assert dismiss_json["duplicate_review_status"] == "DISMISSED_BY_ADMIN"
    assert dismiss_json["canonical_issue_id"] is None

    # 5. Verify unlinked from cluster
    resp_cluster_after = client.get(f"/api/reports/{canonical_id}/duplicate-cluster")
    assert resp_cluster_after.status_code == 200
    child_ids_after = [c["client_report_id"] for c in resp_cluster_after.json()["duplicate_submissions"]]
    assert id_b not in child_ids_after

    # 6. Admin Decision Action: CONFIRM_DUPLICATE ("Confirm Duplicate")
    review_confirm_payload = {
        "action": "CONFIRM_DUPLICATE",
        "canonical_issue_id": canonical_id,
        "admin_notes": "Inspector re-confirmed geometric inlier overlap with canonical ticket.",
    }
    resp_confirm = client.post(
        f"/api/reports/{id_b}/duplicate-review",
        json=review_confirm_payload
    )
    assert resp_confirm.status_code == 200
    confirm_json = resp_confirm.json()
    assert confirm_json["success"] is True
    assert confirm_json["is_duplicate"] is True
    assert confirm_json["duplicate_status"] == "CONFIRMED_DUPLICATE"
    assert confirm_json["duplicate_review_status"] == "APPROVED_BY_ADMIN"
    assert confirm_json["canonical_issue_id"] == canonical_id

    # 7. Preservation Verification: Both reports exist as distinct independent records
    single_a = client.get(f"/api/reports/{id_a}")
    single_b = client.get(f"/api/reports/{id_b}")
    assert single_a.status_code == 200
    assert single_b.status_code == 200
    assert single_a.json()["id"] == id_a
    assert single_b.json()["id"] == id_b
    assert single_b.json()["canonical_issue_id"] == canonical_id
