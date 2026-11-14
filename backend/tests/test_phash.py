import os
import cv2
import numpy as np
import pytest
from app.services.phash_service import phash_service

def test_identical_image_hash():
    """Identical images must yield exactly identical 64-bit pHash and 0 Hamming distance."""
    # Synthetic pothole circular crater
    img = np.zeros((300, 300), dtype=np.uint8)
    cv2.circle(img, (150, 150), 70, 180, -1)
    cv2.circle(img, (150, 150), 40, 80, -1)
    _, buf = cv2.imencode(".jpg", img)
    raw_bytes = buf.tobytes()

    h1 = phash_service.compute_phash(raw_bytes)
    h2 = phash_service.compute_phash(raw_bytes)

    assert h1 is not None
    assert len(h1) == 16  # 16 hex chars = 64 bits
    assert h1 == h2

    dist = phash_service.calculate_hamming_distance(h1, h2)
    sim = phash_service.calculate_similarity(dist)
    match_level, is_dup = phash_service.classify_match(dist)

    assert dist == 0
    assert sim == 100.0
    assert match_level == "IDENTICAL"
    assert is_dup is True

def test_resized_and_compressed_image_robustness():
    """pHash must remain near-identical under aggressive downscaling and heavy JPEG compression."""
    # Load sample road image
    sample_path = os.path.join(os.path.dirname(__file__), "sample_road.jpg")
    orig_img = cv2.imread(sample_path)
    assert orig_img is not None, "sample_road.jpg must exist"

    h_orig = phash_service.compute_phash(sample_path)
    assert h_orig is not None

    # 1. Resize to 35% of original dimensions
    h, w = orig_img.shape[:2]
    scaled = cv2.resize(orig_img, (int(w * 0.35), int(h * 0.35)), interpolation=cv2.INTER_AREA)

    # 2. Compress with aggressive 30% JPEG quality
    _, compressed_buf = cv2.imencode(".jpg", scaled, [cv2.IMWRITE_JPEG_QUALITY, 30])
    h_compressed = phash_service.compute_phash(compressed_buf.tobytes())
    assert h_compressed is not None

    dist = phash_service.calculate_hamming_distance(h_orig, h_compressed)
    sim = phash_service.calculate_similarity(dist)
    match_level, is_dup = phash_service.classify_match(dist)

    print(f"Resized+Compressed: distance={dist}/64, similarity={sim}%, level={match_level}")
    # Under 35% downscaling and 30% compression, Hamming distance should remain <= 5
    assert dist <= 5
    assert sim >= 92.0
    assert match_level in ("IDENTICAL", "NEAR_IDENTICAL")
    assert is_dup is True

def test_brightness_and_contrast_shift():
    """pHash must be resilient to exposure and lighting changes because DC term is excluded."""
    sample_path = os.path.join(os.path.dirname(__file__), "sample_road.jpg")
    orig_img = cv2.imread(sample_path)
    h_orig = phash_service.compute_phash(sample_path)

    # Brighten image significantly
    bright = cv2.convertScaleAbs(orig_img, alpha=1.3, beta=40)
    _, buf_bright = cv2.imencode(".jpg", bright)
    h_bright = phash_service.compute_phash(buf_bright.tobytes())

    dist = phash_service.calculate_hamming_distance(h_orig, h_bright)
    sim = phash_service.calculate_similarity(dist)
    match_level, is_dup = phash_service.classify_match(dist)

    print(f"Brightened: distance={dist}/64, similarity={sim}%, level={match_level}")
    assert dist <= 6
    assert sim >= 90.0
    assert is_dup is True

def test_distinct_images_yield_large_distance():
    """Completely different images must produce large Hamming distances (>18) and low similarity."""
    # Pattern A: Vertical stripes
    img_a = np.zeros((200, 200), dtype=np.uint8)
    img_a[:, ::20] = 255
    _, buf_a = cv2.imencode(".jpg", img_a)
    h_a = phash_service.compute_phash(buf_a.tobytes())

    # Pattern B: Concentric circles
    img_b = np.zeros((200, 200), dtype=np.uint8)
    for r in range(10, 90, 15):
        cv2.circle(img_b, (100, 100), r, 255, 2)
    _, buf_b = cv2.imencode(".jpg", img_b)
    h_b = phash_service.compute_phash(buf_b.tobytes())

    dist = phash_service.calculate_hamming_distance(h_a, h_b)
    sim = phash_service.calculate_similarity(dist)
    match_level, is_dup = phash_service.classify_match(dist)

    print(f"Distinct images: distance={dist}/64, similarity={sim}%, level={match_level}")
    assert dist > 18
    assert sim < 72.0
    assert match_level == "DISTINCT"
    assert is_dup is False

def test_evaluate_duplicate_candidates():
    """Verify duplicate candidate evaluation on a list of nearby reports."""
    sample_path = os.path.join(os.path.dirname(__file__), "sample_road.jpg")
    orig_img = cv2.imread(sample_path)
    h_orig = phash_service.compute_phash(sample_path)

    # Near duplicate
    small = cv2.resize(orig_img, (200, 200))
    _, buf = cv2.imencode(".jpg", small, [cv2.IMWRITE_JPEG_QUALITY, 50])
    h_near = phash_service.compute_phash(buf.tobytes())

    # Distinct hash
    h_distinct = "0000000000000000" if h_orig != "0000000000000000" else "ffffffffffffffff"

    candidate_reports = [
        {
            "id": "REP-NEAR-01",
            "client_report_id": "uuid-near-01",
            "image_phash": h_near,
            "category": "Pothole",
            "severity": "High",
            "distance_meters": 4.5,
            "address": "Market St & 8th St"
        },
        {
            "id": "REP-DISTINCT-02",
            "client_report_id": "uuid-distinct-02",
            "image_phash": h_distinct,
            "category": "Alligator Crack",
            "severity": "Low",
            "distance_meters": 12.0,
            "address": "Market St & 9th St"
        }
    ]

    duplicates = phash_service.evaluate_duplicate_candidates(
        query_hash=h_orig,
        candidate_reports=candidate_reports,
        max_distance=12
    )

    assert len(duplicates) == 1
    assert duplicates[0]["report_id"] == "REP-NEAR-01"
    assert duplicates[0]["is_candidate_duplicate"] is True
    assert duplicates[0]["similarity_score"] >= 90.0

