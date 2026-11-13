import cv2
import numpy as np
from typing import Dict, Any, Tuple

# Severity scoring constants
MAX_EXPECTED_AREA_FRACTION = 0.12  # 12% of image frame
WEIGHT_SIZE = 0.5
WEIGHT_DARKNESS = 0.3
WEIGHT_TEXTURE = 0.2

SEVERITY_THRESHOLDS = [
    (80.0, "Critical", "Immediate", "Full-depth emergency repair; hot-mix asphalt patching and compaction"),
    (55.0, "High", "Priority (48h)", "Milling, tack coat application, and dense-graded hot-mix asphalt patch"),
    (30.0, "Medium", "Routine", "Edge sealing, shallow tack patch, or cold-pour polymer mastic fill"),
    (0.0, "Low", "Monitor", "Surface crack sealing and preventive asphalt rejuvenator application"),
]

def calculate_defect_severity(image_bgr: np.ndarray, bbox: list[float]) -> Dict[str, Any]:
    """
    Computes deterministic defect severity using image morphology, intensity, and texture metrics.
    
    Formula:
    composite (0-100) = 100 * ( 0.5 * size_score + 0.3 * darkness_score + 0.2 * texture_score )
    """
    img_h, img_w = image_bgr.shape[:2]
    total_frame_area = img_h * img_w
    
    x1, y1, x2, y2 = [int(round(coord)) for coord in bbox]
    # Clamp coordinates to image boundaries
    x1, x2 = max(0, min(img_w - 1, x1)), max(0, min(img_w, x2))
    y1, y2 = max(0, min(img_h - 1, y1)), max(0, min(img_h, y2))
    
    box_w = max(1, x2 - x1)
    box_h = max(1, y2 - y1)
    defect_area = box_w * box_h
    
    # 1. Size score (Weight: 0.5)
    area_fraction = defect_area / float(total_frame_area)
    size_score = min(1.0, area_fraction / MAX_EXPECTED_AREA_FRACTION)
    
    # Extract defect ROI
    roi_bgr = image_bgr[y1:y2, x1:x2]
    gray_full = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    gray_roi = gray_full[y1:y2, x1:x2]
    
    # 2. Darkness / Contrast score (Weight: 0.3)
    # Define an outer ring region around the defect to sample surrounding pavement
    pad_x = int(box_w * 0.25)
    pad_y = int(box_h * 0.25)
    surr_x1 = max(0, x1 - pad_x)
    surr_y1 = max(0, y1 - pad_y)
    surr_x2 = min(img_w, x2 + pad_x)
    surr_y2 = min(img_h, y2 + pad_y)
    
    surr_mask = np.ones((surr_y2 - surr_y1, surr_x2 - surr_x1), dtype=np.uint8) * 255
    inner_rel_x1 = x1 - surr_x1
    inner_rel_y1 = y1 - surr_y1
    inner_rel_x2 = x2 - surr_x1
    inner_rel_y2 = y2 - surr_y1
    surr_mask[inner_rel_y1:inner_rel_y2, inner_rel_x1:inner_rel_x2] = 0
    
    surrounding_patch = gray_full[surr_y1:surr_y2, surr_x1:surr_x2]
    surrounding_pixels = surrounding_patch[surr_mask == 255]
    
    if len(surrounding_pixels) > 0 and gray_roi.size > 0:
        pavement_mean = float(np.mean(surrounding_pixels))
        defect_mean = float(np.mean(gray_roi))
        # Absolute contrast normalized to 0-1 (up to 120 intensity difference)
        intensity_diff = abs(pavement_mean - defect_mean)
        darkness_score = min(1.0, intensity_diff / 100.0)
    else:
        darkness_score = 0.3
        
    # 3. Texture score (Weight: 0.2)
    # Relative Laplacian variance (broken roughness vs frame baseline)
    full_laplacian_var = float(cv2.Laplacian(gray_full, cv2.CV_64F).var())
    full_laplacian_var = max(full_laplacian_var, 1.0)
    
    roi_laplacian_var = float(cv2.Laplacian(gray_roi, cv2.CV_64F).var()) if gray_roi.size > 9 else 0.0
    texture_ratio = roi_laplacian_var / full_laplacian_var
    texture_score = min(1.0, texture_ratio / 3.0)
    
    # Composite score (0 - 100)
    composite = 100.0 * (
        (WEIGHT_SIZE * size_score) +
        (WEIGHT_DARKNESS * darkness_score) +
        (WEIGHT_TEXTURE * texture_score)
    )
    composite = round(max(0.0, min(100.0, composite)), 1)
    
    # Map composite score to label, urgency, repair method
    severity_label = "Low"
    urgency = "Monitor"
    repair_method = SEVERITY_THRESHOLDS[-1][3]
    for min_score, label, urg, rep in SEVERITY_THRESHOLDS:
        if composite >= min_score:
            severity_label = label
            urgency = urg
            repair_method = rep
            break
            
    # Estimate approximate physical dimensions based on typical lane camera perspective
    # (Assuming 3.5m lane width spans roughly 70% of image horizontal width)
    cm_per_pixel = 350.0 / (img_w * 0.70)
    width_cm = round(box_w * cm_per_pixel, 1)
    height_cm = round(box_h * cm_per_pixel, 1)
    area_cm2 = round(width_cm * height_cm, 1)
    
    # Estimated depth proxy from shadow contrast (not true 3D LIDAR depth)
    depth_mm_proxy = round(20.0 + (composite * 0.8), 1)
    
    return {
        "score": composite,
        "label": severity_label,
        "urgency": urgency,
        "repair_method": repair_method,
        "size_score": round(size_score, 3),
        "darkness_score": round(darkness_score, 3),
        "texture_score": round(texture_score, 3),
        "dimensions": {
            "widthCm": width_cm,
            "heightCm": height_cm,
            "estimatedDepthMm": depth_mm_proxy,
            "areaCm2": area_cm2,
        }
    }
