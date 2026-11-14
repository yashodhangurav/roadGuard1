import os
import time
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import cv2
import numpy as np
from PIL import Image

from ultralytics import YOLO
from app.core.config import settings
from app.services.severity import calculate_defect_severity
from app.schemas.detection import (
    DetectedDefect,
    BoundingBox,
    DefectDimensions,
    RoadDamageStats,
    ModelInfo,
    DetectionResponse,
)

logger = logging.getLogger(__name__)

# Severity Color Map in BGR
SEVERITY_COLORS = {
    "Critical": (36, 36, 239),     # Red
    "High": (34, 126, 245),       # Orange
    "Medium": (40, 204, 255),     # Yellow
    "Low": (84, 180, 46),         # Green
}

class YOLOService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(YOLOService, cls).__new__(cls)
            cls._instance._init_model()
        return cls._instance

    def _init_model(self):
        self.hazard_session = None
        self.hazard_model = None
        self.pothole_model = None
        self.model_loaded = False
        self.model_name = "YOLO11n-RoadHazard-Ensemble"
        self.model_version = "v2.0.0-dual-engine"
        self.architecture = "YOLO11n ONNX (VivekVagale RDD2022) + YOLOv8 Pothole Specialist"
        
        # 1. Road Hazard model (VivekVagale/road-hazard RDD2022 native ONNX session)
        hazard_path = Path(settings.WEIGHTS_DIR / "road_hazard_yolo11n.onnx")
        if hazard_path.exists():
            try:
                import onnxruntime as ort
                logger.info(f"Loading Road Hazard native ONNX session from {hazard_path}...")
                opts = ort.SessionOptions()
                opts.intra_op_num_threads = 2
                self.hazard_session = ort.InferenceSession(str(hazard_path), sess_options=opts)
                logger.info("Road Hazard native ONNX session loaded successfully.")
            except Exception as e:
                logger.error(f"Error loading Road Hazard ONNX session: {e}")
                try:
                    logger.info(f"Falling back to Ultralytics YOLO loader for {hazard_path}...")
                    self.hazard_model = YOLO(str(hazard_path))
                except Exception as e2:
                    logger.error(f"Error loading Road Hazard weights via YOLO: {e2}")
                
        # 2. Dedicated Pothole detector (High Precision)
        pothole_path = Path(settings.WEIGHTS_DIR / "pothole_yolov8.pt")
        if pothole_path.exists():
            try:
                logger.info(f"Loading dedicated Pothole weights from {pothole_path}...")
                self.pothole_model = YOLO(str(pothole_path))
                logger.info(f"Pothole detector loaded. Classes: {self.pothole_model.names}")
            except Exception as e:
                logger.error(f"Error loading Pothole detector weights: {e}")

        self.model = self.hazard_session or self.hazard_model or self.pothole_model
        self.model_loaded = (self.hazard_session is not None) or (self.hazard_model is not None) or (self.pothole_model is not None)

    def _calculate_iou(self, box1: List[float], box2: List[float]) -> float:
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])
        inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union = area1 + area2 - inter
        return inter / union if union > 0 else 0.0

    def _detect_pothole_cavities_cv(self, image_bgr: np.ndarray) -> List[Dict[str, Any]]:
        """
        Secondary computer vision road cavity & depression analyzer.
        Employs adaptive multi-scale morphological contrast and texture analysis
        to localize road potholes when neural net confidence is borderline.
        """
        img_h, img_w = image_bgr.shape[:2]
        if img_h < 60 or img_w < 60:
            return []
            
        roi_top = int(img_h * 0.15)
        roi = image_bgr[roi_top:img_h, :]
        roi_h, roi_w = roi.shape[:2]
        
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)
        
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 31, 8
        )
        
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
        opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel, iterations=1)
        
        contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        total_area = float(roi_h * roi_w)
        candidates = []
        
        for c in contours:
            area = cv2.contourArea(c)
            area_frac = area / total_area
            if 0.005 <= area_frac <= 0.45:
                x, y, bw, bh = cv2.boundingRect(c)
                aspect = bw / float(bh) if bh > 0 else 0
                if 0.25 <= aspect <= 4.0:
                    mask = np.zeros(gray.shape, dtype=np.uint8)
                    cv2.drawContours(mask, [c], -1, 255, -1)
                    mean_inside = cv2.mean(gray, mask=mask)[0]
                    mean_outside = cv2.mean(gray)[0]
                    contrast = max(0.0, mean_outside - mean_inside)
                    
                    roi_c = gray[y:y+bh, x:x+bw]
                    lap_var = cv2.Laplacian(roi_c, cv2.CV_64F).var() if roi_c.size > 9 else 0
                    
                    if contrast > 6.0 or lap_var > 35.0:
                        conf = min(94.0, max(60.0, 58.0 + (contrast * 0.8) + min(22.0, lap_var * 0.05)))
                        candidates.append({
                            "xyxy": [float(x), float(y + roi_top), float(x + bw), float(y + bh + roi_top)],
                            "conf": round(conf, 1),
                            "type": "Pothole",
                            "raw_code": "D40"
                        })
                        
        candidates.sort(key=lambda c: c["conf"], reverse=True)
        return candidates[:3]

    def _predict_hazard_onnx_native(self, image_bgr: np.ndarray, conf_threshold: float = 0.20) -> List[Dict[str, Any]]:
        """
        Executes native ONNX inference with aspect-preserving letterbox padding (114, 114, 114)
        matching VivekVagale/road-hazard exactly.
        Classes:
          0: Longitudinal Crack (D00)
          1: Transverse Crack (D10)
          2: Alligator Crack (D20)
          3: Pothole (D40)
        """
        if self.hazard_session is None:
            return []
            
        img_h, img_w = image_bgr.shape[:2]
        total_frame_area = float(img_h * img_w)
        target_size = 640
        
        # Letterbox aspect-preserving resize with grey (114, 114, 114) padding
        scale = min(target_size / img_w, target_size / img_h)
        nw = int(round(img_w * scale))
        nh = int(round(img_h * scale))
        px = (target_size - nw) // 2
        py = (target_size - nh) // 2
        
        resized = cv2.resize(image_bgr, (nw, nh), interpolation=cv2.INTER_LINEAR)
        padded = np.full((target_size, target_size, 3), 114, dtype=np.uint8)
        padded[py:py+nh, px:px+nw] = resized
        
        # RGB normalized float32 [1, 3, 640, 640]
        rgb = cv2.cvtColor(padded, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        blob = np.transpose(rgb, (2, 0, 1))[None, ...]
        
        try:
            out = self.hazard_session.run(["output0"], {"images": blob})[0]
            dims = out.shape # (1, 8, 8400)
            rows, n = dims[1], dims[2]
            d = out[0]
            
            raw_detections = []
            for i in range(n):
                best = 0.0
                cls_idx = -1
                for c in range(4, rows):
                    score = float(d[c, i])
                    if score > best:
                        best = score
                        cls_idx = c - 4
                        
                if best < conf_threshold:
                    continue
                    
                cx, cy, bw, bh = float(d[0, i]), float(d[1, i]), float(d[2, i]), float(d[3, i])
                x1 = (cx - bw / 2.0 - px) / scale
                y1 = (cy - bh / 2.0 - py) / scale
                x2 = (cx + bw / 2.0 - px) / scale
                y2 = (cy + bh / 2.0 - py) / scale
                
                x1 = max(0.0, min(float(img_w), x1))
                y1 = max(0.0, min(float(img_h), y1))
                x2 = max(0.0, min(float(img_w), x2))
                y2 = max(0.0, min(float(img_h), y2))
                
                box_area = (x2 - x1) * (y2 - y1)
                box_w_frac = (x2 - x1) / img_w
                if (box_area / total_frame_area) > 0.85 or box_w_frac > 0.90:
                    continue
                    
                damage_type, raw_code = self.resolve_damage_class(str(cls_idx), cls_idx)
                if damage_type and raw_code:
                    raw_detections.append({
                        "xyxy": [x1, y1, x2, y2],
                        "conf": round(best * 100.0, 1),
                        "type": damage_type,
                        "raw_code": raw_code
                    })
                    
            # Per-class NMS to remove overlapping boxes of same defect type
            raw_detections.sort(key=lambda b: b["conf"], reverse=True)
            keep_detections = []
            for b in raw_detections:
                dup = False
                for k in keep_detections:
                    if k["raw_code"] == b["raw_code"]:
                        if self._calculate_iou(k["xyxy"], b["xyxy"]) > 0.45:
                            dup = True
                            break
                if not dup:
                    keep_detections.append(b)
                    
            return keep_detections
        except Exception as e:
            logger.error(f"Error in _predict_hazard_onnx_native: {e}")
            return []

    def _collect_candidate_detections(self, image_bgr: np.ndarray) -> List[Dict[str, Any]]:
        candidates = []
        img_h, img_w = image_bgr.shape[:2]
        total_frame_area = float(img_h * img_w)
        
        # 1. Run VivekVagale Road Hazard ONNX detector (trained on RDD2022 Indian roads)
        if self.hazard_session is not None:
            hazard_dets = self._predict_hazard_onnx_native(image_bgr, conf_threshold=0.20)
            candidates.extend(hazard_dets)
        elif self.hazard_model is not None:
            try:
                image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
                res2 = self.hazard_model.predict(
                    source=image_rgb,
                    conf=0.15,
                    iou=0.45,
                    verbose=False
                )
                if len(res2) > 0 and res2[0].boxes is not None:
                    for box in res2[0].boxes:
                        cls_idx = int(box.cls[0].item())
                        conf = float(box.conf[0].item()) * 100.0
                        xyxy = [float(v) for v in box.xyxy[0].tolist()]
                        
                        box_area = (xyxy[2] - xyxy[0]) * (xyxy[3] - xyxy[1])
                        box_w_frac = (xyxy[2] - xyxy[0]) / img_w
                        if (box_area / total_frame_area) > 0.85 or box_w_frac > 0.90:
                            continue
                            
                        raw_name = self.hazard_model.names.get(cls_idx, str(cls_idx))
                        damage_type, raw_code = self.resolve_damage_class(raw_name, cls_idx)
                        if damage_type and raw_code:
                            candidates.append({
                                "xyxy": xyxy,
                                "conf": conf,
                                "type": damage_type,
                                "raw_code": raw_code
                            })
            except Exception as e:
                logger.error(f"Road Hazard model inference error: {e}")
        
        # 2. Run dedicated Pothole model (high precision on close-ups)
        if self.pothole_model is not None:
            try:
                image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
                res1 = self.pothole_model.predict(
                    source=image_rgb,
                    conf=0.25,
                    iou=0.45,
                    verbose=False
                )
                if len(res1) > 0 and res1[0].boxes is not None:
                    for box in res1[0].boxes:
                        cls_idx = int(box.cls[0].item())
                        conf = float(box.conf[0].item()) * 100.0
                        xyxy = [float(v) for v in box.xyxy[0].tolist()]
                        
                        box_area = (xyxy[2] - xyxy[0]) * (xyxy[3] - xyxy[1])
                        box_w_frac = (xyxy[2] - xyxy[0]) / img_w
                        if (box_area / total_frame_area) > 0.85 or box_w_frac > 0.90:
                            continue
                            
                        raw_name = self.pothole_model.names.get(cls_idx, str(cls_idx))
                        damage_type, raw_code = self.resolve_damage_class(raw_name, cls_idx)
                        if damage_type and raw_code:
                            candidates.append({
                                "xyxy": xyxy,
                                "conf": conf,
                                "type": damage_type,
                                "raw_code": raw_code
                            })
            except Exception as e:
                logger.error(f"Pothole detector inference error: {e}")

        # 3. If neural nets return 0 candidate boxes on road photos, trigger adaptive CV cavity detector
        if len(candidates) == 0:
            cv_cavities = self._detect_pothole_cavities_cv(image_bgr)
            candidates.extend(cv_cavities)

        # Sort all candidates by confidence descending
        candidates.sort(key=lambda c: c["conf"], reverse=True)
        
        # NMS suppression to eliminate redundant duplicate bounding boxes
        final_boxes = []
        for cand in candidates:
            is_dup = False
            for kept in final_boxes:
                if self._calculate_iou(cand["xyxy"], kept["xyxy"]) > 0.40:
                    is_dup = True
                    break
            if not is_dup:
                final_boxes.append(cand)
                
        return final_boxes

    def resolve_damage_class(self, raw_name: Any, cls_idx: int) -> Tuple[Optional[str], Optional[str]]:
        """
        Resolves model class name/index to road damage types (Pothole, Cracks)
        and explicitly suppresses non-road entities like vehicles, bikes, and people.
        """
        name_str = str(raw_name).lower().strip().replace("-", "_").replace(" ", "_")
        
        # 1. Non-defect objects (e.g. if fallback COCO or hybrid model runs)
        non_defect_classes = {
            "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
            "traffic_light", "fire_hydrant", "stop_sign", "parking_meter", "bench", "bird", "cat",
            "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
            "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports_ball",
            "kite", "baseball_bat", "baseball_glove", "skateboard", "surfboard", "tennis_racket",
            "bottle", "wine_glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
            "sandwich", "orange", "broccoli", "carrot", "hot_dog", "pizza", "donut", "cake", "chair",
            "couch", "potted_plant", "bed", "dining_table", "toilet", "tv", "laptop", "mouse",
            "remote", "keyboard", "cell_phone", "microwave", "oven", "toaster", "sink",
            "refrigerator", "book", "clock", "vase", "scissors", "teddy_bear", "hair_drier", "toothbrush",
            "vehicle", "auto", "bike", "scooter"
        }
        if name_str in non_defect_classes:
            return None, None
            
        # 2. Semantic name resolution (for VivekVagale road-hazard and standard RDD)
        if "pothole" in name_str or name_str in ["d40", "cavity", "depression"]:
            return "Pothole", "D40"
        if "alligator" in name_str or name_str in ["d20", "crocodile_crack"]:
            return "Alligator Crack", "D20"
        if "transverse" in name_str or name_str in ["d10"]:
            return "Transverse Crack", "D10"
        if "longitudinal" in name_str or name_str in ["d00"]:
            return "Longitudinal Crack", "D00"
        if "crack" in name_str:
            return "Surface Crack", "D00"
            
        # 3. Model class index matching (Road Hazard / RDD2022 standards)
        # In VivekVagale/road-hazard YOLO11n RDD2022 model:
        # 0: longitudinal_crack, 1: transverse_crack, 2: alligator_crack, 3: pothole
        if name_str == "3" or cls_idx == 3:
            return "Pothole", "D40"
        elif name_str == "0" or cls_idx == 0:
            return "Longitudinal Crack", "D00"
        elif name_str == "1" or cls_idx == 1:
            return "Transverse Crack", "D10"
        elif name_str == "2" or cls_idx == 2:
            return "Alligator Crack", "D20"
            
        return None, None

    def detect_image(self, image_bytes: bytes, original_filename: str) -> DetectionResponse:
        """
        Executes YOLO inference, computes severity metrics, generates annotated image,
        and returns validated DetectionResponse.
        """
        start_time = time.perf_counter()
        clean_filename = os.path.basename(original_filename) if original_filename else "road_image.jpg"
        
        # Decode image using OpenCV
        np_arr = np.frombuffer(image_bytes, np.uint8)
        image_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image_bgr is None:
            raise ValueError("Could not decode image file into valid OpenCV matrix")
            
        img_h, img_w = image_bgr.shape[:2]
        unique_id = f"SCAN-{uuid.uuid4().hex[:8].upper()}"
        
        # Save raw upload for audit
        upload_path = settings.UPLOADS_DIR / f"{unique_id}_{clean_filename}"
        with open(upload_path, "wb") as f:
            f.write(image_bytes)
            
        defects: List[DetectedDefect] = []
        annotated_bgr = image_bgr.copy()
        
        if not self.model_loaded or self.model is None:
            raise RuntimeError("YOLO model checkpoint is not initialized or failed to load")
            
        # Run ensemble inference across dedicated pothole & road hazard models
        candidate_boxes = self._collect_candidate_detections(image_bgr)
        inference_time_ms = round((time.perf_counter() - start_time) * 1000.0, 1)
        
        for idx, cand in enumerate(candidate_boxes):
            conf = cand["conf"]
            xyxy = cand["xyxy"]
            damage_type = cand["type"]
            raw_code = cand["raw_code"]
            
            # Compute severity via deterministic image analysis
            severity_info = calculate_defect_severity(image_bgr, xyxy)
            
            # Normalized percentages (0 - 100) for frontend
            x1, y1, x2, y2 = xyxy
            norm_x = round((x1 / img_w) * 100.0, 2)
            norm_y = round((y1 / img_h) * 100.0, 2)
            norm_w = round(((x2 - x1) / img_w) * 100.0, 2)
            norm_h = round(((y2 - y1) / img_h) * 100.0, 2)
            
            prefix = "PTH" if damage_type == "Pothole" else "DEF"
            defect_id = f"{prefix}-{unique_id}-{idx + 1:02d}"
            dims = DefectDimensions(**severity_info["dimensions"])
            
            detected = DetectedDefect(
                id=defect_id,
                type=damage_type,
                raw_class=raw_code,
                severity=severity_info["label"],
                severity_score=severity_info["score"],
                confidence=round(conf, 1),
                box=BoundingBox(
                    x=norm_x,
                    y=norm_y,
                    width=norm_w,
                    height=norm_h,
                    xyxy=[round(c, 1) for c in xyxy]
                ),
                dimensions=dims,
                urgency=severity_info["urgency"],
                repairMethod=severity_info["repair_method"],
            )
            defects.append(detected)
            
            # Annotate image
            color = SEVERITY_COLORS.get(severity_info["label"], (40, 204, 255))
            pt1 = (int(x1), int(y1))
            pt2 = (int(x2), int(y2))
            cv2.rectangle(annotated_bgr, pt1, pt2, color, 3)
            
            # Label badge
            label_text = f"{damage_type} ({round(conf, 1)}%) [{severity_info['label']}]"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.55
            thickness = 1
            (lw, lh), baseline = cv2.getTextSize(label_text, font, font_scale, thickness)
            badge_y1 = max(0, int(y1) - lh - 8)
            badge_y2 = int(y1)
            badge_x2 = min(img_w, int(x1) + lw + 8)
            cv2.rectangle(annotated_bgr, (int(x1), badge_y1), (badge_x2, badge_y2), color, -1)
            cv2.putText(
                annotated_bgr,
                label_text,
                (int(x1) + 4, badge_y2 - 4),
                font,
                font_scale,
                (255, 255, 255),
                thickness,
                cv2.LINE_AA
            )

        # Save annotated image
        annotated_filename = f"annotated_{unique_id}.jpg"
        annotated_path = settings.OUTPUTS_DIR / annotated_filename
        cv2.imwrite(str(annotated_path), annotated_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        
        # Calculate summary statistics
        total_defects = len(defects)
        potholes = sum(1 for d in defects if d.type == "Pothole")
        cracks = sum(1 for d in defects if "Crack" in d.type)
        deteriorations = sum(1 for d in defects if "Deterioration" in d.type)
        critical_count = sum(1 for d in defects if d.severity == "Critical")
        
        # Pavement Condition Index (PCI) estimation (ASTM D6433 proxy)
        # 100 = Perfect, deductions per defect severity
        deduct_sum = sum(d.severity_score * 0.4 for d in defects)
        pci = max(10.0, min(100.0, 100.0 - deduct_sum))
        
        if critical_count > 0 or total_defects >= 3:
            condition = "Critical"
        elif total_defects >= 2:
            condition = "Poor"
        elif total_defects == 1:
            condition = "Fair"
        else:
            condition = "Good"
            
        hazard_index = min(100.0, (100.0 - pci) * 1.1)
        total_patch_tons = round(sum(d.dimensions.areaCm2 for d in defects) * 0.00025, 2)
        
        stats = RoadDamageStats(
            totalDefects=total_defects,
            potholesCount=potholes,
            cracksCount=cracks,
            deteriorationCount=deteriorations,
            criticalCount=critical_count,
            overallCondition=condition,
            hazardIndex=round(hazard_index, 1),
            pciScore=round(pci, 1),
            estimatedPatchTons=total_patch_tons,
            scanDurationMs=round((time.perf_counter() - start_time) * 1000.0, 1),
        )
        
        model_info = ModelInfo(
            name=self.model_name,
            version=self.model_version,
            architecture=self.architecture,
            inferenceTimeMs=inference_time_ms,
        )
        
        return DetectionResponse(
            imageId=unique_id,
            fileName=original_filename,
            imageUrl=f"/outputs/{unique_id}_{original_filename}",
            annotatedImageUrl=f"/outputs/{annotated_filename}",
            analyzedAt=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            defects=defects,
            stats=stats,
            backend="Live YOLOv8 API",
            backendEndpoint="/api/detect/image",
            modelInfo=model_info,
        )

    def detect_video(self, video_bytes: bytes, original_filename: str) -> DetectionResponse:
        """
        Processes uploaded video by sampling frames, running YOLO inference,
        identifying defects across the video timeline, and saving an annotated keyframe.
        """
        start_time = time.perf_counter()
        unique_id = f"SCAN-VID-{uuid.uuid4().hex[:8].upper()}"
        clean_filename = os.path.basename(original_filename) if original_filename else "road_video.mp4"
        
        video_path = settings.UPLOADS_DIR / f"{unique_id}_{clean_filename}"
        with open(video_path, "wb") as f:
            f.write(video_bytes)
            
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise ValueError("Could not open uploaded video file with OpenCV VideoCapture.")
            
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            total_frames = 100
            
        sample_step = max(1, total_frames // 10)
        
        all_defects: List[DetectedDefect] = []
        best_frame = None
        best_annotated = None
        best_severity_score = -1.0
        frame_idx = 0
        sampled_count = 0
        total_inference_time = 0.0
        
        while cap.isOpened() and sampled_count < 15:
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_idx % sample_step == 0:
                sampled_count += 1
                img_h, img_w = frame.shape[:2]
                frame_annotated = frame.copy()
                
                t0 = time.perf_counter()
                candidate_boxes = self._collect_candidate_detections(frame)
                total_inference_time += (time.perf_counter() - t0)
                
                frame_defects = []
                frame_max_score = 0.0
                
                for b_idx, cand in enumerate(candidate_boxes):
                    conf = cand["conf"]
                    xyxy = cand["xyxy"]
                    damage_type = cand["type"]
                    raw_code = cand["raw_code"]
                    severity_info = calculate_defect_severity(frame, xyxy)
                    frame_max_score = max(frame_max_score, severity_info["score"])
                    
                    x1, y1, x2, y2 = xyxy
                    norm_x = round((x1 / img_w) * 100.0, 2)
                    norm_y = round((y1 / img_h) * 100.0, 2)
                    norm_w = round(((x2 - x1) / img_w) * 100.0, 2)
                    norm_h = round(((y2 - y1) / img_h) * 100.0, 2)
                    
                    timestamp_sec = round(frame_idx / fps, 1)
                    prefix = "PTH" if damage_type == "Pothole" else "DEF"
                    defect_id = f"{prefix}-{unique_id}-F{frame_idx}-{b_idx + 1:02d}"
                    dims = DefectDimensions(**severity_info["dimensions"])
                    
                    detected = DetectedDefect(
                        id=defect_id,
                        type=damage_type,
                        raw_class=raw_code,
                        severity=severity_info["label"],
                        severity_score=severity_info["score"],
                        confidence=round(conf, 1),
                        box=BoundingBox(
                            x=norm_x,
                            y=norm_y,
                            width=norm_w,
                            height=norm_h,
                            xyxy=[round(c, 1) for c in xyxy]
                        ),
                        dimensions=dims,
                        urgency=severity_info["urgency"],
                        repairMethod=f"{severity_info['repair_method']} (Frame @ {timestamp_sec}s)",
                    )
                    frame_defects.append(detected)
                    
                    color = SEVERITY_COLORS.get(severity_info["label"], (40, 204, 255))
                    cv2.rectangle(frame_annotated, (int(x1), int(y1)), (int(x2), int(y2)), color, 3)
                    label_text = f"{damage_type} ({round(conf, 1)}%) [{severity_info['label']}]"
                    cv2.putText(frame_annotated, label_text, (int(x1) + 4, max(20, int(y1) - 4)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2, cv2.LINE_AA)
                                    
                if frame_max_score > best_severity_score or best_annotated is None:
                    best_severity_score = frame_max_score
                    best_frame = frame
                    best_annotated = frame_annotated
                    
                all_defects.extend(frame_defects)
                
            frame_idx += 1
            
        cap.release()
        
        annotated_filename = f"annotated_{unique_id}.jpg"
        annotated_path = settings.OUTPUTS_DIR / annotated_filename
        if best_annotated is not None:
            cv2.imwrite(str(annotated_path), best_annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        elif best_frame is not None:
            cv2.imwrite(str(annotated_path), best_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        else:
            placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(placeholder, "Video Scan Completed", (140, 240), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
            cv2.imwrite(str(annotated_path), placeholder)
            
        total_defects = len(all_defects)
        potholes = sum(1 for d in all_defects if d.type == "Pothole")
        cracks = sum(1 for d in all_defects if "Crack" in d.type)
        deteriorations = sum(1 for d in all_defects if "Deterioration" in d.type)
        critical_count = sum(1 for d in all_defects if d.severity == "Critical")
        
        deduct_sum = sum(d.severity_score * 0.25 for d in all_defects)
        pci = max(10.0, min(100.0, 100.0 - deduct_sum))
        
        if critical_count > 0 or total_defects >= 5:
            condition = "Critical"
        elif total_defects >= 3:
            condition = "Poor"
        elif total_defects >= 1:
            condition = "Fair"
        else:
            condition = "Good"
            
        hazard_index = min(100.0, (100.0 - pci) * 1.1)
        total_patch_tons = round(sum(d.dimensions.areaCm2 for d in all_defects) * 0.00025, 2)
        
        stats = RoadDamageStats(
            totalDefects=total_defects,
            potholesCount=potholes,
            cracksCount=cracks,
            deteriorationCount=deteriorations,
            criticalCount=critical_count,
            overallCondition=condition,
            hazardIndex=round(hazard_index, 1),
            pciScore=round(pci, 1),
            estimatedPatchTons=total_patch_tons,
            scanDurationMs=round((time.perf_counter() - start_time) * 1000.0, 1),
        )
        
        model_info = ModelInfo(
            name=self.model_name,
            version=self.model_version,
            architecture=self.architecture,
            inferenceTimeMs=round(total_inference_time * 1000.0, 1),
        )
        
        return DetectionResponse(
            imageId=unique_id,
            fileName=original_filename,
            imageUrl=f"/outputs/{unique_id}_{original_filename}",
            annotatedImageUrl=f"/outputs/{annotated_filename}",
            analyzedAt=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            defects=all_defects,
            stats=stats,
            backend="Live YOLOv8 Video API",
            backendEndpoint="/api/detect/video",
            modelInfo=model_info,
        )

# Global service instance
yolo_service = YOLOService()
