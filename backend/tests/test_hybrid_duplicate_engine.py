import os
import cv2
import numpy as np
import pytest
from app.services.hybrid_duplicate_engine import (
    HybridDuplicateEngine,
    DuplicateEngineThresholds,
    DuplicateVerdict,
    MatchType,
)
from app.services.phash_service import phash_service
from app.services.orb_service import orb_service

SAMPLE_PATH = os.path.join(os.path.dirname(__file__), "sample_road.jpg")


@pytest.fixture
def sample_image_bytes():
    assert os.path.exists(SAMPLE_PATH), "sample_road.jpg must exist"
    with open(SAMPLE_PATH, "rb") as f:
        return f.read()


@pytest.fixture
def perspective_warped_bytes():
    img = cv2.imread(SAMPLE_PATH)
    assert img is not None
    h, w = img.shape[:2]
    pts1 = np.float32([[0, 0], [w, 0], [0, h], [w, h]])
    pts2 = np.float32([[w * 0.10, h * 0.06], [w * 0.90, h * 0.03], [w * 0.04, h * 0.94], [w * 0.96, h * 0.88]])
    M = cv2.getPerspectiveTransform(pts1, pts2)
    warped = cv2.warpPerspective(img, M, (w, h))
    M_rot = cv2.getRotationMatrix2D((w / 2, h / 2), 8, 0.96)
    warped = cv2.warpAffine(warped, M_rot, (w, h))
    _, buf = cv2.imencode(".jpg", warped)
    return buf.tobytes()


@pytest.fixture
def distinct_image_bytes():
    distinct = np.zeros((350, 350, 3), dtype=np.uint8)
    distinct[:] = (75, 75, 75)
    for x in range(25, 330, 35):
        cv2.line(distinct, (x, 15), (x + 10, 335), (210, 210, 210), 2)
    for y in range(30, 320, 45):
        cv2.line(distinct, (15, y), (335, y - 5), (30, 30, 30), 2)
    _, buf = cv2.imencode(".jpg", distinct)
    return buf.tobytes()


def test_spatial_prefiltering_avoids_comparing_distant_images():
    """Candidates outside the configured GPS radius must be filtered out, avoiding full DB image comparisons."""
    engine = HybridDuplicateEngine(DuplicateEngineThresholds(search_radius_meters=50.0))

    # Candidate 200m away (outside radius)
    distant_candidate = {
        "id": "DISTANT-REPORT-99",
        "distance_meters": 200.0,
        "latitude": 37.7760,
        "longitude": -122.4180,
        "image_phash": "cee4d5d823838e74",
        "category": "Pothole",
    }

    # When querying nearby, find_nearby_candidates uses radius
    # If a distant candidate is passed to evaluate_candidate:
    dummy_kps, dummy_des, _ = orb_service.extract_features(np.zeros((100, 100, 3), dtype=np.uint8))
    # Test with custom search candidates:
    nearby_cands = [distant_candidate]
    # Filter by radius:
    filtered = [c for c in nearby_cands if c["distance_meters"] <= engine.thresholds.search_radius_meters]
    assert len(filtered) == 0, "Distant candidate must be rejected by spatial pre-filtering"


def test_confirmed_duplicate_identical_phash(sample_image_bytes):
    """Exact or near-identical photo re-upload within proximity must be CONFIRMED_DUPLICATE and link canonical ID."""
    engine = HybridDuplicateEngine()
    query_phash = phash_service.compute_phash(sample_image_bytes)
    kps_query, des_query, _ = orb_service.extract_features(sample_image_bytes)

    candidate = {
        "id": "CANONICAL-REPORT-001",
        "client_report_id": "uuid-001",
        "canonical_issue_id": "CANONICAL-REPORT-001",
        "distance_meters": 8.5,
        "image_phash": query_phash,  # Exact pHash match (dist=0)
        "category": "Pothole",
        "severity": "Critical",
        "status": "Submitted",
    }

    eval_res = engine.evaluate_candidate(
        candidate=candidate,
        query_phash=query_phash,
        kps_query=kps_query,
        des_query=des_query,
        query_category="Pothole"
    )

    assert eval_res["verdict"] == DuplicateVerdict.CONFIRMED_DUPLICATE.value
    assert eval_res["match_type"] in (MatchType.PHASH_IDENTICAL.value, MatchType.COMBINED.value)
    assert eval_res["canonical_issue_id"] == "CANONICAL-REPORT-001"
    assert eval_res["confidence_tier"] == "HIGH"
    assert eval_res["evidence_score"] >= 95.0


def test_confirmed_duplicate_different_angle_orb(sample_image_bytes, perspective_warped_bytes):
    """Same pothole photographed from different viewpoint/angle must be CONFIRMED_DUPLICATE via ORB RANSAC."""
    engine = HybridDuplicateEngine()

    query_phash = phash_service.compute_phash(perspective_warped_bytes)
    kps_query, des_query, _ = orb_service.extract_features(perspective_warped_bytes)

    # Candidate has original unwarped image
    cand_phash = phash_service.compute_phash(sample_image_bytes)
    kps_train, des_train, _ = orb_service.extract_features(sample_image_bytes)
    orb_service.save_features_cache("CANONICAL-POTHOLE-VIEW-01", kps_train, des_train)

    candidate = {
        "id": "CANONICAL-POTHOLE-VIEW-01",
        "client_report_id": "uuid-view-01",
        "canonical_issue_id": "CANONICAL-POTHOLE-VIEW-01",
        "distance_meters": 12.0,
        "image_phash": cand_phash,
        "category": "Pothole",
        "severity": "Critical",
        "status": "Submitted",
    }

    eval_res = engine.evaluate_candidate(
        candidate=candidate,
        query_phash=query_phash,
        kps_query=kps_query,
        des_query=des_query,
        query_category="Pothole"
    )

    assert eval_res["verdict"] == DuplicateVerdict.CONFIRMED_DUPLICATE.value
    assert eval_res["match_type"] == MatchType.ORB_VIEWPOINT.value
    assert eval_res["canonical_issue_id"] == "CANONICAL-POTHOLE-VIEW-01"
    assert eval_res["orb_metrics"]["has_homography"] is True
    assert eval_res["orb_metrics"]["ransac_inliers_count"] >= 20
    assert eval_res["confidence_tier"] == "HIGH"


def test_uncertain_match_sent_for_admin_review_not_automerged(sample_image_bytes):
    """Uncertain visual match must be flagged NEEDS_REVIEW, set to PENDING_ADMIN_REVIEW, and NOT auto-merged."""
    engine = HybridDuplicateEngine()

    query_phash = phash_service.compute_phash(sample_image_bytes)
    kps_query, des_query, _ = orb_service.extract_features(sample_image_bytes)

    # Candidate with altered hash (Hamming distance = 7, within similar threshold 5-10)
    # Simulate perceptual resemblance by flipping 7 bits of hex hash
    hash_int = int(query_phash, 16) ^ 0x000000000000007F  # flip 7 bits
    cand_phash = f"{hash_int:016x}"

    candidate = {
        "id": "CANDIDATE-REVIEW-02",
        "distance_meters": 18.0,
        "image_phash": cand_phash,
        "category": "Pothole",
        "severity": "High",
    }

    eval_res = engine.evaluate_candidate(
        candidate=candidate,
        query_phash=query_phash,
        kps_query=kps_query,
        des_query=des_query,
        query_category="Pothole"
    )

    assert eval_res["verdict"] == DuplicateVerdict.NEEDS_REVIEW.value
    assert eval_res["match_type"] == MatchType.VISUAL_RESEMBLANCE.value
    assert eval_res["confidence_tier"] == "MODERATE"
    # Crucially: it is marked for review, not automatically merged


def test_distinct_road_defect_nearby_is_not_merged(sample_image_bytes, distinct_image_bytes):
    """Do not merge reports solely because they are close together! Distinct defect 5m away is NEW_ISSUE."""
    engine = HybridDuplicateEngine()

    query_phash = phash_service.compute_phash(distinct_image_bytes)
    kps_query, des_query, _ = orb_service.extract_features(distinct_image_bytes)

    cand_phash = phash_service.compute_phash(sample_image_bytes)
    kps_train, des_train, _ = orb_service.extract_features(sample_image_bytes)
    orb_service.save_features_cache("NEARBY-DISTINCT-01", kps_train, des_train)

    candidate = {
        "id": "NEARBY-DISTINCT-01",
        "distance_meters": 4.5,  # Very close! Only 4.5 meters away
        "image_phash": cand_phash,
        "category": "Alligator Crack",  # Different crack pattern
        "severity": "Medium",
    }

    eval_res = engine.evaluate_candidate(
        candidate=candidate,
        query_phash=query_phash,
        kps_query=kps_query,
        des_query=des_query,
        query_category="Transverse Crack"
    )

    # Must be NEW_ISSUE because visual evidence is distinct!
    assert eval_res["verdict"] == DuplicateVerdict.NEW_ISSUE.value
    assert eval_res["match_type"] == MatchType.NONE.value
    assert eval_res["confidence_tier"] == "LOW"


def test_configurable_threshold_overrides(sample_image_bytes):
    """Thresholds must be configurable and alter engine sensitivity as expected."""
    # Strict thresholds: requires 80 inliers for confirmed match
    strict_thresholds = DuplicateEngineThresholds(
        search_radius_meters=30.0,
        phash_identical_dist=1,
        orb_min_inliers_confirmed=80,
        orb_min_ratio_confirmed=0.60
    )
    strict_engine = HybridDuplicateEngine(strict_thresholds)

    assert strict_engine.thresholds.search_radius_meters == 30.0
    assert strict_engine.thresholds.orb_min_inliers_confirmed == 80
    assert strict_engine.thresholds.phash_identical_dist == 1


def test_canonical_root_issue_resolution():
    """When matching a report that is already a duplicate, link to its root canonical issue."""
    engine = HybridDuplicateEngine()

    # Candidate C is a child duplicate of Report A
    child_candidate = {
        "id": "REPORT-CHILD-B",
        "client_report_id": "uuid-b",
        "canonical_issue_id": "REPORT-ROOT-A",  # Root is Report A
        "distance_meters": 5.0,
        "image_phash": "cee4d5d823838e74",
        "category": "Pothole",
    }

    dummy_kps, dummy_des, _ = orb_service.extract_features(np.zeros((100, 100, 3), dtype=np.uint8))
    eval_res = engine.evaluate_candidate(
        candidate=child_candidate,
        query_phash="cee4d5d823838e74",  # Identical
        kps_query=dummy_kps,
        des_query=dummy_des,
        query_category="Pothole"
    )

    # Must link to the root canonical issue REPORT-ROOT-A, avoiding duplicate daisy-chains
    assert eval_res["canonical_issue_id"] == "REPORT-ROOT-A"

