import os
import uuid
import pytest
from fastapi.testclient import TestClient
from main import app
from app.services.phash_service import phash_service
from app.services.orb_service import orb_service
from app.services.hybrid_duplicate_engine import (
    hybrid_duplicate_engine,
    DuplicateVerdict,
    MatchType,
    DuplicateEngineThresholds,
)
from app.database.mongodb import (
    find_nearby_reports,
    find_report_by_id_or_client_id,
    haversine_distance_meters,
)

client = TestClient(app)
SAMPLE_PATH = os.path.join(os.path.dirname(__file__), "sample_road.jpg")
SAMPLE_COMPRESSED = os.path.join(os.path.dirname(__file__), "sample_road_compressed.jpg")


@pytest.fixture(scope="session")
def sample_image_bytes():
    assert os.path.exists(SAMPLE_PATH), "sample_road.jpg must exist"
    with open(SAMPLE_PATH, "rb") as f:
        return f.read()


@pytest.fixture(scope="session")
def compressed_image_bytes():
    path = SAMPLE_COMPRESSED if os.path.exists(SAMPLE_COMPRESSED) else SAMPLE_PATH
    with open(path, "rb") as f:
        return f.read()


# ----------------------------------------------------------------------
# 1. Citizen Report Submission
# ----------------------------------------------------------------------
def test_01_citizen_report_submission_and_idempotency(sample_image_bytes):
    run_id = uuid.uuid4().hex[:6]
    client_id = f"audit-sub-{run_id}"

    files = {"image": ("pothole.jpg", sample_image_bytes, "image/jpeg")}
    data = {
        "client_report_id": client_id,
        "latitude": 37.7749,
        "longitude": -122.4194,
        "category": "Pothole",
        "severity": "Critical",
        "description": "Hazardous road pothole near intersection.",
        "citizen_id": "CIT-AUDIT-01",
        "citizen_name": "Auditor Vance",
        "address": "Market St & 5th St",
        "accuracy_meters": 4.5,
    }

    # First submission
    resp1 = client.post("/api/reports/sync", files=files, data=data)
    assert resp1.status_code == 200, resp1.text
    payload1 = resp1.json()
    assert payload1["success"] is True
    assert payload1["client_report_id"] == client_id

    # Second submission (Idempotency guarantee)
    files2 = {"image": ("pothole.jpg", sample_image_bytes, "image/jpeg")}
    resp2 = client.post("/api/reports/sync", files=files2, data=data)
    assert resp2.status_code == 200, resp2.text
    payload2 = resp2.json()
    assert payload2["message"] == "Report already synchronized (idempotent)"
    assert payload2["client_report_id"] == client_id


# ----------------------------------------------------------------------
# 2. GPS Coordinates & Spatial GeoJSON
# ----------------------------------------------------------------------
def test_02_gps_coordinates_spatial_indexing_and_accuracy(sample_image_bytes):
    run_id = uuid.uuid4().hex[:6]
    client_id = f"audit-gps-{run_id}"
    test_lat, test_lng = 37.7891, -122.4014

    files = {"image": ("gps_test.jpg", sample_image_bytes, "image/jpeg")}
    data = {
        "client_report_id": client_id,
        "latitude": test_lat,
        "longitude": test_lng,
        "category": "Pothole",
        "severity": "High",
        "address": "450 Sutter St",
        "accuracy_meters": 3.2,
        "is_manual_correction": True,
    }
    resp = client.post("/api/reports/sync", files=files, data=data)
    assert resp.status_code == 200, resp.text

    # Retrieve from MongoDB Atlas
    doc = find_report_by_id_or_client_id(client_id)
    assert doc is not None, "Report must be queryable in MongoDB Atlas"
    loc = doc.get("location", {})
    assert loc.get("type") == "Point"
    # GeoJSON: [longitude, latitude]
    assert round(loc["coordinates"][0], 4) == round(test_lng, 4)
    assert round(loc["coordinates"][1], 4) == round(test_lat, 4)
    assert loc.get("accuracy_meters") == 3.2
    assert loc.get("is_manual_correction") is True


# ----------------------------------------------------------------------
# 3. YOLO Pothole Detection & Pavement Metrics
# ----------------------------------------------------------------------
def test_03_yolo_detection_and_pavement_scoring(sample_image_bytes):
    files = {"file": ("test_yolo.jpg", sample_image_bytes, "image/jpeg")}
    resp = client.post("/api/detect/image", files=files)
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert "defects" in data
    assert "stats" in data
    assert data["stats"]["totalDefects"] >= 1
    assert data["stats"]["pciScore"] >= 0 and data["stats"]["pciScore"] <= 100
    assert data["annotatedImageUrl"].startswith("/outputs/")


# ----------------------------------------------------------------------
# 4. pHash Generation & Comparison
# ----------------------------------------------------------------------
def test_04_phash_generation_hamming_and_compression(sample_image_bytes, compressed_image_bytes):
    hash1 = phash_service.compute_phash(sample_image_bytes)
    assert hash1 is not None and len(hash1) == 16, "pHash must be 16-char hex"

    hash2 = phash_service.compute_phash(compressed_image_bytes)
    hamming_dist = phash_service.calculate_hamming_distance(hash1, hash2)
    similarity = phash_service.calculate_similarity(hamming_dist)

    # Same or compressed image must yield low Hamming distance (<= 10) and high similarity (>= 80%)
    assert hamming_dist <= 10
    assert similarity >= 80.0


# ----------------------------------------------------------------------
# 5. ORB Feature Extraction & Matching
# ----------------------------------------------------------------------
def test_05_orb_feature_extraction_matching_and_caching(sample_image_bytes):
    kps, des, _ = orb_service.extract_features(sample_image_bytes)
    assert len(kps) > 10, "Should detect at least 10 keypoints on road image"
    assert des is not None

    # Test cache persistence
    test_id = f"cache-test-{uuid.uuid4().hex[:6]}"
    orb_service.save_features_cache(test_id, kps, des)
    cached_kps, cached_des = orb_service.load_features_cache(test_id)
    assert len(cached_kps) == len(kps)
    assert cached_des.shape == des.shape

    # Match against self (ideal homography)
    metrics = orb_service.match_features(kps, des, cached_kps, cached_des)
    assert metrics["has_homography"] is True
    assert metrics["ransac_inliers_count"] >= 20
    assert metrics["inlier_ratio"] >= 0.5


# ----------------------------------------------------------------------
# 6. Nearby Road Issue Searching (50m Radius)
# ----------------------------------------------------------------------
def test_06_nearby_issue_searching_radius(sample_image_bytes):
    run_id = uuid.uuid4().hex[:6]
    root_id = f"audit-near-root-{run_id}"
    offset = (int(run_id, 16) % 1000) * 0.001
    center_lat = round(37.7500 + offset, 5)
    center_lng = round(-122.4200 - offset, 5)

    # Create reference report at center
    files = {"image": ("near_root.jpg", sample_image_bytes, "image/jpeg")}
    data = {
        "client_report_id": root_id,
        "latitude": center_lat,
        "longitude": center_lng,
        "category": "Pothole",
        "severity": "Medium",
    }
    resp = client.post("/api/reports/sync", files=files, data=data)
    assert resp.status_code == 200, resp.text

    # Search at center within 50 meters
    nearby_resp = client.get(f"/api/reports/nearby?latitude={center_lat}&longitude={center_lng}&radius_meters=50")
    assert nearby_resp.status_code == 200, nearby_resp.text
    nearby_data = nearby_resp.json()
    assert nearby_data["total_found"] >= 1
    found_ids = [r["client_report_id"] for r in nearby_data["reports"]]
    assert root_id in found_ids

    # Search far away (10 km away)
    far_resp = client.get(f"/api/reports/nearby?latitude={center_lat + 0.1}&longitude={center_lng + 0.1}&radius_meters=50")
    assert far_resp.status_code == 200
    far_data = far_resp.json()
    far_ids = [r["client_report_id"] for r in far_data["reports"]]
    assert root_id not in far_ids


# ----------------------------------------------------------------------
# 7. Duplicate Candidate Identification (Hybrid Engine)
# ----------------------------------------------------------------------
def test_07_duplicate_candidate_identification_multi_tier(sample_image_bytes):
    run_id = uuid.uuid4().hex[:6]
    root_id = f"audit-dup-root-{run_id}"
    dup_id = f"audit-dup-child-{run_id}"
    offset = (int(run_id, 16) % 1000) * 0.001
    lat = round(37.7300 + offset, 5)
    lng = round(-122.4400 - offset, 5)

    # 1. Post original report
    files1 = {"image": ("original.jpg", sample_image_bytes, "image/jpeg")}
    data1 = {
        "client_report_id": root_id,
        "latitude": lat,
        "longitude": lng,
        "category": "Pothole",
        "severity": "High",
    }
    resp1 = client.post("/api/reports/sync", files=files1, data=data1)
    assert resp1.status_code == 200

    # 2. Post duplicate with same photo 5 meters away
    files2 = {"image": ("duplicate.jpg", sample_image_bytes, "image/jpeg")}
    data2 = {
        "client_report_id": dup_id,
        "latitude": lat + 0.00004,
        "longitude": lng + 0.00004,
        "category": "Pothole",
        "severity": "High",
    }
    resp2 = client.post("/api/reports/sync", files=files2, data=data2)
    assert resp2.status_code == 200
    dup_data = resp2.json()

    assert dup_data["is_duplicate"] is True
    assert dup_data["duplicate_status"] == DuplicateVerdict.CONFIRMED_DUPLICATE.value
    assert dup_data["canonical_issue_id"] in (root_id, resp1.json().get("report_id"))


# ----------------------------------------------------------------------
# 8. Admin Duplicate Confirmation & Dismissal
# ----------------------------------------------------------------------
def test_08_admin_duplicate_confirmation_and_dismissal():
    test_rep_id = f"audit-review-{uuid.uuid4().hex[:6]}"
    can_id = f"audit-can-{uuid.uuid4().hex[:6]}"

    # Confirm duplicate
    confirm_resp = client.post(
        f"/api/reports/{test_rep_id}/duplicate-review",
        json={
            "action": "CONFIRM_DUPLICATE",
            "canonical_issue_id": can_id,
            "admin_notes": "Verified same distress by municipal inspector."
        }
    )
    assert confirm_resp.status_code == 200, confirm_resp.text
    c_json = confirm_resp.json()
    assert c_json["is_duplicate"] is True
    assert c_json["duplicate_status"] == "CONFIRMED_DUPLICATE"
    assert c_json["canonical_issue_id"] == can_id

    # Dismiss duplicate (independent issue)
    dismiss_resp = client.post(
        f"/api/reports/{test_rep_id}/duplicate-review",
        json={
            "action": "DISMISS_DUPLICATE",
            "admin_notes": "Distinct defect located across lane divider."
        }
    )
    assert dismiss_resp.status_code == 200, dismiss_resp.text
    d_json = dismiss_resp.json()
    assert d_json["is_duplicate"] is False
    assert d_json["duplicate_status"] == "NEW_ISSUE"
    assert d_json["canonical_issue_id"] is None


# ----------------------------------------------------------------------
# 9. Canonical Issue Linking & Preservation
# ----------------------------------------------------------------------
def test_09_canonical_issue_linking_and_preservation(sample_image_bytes):
    run_id = uuid.uuid4().hex[:6]
    canonical_id = f"audit-can-root-{run_id}"
    child_id = f"audit-can-child-{run_id}"
    offset = (int(run_id, 16) % 1000) * 0.001
    lat = round(37.7100 + offset, 5)
    lng = round(-122.4600 - offset, 5)

    # Submit canonical
    r1 = client.post("/api/reports/sync", files={"image": ("c1.jpg", sample_image_bytes, "image/jpeg")}, data={
        "client_report_id": canonical_id,
        "latitude": lat,
        "longitude": lng,
        "citizen_name": "Reporter Alpha",
    })
    assert r1.status_code == 200

    # Submit child duplicate
    r2 = client.post("/api/reports/sync", files={"image": ("c2.jpg", sample_image_bytes, "image/jpeg")}, data={
        "client_report_id": child_id,
        "latitude": lat + 0.00003,
        "longitude": lng + 0.00003,
        "citizen_name": "Reporter Beta",
    })
    assert r2.status_code == 200
    r2_data = r2.json()
    assert r2_data["is_duplicate"] is True
    target_cluster_id = r2_data["canonical_issue_id"]

    # Verify cluster endpoint returns canonical with linked duplicates preserved
    cluster_resp = client.get(f"/api/reports/{target_cluster_id}/duplicate-cluster")
    assert cluster_resp.status_code == 200, cluster_resp.text
    c_data = cluster_resp.json()
    assert c_data["total_linked_submissions"] >= 1
    child_reps = [r["client_report_id"] for r in c_data["duplicate_submissions"]]
    assert child_id in child_reps


# ----------------------------------------------------------------------
# 10. Department Assignment
# ----------------------------------------------------------------------
def test_10_department_assignment(sample_image_bytes):
    run_id = uuid.uuid4().hex[:6]
    rep_id = f"audit-dept-{run_id}"
    client.post("/api/reports/sync", files={"image": ("d.jpg", sample_image_bytes, "image/jpeg")}, data={
        "client_report_id": rep_id,
        "latitude": 37.7000,
        "longitude": -122.4000,
    })

    assign_resp = client.post(
        f"/api/reports/{rep_id}/progress-stage",
        json={
            "stage": "Assigned to department",
            "department": "Rapid Patch Division",
            "crew": "Unit 4",
            "actor_name": "Chief Engineer Sarah Lin",
            "actor_role": "Administrator",
            "notes": "Assigned high-priority dispatch to Rapid Patch Division."
        }
    )
    assert assign_resp.status_code == 200, assign_resp.text
    data = assign_resp.json()
    assert data["current_stage"] == "Assigned to department"
    assert data["assigned_department"] == "Rapid Patch Division"
    assert data["assigned_crew"] == "Unit 4"


# ----------------------------------------------------------------------
# 11. Repair Progress Updates & Scheduling
# ----------------------------------------------------------------------
def test_11_repair_progress_updates_and_scheduling(sample_image_bytes):
    run_id = uuid.uuid4().hex[:6]
    rep_id = f"audit-sched-{run_id}"
    client.post("/api/reports/sync", files={"image": ("s.jpg", sample_image_bytes, "image/jpeg")}, data={
        "client_report_id": rep_id,
        "latitude": 37.7010,
        "longitude": -122.4010,
    })

    sched_resp = client.post(
        f"/api/reports/{rep_id}/progress-stage",
        json={
            "stage": "Scheduled",
            "expected_completion_date": "2026-11-20",
            "actor_name": "Dave Miller",
            "actor_role": "Department Crew",
            "notes": "Target completion scheduled for Nov 20."
        }
    )
    assert sched_resp.status_code == 200, sched_resp.text
    data = sched_resp.json()
    assert data["current_stage"] == "Scheduled"
    assert data["expected_completion_date"] == "2026-11-20"


# ----------------------------------------------------------------------
# 12. Before, During and After Repair Photographs
# ----------------------------------------------------------------------
def test_12_before_during_after_photographs(sample_image_bytes):
    run_id = uuid.uuid4().hex[:6]
    rep_id = f"audit-photo-{run_id}"
    client.post("/api/reports/sync", files={"image": ("init.jpg", sample_image_bytes, "image/jpeg")}, data={
        "client_report_id": rep_id,
        "latitude": 37.7020,
        "longitude": -122.4020,
    })

    # Upload During photo
    during_resp = client.post(
        f"/api/reports/{rep_id}/repair-photo",
        files={"photo": ("during.jpg", sample_image_bytes, "image/jpeg")},
        data={"stage": "during", "caption": "Milling distress cavity", "actor_name": "Dave Miller"}
    )
    assert during_resp.status_code == 200, during_resp.text
    during_json = during_resp.json()
    assert during_json["stage"] == "during"
    assert during_json["photo_url"].startswith("/outputs/")

    # Upload After photo
    after_resp = client.post(
        f"/api/reports/{rep_id}/repair-photo",
        files={"photo": ("after.jpg", sample_image_bytes, "image/jpeg")},
        data={"stage": "after", "caption": "Compacted hot-mix asphalt", "actor_name": "Dave Miller"}
    )
    assert after_resp.status_code == 200, after_resp.text
    after_json = after_resp.json()
    assert after_json["stage"] == "after"

    # Verify progress state has both photos
    prog = client.get(f"/api/reports/{rep_id}/progress").json()
    assert len(prog["before_images"]) >= 1
    assert len(prog["during_images"]) >= 1
    assert len(prog["after_images"]) >= 1


# ----------------------------------------------------------------------
# 13. Citizen Status Tracking & Timeline
# ----------------------------------------------------------------------
def test_13_citizen_status_tracking_and_timeline(sample_image_bytes):
    run_id = uuid.uuid4().hex[:6]
    rep_id = f"audit-citizen-track-{run_id}"
    client.post("/api/reports/sync", files={"image": ("ct.jpg", sample_image_bytes, "image/jpeg")}, data={
        "client_report_id": rep_id,
        "latitude": 37.7030,
        "longitude": -122.4030,
        "citizen_name": "Citizen Alex",
    })

    # Advance stage to Repair in progress
    client.post(
        f"/api/reports/{rep_id}/progress-stage",
        json={"stage": "Repair in progress", "actor_name": "Dave Miller", "actor_role": "Department Crew"}
    )

    # Citizen inspects progress
    prog = client.get(f"/api/reports/{rep_id}/progress").json()
    assert prog["current_stage"] == "Repair in progress"
    assert prog["status"] == "In Progress"
    assert len(prog["repair_progress_history"]) >= 2  # Reported + Repair in progress
    stages_in_history = [h["stage"] for h in prog["repair_progress_history"]]
    assert "Reported" in stages_in_history
    assert "Repair in progress" in stages_in_history


# ----------------------------------------------------------------------
# 14. Final Repair Verification & Reopen Workflow
# ----------------------------------------------------------------------
def test_14_final_repair_verification_and_reopen_workflow(sample_image_bytes):
    run_id = uuid.uuid4().hex[:6]
    rep_id = f"audit-qa-reopen-{run_id}"
    client.post("/api/reports/sync", files={"image": ("qa.jpg", sample_image_bytes, "image/jpeg")}, data={
        "client_report_id": rep_id,
        "latitude": 37.7040,
        "longitude": -122.4040,
    })

    # Advance to Final verification
    client.post(f"/api/reports/{rep_id}/progress-stage", json={
        "stage": "Final verification",
        "actor_name": "Karen Davis",
        "actor_role": "QA Inspector"
    })

    # Incomplete repair -> Reopen
    reopen_resp = client.post(f"/api/reports/{rep_id}/progress-stage", json={
        "stage": "Reopened",
        "actor_name": "Karen Davis",
        "actor_role": "QA Inspector",
        "reopen_reason": "Edges unsealed; surface raveling observed."
    })
    assert reopen_resp.status_code == 200
    ro_data = reopen_resp.json()
    assert ro_data["current_stage"] == "Reopened"
    assert ro_data["reopened_count"] == 1
    assert "raveling" in ro_data["reopened_reason"]

    # Final sign-off & Close
    close_resp = client.post(f"/api/reports/{rep_id}/progress-stage", json={
        "stage": "Closed",
        "actor_name": "Chief Engineer Sarah Lin",
        "actor_role": "Administrator",
        "notes": "Rework verified and signed off."
    })
    assert close_resp.status_code == 200
    cl_data = close_resp.json()
    assert cl_data["current_stage"] == "Closed"
    assert cl_data["status"] == "Resolved"


# ----------------------------------------------------------------------
# 15. Role Permissions & Actor Auditing
# ----------------------------------------------------------------------
def test_15_role_permissions_and_actor_auditing(sample_image_bytes):
    run_id = uuid.uuid4().hex[:6]
    rep_id = f"audit-roles-{run_id}"
    client.post("/api/reports/sync", files={"image": ("roles.jpg", sample_image_bytes, "image/jpeg")}, data={
        "client_report_id": rep_id,
        "latitude": 37.7050,
        "longitude": -122.4050,
    })

    # Check actor audit recording
    stage_resp = client.post(
        f"/api/reports/{rep_id}/progress-stage",
        json={
            "stage": "Admin verified",
            "actor_name": "Chief Engineer Sarah Lin",
            "actor_role": "Administrator",
            "notes": "Verified severity: Critical."
        }
    )
    assert stage_resp.status_code == 200
    hist = stage_resp.json()["repair_progress_history"]
    last_entry = hist[-1]
    assert last_entry["actor_name"] == "Chief Engineer Sarah Lin"
    assert last_entry["actor_role"] == "Administrator"
    assert last_entry["stage"] == "Admin verified"
