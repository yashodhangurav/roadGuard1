"""
RoadGuard AI - Perceptual Image Hashing (pHash) Service
Computes 64-bit Discrete Cosine Transform (DCT) perceptual hash fingerprints.
Calculates Hamming distance and similarity to detect identical and near-identical photographs,
invariant to aspect ratio resizing, JPEG compression, and lighting changes.
Does not require external pretrained AI models or third-party repositories.
"""

import os
import cv2
import numpy as np
from typing import Optional, Union, Dict, Any, List, Tuple
from pathlib import Path
from PIL import Image
import logging

logger = logging.getLogger("roadguard.phash")

class PHashService:
    HASH_SIZE = 8       # 8x8 DCT low-frequency matrix = 64-bit fingerprint
    RESIZE_SIZE = (32, 32)
    
    # Standard 64-bit pHash Hamming distance thresholds:
    # 0: Exactly identical photo (bit-for-bit or pure re-encode)
    # 1-5: Near-identical photo (compressed, scaled, or minor filter)
    # 6-12: High structural similarity / Candidate duplicate (same defect, slightly different angle/crop)
    # 13-18: Moderate similarity (similar road surface, unlikely duplicate)
    # >18: Distinct scenes (different road defects)
    THRESHOLD_IDENTICAL = 0
    THRESHOLD_NEAR_IDENTICAL = 5
    THRESHOLD_CANDIDATE = 12
    THRESHOLD_SIMILAR = 18

    def compute_phash(
        self,
        image_input: Union[bytes, str, Path, np.ndarray, Image.Image]
    ) -> Optional[str]:
        """
        Compute a 64-bit Discrete Cosine Transform (DCT) perceptual hash.
        
        Algorithm:
        1. Read / convert image to 8-bit single-channel grayscale.
        2. Resize to 32x32 using area-based interpolation (cv2.INTER_AREA) to remove high-frequency noise.
        3. Compute 2D Discrete Cosine Transform (cv2.dct).
        4. Extract the top-left 8x8 matrix (lowest 64 spatial frequencies).
        5. Calculate the median of the 64 coefficients (excluding the DC coefficient at [0, 0]
           to achieve illumination/exposure invariance).
        6. Compute the 64-bit binary mask (1 if coeff > median, else 0).
        7. Encode as a 16-character hexadecimal string.
        """
        try:
            gray: Optional[np.ndarray] = None

            if isinstance(image_input, bytes):
                nparr = np.frombuffer(image_input, np.uint8)
                gray = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            elif isinstance(image_input, (str, Path)):
                path_str = str(image_input)
                if not os.path.exists(path_str):
                    logger.warning(f"Image path does not exist for pHash: {path_str}")
                    return None
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
                logger.warning("Could not decode image input for pHash computation.")
                return None

            # 1. Resize to 32x32 for DCT decomposition
            resized = cv2.resize(gray, self.RESIZE_SIZE, interpolation=cv2.INTER_AREA)

            # 2. Compute 2D Discrete Cosine Transform on float32 matrix
            float_img = np.float32(resized)
            dct = cv2.dct(float_img)

            # 3. Extract top-left 8x8 submatrix (lowest 64 frequency components)
            dct_low = dct[:self.HASH_SIZE, :self.HASH_SIZE]

            # 4. Compute median excluding DC coefficient at index [0, 0]
            # Excluding DC (mean luminance) makes the hash invariant to overall brightness
            flat_coeffs = dct_low.flatten()
            median_val = np.median(flat_coeffs[1:])

            # 5. Build 64-bit boolean mask
            bit_mask = dct_low > median_val

            # 6. Convert 64 boolean values into a 16-character hexadecimal string
            bit_str = "".join("1" if b else "0" for b in bit_mask.flatten())
            hex_hash = f"{int(bit_str, 2):016x}"
            return hex_hash

        except Exception as e:
            logger.error(f"Error computing pHash: {e}")
            return None

    def calculate_hamming_distance(self, hash1: str, hash2: str) -> int:
        """
        Calculate the Hamming distance (number of differing bits) between two 64-bit hex hashes.
        Distance range: 0 (identical) to 64 (complete inverse).
        """
        if not hash1 or not hash2:
            return 64
        try:
            val1 = int(hash1.strip(), 16)
            val2 = int(hash2.strip(), 16)
            xor_diff = val1 ^ val2
            return bin(xor_diff).count("1")
        except ValueError:
            return 64

    def calculate_similarity(self, distance: int, bit_length: int = 64) -> float:
        """
        Convert Hamming distance into a normalized percentage similarity (0.0% to 100.0%).
        """
        clamped_dist = max(0, min(distance, bit_length))
        sim = (1.0 - (clamped_dist / float(bit_length))) * 100.0
        return round(sim, 1)

    def classify_match(self, distance: int) -> Tuple[str, bool]:
        """
        Classify the match level based on Hamming distance.
        Returns: (match_level_label, is_candidate_duplicate)
        """
        if distance <= self.THRESHOLD_IDENTICAL:
            return ("IDENTICAL", True)
        elif distance <= self.THRESHOLD_NEAR_IDENTICAL:
            return ("NEAR_IDENTICAL", True)
        elif distance <= self.THRESHOLD_CANDIDATE:
            return ("HIGH_SIMILARITY", True)
        elif distance <= self.THRESHOLD_SIMILAR:
            return ("MODERATE_SIMILARITY", False)
        else:
            return ("DISTINCT", False)

    def compare_hashes(self, hash1: str, hash2: str) -> Dict[str, Any]:
        """
        Full comparison dictionary between two perceptual hashes.
        """
        dist = self.calculate_hamming_distance(hash1, hash2)
        sim = self.calculate_similarity(dist)
        match_level, is_candidate = self.classify_match(dist)
        return {
            "hash1": hash1,
            "hash2": hash2,
            "distance": dist,
            "similarity_score": sim,
            "match_level": match_level,
            "is_candidate_duplicate": is_candidate,
        }

    def evaluate_duplicate_candidates(
        self,
        query_hash: str,
        candidate_reports: List[Dict[str, Any]],
        max_distance: int = THRESHOLD_CANDIDATE
    ) -> List[Dict[str, Any]]:
        """
        Compare query pHash against a list of candidate report dicts.
        Returns list of matched candidates with distance <= max_distance, sorted by closest match.
        NOTE: Does not automatically merge reports; returns candidate information for review.
        """
        if not query_hash:
            return []

        matches = []
        for report in candidate_reports:
            rep_hash = report.get("image_phash")
            
            # If report does not yet have a stored pHash, attempt to compute it if image is local
            if not rep_hash and report.get("image_url"):
                img_url = report.get("image_url", "")
                if img_url.startswith("/outputs/"):
                    local_path = os.path.join(
                        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                        "outputs",
                        os.path.basename(img_url)
                    )
                    if os.path.exists(local_path):
                        rep_hash = self.compute_phash(local_path)

            if not rep_hash:
                continue

            dist = self.calculate_hamming_distance(query_hash, rep_hash)
            sim = self.calculate_similarity(dist)
            match_level, is_candidate = self.classify_match(dist)

            if dist <= max_distance:
                matches.append({
                    "report_id": str(report.get("id") or report.get("_id")),
                    "client_report_id": report.get("client_report_id"),
                    "distance": dist,
                    "similarity_score": sim,
                    "match_level": match_level,
                    "is_candidate_duplicate": is_candidate,
                    "category": report.get("category", "Pothole"),
                    "severity": report.get("severity", "High"),
                    "status": report.get("status", "Submitted"),
                    "distance_meters": report.get("distance_meters"),
                    "address": report.get("address"),
                    "image_url": report.get("image_url"),
                    "annotated_image_url": report.get("annotated_image_url"),
                    "submitted_at": report.get("submitted_at"),
                })

        # Sort by lowest Hamming distance (highest visual resemblance first)
        matches.sort(key=lambda x: x["distance"])
        return matches

# Global singleton instance
phash_service = PHashService()

