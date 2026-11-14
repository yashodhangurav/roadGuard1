"""
RoadGuard AI - OpenCV ORB Feature Extraction & Matching Service
Implements scale- and rotation-invariant feature detection (ORB) and geometric verification (RANSAC).
Detects duplicate pothole reports captured from different camera angles, distances, or viewpoints.
Uses BFMatcher with Hamming distance and Lowe's ratio test.
No external pretrained AI model downloads or third-party repositories required.
"""

import os
import io
import cv2
import numpy as np
from typing import Optional, Union, Dict, Any, List, Tuple
from pathlib import Path
from PIL import Image
import logging

from app.core.config import settings

logger = logging.getLogger("roadguard.orb")

class ORBFeatureService:
    DEFAULT_N_FEATURES = 1000
    MIN_KEYPOINTS_REQUIRED = 8
    MIN_GOOD_MATCHES_FOR_RANSAC = 4
    DEFAULT_LOWE_RATIO = 0.75
    DEFAULT_RANSAC_THRESH = 5.0

    # Decision thresholds
    INLIERS_CONFIRMED = 20
    INLIERS_PROBABLE = 10
    INLIER_RATIO_CONFIRMED = 0.35
    INLIER_RATIO_PROBABLE = 0.22

    def __init__(self):
        # LRU in-memory cache for extracted descriptors: { cache_key: (kps, des) }
        self._memory_cache: Dict[str, Tuple[List[cv2.KeyPoint], np.ndarray]] = {}
        self._max_cache_size = 150
        # Initialize default ORB detector
        self._orb = cv2.ORB_create(
            nfeatures=self.DEFAULT_N_FEATURES,
            scaleFactor=1.2,
            nlevels=8,
            edgeThreshold=31,
            firstLevel=0,
            WTA_K=2,
            scoreType=cv2.ORB_HARRIS_SCORE,
            patchSize=31,
            fastThreshold=20
        )

    def extract_features(
        self,
        image_input: Union[bytes, str, Path, np.ndarray, Image.Image],
        max_features: Optional[int] = None
    ) -> Tuple[List[cv2.KeyPoint], Optional[np.ndarray], Dict[str, Any]]:
        """
        Extract ORB keypoints and descriptors from an image.
        Returns: (keypoints, descriptors, metadata)
        Handles images with insufficient features safely.
        """
        try:
            gray: Optional[np.ndarray] = None

            if isinstance(image_input, bytes):
                nparr = np.frombuffer(image_input, np.uint8)
                gray = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            elif isinstance(image_input, (str, Path)):
                path_str = str(image_input)
                if not os.path.exists(path_str):
                    logger.warning(f"Image path not found for ORB: {path_str}")
                    return [], None, {"status": "FILE_NOT_FOUND", "keypoints_count": 0}
                gray = cv2.imread(path_str, cv2.IMREAD_GRAYSCALE)
            elif isinstance(image_input, np.ndarray):
                if len(image_input.shape) == 3:
                    gray = cv2.cvtColor(image_input, cv2.COLOR_BGR2GRAY)
                elif len(image_input.shape) == 2:
                    gray = image_input
            elif isinstance(image_input, Image.Image):
                rgb = image_input.convert("L")
                gray = np.array(rgb)

            if gray is None or gray.size == 0:
                return [], None, {"status": "DECODE_FAILED", "keypoints_count": 0}

            # Use configured detector or custom feature count
            detector = self._orb
            if max_features and max_features != self.DEFAULT_N_FEATURES:
                detector = cv2.ORB_create(nfeatures=max_features)

            kps, des = detector.detectAndCompute(gray, None)

            if kps is None or len(kps) < self.MIN_KEYPOINTS_REQUIRED or des is None:
                return kps or [], None, {
                    "status": "INSUFFICIENT_FEATURES",
                    "keypoints_count": len(kps) if kps else 0,
                    "message": "Image contains insufficient distinct road texture features for geometric matching."
                }

            return list(kps), des, {
                "status": "OK",
                "keypoints_count": len(kps),
                "descriptors_count": len(des)
            }

        except Exception as e:
            logger.error(f"Error in ORB feature extraction: {e}")
            return [], None, {"status": "ERROR", "error": str(e), "keypoints_count": 0}

    def match_features(
        self,
        kps1: List[cv2.KeyPoint],
        des1: Optional[np.ndarray],
        kps2: List[cv2.KeyPoint],
        des2: Optional[np.ndarray],
        ratio: float = DEFAULT_LOWE_RATIO,
        ransac_thresh: float = DEFAULT_RANSAC_THRESH
    ) -> Dict[str, Any]:
        """
        Compare two sets of ORB features using BFMatcher, Lowe's ratio test, and RANSAC homography.
        Returns matching metrics and candidate duplicate determination.
        """
        kps1_count = len(kps1) if kps1 is not None else 0
        kps2_count = len(kps2) if kps2 is not None else 0

        # Handle insufficient features gracefully
        if des1 is None or des2 is None or len(des1) < self.MIN_GOOD_MATCHES_FOR_RANSAC or len(des2) < self.MIN_GOOD_MATCHES_FOR_RANSAC:
            return {
                "status": "INSUFFICIENT_FEATURES",
                "query_keypoints_count": kps1_count,
                "train_keypoints_count": kps2_count,
                "good_matches_count": 0,
                "ransac_inliers_count": 0,
                "inlier_ratio": 0.0,
                "has_homography": False,
                "match_verdict": "INSUFFICIENT_FEATURES",
                "is_candidate_duplicate": False,
                "similarity_score": 0.0,
                "message": "Insufficient feature descriptors to perform reliable geometric matching."
            }

        try:
            # 1. BFMatcher with NORM_HAMMING for binary ORB descriptors
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
            knn_matches = bf.knnMatch(des1, des2, k=2)

            # 2. Apply Lowe's ratio test
            good_matches = []
            for m_n in knn_matches:
                if len(m_n) == 2:
                    m, n = m_n
                    if m.distance < ratio * n.distance:
                        good_matches.append(m)

            good_count = len(good_matches)
            inliers = 0
            inlier_ratio = 0.0
            has_homography = False

            # 3. RANSAC Geometric Verification
            if good_count >= self.MIN_GOOD_MATCHES_FOR_RANSAC:
                src_pts = np.float32([kps1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
                dst_pts = np.float32([kps2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

                H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, ransac_thresh)
                if mask is not None and H is not None:
                    inliers = int(np.sum(mask))
                    inlier_ratio = round(float(inliers) / float(good_count), 3)
                    has_homography = True

            # 4. Determine Verdict & Calculate Normalized Similarity
            # A combination of inlier count and inlier ratio
            if inliers >= self.INLIERS_CONFIRMED and inlier_ratio >= self.INLIER_RATIO_CONFIRMED:
                match_verdict = "CONFIRMED_VIEWPOINT_DUPLICATE"
                is_candidate = True
                sim = min(100.0, round(75.0 + (inlier_ratio * 25.0), 1))
            elif inliers >= self.INLIERS_PROBABLE and inlier_ratio >= self.INLIER_RATIO_PROBABLE:
                match_verdict = "PROBABLE_VIEWPOINT_DUPLICATE"
                is_candidate = True
                sim = min(90.0, round(55.0 + (inliers * 1.5) + (inlier_ratio * 20.0), 1))
            elif good_count >= 10:
                match_verdict = "WEAK_FEATURE_OVERLAP"
                is_candidate = False
                sim = round(float(good_count) * 1.8, 1)
            else:
                match_verdict = "DISTINCT_FEATURES"
                is_candidate = False
                sim = round(float(inliers) * 2.0, 1)

            return {
                "status": "OK",
                "query_keypoints_count": kps1_count,
                "train_keypoints_count": kps2_count,
                "good_matches_count": good_count,
                "ransac_inliers_count": inliers,
                "inlier_ratio": inlier_ratio,
                "has_homography": has_homography,
                "match_verdict": match_verdict,
                "is_candidate_duplicate": is_candidate,
                "similarity_score": sim,
            }

        except Exception as e:
            logger.error(f"Error during ORB matching: {e}")
            return {
                "status": "ERROR",
                "error": str(e),
                "query_keypoints_count": kps1_count,
                "train_keypoints_count": kps2_count,
                "good_matches_count": 0,
                "ransac_inliers_count": 0,
                "inlier_ratio": 0.0,
                "has_homography": False,
                "match_verdict": "ERROR",
                "is_candidate_duplicate": False,
                "similarity_score": 0.0,
            }

    def save_features_cache(
        self,
        identifier: str,
        kps: List[cv2.KeyPoint],
        des: Optional[np.ndarray]
    ) -> Optional[str]:
        """
        Store reusable image feature information (.orb.npz) to disk and memory cache.
        Allows instant sub-millisecond comparisons without re-reading or re-extracting.
        """
        if not identifier or des is None or len(kps) == 0:
            return None

        # 1. Update in-memory cache
        if len(self._memory_cache) >= self._max_cache_size:
            # Pop oldest item
            self._memory_cache.pop(next(iter(self._memory_cache)))
        self._memory_cache[identifier] = (kps, des)

        # 2. Persist to disk as compressed numpy archive
        try:
            cache_dir = settings.OUTPUTS_DIR
            os.makedirs(cache_dir, exist_ok=True)
            cache_file = os.path.join(cache_dir, f"{identifier}.orb.npz")

            # Convert keypoints to float32 array: [x, y, size, angle, response, octave, class_id]
            kps_arr = np.array(
                [[kp.pt[0], kp.pt[1], kp.size, kp.angle, kp.response, kp.octave, kp.class_id] for kp in kps],
                dtype=np.float32
            )
            np.savez_compressed(cache_file, kps=kps_arr, des=des)
            return cache_file
        except Exception as e:
            logger.warning(f"Could not save ORB feature cache for {identifier}: {e}")
            return None

    def load_features_cache(
        self,
        identifier: str
    ) -> Tuple[Optional[List[cv2.KeyPoint]], Optional[np.ndarray]]:
        """
        Retrieve pre-extracted ORB keypoints and descriptors from memory or disk cache.
        """
        if not identifier:
            return None, None

        # 1. Check in-memory cache
        if identifier in self._memory_cache:
            return self._memory_cache[identifier]

        # 2. Check disk cache
        cache_file = os.path.join(settings.OUTPUTS_DIR, f"{identifier}.orb.npz")
        if os.path.exists(cache_file):
            try:
                data = np.load(cache_file)
                des = data["des"]
                kps = [
                    cv2.KeyPoint(
                        x=float(r[0]),
                        y=float(r[1]),
                        size=float(r[2]),
                        angle=float(r[3]),
                        response=float(r[4]),
                        octave=int(r[5]),
                        class_id=int(r[6])
                    )
                    for r in data["kps"]
                ]
                # Populate memory cache
                self._memory_cache[identifier] = (kps, des)
                return kps, des
            except Exception as e:
                logger.warning(f"Could not load ORB feature cache {cache_file}: {e}")

        return None, None

    def get_or_extract_report_features(
        self,
        report: Dict[str, Any]
    ) -> Tuple[List[cv2.KeyPoint], Optional[np.ndarray]]:
        """
        Retrieve ORB features from cache or extract from image file on disk.
        """
        rep_id = str(report.get("id") or report.get("_id") or "")
        client_id = report.get("client_report_id") or ""

        # Try cache with report_id or client_report_id
        for ident in [rep_id, client_id]:
            if ident:
                kps, des = self.load_features_cache(ident)
                if des is not None and len(des) > 0:
                    return kps or [], des

        # Fallback to loading image file from disk
        img_url = report.get("image_url") or ""
        if img_url:
            filename = os.path.basename(img_url)
            local_path = os.path.join(settings.OUTPUTS_DIR, filename)
            if os.path.exists(local_path):
                kps, des, _ = self.extract_features(local_path)
                if des is not None:
                    # Save to cache for future runs
                    ident = rep_id or client_id or filename
                    self.save_features_cache(ident, kps, des)
                return kps, des

        return [], None

# Global singleton instance
orb_service = ORBFeatureService()
