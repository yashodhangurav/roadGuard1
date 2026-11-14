import os
import cv2
import numpy as np
import pytest
from app.services.orb_service import orb_service

SAMPLE_PATH = os.path.join(os.path.dirname(__file__), "sample_road.jpg")


def test_orb_feature_extraction():
    """ORB must extract keypoints and 32-byte binary descriptors from a road photograph."""
    assert os.path.exists(SAMPLE_PATH), "sample_road.jpg must exist"
    with open(SAMPLE_PATH, "rb") as f:
        img_bytes = f.read()

    kps, des, status = orb_service.extract_features(img_bytes)

    assert status["status"] == "OK"
    assert len(kps) >= 200, f"Expected >= 200 keypoints, got {len(kps)}"
    assert des is not None
    assert des.dtype == np.uint8
    assert des.shape == (len(kps), 32)  # ORB 256-bit / 32-byte descriptor


def test_orb_viewpoint_and_perspective_change_matching():
    """ORB + BFMatcher + Lowe's ratio + RANSAC must match the same pothole taken from different angles."""
    img = cv2.imread(SAMPLE_PATH)
    assert img is not None

    h, w = img.shape[:2]
    # Perspective matrix simulating a different camera viewpoint angle (skew + rotation)
    pts1 = np.float32([[0, 0], [w, 0], [0, h], [w, h]])
    pts2 = np.float32([[w * 0.08, h * 0.05], [w * 0.92, h * 0.02], [w * 0.02, h * 0.95], [w * 0.98, h * 0.90]])
    M_proj = cv2.getPerspectiveTransform(pts1, pts2)
    warped = cv2.warpPerspective(img, M_proj, (w, h))

    # Add slight rotation (10 degrees)
    M_rot = cv2.getRotationMatrix2D((w / 2, h / 2), 10, 0.95)
    warped = cv2.warpAffine(warped, M_rot, (w, h))

    _, orig_bytes = cv2.imencode(".jpg", img)
    _, warp_bytes = cv2.imencode(".jpg", warped)

    kps1, des1, _ = orb_service.extract_features(orig_bytes.tobytes())
    kps2, des2, _ = orb_service.extract_features(warp_bytes.tobytes())

    metrics = orb_service.match_features(kps1, des1, kps2, des2)

    assert metrics["status"] == "OK"
    assert metrics["has_homography"] is True, "RANSAC must find valid homography between perspective shifts"
    assert metrics["ransac_inliers_count"] >= 20, f"Expected >= 20 inliers, got {metrics['ransac_inliers_count']}"
    assert metrics["inlier_ratio"] >= 0.25, f"Expected inlier ratio >= 0.25, got {metrics['inlier_ratio']}"
    assert metrics["match_verdict"] in ("CONFIRMED_VIEWPOINT_DUPLICATE", "PROBABLE_VIEWPOINT_DUPLICATE")


def test_orb_distinct_images_do_not_match():
    """Completely different road distress images must produce few matches and fail geometric RANSAC verification."""
    with open(SAMPLE_PATH, "rb") as f:
        road_bytes = f.read()

    # Create synthetic distinct texture (perpendicular grid cracks)
    distinct_img = np.zeros((400, 400, 3), dtype=np.uint8)
    distinct_img[:] = (80, 80, 80)
    for x in range(30, 370, 30):
        cv2.line(distinct_img, (x, 20), (x + 10, 380), (200, 200, 200), 2)
    for y in range(40, 360, 40):
        cv2.line(distinct_img, (20, y), (380, y - 5), (20, 20, 20), 3)

    _, distinct_bytes = cv2.imencode(".jpg", distinct_img)

    kps1, des1, _ = orb_service.extract_features(road_bytes)
    kps2, des2, _ = orb_service.extract_features(distinct_bytes.tobytes())

    metrics = orb_service.match_features(kps1, des1, kps2, des2)

    assert metrics["status"] == "OK"
    assert metrics["has_homography"] is False or metrics["ransac_inliers_count"] < 10
    assert metrics["match_verdict"] == "DISTINCT_FEATURES"
    assert metrics["similarity_score"] < 40.0


def test_orb_insufficient_features_handling():
    """Smooth or textureless images must be handled gracefully without exceptions."""
    blank_img = np.full((300, 300, 3), 128, dtype=np.uint8)
    _, blank_bytes = cv2.imencode(".jpg", blank_img)

    kps, des, status = orb_service.extract_features(blank_bytes.tobytes())

    assert len(kps) == 0
    assert des is None
    assert status["status"] == "INSUFFICIENT_FEATURES"

    # Matching with empty descriptors must return INSUFFICIENT_FEATURES verdict safely
    dummy_des = np.zeros((50, 32), dtype=np.uint8)
    metrics = orb_service.match_features([], None, [], dummy_des)

    assert metrics["status"] == "INSUFFICIENT_FEATURES"
    assert metrics["match_verdict"] == "INSUFFICIENT_FEATURES"
    assert metrics["has_homography"] is False
    assert metrics["ransac_inliers_count"] == 0


def test_orb_feature_caching_and_persistence():
    """ORB keypoints and descriptors must correctly persist to .npz cache and restore identically."""
    with open(SAMPLE_PATH, "rb") as f:
        img_bytes = f.read()

    kps, des, _ = orb_service.extract_features(img_bytes)
    assert des is not None

    test_image_id = "test_persistence_report_01"
    save_path = orb_service.save_features_cache(test_image_id, kps, des)
    assert save_path is not None
    assert os.path.exists(save_path)

    # Restore from cache
    loaded_kps, loaded_des = orb_service.load_features_cache(test_image_id)
    assert loaded_kps is not None
    assert loaded_des is not None
    assert len(loaded_kps) == len(kps)
    assert np.array_equal(loaded_des, des)
