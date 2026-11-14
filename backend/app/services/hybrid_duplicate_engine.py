import logging
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, Dict, Any, Tuple

from app.core.config import settings
from app.services.phash_service import phash_service
from app.services.orb_service import orb_service
from app.database.mongodb import (
    find_nearby_reports,
    haversine_distance_meters,
)

logger = logging.getLogger("roadguard.hybrid_duplicate_engine")


class DuplicateVerdict(str, Enum):
    """Principled multi-tier classification verdict (not a pseudo-probability)."""
    CONFIRMED_DUPLICATE = "CONFIRMED_DUPLICATE"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    NEW_ISSUE = "NEW_ISSUE"


class MatchType(str, Enum):
    """Specific visual/geometric modality that triggered the match."""
    PHASH_IDENTICAL = "PHASH_IDENTICAL"          # Exact or cropped photo upload (pHash Hamming <= 4)
    ORB_VIEWPOINT = "ORB_VIEWPOINT"              # Same 3D pothole photographed from different viewpoint/angle
    COMBINED = "COMBINED"                        # Confirmed by both perceptual hash & ORB homography
    PROBABLE_ORB = "PROBABLE_ORB"                # Plausible feature correspondence (needs admin review)
    VISUAL_RESEMBLANCE = "VISUAL_RESEMBLANCE"    # Similar global texture/pattern without confirmed homography
    NONE = "NONE"                                # Distinct road distress


@dataclass
class DuplicateEngineThresholds:
    """Configurable thresholds for the multi-tier hybrid duplicate detection engine."""
    search_radius_meters: float = 50.0
    close_proximity_meters: float = 15.0
    phash_identical_dist: int = 4
    phash_similar_dist: int = 10
    orb_min_inliers_confirmed: int = 20
    orb_min_ratio_confirmed: float = 0.35
    orb_min_inliers_uncertain: int = 10
    orb_min_ratio_uncertain: float = 0.22
    lowe_ratio: float = 0.75
    ransac_reproj_thresh: float = 5.0

    @classmethod
    def from_settings(cls) -> "DuplicateEngineThresholds":
        """Instantiate thresholds from application core configuration."""
        return cls(
            search_radius_meters=getattr(settings, "DUPLICATE_GPS_SEARCH_RADIUS_METERS", 50.0),
            close_proximity_meters=getattr(settings, "DUPLICATE_CLOSE_PROXIMITY_METERS", 15.0),
            phash_identical_dist=getattr(settings, "DUPLICATE_PHASH_IDENTICAL_HAMMING", 4),
            phash_similar_dist=getattr(settings, "DUPLICATE_PHASH_SIMILAR_HAMMING", 10),
            orb_min_inliers_confirmed=getattr(settings, "DUPLICATE_ORB_MIN_INLIERS_CONFIRMED", 20),
            orb_min_ratio_confirmed=getattr(settings, "DUPLICATE_ORB_MIN_RATIO_CONFIRMED", 0.35),
            orb_min_inliers_uncertain=getattr(settings, "DUPLICATE_ORB_MIN_INLIERS_UNCERTAIN", 10),
            orb_min_ratio_uncertain=getattr(settings, "DUPLICATE_ORB_MIN_RATIO_UNCERTAIN", 0.22),
            lowe_ratio=getattr(settings, "DUPLICATE_LOWE_RATIO", 0.75),
            ransac_reproj_thresh=getattr(settings, "DUPLICATE_RANSAC_REPROJ_THRESH", 5.0),
        )


class HybridDuplicateEngine:
    """
    Production-grade Hybrid Duplicate Pothole Detection Engine.
    
    Combines:
      1. GPS Proximity (Geospatial candidate gating to avoid full-database image comparison)
      2. Perceptual Image Hashing (pHash 64-bit DCT for exact/cropped photo re-uploads)
      3. OpenCV ORB Feature Matching (FAST corners + BRIEF descriptors + Lowe's ratio + RANSAC homography)
      4. Canonical Issue Linking (Preserving all citizen submissions while clustering duplicates)
      5. Admin Review Routing for uncertain matches
    """

    def __init__(self, thresholds: Optional[DuplicateEngineThresholds] = None):
        self.thresholds = thresholds or DuplicateEngineThresholds.from_settings()

    def find_nearby_candidates(
        self,
        latitude: float,
        longitude: float,
        search_radius_meters: Optional[float] = None,
        limit: int = 30,
        exclude_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Step 1 & 4 of Workflow:
        Query database ONLY for reports within the configurable GPS search radius.
        Avoids comparing against every image in the database.
        """
        radius = search_radius_meters or self.thresholds.search_radius_meters
        try:
            candidates = find_nearby_reports(
                latitude=latitude,
                longitude=longitude,
                radius_meters=radius,
                limit=limit
            )
            if exclude_id:
                candidates = [
                    c for c in candidates
                    if str(c.get("id")) != exclude_id and str(c.get("client_report_id")) != exclude_id
                ]
            return candidates
        except Exception as e:
            logger.error(f"Error querying nearby candidates for duplicate evaluation: {e}")
            return []

    def evaluate_candidate(
        self,
        candidate: Dict[str, Any],
        query_phash: Optional[str],
        kps_query: List[Any],
        des_query: Optional[Any],
        query_category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Step 5, 6, 7 of Workflow:
        Combines location, pHash similarity, and OpenCV ORB feature matching into a
        principled multi-tier evidence decision for a single nearby candidate.
        """
        cand_id = str(candidate.get("id") or candidate.get("client_report_id") or "")
        cand_client_id = candidate.get("client_report_id") or cand_id
        # Resolve canonical root issue if candidate is already part of a duplicate cluster
        canonical_issue_id = candidate.get("canonical_issue_id") or cand_id

        dist_m = float(candidate.get("distance_meters", 0.0))

        # 1. pHash Comparison
        cand_phash = candidate.get("image_phash")
        phash_dist = 64
        phash_sim = 0.0
        if query_phash and cand_phash:
            phash_dist = phash_service.calculate_hamming_distance(query_phash, cand_phash)
            phash_sim = phash_service.calculate_similarity(phash_dist)

        # 2. OpenCV ORB Feature Extraction & Geometric RANSAC Matching
        kps_train, des_train = orb_service.get_or_extract_report_features(candidate)
        orb_metrics = orb_service.match_features(
            kps_query, des_query, kps_train, des_train,
            ratio=self.thresholds.lowe_ratio,
            ransac_thresh=self.thresholds.ransac_reproj_thresh
        )

        inliers = orb_metrics.get("ransac_inliers_count", 0)
        inlier_ratio = orb_metrics.get("inlier_ratio", 0.0)
        has_homography = orb_metrics.get("has_homography", False)
        good_matches = orb_metrics.get("good_matches_count", 0)

        # Check Category Overlap
        cand_cat = candidate.get("category", "")
        category_matches = (
            not query_category or
            not cand_cat or
            query_category.strip().lower() == cand_cat.strip().lower()
        )

        # ---------------------------------------------------------
        # MULTI-TIER EVIDENCE DECISION LOGIC (Rule-Based, Non-Bayesian)
        # ---------------------------------------------------------

        # TIER 1: CONFIRMED DUPLICATES
        # Case 1A: Exact or near-identical photograph within proximity
        if phash_dist <= self.thresholds.phash_identical_dist:
            verdict = DuplicateVerdict.CONFIRMED_DUPLICATE
            match_type = MatchType.COMBINED if (has_homography and inliers >= self.thresholds.orb_min_inliers_confirmed) else MatchType.PHASH_IDENTICAL
            match_reason = f"Exact duplicate photograph (pHash Hamming distance {phash_dist}/64, {phash_sim}% visual match at {dist_m}m)."
            confidence_tier = "HIGH"
            evidence_score = 100.0 - (phash_dist * 2.5)

        # Case 1B: Confirmed viewpoint geometry (different camera angle/perspective of same physical 3D pothole)
        elif has_homography and inliers >= self.thresholds.orb_min_inliers_confirmed and inlier_ratio >= self.thresholds.orb_min_ratio_confirmed:
            verdict = DuplicateVerdict.CONFIRMED_DUPLICATE
            match_type = MatchType.ORB_VIEWPOINT
            match_reason = (
                f"Confirmed viewpoint match: same road distress photographed from different angle/distance "
                f"({inliers} RANSAC inliers, {int(inlier_ratio * 100)}% geometric ratio at {dist_m}m)."
            )
            confidence_tier = "HIGH"
            evidence_score = min(99.0, round(60.0 + (inliers * 1.0) + (inlier_ratio * 25.0), 1))

        # TIER 2: UNCERTAIN MATCHES (SENT FOR ADMIN REVIEW, NEVER AUTOMERGE)
        # Case 2A: Probable ORB viewpoint inliers (plausible homography, but marginal inlier count)
        elif has_homography and inliers >= self.thresholds.orb_min_inliers_uncertain and inlier_ratio >= self.thresholds.orb_min_ratio_uncertain:
            verdict = DuplicateVerdict.NEEDS_REVIEW
            match_type = MatchType.PROBABLE_ORB
            match_reason = (
                f"Probable viewpoint duplicate with partial geometric correspondence "
                f"({inliers} inliers, {int(inlier_ratio * 100)}% ratio at {dist_m}m). Sent for admin review."
            )
            confidence_tier = "MODERATE"
            evidence_score = min(75.0, round(45.0 + (inliers * 1.5) + (inlier_ratio * 20.0), 1))

        # Case 2B: Perceptual resemblance (pHash Hamming 5-10, similar global layout/texture)
        elif phash_dist <= self.thresholds.phash_similar_dist:
            verdict = DuplicateVerdict.NEEDS_REVIEW
            match_type = MatchType.VISUAL_RESEMBLANCE
            match_reason = (
                f"Perceptual image resemblance (pHash distance {phash_dist}/64, {phash_sim}% resemblance at {dist_m}m). "
                f"Requires municipal admin review."
            )
            confidence_tier = "MODERATE"
            evidence_score = phash_sim

        # Case 2C: Close proximity (<15m) + same defect category + weak feature overlap (6-9 inliers)
        elif dist_m <= self.thresholds.close_proximity_meters and category_matches and inliers >= 6:
            verdict = DuplicateVerdict.NEEDS_REVIEW
            match_type = MatchType.PROBABLE_ORB
            match_reason = (
                f"Immediate proximity ({dist_m}m) with matching category '{cand_cat}' and {inliers} feature matches. "
                f"Sent for municipal road inspector verification."
            )
            confidence_tier = "MODERATE"
            evidence_score = round(40.0 + (inliers * 2.5), 1)

        # TIER 3: NEW ISSUE / DISTINCT ROAD DEFECT
        # IMPORTANT: Do not merge reports solely because they are close together!
        # Even if 2m away, if visual evidence is distinct, it is a NEW ISSUE.
        else:
            verdict = DuplicateVerdict.NEW_ISSUE
            match_type = MatchType.NONE
            match_reason = f"Distinct road surface ({dist_m}m away; no convincing visual correspondence found)."
            confidence_tier = "LOW"
            evidence_score = max(0.0, round(phash_sim * 0.3, 1))

        return {
            "report_id": cand_id,
            "client_report_id": cand_client_id,
            "canonical_issue_id": canonical_issue_id,
            "verdict": verdict.value,
            "match_type": match_type.value,
            "match_reason": match_reason,
            "confidence_tier": confidence_tier,
            "evidence_score": evidence_score,
            "distance_meters": dist_m,
            "phash_distance": phash_dist,
            "phash_similarity": phash_sim,
            "category": cand_cat or "Pothole",
            "severity": candidate.get("severity", "High"),
            "status": candidate.get("status", "Submitted"),
            "address": candidate.get("address"),
            "image_url": candidate.get("image_url"),
            "annotated_image_url": candidate.get("annotated_image_url"),
            "submitted_at": candidate.get("submitted_at"),
            "orb_metrics": {
                "query_keypoints_count": orb_metrics.get("query_keypoints_count", 0),
                "train_keypoints_count": orb_metrics.get("train_keypoints_count", 0),
                "good_matches_count": good_matches,
                "ransac_inliers_count": inliers,
                "inlier_ratio": inlier_ratio,
                "has_homography": has_homography,
                "match_verdict": orb_metrics.get("match_verdict", "DISTINCT_FEATURES"),
                "similarity_score": orb_metrics.get("similarity_score", 0.0),
            }
        }

    def evaluate_submission(
        self,
        image_bytes: bytes,
        latitude: float,
        longitude: float,
        category: Optional[str] = None,
        query_phash: Optional[str] = None,
        kps_query: Optional[List[Any]] = None,
        des_query: Optional[Any] = None,
        search_radius_meters: Optional[float] = None,
        exclude_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Complete end-to-end duplicate evaluation workflow for a submitted issue.
        Returns:
          - overall_decision: CONFIRMED_DUPLICATE, NEEDS_REVIEW, or NEW_ISSUE
          - canonical_issue_id: Linked root ticket ID if confirmed or candidate parent if review
          - is_duplicate: boolean (True ONLY if CONFIRMED_DUPLICATE)
          - review_status: "AUTOMATICALLY_LINKED", "PENDING_ADMIN_REVIEW", or "NONE"
          - candidates: sorted list of evaluated candidate reports
          - top_match: the single highest-evidence candidate (or None)
        """
        # Step 2 & 5: Ensure pHash computed
        if not query_phash:
            query_phash = phash_service.compute_phash(image_bytes)

        # Step 6: Ensure ORB features extracted
        if kps_query is None or des_query is None:
            kps_query, des_query, _ = orb_service.extract_features(image_bytes)

        orb_kps_count = len(kps_query) if kps_query else 0

        # Step 4: Find nearby issues within GPS radius (avoids full database scan)
        radius = search_radius_meters or self.thresholds.search_radius_meters
        nearby_candidates = self.find_nearby_candidates(
            latitude=latitude,
            longitude=longitude,
            search_radius_meters=radius,
            exclude_id=exclude_id
        )

        evaluated_candidates = []
        for cand in nearby_candidates:
            res = self.evaluate_candidate(
                candidate=cand,
                query_phash=query_phash,
                kps_query=kps_query,
                des_query=des_query,
                query_category=category
            )
            # Only retain candidates that have at least some similarity or are uncertain/confirmed
            if res["verdict"] in (DuplicateVerdict.CONFIRMED_DUPLICATE.value, DuplicateVerdict.NEEDS_REVIEW.value) or res["evidence_score"] > 30.0:
                evaluated_candidates.append(res)

        # Sort candidate reports by evidence score descending
        evaluated_candidates.sort(key=lambda x: -x["evidence_score"])

        # Determine overall submission classification
        confirmed = [c for c in evaluated_candidates if c["verdict"] == DuplicateVerdict.CONFIRMED_DUPLICATE.value]
        uncertain = [c for c in evaluated_candidates if c["verdict"] == DuplicateVerdict.NEEDS_REVIEW.value]

        if confirmed:
            top_match = confirmed[0]
            overall_verdict = DuplicateVerdict.CONFIRMED_DUPLICATE.value
            canonical_id = top_match["canonical_issue_id"]
            is_dup = True
            review_status = "AUTOMATICALLY_LINKED"
            reason = top_match["match_reason"]
            match_type = top_match["match_type"]
        elif uncertain:
            top_match = uncertain[0]
            overall_verdict = DuplicateVerdict.NEEDS_REVIEW.value
            canonical_id = top_match["canonical_issue_id"]
            is_dup = False  # DO NOT automatically merge uncertain matches!
            review_status = "PENDING_ADMIN_REVIEW"
            reason = top_match["match_reason"]
            match_type = top_match["match_type"]
        else:
            top_match = None
            overall_verdict = DuplicateVerdict.NEW_ISSUE.value
            canonical_id = None
            is_dup = False
            review_status = "NONE"
            reason = "No convincing nearby duplicate match detected. Created as unique issue ticket."
            match_type = MatchType.NONE.value

        return {
            "overall_verdict": overall_verdict,
            "is_duplicate": is_dup,
            "canonical_issue_id": canonical_id,
            "duplicate_review_status": review_status,
            "match_type": match_type,
            "match_reason": reason,
            "query_phash": query_phash,
            "orb_keypoints_detected": orb_kps_count,
            "search_radius_meters": radius,
            "total_nearby_evaluated": len(nearby_candidates),
            "candidates_count": len(evaluated_candidates),
            "top_match": top_match,
            "candidates": evaluated_candidates
        }


# Global singleton instance with application settings
hybrid_duplicate_engine = HybridDuplicateEngine()

