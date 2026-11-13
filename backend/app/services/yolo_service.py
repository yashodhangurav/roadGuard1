import os
import time
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple
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
        self.model = None
        self.model_loaded = False
        self.model_name = "YOLOv8s-RoadDamage-Edge"
        self.model_version = "v1.0.0-verified"
        self.architecture = "YOLOv8s (Ultralytics PyTorch)"
        
        model_path = Path(settings.YOLO_MODEL_PATH)
        if model_path.exists():
            try:
                logger.info(f"Loading YOLO weights from {model_path}...")
                self.model = YOLO(str(model_path))
                self.model_loaded = True
                logger.info(f"YOLO model successfully loaded. Classes: {self.model.names}")
            except Exception as e:
                logger.error(f"Error loading YOLO weights: {e}")
                self.model_loaded = False
        else:
            logger.warning(f"Model path {model_path} not found. Attempting fallback {settings.YOLO_FALLBACK_MODEL}")
            try:
                self.model = YOLO(settings.YOLO_FALLBACK_MODEL)
                self.model_loaded = True
            except Exception as e:
                logger.error(f"Fallback model failed to load: {e}")
                self.model_loaded = False

    def detect_image(self, image_bytes: bytes, original_filename: str) -> DetectionResponse:
        """
        Executes YOLO inference, computes severity metrics, generates annotated image,
        and returns validated DetectionResponse.
        """
        start_time = time.perf_counter()
        
        # Decode image using OpenCV
        np_arr = np.frombuffer(image_bytes, np.uint8)
        image_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image_bgr is None:
            raise ValueError("Could not decode image file into valid OpenCV matrix")
            
        img_h, img_w = image_bgr.shape[:2]
        unique_id = f"SCAN-{uuid.uuid4().hex[:8].upper()}"
        
        # Save raw upload for audit
        upload_path = settings.UPLOADS_DIR / f"{unique_id}_{original_filename}"
        with open(upload_path, "wb") as f:
            f.write(image_bytes)
            
        defects: List[DetectedDefect] = []
        annotated_bgr = image_bgr.copy()
        
        if not self.model_loaded or self.model is None:
            raise RuntimeError("YOLO model checkpoint is not initialized or failed to load")
            
        # Run inference
        results = self.model.predict(
            source=image_bgr,
            conf=settings.CONFIDENCE_THRESHOLD,
            iou=settings.IOU_THRESHOLD,
            verbose=False
        )
        
        inference_time_ms = round((time.perf_counter() - start_time) * 1000.0, 1)
        
        if len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            for idx, box in enumerate(boxes):
                cls_idx = int(box.cls[0].item())
                conf = float(box.conf[0].item()) * 100.0
                xyxy = [float(v) for v in box.xyxy[0].tolist()]
                
                # Class resolution:
                # Checkpoint maps class 0 to road damage / pothole
                raw_name = self.model.names.get(cls_idx, "0")
                if str(raw_name).lower() in ["0", "pothole", "d40"]:
                    damage_type = "Pothole"
                    raw_code = "D40"
                elif str(raw_name).lower() in ["1", "d00", "longitudinal_crack"]:
                    damage_type = "Longitudinal Crack"
                    raw_code = "D00"
                elif str(raw_name).lower() in ["2", "d10", "transverse_crack"]:
                    damage_type = "Transverse Crack"
                    raw_code = "D10"
                elif str(raw_name).lower() in ["3", "d20", "alligator_crack"]:
                    damage_type = "Alligator Crack"
                    raw_code = "D20"
                else:
                    damage_type = "Pothole"
                    raw_code = "D40"
                    
                # Compute severity via deterministic image analysis
                severity_info = calculate_defect_severity(image_bgr, xyxy)
                
                # Normalized percentages (0 - 100) for frontend
                x1, y1, x2, y2 = xyxy
                norm_x = round((x1 / img_w) * 100.0, 2)
                norm_y = round((y1 / img_h) * 100.0, 2)
                norm_w = round(((x2 - x1) / img_w) * 100.0, 2)
                norm_h = round(((y2 - y1) / img_h) * 100.0, 2)
                
                defect_id = f"DEF-{unique_id}-{idx + 1:02d}"
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
        
        video_path = settings.UPLOADS_DIR / f"{unique_id}_{original_filename}"
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
                results = self.model.predict(
                    source=frame,
                    conf=settings.CONFIDENCE_THRESHOLD,
                    iou=settings.IOU_THRESHOLD,
                    verbose=False
                )
                total_inference_time += (time.perf_counter() - t0)
                
                frame_defects = []
                frame_max_score = 0.0
                
                if len(results) > 0 and results[0].boxes is not None:
                    for b_idx, box in enumerate(results[0].boxes):
                        cls_idx = int(box.cls[0].item())
                        conf = float(box.conf[0].item()) * 100.0
                        xyxy = [float(v) for v in box.xyxy[0].tolist()]
                        
                        raw_name = self.model.names.get(cls_idx, "0")
                        damage_type = "Pothole"
                        raw_code = "D40"
                        if str(raw_name).lower() in ["1", "d00", "longitudinal_crack"]:
                            damage_type = "Longitudinal Crack"
                            raw_code = "D00"
                        elif str(raw_name).lower() in ["2", "d10", "transverse_crack"]:
                            damage_type = "Transverse Crack"
                            raw_code = "D10"
                        elif str(raw_name).lower() in ["3", "d20", "alligator_crack"]:
                            damage_type = "Alligator Crack"
                            raw_code = "D20"
                            
                        severity_info = calculate_defect_severity(frame, xyxy)
                        frame_max_score = max(frame_max_score, severity_info["score"])
                        
                        x1, y1, x2, y2 = xyxy
                        norm_x = round((x1 / img_w) * 100.0, 2)
                        norm_y = round((y1 / img_h) * 100.0, 2)
                        norm_w = round(((x2 - x1) / img_w) * 100.0, 2)
                        norm_h = round(((y2 - y1) / img_h) * 100.0, 2)
                        
                        timestamp_sec = round(frame_idx / fps, 1)
                        defect_id = f"DEF-{unique_id}-F{frame_idx}-{b_idx + 1:02d}"
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
