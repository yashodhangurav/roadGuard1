import os
import uuid
from fastapi.testclient import TestClient
import pytest
from main import app

client = TestClient(app)
SAMPLE_PATH = os.path.join(os.path.dirname(__file__), "sample_road.jpg")


def test_full_road_damage_progress_monitoring_lifecycle():
    """
    Test the full 8-stage road damage progress monitoring and repair lifecycle:
    1. Reported (Citizen report synced)
    2. Admin verified (Admin verification)
    3. Assigned to department (Municipal Dispatch)
    4. Scheduled (Expected completion date recorded)
    5. Repair in progress (Crew active on site, during-repair photo uploaded)
    6. Repair completed (After-repair photo uploaded, crew sign-off)
    7. Final verification (Admin QA inspection)
    8. Reopened when repair is incomplete (Deficiency note recorded, returned to queue)
    9. Rework completed and issue Closed
    10. Linked duplicate citizen submissions preservation & synchronized timeline
    """
    assert os.path.exists(SAMPLE_PATH), "sample_road.jpg must exist for test"
    with open(SAMPLE_PATH, "rb") as f:
        img_bytes = f.read()

    run_id = uuid.uuid4().hex[:6]
    canonical_id = f"test-progress-can-{run_id}"
    child_dup_id = f"test-progress-child-{run_id}"

    # Use unique GPS coordinate per test run to isolate from prior test runs
    offset = (int(run_id, 16) % 1000) * 0.001
    test_lat = round(37.6000 + offset, 5)
    test_lng = round(-122.3000 - offset, 5)

    # -------------------------------------------------------------
    # 1. STAGE 1: REPORTED (Citizen submits canonical issue)
    # -------------------------------------------------------------
    files_a = {"image": ("canonical_distress.jpg", img_bytes, "image/jpeg")}
    data_a = {
        "client_report_id": canonical_id,
        "latitude": test_lat,
        "longitude": test_lng,
        "category": "Pothole",
        "severity": "Critical",
        "description": "Deep tire-damaging pothole on crosswalk.",
        "citizen_name": "Citizen Elena",
    }
    resp_a = client.post("/api/reports/sync", files=files_a, data=data_a)
    assert resp_a.status_code == 200, resp_a.text
    res_a_json = resp_a.json()

    # Verify initial stage is 'Reported'
    prog_initial = client.get(f"/api/reports/{canonical_id}/progress")
    assert prog_initial.status_code == 200, prog_initial.text
    prog_data = prog_initial.json()
    assert prog_data["current_stage"] == "Reported"
    assert len(prog_data["before_images"]) >= 1
    assert len(prog_data["during_images"]) == 0
    assert len(prog_data["after_images"]) == 0
    assert len(prog_data["repair_progress_history"]) >= 1

    # Also submit second citizen report nearby (within 3 meters) as linked duplicate
    files_b = {"image": ("child_distress.jpg", img_bytes, "image/jpeg")}
    data_b = {
        "client_report_id": child_dup_id,
        "latitude": round(test_lat + 0.00002, 5),
        "longitude": round(test_lng + 0.00001, 5),
        "category": "Pothole",
        "severity": "Critical",
        "description": "Second citizen report of same cavity.",
        "citizen_name": "Citizen Marcus",
    }
    resp_b = client.post("/api/reports/sync", files=files_b, data=data_b)
    assert resp_b.status_code == 200
    matched_canonical = resp_b.json()["canonical_issue_id"]
    assert matched_canonical in (canonical_id, res_a_json["report_id"])

    # -------------------------------------------------------------
    # 2. STAGE 2: ADMIN VERIFIED
    # -------------------------------------------------------------
    verify_payload = {
        "stage": "Admin verified",
        "actor_name": "Chief Engineer Sarah Lin",
        "actor_role": "Administrator",
        "department": "Department of Public Works",
        "notes": "Field telemetry verified. ASTM D6433 High-severity Pothole confirmed.",
    }
    resp_verify = client.post(f"/api/reports/{canonical_id}/progress-stage", json=verify_payload)
    assert resp_verify.status_code == 200, resp_verify.text
    data_v = resp_verify.json()
    assert data_v["current_stage"] == "Admin verified"
    assert data_v["status"] == "Under Review"

    # -------------------------------------------------------------
    # 3. STAGE 3: ASSIGNED TO DEPARTMENT
    # -------------------------------------------------------------
    assign_payload = {
        "stage": "Assigned to department",
        "actor_name": "Sarah Lin",
        "actor_role": "Administrator",
        "department": "Rapid Patch Division",
        "crew": "Rapid Patch Unit #4",
        "notes": "Work order #WO-8910 assigned to Rapid Patch Unit #4.",
    }
    resp_assign = client.post(f"/api/reports/{canonical_id}/progress-stage", json=assign_payload)
    assert resp_assign.status_code == 200
    data_as = resp_assign.json()
    assert data_as["current_stage"] == "Assigned to department"
    assert data_as["assigned_department"] == "Rapid Patch Division"
    assert data_as["assigned_crew"] == "Rapid Patch Unit #4"

    # -------------------------------------------------------------
    # 4. STAGE 4: SCHEDULED (Record expected completion date)
    # -------------------------------------------------------------
    target_date = "2026-11-18"
    schedule_payload = {
        "stage": "Scheduled",
        "actor_name": "Dave Miller",
        "actor_role": "Department Crew Supervisor",
        "department": "Rapid Patch Division",
        "crew": "Rapid Patch Unit #4",
        "expected_completion_date": target_date,
        "notes": "Field repair scheduled for night shift milling and hot-mix laydown.",
    }
    resp_sched = client.post(f"/api/reports/{canonical_id}/progress-stage", json=schedule_payload)
    assert resp_sched.status_code == 200
    data_sc = resp_sched.json()
    assert data_sc["current_stage"] == "Scheduled"
    assert data_sc["expected_completion_date"] == target_date

    # -------------------------------------------------------------
    # 5. STAGE 5: REPAIR IN PROGRESS & DURING PHOTOGRAPH
    # -------------------------------------------------------------
    progress_payload = {
        "stage": "Repair in progress",
        "actor_name": "Dave Miller",
        "actor_role": "Department Crew Supervisor",
        "department": "Rapid Patch Division",
        "crew": "Rapid Patch Unit #4",
        "notes": "Crews arrived on site. Traffic cones placed, pavement cavity cleaned.",
    }
    resp_prog = client.post(f"/api/reports/{canonical_id}/progress-stage", json=progress_payload)
    assert resp_prog.status_code == 200
    assert resp_prog.json()["current_stage"] == "Repair in progress"

    # Authorised department user uploads "DURING" photograph
    during_photo_files = {"photo": ("during_prep.jpg", img_bytes, "image/jpeg")}
    during_photo_data = {
        "stage": "during",
        "caption": "Pothole cavity milled 80mm deep with asphalt tack coat applied.",
        "actor_name": "Dave Miller",
        "actor_role": "Department Crew Supervisor",
        "department": "Rapid Patch Division",
    }
    resp_during_photo = client.post(
        f"/api/reports/{canonical_id}/repair-photo",
        files=during_photo_files,
        data=during_photo_data
    )
    assert resp_during_photo.status_code == 200
    assert resp_during_photo.json()["stage"] == "during"

    # -------------------------------------------------------------
    # 6. STAGE 6: REPAIR COMPLETED & AFTER PHOTOGRAPH
    # -------------------------------------------------------------
    # Authorised department user uploads "AFTER" photograph
    after_photo_files = {"photo": ("after_patch.jpg", img_bytes, "image/jpeg")}
    after_photo_data = {
        "stage": "after",
        "caption": "Permanent hot-mix patch laid, vibratory roll compacted, and edges rubberized sealed.",
        "actor_name": "Dave Miller",
        "actor_role": "Department Crew Supervisor",
        "department": "Rapid Patch Division",
    }
    resp_after_photo = client.post(
        f"/api/reports/{canonical_id}/repair-photo",
        files=after_photo_files,
        data=after_photo_data
    )
    assert resp_after_photo.status_code == 200
    assert resp_after_photo.json()["stage"] == "after"

    completed_payload = {
        "stage": "Repair completed",
        "actor_name": "Dave Miller",
        "actor_role": "Department Crew Supervisor",
        "department": "Rapid Patch Division",
        "notes": "1.2 tons of dense hot-mix asphalt compacted. Surface flush with roadway grade.",
    }
    resp_comp = client.post(f"/api/reports/{canonical_id}/progress-stage", json=completed_payload)
    assert resp_comp.status_code == 200
    assert resp_comp.json()["current_stage"] == "Repair completed"

    # Verify Before, During, and After images exist
    resp_check_photos = client.get(f"/api/reports/{canonical_id}/progress")
    assert resp_check_photos.status_code == 200
    photos_data = resp_check_photos.json()
    assert len(photos_data["before_images"]) >= 1, "Must contain 'before' image"
    assert len(photos_data["during_images"]) >= 1, "Must contain 'during' image"
    assert len(photos_data["after_images"]) >= 1, "Must contain 'after' image"

    # -------------------------------------------------------------
    # 7. STAGE 7: FINAL VERIFICATION
    # -------------------------------------------------------------
    qa_payload = {
        "stage": "Final verification",
        "actor_name": "Karen Davis",
        "actor_role": "QA Field Inspector",
        "department": "Department of Public Works",
        "notes": "On-site quality assessment: inspecting joint seal and rideability index.",
    }
    resp_qa = client.post(f"/api/reports/{canonical_id}/progress-stage", json=qa_payload)
    assert resp_qa.status_code == 200
    assert resp_qa.json()["current_stage"] == "Final verification"

    # -------------------------------------------------------------
    # 8. STAGE 8A: REOPENED (Admin detects incomplete repair)
    # -------------------------------------------------------------
    reopen_payload = {
        "stage": "Reopened",
        "actor_name": "Sarah Lin",
        "actor_role": "Administrator",
        "department": "Department of Public Works",
        "notes": "Edge bonding gap detected on southern lip of the patch. Secondary tack seal required.",
        "reopen_reason": "Edge bonding gap detected; risk of water ingress.",
    }
    resp_reopen = client.post(f"/api/reports/{canonical_id}/progress-stage", json=reopen_payload)
    assert resp_reopen.status_code == 200
    reopen_data = resp_reopen.json()
    assert reopen_data["current_stage"] == "Reopened"
    assert reopen_data["reopened_count"] >= 1
    assert "Edge bonding gap" in (reopen_data["reopened_reason"] or "")

    # -------------------------------------------------------------
    # 9. STAGE 8B: REWORK COMPLETED & CLOSED
    # -------------------------------------------------------------
    # Crew reseals edge
    crew_reseal_payload = {
        "stage": "Repair completed",
        "actor_name": "Dave Miller",
        "actor_role": "Department Crew Supervisor",
        "notes": "Liquid rubberized mastic edge seal applied over entire patch boundary.",
    }
    client.post(f"/api/reports/{canonical_id}/progress-stage", json=crew_reseal_payload)

    # Admin sign-off and closure
    close_payload = {
        "stage": "Closed",
        "actor_name": "Sarah Lin",
        "actor_role": "Administrator",
        "notes": "Quality sign-off completed. Pavement restored to ASTM D6433 Good standard. Work order closed.",
    }
    resp_close = client.post(f"/api/reports/{canonical_id}/progress-stage", json=close_payload)
    assert resp_close.status_code == 200
    final_data = resp_close.json()
    assert final_data["current_stage"] == "Closed"
    assert final_data["status"] == "Resolved"

    # -------------------------------------------------------------
    # 10. PRESERVATION OF LINKED CITIZEN REPORTS
    # -------------------------------------------------------------
    # Both canonical issue and child duplicate remain fully intact
    single_can = client.get(f"/api/reports/{canonical_id}")
    single_child = client.get(f"/api/reports/{child_dup_id}")
    assert single_can.status_code == 200
    assert single_child.status_code == 200
    assert single_child.json()["canonical_issue_id"] in (canonical_id, res_a_json["report_id"])
    # Citizen Marcus's submission remains independent and preserved
    assert single_child.json()["id"] == child_dup_id
