import os
import json
import uuid
import traceback
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.services.yolo_service import yolo_service
from app.services.phash_service import phash_service
from app.services.orb_service import orb_service
from app.services.exif_service import exif_service
from app.services.hybrid_duplicate_engine import (
    hybrid_duplicate_engine,
    DuplicateVerdict,
    MatchType,
    DuplicateEngineThresholds
)
from app.database.session import get_db
from app.database.models import InspectionReportORM, DefectItemORM, MaintainerORM
from app.services.repair_verification_service import repair_verification_service
from app.schemas.maintainers import (
    TaskAssignmentRequestSchema,
    TaskAssignmentResponseSchema,
    AIRepairVerificationResponseSchema,
    ManualRepairDecisionRequestSchema,
)
from app.database.mongodb import (
    save_synced_report_to_mongodb,
    find_by_client_report_id,
    get_reports_collection,
    find_nearby_reports,
    haversine_distance_meters,
    find_reports_by_canonical_id,
    find_pending_duplicate_reviews,
    update_duplicate_review_decision,
    update_report_progress_stage,
    add_repair_progress_photo,
    find_report_by_id_or_client_id,
    STAGE_TO_STATUS_MAP,
    VALID_PROGRESS_STAGES,
    assign_report_to_maintainer,
    update_report_ai_repair_verification,
    get_maintainer_by_id,
)
from app.schemas.reports import (
    ReportSummarySchema,
    ReportDetailSchema,
    DefectItemSchema,
    StatisticsResponse,
    NearbyReportItemSchema,
    NearbyReportsResponse,
    DuplicateCandidateSchema,
    DuplicateDetectionSummarySchema,
    CheckDuplicateResponse,
    OrbMatchingMetricsSchema,
    DuplicateReviewRequestSchema,
    DuplicateReviewResponseSchema,
    RepairPhotoSchema,
    RepairProgressHistoryEntrySchema,
    ProgressStageUpdateRequestSchema,
    ProgressResponseSchema,
    UploadPhotoResponseSchema,
)

router = APIRouter(tags=["Inspection Reports & Statistics"])

ALLOWED_SYNC_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

def evaluate_hybrid_duplicates(
    content: bytes,
    query_phash: Optional[str],
    candidate_reports: List[Dict[str, Any]],
    kps_query: Optional[List[Any]] = None,
    des_query: Optional[Any] = None,
    exclude_client_id: Optional[str] = None
) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Hybrid duplicate detection combining 64-bit DCT pHash and OpenCV ORB + RANSAC.
    Delegates candidate evaluation to HybridDuplicateEngine.
    """
    if kps_query is None or des_query is None:
        kps_query, des_query, _ = orb_service.extract_features(content)

    orb_kps_count = len(kps_query) if kps_query else 0
    duplicate_candidates = []

    for cand in candidate_reports:
        cand_id = str(cand.get("id") or cand.get("client_report_id") or "")
        cand_client_id = str(cand.get("client_report_id") or "")
        if exclude_client_id and (cand_id == exclude_client_id or cand_client_id == exclude_client_id):
            continue

        res = hybrid_duplicate_engine.evaluate_candidate(
            candidate=cand,
            query_phash=query_phash,
            kps_query=kps_query,
            des_query=des_query
        )
        if res["verdict"] in (DuplicateVerdict.CONFIRMED_DUPLICATE.value, DuplicateVerdict.NEEDS_REVIEW.value) or res["evidence_score"] > 30.0:
            duplicate_candidates.append({
                "report_id": res["report_id"],
                "client_report_id": res["client_report_id"],
                "canonical_issue_id": res["canonical_issue_id"],
                "distance": res["phash_distance"],
                "similarity_score": res["evidence_score"],
                "match_level": res["verdict"],
                "match_type": res["match_type"],
                "match_reason": res["match_reason"],
                "verdict": res["verdict"],
                "confidence_tier": res["confidence_tier"],
                "evidence_score": res["evidence_score"],
                "is_candidate_duplicate": res["verdict"] in (DuplicateVerdict.CONFIRMED_DUPLICATE.value, DuplicateVerdict.NEEDS_REVIEW.value),
                "category": res["category"],
                "severity": res["severity"],
                "status": res["status"],
                "distance_meters": res["distance_meters"],
                "address": res["address"],
                "image_url": res["image_url"],
                "annotated_image_url": res["annotated_image_url"],
                "submitted_at": res["submitted_at"],
                "orb_metrics": res["orb_metrics"]
            })

    duplicate_candidates.sort(key=lambda x: -x["similarity_score"])
    return orb_kps_count, duplicate_candidates

@router.post(
    "/reports/sync",
    summary="Synchronize an offline road incident report to MongoDB Atlas and SQLite",
    description="Accepts multipart form-data with client UUID, image binary, GPS telemetry, and road hazard metadata. Guarantees idempotency."
)
async def sync_report(
    image: UploadFile = File(..., description="Road damage photograph binary"),
    client_report_id: str = Form(..., description="Unique client-generated report UUID for idempotency"),
    category: str = Form("Pothole", description="Road damage category"),
    severity: str = Form("High", description="Distress severity level (Low, Medium, High, Critical)"),
    description: Optional[str] = Form("", description="Citizen observations and description"),
    latitude: float = Form(..., description="GPS Latitude (-90 to 90)"),
    longitude: float = Form(..., description="GPS Longitude (-180 to 180)"),
    address: Optional[str] = Form(None, description="Human-readable street or junction address"),
    city: Optional[str] = Form("San Francisco", description="City / Municipality name"),
    is_manual_correction: bool = Form(False, description="Whether GPS location was manually adjusted by citizen"),
    accuracy_meters: Optional[float] = Form(None, description="GNSS accuracy in meters"),
    citizen_id: Optional[str] = Form("CIT-ANON", description="Authenticated citizen user ID"),
    citizen_name: Optional[str] = Form("Citizen Reporter", description="Authenticated citizen full name"),
    submitted_at: Optional[str] = Form(None, description="Original ISO client submission timestamp"),
    original_image: Optional[UploadFile] = File(None, description="Raw unstamped camera frame if in-app camera capture"),
    altitude: Optional[float] = Form(None, description="GPS Altitude in meters AMSL"),
    capture_timestamp: Optional[str] = Form(None, description="Timestamp of photograph capture event"),
    capture_method: str = Form("in_app_camera", description="Method of capture: 'in_app_camera' or 'existing_geotagged_upload'"),
    camera_make: Optional[str] = Form(None, description="Camera device manufacturer"),
    camera_model: Optional[str] = Form(None, description="Camera hardware model"),
    db: Session = Depends(get_db)
):
    # 1. Validate UUID format
    clean_client_id = client_report_id.strip()
    if not clean_client_id or len(clean_client_id) < 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid unique client_report_id (UUID) is required for idempotency."
        )

    # 2. Validate GPS coordinates
    if not (-90.0 <= latitude <= 90.0) or not (-180.0 <= longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid GPS coordinates ({latitude}, {longitude}). Latitude must be [-90, 90] and Longitude [-180, 180]."
        )

    # 3. Check for existing report in MongoDB Atlas (Idempotency check)
    existing_mongo = find_by_client_report_id(clean_client_id)
    if existing_mongo:
        return {
            "success": True,
            "message": "Report already synchronized (idempotent)",
            "report_id": str(existing_mongo["_id"]),
            "client_report_id": clean_client_id,
            "sync_status": "synced",
            "image_url": existing_mongo.get("image_url"),
            "annotated_image_url": existing_mongo.get("annotated_image_url"),
            "ai_verified": bool(existing_mongo.get("yolo_detection", {}).get("total_defects", 0) > 0),
            "created_at": existing_mongo.get("created_at").isoformat() if hasattr(existing_mongo.get("created_at"), "isoformat") else str(existing_mongo.get("created_at")),
            "yolo_detection": existing_mongo.get("yolo_detection"),
            "canonical_issue_id": existing_mongo.get("canonical_issue_id"),
            "is_duplicate": bool(existing_mongo.get("is_duplicate", False)),
            "duplicate_status": existing_mongo.get("duplicate_status", "NEW_ISSUE"),
            "duplicate_review_status": existing_mongo.get("duplicate_review_status", "RESOLVED"),
            "duplicate_match_type": existing_mongo.get("duplicate_match_type", "NONE"),
            "duplicate_match_reason": existing_mongo.get("duplicate_match_reason"),
        }

    # 4. Validate image format and size
    ext = os.path.splitext(image.filename or "")[1].lower()
    if ext not in ALLOWED_SYNC_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image format '{ext}'. Supported formats: JPG, JPEG, PNG, WEBP."
        )

    try:
        content = await image.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read image payload: {str(e)}"
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image payload is empty (0 bytes)."
        )

    if len(content) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size exceeds maximum limit of {settings.MAX_FILE_SIZE_MB}MB."
        )

    # 4.5. Server-side Geotag Verification & EXIF Validation
    geotag_verified = False
    exif_metadata_available = False
    original_image_path = None

    clean_capture_method = capture_method.strip().lower()
    if clean_capture_method not in ["in_app_camera", "existing_geotagged_upload", "standard_upload", "upload"]:
        clean_capture_method = "standard_upload"

    if clean_capture_method == "existing_geotagged_upload":
        # Validate that the uploaded file has legitimate embedded EXIF GPS metadata
        is_valid_exif, exif_msg, exif_meta = exif_service.validate_uploaded_geotag(
            content=content,
            reported_lat=latitude,
            reported_lng=longitude
        )
        if not is_valid_exif:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=exif_msg
            )
        geotag_verified = True
        exif_metadata_available = True
        if exif_meta.get("altitude") is not None and altitude is None:
            altitude = exif_meta["altitude"]
        if exif_meta.get("capture_timestamp") and not capture_timestamp:
            capture_timestamp = exif_meta["capture_timestamp"]
        if exif_meta.get("camera_make") and not camera_make:
            camera_make = exif_meta["camera_make"]
        if exif_meta.get("camera_model") and not camera_model:
            camera_model = exif_meta["camera_model"]
    elif clean_capture_method in ["standard_upload", "upload"]:
        # Standard user photo upload: EXIF GPS is optional.
        # Check if EXIF is present; if so, extract it opportunistically without failing if absent.
        try:
            is_valid_exif, _, exif_meta = exif_service.validate_uploaded_geotag(
                content=content,
                reported_lat=latitude,
                reported_lng=longitude
            )
            if is_valid_exif and exif_meta:
                geotag_verified = True
                exif_metadata_available = True
                if exif_meta.get("altitude") is not None and altitude is None:
                    altitude = exif_meta["altitude"]
                if exif_meta.get("capture_timestamp") and not capture_timestamp:
                    capture_timestamp = exif_meta["capture_timestamp"]
                if exif_meta.get("camera_make") and not camera_make:
                    camera_make = exif_meta["camera_make"]
                if exif_meta.get("camera_model") and not camera_model:
                    camera_model = exif_meta["camera_model"]
        except Exception:
            pass
    else:
        # In-App Camera: Validate GPS accuracy is within permissible threshold
        if accuracy_meters is not None and accuracy_meters > 100.0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"GPS accuracy (±{accuracy_meters}m) is unacceptable. Must be within ±100m for official defect verification."
            )
        geotag_verified = True

    # Save raw unstamped original image if provided
    if original_image:
        try:
            orig_bytes = await original_image.read()
            if len(orig_bytes) > 0:
                orig_ext = os.path.splitext(original_image.filename or "")[1].lower() or ".jpg"
                orig_filename = f"raw_{clean_client_id}_{uuid.uuid4().hex[:6]}{orig_ext}"
                orig_path = os.path.join(str(settings.OUTPUTS_DIR), orig_filename)
                with open(orig_path, "wb") as f:
                    f.write(orig_bytes)
                original_image_path = f"/outputs/{orig_filename}"
        except Exception as orig_err:
            pass

    # 5. Compute Perceptual Image Hash (pHash) & Extract ORB Feature Descriptors
    image_phash = phash_service.compute_phash(content)
    kps_query, des_query, _ = orb_service.extract_features(content)
    orb_kps_count = len(kps_query) if kps_query else 0

    # Store reusable feature descriptors in memory and disk cache for instant comparisons
    orb_service.save_features_cache(clean_client_id, kps_query, des_query)

    # 6. Execute Computer Vision YOLO Detection
    try:
        det_result = yolo_service.detect_image(content, image.filename or f"{clean_client_id}.jpg")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during computer vision analysis: {str(e)}"
        )

    # 7. Evaluate duplicate candidates against nearby reports using HybridDuplicateEngine
    # GPS proximity filter first -> pHash -> ORB RANSAC -> Multi-tier decision
    dup_eval = {
        "overall_verdict": "NEW_ISSUE",
        "is_duplicate": False,
        "canonical_issue_id": None,
        "duplicate_review_status": "NONE",
        "match_type": "NONE",
        "match_reason": "No nearby duplicates evaluated.",
        "candidates": [],
        "top_match": None,
        "total_nearby_evaluated": 0,
        "orb_keypoints_detected": orb_kps_count,
    }
    try:
        dup_eval = hybrid_duplicate_engine.evaluate_submission(
            image_bytes=content,
            latitude=latitude,
            longitude=longitude,
            category=category,
            query_phash=image_phash,
            kps_query=kps_query,
            des_query=des_query,
            exclude_id=clean_client_id
        )
    except Exception as dup_err:
        traceback.print_exc()

    # 8. Build document for MongoDB Atlas
    try:
        now = datetime.utcnow()
        display_address = address.strip() if address else f"{latitude:.5f}, {longitude:.5f}"
        
        mongo_report_doc = {
            "client_report_id": clean_client_id,
            "category": category.strip(),
            "severity": severity.strip(),
            "description": description.strip() if description else "Citizen reported road distress.",
            "image_url": det_result.imageUrl,
            "annotated_image_url": det_result.annotatedImageUrl,
            "image_phash": image_phash,
            "orb_keypoints_count": orb_kps_count,
            "canonical_issue_id": dup_eval["canonical_issue_id"],
            "is_duplicate": dup_eval["is_duplicate"],
            "duplicate_status": dup_eval["overall_verdict"],
            "duplicate_review_status": dup_eval["duplicate_review_status"],
            "duplicate_match_type": dup_eval["match_type"],
            "duplicate_match_reason": dup_eval["match_reason"],
            "location": {
                "type": "Point",
                "coordinates": [longitude, latitude],
                "address": display_address,
                "city": city.strip() if city else "San Francisco",
                "is_manual_correction": is_manual_correction,
                "accuracy_meters": accuracy_meters,
            },
            "citizen": {
                "id": citizen_id.strip() if citizen_id else "CIT-ANON",
                "name": citizen_name.strip() if citizen_name else "Citizen Reporter",
            },
            "status": "Submitted",
            "submitted_at": submitted_at or now.isoformat(),
            "created_at": now,
            "synced_at": now,
            "duplicate_analysis": {
                "verdict": dup_eval["overall_verdict"],
                "has_duplicate_candidate": len(dup_eval["candidates"]) > 0,
                "candidate_count": len(dup_eval["candidates"]),
                "canonical_issue_id": dup_eval["canonical_issue_id"],
                "review_status": dup_eval["duplicate_review_status"],
                "match_type": dup_eval["match_type"],
                "match_reason": dup_eval["match_reason"],
                "closest_match_distance": dup_eval["top_match"]["phash_distance"] if dup_eval["top_match"] else None,
                "closest_match_similarity": dup_eval["top_match"]["evidence_score"] if dup_eval["top_match"] else None,
                "closest_match_id": dup_eval["top_match"]["report_id"] if dup_eval["top_match"] else None,
                "candidates": dup_eval["candidates"],
            },
            "yolo_detection": {
                "model_name": det_result.modelInfo.name,
                "model_version": det_result.modelInfo.version,
                "inference_time_ms": det_result.stats.scanDurationMs,
                "total_defects": det_result.stats.totalDefects,
                "potholes_count": det_result.stats.potholesCount,
                "cracks_count": det_result.stats.cracksCount,
                "critical_count": det_result.stats.criticalCount,
                "overall_condition": det_result.stats.overallCondition,
                "pci_score": det_result.stats.pciScore,
                "hazard_index": det_result.stats.hazardIndex,
                "estimated_patch_tons": det_result.stats.estimatedPatchTons,
                "defects": [
                    {
                        "id": d.id,
                        "type": d.type,
                        "raw_class": d.raw_class,
                        "severity": d.severity,
                        "confidence": d.confidence,
                        "box": {
                            "x": d.box.x,
                            "y": d.box.y,
                            "width": d.box.width,
                            "height": d.box.height,
                        },
                        "dimensions": {
                            "widthCm": d.dimensions.widthCm,
                            "heightCm": d.dimensions.heightCm,
                            "estimatedDepthMm": d.dimensions.estimatedDepthMm,
                            "areaCm2": d.dimensions.areaCm2,
                        },
                        "urgency": d.urgency,
                        "repair_method": d.repairMethod,
                    }
                    for d in det_result.defects
                ],
            },
            "current_stage": "Reported",
            "assigned_department": None,
            "assigned_crew": None,
            "expected_completion_date": None,
            "before_images": [det_result.imageUrl] if det_result.imageUrl else [],
            "during_images": [],
            "after_images": [],
            "reopened_count": 0,
            "reopened_reason": None,
            "altitude": altitude,
            "gps_accuracy": accuracy_meters,
            "readable_address": display_address,
            "capture_timestamp": capture_timestamp or submitted_at or now.isoformat(),
            "upload_timestamp": now.isoformat(),
            "capture_method": clean_capture_method,
            "geotag_verified": geotag_verified,
            "exif_metadata_available": exif_metadata_available,
            "camera_make": camera_make,
            "camera_model": camera_model,
            "original_image_path": original_image_path,
            "stamped_image_path": det_result.imageUrl,
            "repair_progress_history": [
                {
                    "id": f"prog-{uuid.uuid4().hex[:8]}",
                    "stage": "Reported",
                    "status": "Submitted",
                    "timestamp": submitted_at or now.isoformat(),
                    "actor_name": citizen_name or "Citizen Reporter",
                    "actor_role": "Citizen",
                    "department": None,
                    "crew": None,
                    "expected_completion_date": None,
                    "notes": description.strip() if description else f"Citizen report logged with {det_result.stats.totalDefects} AI detected distress features.",
                    "reopen_reason": None,
                    "photos": [
                        {
                            "url": det_result.imageUrl,
                            "stage": "before",
                            "caption": "Initial citizen evidence photograph",
                            "actor_name": citizen_name or "Citizen Reporter",
                            "actor_role": "Citizen",
                            "uploaded_at": submitted_at or now.isoformat(),
                        }
                    ] if det_result.imageUrl else [],
                }
            ],
            "timeline": [
                {
                    "status": "Submitted",
                    "timestamp": submitted_at or now.isoformat(),
                    "note": f"Report synchronized via offline background sync. AI verified {det_result.stats.totalDefects} defects (PCI: {det_result.stats.pciScore}/100)."
                }
            ]
        }

        # 9. Persist to MongoDB Atlas
        is_new, mongo_id = save_synced_report_to_mongodb(mongo_report_doc)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving to MongoDB: {str(e)}"
        )

    # 10. Dual-persist to SQLite ORM to keep existing admin dashboard & legacy queries consistent
    try:
        init_history_json = json.dumps(mongo_report_doc.get("repair_progress_history", []))
        report_orm = InspectionReportORM(
            id=clean_client_id,
            file_name=det_result.fileName,
            image_url=det_result.imageUrl,
            annotated_image_url=det_result.annotatedImageUrl,
            analyzed_at=now,
            total_defects=det_result.stats.totalDefects,
            potholes_count=det_result.stats.potholesCount,
            cracks_count=det_result.stats.cracksCount,
            critical_count=det_result.stats.criticalCount,
            overall_condition=det_result.stats.overallCondition,
            pci_score=det_result.stats.pciScore,
            hazard_index=det_result.stats.hazardIndex,
            estimated_patch_tons=det_result.stats.estimatedPatchTons,
            location_name=display_address,
            latitude=latitude,
            longitude=longitude,
            image_phash=image_phash,
            orb_keypoints_count=orb_kps_count,
            canonical_issue_id=dup_eval["canonical_issue_id"],
            is_duplicate=dup_eval["is_duplicate"],
            duplicate_status=dup_eval["overall_verdict"],
            duplicate_review_status=dup_eval["duplicate_review_status"],
            duplicate_match_type=dup_eval["match_type"],
            duplicate_match_reason=dup_eval["match_reason"],
            current_stage="Reported",
            assigned_department=None,
            assigned_crew=None,
            expected_completion_date=None,
            repair_progress_json=init_history_json,
            before_images_json=json.dumps([det_result.imageUrl] if det_result.imageUrl else []),
            during_images_json=json.dumps([]),
            after_images_json=json.dumps([]),
            reopened_count=0,
            reopened_reason=None,
            altitude=altitude,
            gps_accuracy=accuracy_meters,
            readable_address=display_address,
            capture_timestamp=capture_timestamp or submitted_at or now.isoformat(),
            upload_timestamp=now.isoformat(),
            capture_method=clean_capture_method,
            geotag_verified=geotag_verified,
            exif_metadata_available=exif_metadata_available,
            camera_make=camera_make,
            camera_model=camera_model,
            original_image_path=original_image_path,
            stamped_image_path=det_result.imageUrl,
        )
        db.add(report_orm)
        db.flush()

        for d in det_result.defects:
            defect_orm = DefectItemORM(
                id=d.id,
                report_id=clean_client_id,
                type=d.type,
                raw_class=d.raw_class,
                severity=d.severity,
                severity_score=d.severity_score,
                confidence=d.confidence,
                box_x=d.box.x,
                box_y=d.box.y,
                box_width=d.box.width,
                box_height=d.box.height,
                width_cm=d.dimensions.widthCm,
                height_cm=d.dimensions.heightCm,
                estimated_depth_mm=d.dimensions.estimatedDepthMm,
                area_cm2=d.dimensions.areaCm2,
                urgency=d.urgency,
                repair_method=d.repairMethod,
            )
            db.add(defect_orm)
        db.commit()
    except Exception as orm_err:
        db.rollback()
        # Non-fatal if SQLite already has this ID (idempotent)
        pass

    return {
        "success": True,
        "message": "Report synchronized successfully",
        "id": mongo_id,
        "report_id": mongo_id,
        "client_report_id": clean_client_id,
        "sync_status": "synced",
        "image_url": det_result.imageUrl,
        "annotated_image_url": det_result.annotatedImageUrl,
        "ai_verified": len(det_result.defects) > 0,
        "pci_score": det_result.stats.pciScore,
        "overall_condition": det_result.stats.overallCondition,
        "total_defects": det_result.stats.totalDefects,
        "image_phash": image_phash,
        "orb_keypoints_detected": orb_kps_count,
        "canonical_issue_id": dup_eval["canonical_issue_id"],
        "is_duplicate": dup_eval["is_duplicate"],
        "duplicate_status": dup_eval["overall_verdict"],
        "duplicate_review_status": dup_eval["duplicate_review_status"],
        "duplicate_match_type": dup_eval["match_type"],
        "duplicate_match_reason": dup_eval["match_reason"],
        "altitude": altitude,
        "gps_accuracy": accuracy_meters,
        "readable_address": display_address,
        "capture_timestamp": capture_timestamp or submitted_at or now.isoformat(),
        "upload_timestamp": now.isoformat(),
        "capture_method": clean_capture_method,
        "geotag_verified": geotag_verified,
        "exif_metadata_available": exif_metadata_available,
        "camera_make": camera_make,
        "camera_model": camera_model,
        "original_image_path": original_image_path,
        "original_image_url": original_image_path,
        "stamped_image_path": det_result.imageUrl,
        "stamped_image_url": det_result.imageUrl,
        "duplicate_detection": {
            "image_phash": image_phash,
            "orb_keypoints_detected": orb_kps_count,
            "overall_verdict": dup_eval["overall_verdict"],
            "canonical_issue_id": dup_eval["canonical_issue_id"],
            "duplicate_review_status": dup_eval["duplicate_review_status"],
            "candidates_evaluated": dup_eval["total_nearby_evaluated"],
            "has_potential_duplicate": len(dup_eval["candidates"]) > 0,
            "duplicate_candidates": dup_eval["candidates"],
            "top_match": dup_eval["top_match"],
        }
    }

@router.get(
    "/reports",
    response_model=List[ReportSummarySchema],
    summary="List all road damage inspection reports",
    description="Returns stored inspection records with optional condition filtering, search, and pagination.",
)
def get_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    condition: Optional[str] = Query(None, description="Filter by condition (Critical, Poor, Fair, Good)"),
    search: Optional[str] = Query(None, description="Search by location or filename"),
    db: Session = Depends(get_db)
):
    query = db.query(InspectionReportORM)
    if condition:
        query = query.filter(InspectionReportORM.overall_condition.ilike(condition))
    if search:
        query = query.filter(
            (InspectionReportORM.location_name.ilike(f"%{search}%")) |
            (InspectionReportORM.file_name.ilike(f"%{search}%"))
        )
    reports = query.order_by(InspectionReportORM.analyzed_at.desc()).offset(skip).limit(limit).all()
    
    results = []
    for r in reports:
        b_imgs = [r.image_url] if r.image_url else []
        d_imgs = []
        a_imgs = []
        try:
            if r.before_images_json:
                b_imgs = json.loads(r.before_images_json)
        except Exception:
            pass
        try:
            if r.during_images_json:
                d_imgs = json.loads(r.during_images_json)
        except Exception:
            pass
        try:
            if r.after_images_json:
                a_imgs = json.loads(r.after_images_json)
        except Exception:
            pass

        results.append(ReportSummarySchema(
            id=r.id,
            file_name=r.file_name,
            image_url=r.image_url,
            annotated_image_url=r.annotated_image_url,
            analyzed_at=r.analyzed_at.isoformat() if r.analyzed_at else "",
            total_defects=r.total_defects,
            potholes_count=r.potholes_count,
            cracks_count=r.cracks_count,
            critical_count=r.critical_count,
            overall_condition=r.overall_condition,
            pci_score=r.pci_score,
            hazard_index=r.hazard_index,
            estimated_patch_tons=r.estimated_patch_tons,
            location_name=r.location_name,
            latitude=r.latitude,
            longitude=r.longitude,
            image_phash=r.image_phash,
            orb_keypoints_count=r.orb_keypoints_count or 0,
            canonical_issue_id=r.canonical_issue_id,
            is_duplicate=r.is_duplicate or False,
            duplicate_status=r.duplicate_status or "NEW_ISSUE",
            duplicate_review_status=r.duplicate_review_status or "NONE",
            duplicate_match_type=r.duplicate_match_type,
            current_stage=r.current_stage or "Reported",
            assigned_department=r.assigned_department,
            assigned_crew=r.assigned_crew,
            expected_completion_date=r.expected_completion_date,
            reopened_count=r.reopened_count or 0,
            reopened_reason=r.reopened_reason,
            before_images=b_imgs,
            during_images=d_imgs,
            after_images=a_imgs,
            altitude=r.altitude,
            gps_accuracy=r.gps_accuracy,
            readable_address=r.readable_address or r.location_name,
            capture_timestamp=r.capture_timestamp,
            upload_timestamp=r.upload_timestamp,
            capture_method=r.capture_method or "in_app_camera",
            geotag_verified=r.geotag_verified or False,
            exif_metadata_available=r.exif_metadata_available or False,
            camera_make=r.camera_make,
            camera_model=r.camera_model,
            original_image_path=r.original_image_path,
            original_image_url=r.original_image_path,
            stamped_image_path=r.stamped_image_path or r.image_url,
            stamped_image_url=r.stamped_image_path or r.image_url,
        ))
    return results

@router.post(
    "/reports/check-duplicate",
    response_model=CheckDuplicateResponse,
    summary="Check image against nearby reports using hybrid GPS + pHash + OpenCV ORB engine",
    description="Spatial proximity gating, 64-bit DCT pHash, and OpenCV ORB feature matching with RANSAC homography. Categorizes candidate issues into confirmed, uncertain, or new issue."
)
async def check_duplicate_image(
    image: UploadFile = File(..., description="Road damage photograph binary"),
    latitude: float = Form(..., description="Center GPS Latitude"),
    longitude: float = Form(..., description="Center GPS Longitude"),
    radius_meters: float = Form(50.0, description="Search radius in meters"),
    category: Optional[str] = Form(None, description="Optional defect category"),
    db: Session = Depends(get_db)
):
    try:
        content = await image.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image payload: {e}")

    if not content:
        raise HTTPException(status_code=400, detail="Empty image payload (0 bytes).")

    query_phash = phash_service.compute_phash(content)
    if not query_phash:
        raise HTTPException(status_code=422, detail="Could not compute perceptual image hash from payload.")

    kps_query, des_query, _ = orb_service.extract_features(content)

    dup_eval = hybrid_duplicate_engine.evaluate_submission(
        image_bytes=content,
        latitude=latitude,
        longitude=longitude,
        category=category,
        query_phash=query_phash,
        kps_query=kps_query,
        des_query=des_query,
        search_radius_meters=radius_meters
    )

    return CheckDuplicateResponse(
        query_phash=query_phash,
        orb_keypoints_detected=dup_eval["orb_keypoints_detected"],
        search_radius_meters=radius_meters,
        total_nearby_evaluated=dup_eval["total_nearby_evaluated"],
        has_duplicate_candidate=len(dup_eval["candidates"]) > 0,
        overall_verdict=dup_eval["overall_verdict"],
        duplicate_candidates=[
            DuplicateCandidateSchema(
                report_id=c["report_id"],
                client_report_id=c.get("client_report_id"),
                canonical_issue_id=c.get("canonical_issue_id"),
                distance=c["phash_distance"],
                similarity_score=c["evidence_score"],
                match_level=c["verdict"],
                match_type=c["match_type"],
                match_reason=c["match_reason"],
                verdict=c["verdict"],
                confidence_tier=c["confidence_tier"],
                evidence_score=c["evidence_score"],
                is_candidate_duplicate=c["verdict"] in (DuplicateVerdict.CONFIRMED_DUPLICATE.value, DuplicateVerdict.NEEDS_REVIEW.value),
                category=c["category"],
                severity=c["severity"],
                status=c["status"],
                distance_meters=c["distance_meters"],
                address=c["address"],
                image_url=c["image_url"],
                annotated_image_url=c["annotated_image_url"],
                submitted_at=c["submitted_at"],
                orb_metrics=c["orb_metrics"]
            )
            for c in dup_eval["candidates"]
        ]
    )

@router.get(
    "/reports/nearby",
    response_model=NearbyReportsResponse,
    summary="Find existing road hazard reports nearby",
    description="Geospatial search using MongoDB Atlas 2dsphere and SQLite fallback within radius_meters (default 50m)."
)
def get_nearby_reports(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Center GPS Latitude (-90 to 90)"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Center GPS Longitude (-180 to 180)"),
    radius_meters: float = Query(50.0, ge=1.0, le=50000.0, description="Search radius in meters (default 50m)"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of nearby reports to return"),
    db: Session = Depends(get_db)
):
    seen_ids = set()
    combined_reports = []

    # 1. Primary: Search MongoDB Atlas using 2dsphere index
    mongo_reports = find_nearby_reports(
        latitude=latitude,
        longitude=longitude,
        radius_meters=radius_meters,
        limit=limit
    )
    for r in mongo_reports:
        seen_ids.add(r["id"])
        if r.get("client_report_id"):
            seen_ids.add(r["client_report_id"])
        combined_reports.append(NearbyReportItemSchema(**r))

    # 2. Secondary / Fallback: Search SQLite ORM for any additional reports
    deg_offset = (radius_meters / 111000.0) * 1.5
    min_lat, max_lat = latitude - deg_offset, latitude + deg_offset
    min_lng, max_lng = longitude - deg_offset, longitude + deg_offset

    try:
        sqlite_reports = db.query(InspectionReportORM).filter(
            InspectionReportORM.latitude.between(min_lat, max_lat),
            InspectionReportORM.longitude.between(min_lng, max_lng)
        ).all()

        for sr in sqlite_reports:
            if sr.id in seen_ids:
                continue

            dist = haversine_distance_meters(latitude, longitude, sr.latitude, sr.longitude)
            if dist <= radius_meters:
                seen_ids.add(sr.id)
                category = "Pothole" if sr.potholes_count > 0 else "Longitudinal Crack" if sr.cracks_count > 0 else "Other"
                severity = "Critical" if sr.critical_count > 0 or sr.overall_condition == "Critical" else "High" if sr.overall_condition == "Poor" else "Medium"
                combined_reports.append(NearbyReportItemSchema(
                    id=sr.id,
                    client_report_id=sr.id,
                    category=category,
                    severity=severity,
                    status="Submitted",
                    description=f"Road inspection record ({sr.total_defects} defects detected)",
                    latitude=sr.latitude,
                    longitude=sr.longitude,
                    address=sr.location_name or f"{sr.latitude:.5f}, {sr.longitude:.5f}",
                    distance_meters=dist,
                    image_url=sr.image_url,
                    annotated_image_url=sr.annotated_image_url,
                    image_phash=sr.image_phash,
                    submitted_at=sr.analyzed_at.isoformat() if sr.analyzed_at else None,
                    pci_score=sr.pci_score,
                    total_defects=sr.total_defects,
                ))
    except Exception:
        pass

    # Sort combined reports by distance
    combined_reports.sort(key=lambda x: x.distance_meters)
    combined_reports = combined_reports[:limit]

    return NearbyReportsResponse(
        center={"latitude": latitude, "longitude": longitude},
        radius_meters=radius_meters,
        total_found=len(combined_reports),
        reports=combined_reports
    )

@router.get(
    "/reports/{report_id}",
    response_model=ReportDetailSchema,
    summary="Get single inspection report with defects",
    description="Returns detailed report by ID including all detected defect coordinates and metrics.",
)
def get_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(InspectionReportORM).filter(InspectionReportORM.id == report_id).first()
    if not report:
        mongo_doc = find_report_by_id_or_client_id(report_id)
        if mongo_doc and mongo_doc.get("client_report_id"):
            report = db.query(InspectionReportORM).filter(InspectionReportORM.id == mongo_doc["client_report_id"]).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection report with ID '{report_id}' not found."
        )

    defects = []
    for d in report.defects:
        defects.append(DefectItemSchema(
            id=d.id,
            report_id=d.report_id,
            type=d.type,
            raw_class=d.raw_class,
            severity=d.severity,
            severity_score=d.severity_score,
            confidence=d.confidence,
            box={
                "x": d.box_x,
                "y": d.box_y,
                "width": d.box_width,
                "height": d.box_height,
            },
            dimensions={
                "widthCm": d.width_cm,
                "heightCm": d.height_cm,
                "estimatedDepthMm": d.estimated_depth_mm,
                "areaCm2": d.area_cm2,
            },
            urgency=d.urgency,
            repair_method=d.repair_method,
        ))

    b_imgs = [report.image_url] if report.image_url else []
    d_imgs = []
    a_imgs = []
    try:
        if report.before_images_json:
            b_imgs = json.loads(report.before_images_json)
    except Exception:
        pass
    try:
        if report.during_images_json:
            d_imgs = json.loads(report.during_images_json)
    except Exception:
        pass
    try:
        if report.after_images_json:
            a_imgs = json.loads(report.after_images_json)
    except Exception:
        pass

    return ReportDetailSchema(
        id=report.id,
        file_name=report.file_name,
        image_url=report.image_url,
        annotated_image_url=report.annotated_image_url,
        analyzed_at=report.analyzed_at.isoformat() if report.analyzed_at else "",
        total_defects=report.total_defects,
        potholes_count=report.potholes_count,
        cracks_count=report.cracks_count,
        critical_count=report.critical_count,
        overall_condition=report.overall_condition,
        pci_score=report.pci_score,
        hazard_index=report.hazard_index,
        estimated_patch_tons=report.estimated_patch_tons,
        location_name=report.location_name,
        latitude=report.latitude,
        longitude=report.longitude,
        image_phash=report.image_phash,
        orb_keypoints_count=report.orb_keypoints_count or 0,
        canonical_issue_id=report.canonical_issue_id,
        is_duplicate=report.is_duplicate or False,
        duplicate_status=report.duplicate_status or "NEW_ISSUE",
        duplicate_review_status=report.duplicate_review_status or "NONE",
        duplicate_match_type=report.duplicate_match_type,
        current_stage=report.current_stage or "Reported",
        status=STAGE_TO_STATUS_MAP.get(report.current_stage or "Reported", "Submitted"),
        assigned_maintainer_id=report.assigned_maintainer_id,
        assigned_maintainer_name=report.assigned_maintainer_name,
        assignment_priority=report.assignment_priority,
        admin_instructions=report.admin_instructions,
        assigned_at=report.assigned_at.isoformat() if report.assigned_at else None,
        repair_started_at=report.repair_started_at.isoformat() if report.repair_started_at else None,
        repair_before_image=report.repair_before_image,
        repair_after_image=report.repair_after_image,
        ai_verification_status=report.ai_verification_status,
        ai_verification_report=json.loads(report.ai_verification_report) if report.ai_verification_report else None,
        resolved_at=report.resolved_at.isoformat() if report.resolved_at else None,
        resolved_by=report.resolved_by,
        assigned_department=report.assigned_department,
        assigned_crew=report.assigned_crew,
        expected_completion_date=report.expected_completion_date,
        reopened_count=report.reopened_count or 0,
        reopened_reason=report.reopened_reason,
        before_images=b_imgs,
        during_images=d_imgs,
        after_images=a_imgs,
        altitude=report.altitude,
        gps_accuracy=report.gps_accuracy,
        readable_address=report.readable_address or report.location_name,
        capture_timestamp=report.capture_timestamp,
        upload_timestamp=report.upload_timestamp,
        capture_method=report.capture_method or "in_app_camera",
        geotag_verified=report.geotag_verified or False,
        exif_metadata_available=report.exif_metadata_available or False,
        camera_make=report.camera_make,
        camera_model=report.camera_model,
        original_image_path=report.original_image_path,
        original_image_url=report.original_image_path,
        stamped_image_path=report.stamped_image_path or report.image_url,
        stamped_image_url=report.stamped_image_path or report.image_url,
        defects=defects,
    )

@router.get(
    "/reports/duplicates/pending-review",
    summary="List road hazard reports whose duplicate matching is uncertain and pending admin review",
    description="Returns reports flagged by the hybrid engine as NEEDS_REVIEW that require manual municipal verification."
)
def get_pending_duplicate_reviews(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Admin endpoint to inspect reports requiring duplicate review."""
    # 1. Primary: Search MongoDB Atlas
    pending_mongo = find_pending_duplicate_reviews(limit=limit)
    if pending_mongo:
        return pending_mongo

    # 2. Secondary / SQLite fallback
    sqlite_pending = db.query(InspectionReportORM).filter(
        InspectionReportORM.duplicate_review_status == "PENDING_ADMIN_REVIEW"
    ).order_by(InspectionReportORM.analyzed_at.desc()).limit(limit).all()

    return [
        {
            "id": r.id,
            "client_report_id": r.id,
            "canonical_issue_id": r.canonical_issue_id,
            "duplicate_status": r.duplicate_status,
            "duplicate_review_status": r.duplicate_review_status,
            "duplicate_match_type": r.duplicate_match_type,
            "duplicate_match_reason": r.duplicate_match_reason,
            "image_url": r.image_url,
            "annotated_image_url": r.annotated_image_url,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "location_name": r.location_name,
            "analyzed_at": r.analyzed_at.isoformat() if r.analyzed_at else None,
            "total_defects": r.total_defects,
            "overall_condition": r.overall_condition,
        }
        for r in sqlite_pending
    ]

@router.get(
    "/reports/{report_id}/duplicate-cluster",
    summary="Get all child duplicate reports attached to a canonical issue",
    description="Returns the primary canonical issue along with all subsequent citizen submissions linked to it."
)
def get_duplicate_cluster(
    report_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve all citizen reports linked to a canonical ticket."""
    target_ids = {report_id}
    parent = find_report_by_id_or_client_id(report_id)
    if parent:
        if parent.get("id"):
            target_ids.add(str(parent["id"]))
        if parent.get("client_report_id"):
            target_ids.add(str(parent["client_report_id"]))

    child_reports = find_reports_by_canonical_id(report_id)
    
    # Also check SQLite
    sqlite_children = db.query(InspectionReportORM).filter(
        InspectionReportORM.canonical_issue_id.in_(list(target_ids))
    ).all()

    sqlite_ids = {s.id for s in sqlite_children}
    merged_children = list(child_reports)
    for s in sqlite_children:
        if s.id not in {c.get("id") for c in merged_children} and s.id not in {c.get("client_report_id") for c in merged_children}:
            merged_children.append({
                "id": s.id,
                "client_report_id": s.id,
                "canonical_issue_id": s.canonical_issue_id,
                "image_url": s.image_url,
                "annotated_image_url": s.annotated_image_url,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "duplicate_status": s.duplicate_status,
                "duplicate_match_type": s.duplicate_match_type,
                "duplicate_match_reason": s.duplicate_match_reason,
                "analyzed_at": s.analyzed_at.isoformat() if s.analyzed_at else None,
            })

    return {
        "canonical_issue_id": report_id,
        "total_linked_submissions": len(merged_children),
        "duplicate_submissions": merged_children,
    }

@router.post(
    "/reports/{report_id}/duplicate-review",
    response_model=DuplicateReviewResponseSchema,
    summary="Admin review action: Confirm or dismiss a tentative duplicate report",
    description="Allows municipal inspectors to confirm a duplicate link to a canonical issue or mark it as an independent new issue."
)
def review_duplicate_report(
    report_id: str,
    payload: DuplicateReviewRequestSchema,
    db: Session = Depends(get_db)
):
    action = payload.action.strip().upper()
    if action not in ("CONFIRM_DUPLICATE", "DISMISS_DUPLICATE"):
        raise HTTPException(
            status_code=400,
            detail="Action must be either 'CONFIRM_DUPLICATE' or 'DISMISS_DUPLICATE'"
        )

    canonical_id = payload.canonical_issue_id.strip() if payload.canonical_issue_id else None

    # 1. Update MongoDB Atlas
    update_duplicate_review_decision(
        report_id=report_id,
        action=action,
        canonical_id=canonical_id,
        admin_notes=payload.admin_notes
    )

    # 2. Update SQLite ORM
    report = db.query(InspectionReportORM).filter(
        (InspectionReportORM.id == report_id) | (InspectionReportORM.id == report_id.strip())
    ).first()

    if report:
        if action == "CONFIRM_DUPLICATE":
            report.is_duplicate = True
            report.duplicate_status = "CONFIRMED_DUPLICATE"
            report.duplicate_review_status = "APPROVED_BY_ADMIN"
            if canonical_id:
                report.canonical_issue_id = canonical_id
        else:
            report.is_duplicate = False
            report.duplicate_status = "NEW_ISSUE"
            report.duplicate_review_status = "DISMISSED_BY_ADMIN"
            report.canonical_issue_id = None
        db.commit()

    is_dup = (action == "CONFIRM_DUPLICATE")
    status_str = "CONFIRMED_DUPLICATE" if is_dup else "NEW_ISSUE"
    rev_status = "APPROVED_BY_ADMIN" if is_dup else "DISMISSED_BY_ADMIN"

    return DuplicateReviewResponseSchema(
        success=True,
        report_id=report_id,
        action=action,
        is_duplicate=is_dup,
        duplicate_status=status_str,
        duplicate_review_status=rev_status,
        canonical_issue_id=canonical_id if is_dup else None,
        message=f"Duplicate review completed: {action} applied successfully."
    )

# -------------------------------------------------------------
# 8-Stage Road Damage Progress Monitoring & Repair Endpoints
# -------------------------------------------------------------

@router.get(
    "/reports/{report_id}/progress",
    response_model=ProgressResponseSchema,
    summary="Get 8-stage road damage repair progress and photo history",
    description="Retrieves current lifecycle stage, department assignment, expected completion date, before/during/after images, and full progress audit trail.",
)
def get_report_progress(report_id: str, db: Session = Depends(get_db)):
    """Fetches progress monitoring state for a canonical road damage issue."""
    # 1. Try MongoDB Atlas first
    mongo_doc = find_report_by_id_or_client_id(report_id)

    # 2. Check SQLite ORM
    orm_report = db.query(InspectionReportORM).filter(
        (InspectionReportORM.id == report_id) |
        (InspectionReportORM.id == (mongo_doc.get("client_report_id") if mongo_doc else report_id))
    ).first()

    if not mongo_doc and not orm_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' not found."
        )

    actual_id = orm_report.id if orm_report else (mongo_doc.get("client_report_id") or mongo_doc.get("id"))

    # Linked child duplicate reports count
    linked_children = find_reports_by_canonical_id(actual_id)
    if not linked_children and orm_report:
        linked_children = db.query(InspectionReportORM).filter(InspectionReportORM.canonical_issue_id == actual_id).all()

    stage = "Reported"
    status_val = "Submitted"
    dept = None
    crew = None
    expected_date = None
    reopen_cnt = 0
    reopen_rsn = None
    before_imgs = []
    during_imgs = []
    after_imgs = []
    history: List[RepairProgressHistoryEntrySchema] = []

    if mongo_doc:
        stage = mongo_doc.get("current_stage") or "Reported"
        status_val = mongo_doc.get("status") or STAGE_TO_STATUS_MAP.get(stage, "In Progress")
        dept = mongo_doc.get("assigned_department")
        crew = mongo_doc.get("assigned_crew")
        expected_date = mongo_doc.get("expected_completion_date")
        reopen_cnt = mongo_doc.get("reopened_count", 0)
        reopen_rsn = mongo_doc.get("reopened_reason")
        before_imgs = mongo_doc.get("before_images") or ([mongo_doc["image_url"]] if mongo_doc.get("image_url") else [])
        during_imgs = mongo_doc.get("during_images") or []
        after_imgs = mongo_doc.get("after_images") or []
        raw_history = mongo_doc.get("repair_progress_history") or []
        for h in raw_history:
            history.append(RepairProgressHistoryEntrySchema(
                id=h.get("id", f"prog-{uuid.uuid4().hex[:8]}"),
                stage=h.get("stage", "Reported"),
                status=h.get("status", "Submitted"),
                timestamp=h.get("timestamp", datetime.utcnow().isoformat()),
                actor_name=h.get("actor_name", "Staff"),
                actor_role=h.get("actor_role", "Staff"),
                department=h.get("department"),
                crew=h.get("crew"),
                expected_completion_date=h.get("expected_completion_date"),
                notes=h.get("notes"),
                reopen_reason=h.get("reopen_reason"),
                photos=[
                    RepairPhotoSchema(
                        url=p.get("url", ""),
                        stage=p.get("stage", "during"),
                        caption=p.get("caption"),
                        actor_name=p.get("actor_name"),
                        actor_role=p.get("actor_role"),
                        department=p.get("department"),
                        uploaded_at=p.get("uploaded_at"),
                    ) for p in h.get("photos", [])
                ]
            ))
    elif orm_report:
        stage = orm_report.current_stage or "Reported"
        status_val = STAGE_TO_STATUS_MAP.get(stage, "In Progress")
        dept = orm_report.assigned_department
        crew = orm_report.assigned_crew
        expected_date = orm_report.expected_completion_date
        reopen_cnt = orm_report.reopened_count or 0
        reopen_rsn = orm_report.reopened_reason
        try:
            before_imgs = json.loads(orm_report.before_images_json) if orm_report.before_images_json else ([orm_report.image_url] if orm_report.image_url else [])
        except Exception:
            before_imgs = [orm_report.image_url] if orm_report.image_url else []
        try:
            during_imgs = json.loads(orm_report.during_images_json) if orm_report.during_images_json else []
        except Exception:
            during_imgs = []
        try:
            after_imgs = json.loads(orm_report.after_images_json) if orm_report.after_images_json else []
        except Exception:
            after_imgs = []
        try:
            raw_history = json.loads(orm_report.repair_progress_json) if orm_report.repair_progress_json else []
            for h in raw_history:
                history.append(RepairProgressHistoryEntrySchema(
                    id=h.get("id", f"prog-{uuid.uuid4().hex[:8]}"),
                    stage=h.get("stage", "Reported"),
                    status=h.get("status", "Submitted"),
                    timestamp=h.get("timestamp", datetime.utcnow().isoformat()),
                    actor_name=h.get("actor_name", "Staff"),
                    actor_role=h.get("actor_role", "Staff"),
                    department=h.get("department"),
                    crew=h.get("crew"),
                    expected_completion_date=h.get("expected_completion_date"),
                    notes=h.get("notes"),
                    reopen_reason=h.get("reopen_reason"),
                    photos=[
                        RepairPhotoSchema(
                            url=p.get("url", ""),
                            stage=p.get("stage", "during"),
                            caption=p.get("caption"),
                            actor_name=p.get("actor_name"),
                            actor_role=p.get("actor_role"),
                            department=p.get("department"),
                            uploaded_at=p.get("uploaded_at"),
                        ) for p in h.get("photos", [])
                    ]
                ))
        except Exception:
            pass

    return ProgressResponseSchema(
        success=True,
        report_id=actual_id,
        current_stage=stage,
        status=status_val,
        assigned_department=dept,
        assigned_crew=crew,
        expected_completion_date=expected_date,
        reopened_count=reopen_cnt,
        reopened_reason=reopen_rsn,
        before_images=before_imgs,
        during_images=during_imgs,
        after_images=after_imgs,
        repair_progress_history=history,
        linked_duplicates_count=len(linked_children) if isinstance(linked_children, list) else 0,
        message=f"Current progress stage: {stage}."
    )

@router.post(
    "/reports/{report_id}/progress-stage",
    response_model=ProgressResponseSchema,
    summary="Update road damage repair progress stage (8-stage lifecycle)",
    description="Transitions an issue between Reported, Admin verified, Assigned to department, Scheduled, Repair in progress, Repair completed, Final verification, Closed, or Reopened.",
)
def advance_report_progress_stage(
    report_id: str,
    payload: ProgressStageUpdateRequestSchema,
    db: Session = Depends(get_db)
):
    if payload.stage not in VALID_PROGRESS_STAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid stage '{payload.stage}'. Must be one of: {', '.join(VALID_PROGRESS_STAGES)}"
        )

    # 1. Update in MongoDB Atlas
    ok, mongo_updated = update_report_progress_stage(
        report_id=report_id,
        stage=payload.stage,
        actor_name=payload.actor_name,
        actor_role=payload.actor_role,
        department=payload.department,
        crew=payload.crew,
        expected_completion_date=payload.expected_completion_date,
        notes=payload.notes,
        reopen_reason=payload.reopen_reason,
    )

    # 2. Update in SQLite ORM
    orm_report = db.query(InspectionReportORM).filter(
        (InspectionReportORM.id == report_id) |
        (InspectionReportORM.id == (mongo_updated.get("client_report_id") if mongo_updated else report_id))
    ).first()

    now_iso = datetime.utcnow().isoformat()
    mapped_status = STAGE_TO_STATUS_MAP.get(payload.stage, "In Progress")

    if orm_report:
        orm_report.current_stage = payload.stage
        if payload.department:
            orm_report.assigned_department = payload.department
        if payload.crew:
            orm_report.assigned_crew = payload.crew
        if payload.expected_completion_date:
            orm_report.expected_completion_date = payload.expected_completion_date
        if payload.stage == "Reopened":
            orm_report.reopened_count = (orm_report.reopened_count or 0) + 1
            orm_report.reopened_reason = payload.reopen_reason or payload.notes or "Reopened for quality rework"

        # Update JSON history
        try:
            curr_hist = json.loads(orm_report.repair_progress_json) if orm_report.repair_progress_json else []
        except Exception:
            curr_hist = []

        curr_hist.append({
            "id": f"prog-{uuid.uuid4().hex[:8]}",
            "stage": payload.stage,
            "status": mapped_status,
            "timestamp": now_iso,
            "actor_name": payload.actor_name,
            "actor_role": payload.actor_role,
            "department": payload.department or orm_report.assigned_department,
            "crew": payload.crew or orm_report.assigned_crew,
            "expected_completion_date": payload.expected_completion_date or orm_report.expected_completion_date,
            "notes": payload.notes or f"Stage updated to {payload.stage}.",
            "reopen_reason": payload.reopen_reason if payload.stage == "Reopened" else None,
            "photos": [],
        })
        orm_report.repair_progress_json = json.dumps(curr_hist)
        db.commit()

        # Propagate to child duplicates in SQLite
        db.query(InspectionReportORM).filter(InspectionReportORM.canonical_issue_id == orm_report.id).update({
            InspectionReportORM.current_stage: payload.stage,
            InspectionReportORM.assigned_department: orm_report.assigned_department,
            InspectionReportORM.assigned_crew: orm_report.assigned_crew,
            InspectionReportORM.expected_completion_date: orm_report.expected_completion_date,
        }, synchronize_session=False)
        db.commit()

    if not ok and not orm_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' not found."
        )

    # Return refreshed progress
    return get_report_progress(report_id, db)

@router.post(
    "/reports/{report_id}/repair-photo",
    response_model=UploadPhotoResponseSchema,
    summary="Upload repair progress photograph (before, during, after)",
    description="Allows authorised department users or inspectors to upload progress photographs with stage tagging ('before', 'during', 'after'), captions, and actor metadata.",
)
async def upload_repair_photo(
    report_id: str,
    photo: UploadFile = File(..., description="Progress photograph binary"),
    stage: str = Form("during", description="Repair stage tag: 'before', 'during', or 'after'"),
    caption: Optional[str] = Form(None, description="Descriptive note or material specifications"),
    actor_name: str = Form("Authorized Department User", description="Crew worker or inspector name"),
    actor_role: str = Form("Department Crew", description="Actor role"),
    department: Optional[str] = Form(None, description="Department name"),
    db: Session = Depends(get_db)
):
    clean_stage = stage.lower().strip()
    if clean_stage not in ["before", "during", "after"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid photo stage '{stage}'. Must be 'before', 'during', or 'after'."
        )

    ext = os.path.splitext(photo.filename or "")[1].lower()
    if ext not in ALLOWED_SYNC_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported format '{ext}'. Allowed: {', '.join(ALLOWED_SYNC_EXTENSIONS)}"
        )

    content = await photo.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    # Save to outputs directory
    photo_filename = f"repair_{clean_stage}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(str(settings.OUTPUTS_DIR), photo_filename)
    with open(dest_path, "wb") as f:
        f.write(content)

    photo_url = f"/outputs/{photo_filename}"

    # 1. Update in MongoDB Atlas
    add_repair_progress_photo(
        report_id=report_id,
        photo_url=photo_url,
        stage=clean_stage,
        caption=caption,
        actor_name=actor_name,
        actor_role=actor_role,
        department=department,
    )

    # 2. Update in SQLite ORM
    orm_report = db.query(InspectionReportORM).filter(
        (InspectionReportORM.id == report_id) | (InspectionReportORM.file_name.ilike(f"%{report_id}%"))
    ).first()

    if orm_report:
        bucket_attr = f"{clean_stage}_images_json"
        try:
            curr_list = json.loads(getattr(orm_report, bucket_attr)) if getattr(orm_report, bucket_attr) else []
        except Exception:
            curr_list = []
        curr_list.append(photo_url)
        setattr(orm_report, bucket_attr, json.dumps(curr_list))

        # Append to progress JSON
        try:
            curr_hist = json.loads(orm_report.repair_progress_json) if orm_report.repair_progress_json else []
        except Exception:
            curr_hist = []

        curr_hist.append({
            "id": f"prog-{uuid.uuid4().hex[:8]}",
            "stage": f"Photo: {clean_stage.capitalize()}",
            "status": orm_report.overall_condition,
            "timestamp": datetime.utcnow().isoformat(),
            "actor_name": actor_name,
            "actor_role": actor_role,
            "department": department or orm_report.assigned_department,
            "crew": orm_report.assigned_crew,
            "expected_completion_date": orm_report.expected_completion_date,
            "notes": caption or f"{clean_stage.capitalize()} photograph attached by {actor_name}",
            "photos": [{
                "url": photo_url,
                "stage": clean_stage,
                "caption": caption,
                "actor_name": actor_name,
                "actor_role": actor_role,
                "department": department,
                "uploaded_at": datetime.utcnow().isoformat(),
            }],
        })
        orm_report.repair_progress_json = json.dumps(curr_hist)
        db.commit()

    return UploadPhotoResponseSchema(
        success=True,
        report_id=report_id,
        photo_url=photo_url,
        stage=clean_stage,
        caption=caption,
        message=f"{clean_stage.capitalize()} repair photograph saved and attached to ticket."
    )

@router.get(
    "/statistics",
    response_model=StatisticsResponse,
    summary="Get network-wide road condition statistics",
    description="Aggregates total inspected segments, defect distributions, average PCI, and critical metrics.",
)
def get_statistics(db: Session = Depends(get_db)):
    total_inspections = db.query(InspectionReportORM).count()
    total_defects = db.query(DefectItemORM).count()
    critical_defects = db.query(DefectItemORM).filter(DefectItemORM.severity == "Critical").count()
    potholes_count = db.query(DefectItemORM).filter(DefectItemORM.type == "Pothole").count()
    cracks_count = db.query(DefectItemORM).filter(DefectItemORM.type.ilike("%Crack%")).count()

    avg_pci = db.query(func.avg(InspectionReportORM.pci_score)).scalar() or 85.0

    # Condition breakdown
    conditions = {"Critical": 0, "Poor": 0, "Fair": 0, "Good": 0}
    cond_rows = db.query(InspectionReportORM.overall_condition, func.count(InspectionReportORM.id)).group_by(InspectionReportORM.overall_condition).all()
    for cond, count in cond_rows:
        if cond in conditions:
            conditions[cond] = count

    # Severity breakdown
    severities = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    sev_rows = db.query(DefectItemORM.severity, func.count(DefectItemORM.id)).group_by(DefectItemORM.severity).all()
    for sev, count in sev_rows:
        if sev in severities:
            severities[sev] = count

    recent = db.query(InspectionReportORM).order_by(InspectionReportORM.analyzed_at.desc()).limit(5).all()
    recent_summaries = [
        ReportSummarySchema(
            id=r.id,
            file_name=r.file_name,
            image_url=r.image_url,
            annotated_image_url=r.annotated_image_url,
            analyzed_at=r.analyzed_at.isoformat() if r.analyzed_at else "",
            total_defects=r.total_defects,
            potholes_count=r.potholes_count,
            cracks_count=r.cracks_count,
            critical_count=r.critical_count,
            overall_condition=r.overall_condition,
            pci_score=r.pci_score,
            hazard_index=r.hazard_index,
            estimated_patch_tons=r.estimated_patch_tons,
            location_name=r.location_name,
            latitude=r.latitude,
            longitude=r.longitude,
            image_phash=r.image_phash,
            orb_keypoints_count=r.orb_keypoints_count or 0,
            canonical_issue_id=r.canonical_issue_id,
            is_duplicate=r.is_duplicate or False,
            duplicate_status=r.duplicate_status or "NEW_ISSUE",
            duplicate_review_status=r.duplicate_review_status or "NONE",
            duplicate_match_type=r.duplicate_match_type,
            current_stage=r.current_stage or "Reported",
            assigned_department=r.assigned_department,
            assigned_crew=r.assigned_crew,
            expected_completion_date=r.expected_completion_date,
            reopened_count=r.reopened_count or 0,
            reopened_reason=r.reopened_reason,
            before_images=[r.image_url] if r.image_url else [],
            during_images=[],
            after_images=[],
        ) for r in recent
    ]

    return StatisticsResponse(
        total_inspections=total_inspections,
        total_defects=total_defects,
        critical_defects=critical_defects,
        potholes_count=potholes_count,
        cracks_count=cracks_count,
        avg_pci_score=round(float(avg_pci), 1),
        condition_breakdown=conditions,
        severity_breakdown=severities,
        recent_reports=recent_summaries,
    )


# --------------------------------------------------------------------------
# Maintainer Assignment & AI Repair Verification Endpoints
# --------------------------------------------------------------------------

@router.post("/reports/{report_id}/assign", response_model=TaskAssignmentResponseSchema)
def assign_report_to_maintainer_endpoint(
    report_id: str,
    payload: TaskAssignmentRequestSchema,
    db: Session = Depends(get_db)
):
    """Admin endpoint to dispatch a road hazard issue to a specific maintainer."""
    orm_report = db.query(InspectionReportORM).filter(
        (InspectionReportORM.id == report_id) | (InspectionReportORM.file_name.ilike(f"%{report_id}%"))
    ).first()

    # Find maintainer name
    m = db.query(MaintainerORM).filter(MaintainerORM.id == payload.maintainer_id).first()
    m_name = m.name if m else None
    if not m_name:
        mongo_m = get_maintainer_by_id(payload.maintainer_id)
        if mongo_m:
            m_name = mongo_m.get("name")
    if not m_name:
        raise HTTPException(status_code=404, detail=f"Maintainer '{payload.maintainer_id}' not found")

    now = datetime.utcnow()
    # Update SQLite
    if orm_report:
        orm_report.assigned_maintainer_id = payload.maintainer_id
        orm_report.assigned_maintainer_name = m_name
        orm_report.assignment_priority = payload.priority.upper()
        orm_report.admin_instructions = payload.admin_instructions
        orm_report.assigned_at = now
        orm_report.assigned_by = payload.assigned_by or "Administrator"
        orm_report.current_stage = "Assigned to department"
        if payload.target_completion_date:
            orm_report.expected_completion_date = payload.target_completion_date
        db.commit()

    # Update MongoDB
    assign_report_to_maintainer(
        report_id=report_id,
        maintainer_id=payload.maintainer_id,
        maintainer_name=m_name,
        priority=payload.priority,
        instructions=payload.admin_instructions,
        target_date=payload.target_completion_date,
        assigned_by=payload.assigned_by or "Administrator",
    )

    return TaskAssignmentResponseSchema(
        success=True,
        report_id=report_id,
        assigned_maintainer_id=payload.maintainer_id,
        assigned_maintainer_name=m_name,
        priority=payload.priority.upper(),
        status="In Progress",
        current_stage="Assigned to department",
        target_completion_date=payload.target_completion_date,
        message=f"Successfully assigned issue to {m_name} ({payload.priority.upper()} priority)."
    )


@router.post("/reports/{report_id}/repair/start")
def start_repair_work(
    report_id: str,
    maintainer_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Maintainer marks arrival on site and starts road repair work."""
    now = datetime.utcnow()
    orm_report = db.query(InspectionReportORM).filter(
        (InspectionReportORM.id == report_id) | (InspectionReportORM.file_name.ilike(f"%{report_id}%"))
    ).first()

    if orm_report:
        orm_report.repair_started_at = now
        orm_report.current_stage = "Repair in progress"
        db.commit()

    # Update MongoDB
    try:
        col = get_reports_collection()
        filter_query = {"client_report_id": report_id}
        if not col.find_one(filter_query):
            filter_query = {"id": report_id}
        col.update_one(
            filter_query,
            {
                "$set": {
                    "repair_started_at": now.isoformat(),
                    "current_stage": "Repair in progress",
                    "status": "In Progress",
                    "updated_at": now
                },
                "$push": {
                    "timeline": {
                        "status": "In Progress",
                        "stage": "Repair in progress",
                        "timestamp": now.isoformat(),
                        "note": "Maintainer arrived on site; road repair work initiated."
                    }
                }
            }
        )
    except Exception as e:
        logger.warning(f"Failed to record repair start in MongoDB: {e}")

    return {"success": True, "message": "Repair work marked in progress", "started_at": now.isoformat()}


@router.post("/reports/{report_id}/repair/submit-evidence", response_model=AIRepairVerificationResponseSchema)
async def submit_repair_evidence(
    report_id: str,
    before_image: UploadFile = File(..., description="Photograph taken BEFORE repair work"),
    after_image: UploadFile = File(..., description="Photograph taken AFTER repair completion"),
    capture_lat: Optional[float] = Form(None, description="GPS latitude captured on site"),
    capture_lng: Optional[float] = Form(None, description="GPS longitude captured on site"),
    gps_accuracy: Optional[float] = Form(None, description="GPS accuracy in meters"),
    maintainer_id: Optional[str] = Form(None, description="Maintainer ID submitting evidence"),
    notes: Optional[str] = Form("", description="Optional technician notes"),
    db: Session = Depends(get_db)
):
    """
    Submits Before and After repair photographs.
    Runs the automated AI Repair Verification Pipeline:
    - pHash fraud/duplicate rejection
    - GPS proximity validation
    - ORB feature consistency
    - YOLO damage reduction comparison
    - Auto-resolves issue if VERIFIED
    """
    b_ext = os.path.splitext(before_image.filename or "")[1].lower()
    a_ext = os.path.splitext(after_image.filename or "")[1].lower()
    if b_ext not in ALLOWED_SYNC_EXTENSIONS or a_ext not in ALLOWED_SYNC_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Both images must be in allowed formats: {', '.join(ALLOWED_SYNC_EXTENSIONS)}"
        )

    b_content = await before_image.read()
    a_content = await after_image.read()
    if len(b_content) == 0 or len(a_content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded photo binary cannot be empty.")

    b_filename = f"repair_before_{uuid.uuid4().hex[:8]}{b_ext}"
    a_filename = f"repair_after_{uuid.uuid4().hex[:8]}{a_ext}"
    b_path = os.path.join(str(settings.OUTPUTS_DIR), b_filename)
    a_path = os.path.join(str(settings.OUTPUTS_DIR), a_filename)

    with open(b_path, "wb") as f:
        f.write(b_content)
    with open(a_path, "wb") as f:
        f.write(a_content)

    b_url = f"/outputs/{b_filename}"
    a_url = f"/outputs/{a_filename}"

    ticket_lat = None
    ticket_lng = None
    orm_report = db.query(InspectionReportORM).filter(
        (InspectionReportORM.id == report_id) | (InspectionReportORM.file_name.ilike(f"%{report_id}%"))
    ).first()
    if orm_report:
        ticket_lat = orm_report.latitude
        ticket_lng = orm_report.longitude
    else:
        doc = find_report_by_id_or_client_id(report_id)
        if doc:
            ticket_lat = doc.get("latitude")
            ticket_lng = doc.get("longitude")

    # Run AI Verification Pipeline
    verification_res = repair_verification_service.verify_repair(
        issue_id=report_id,
        before_bytes=b_content,
        after_bytes=a_content,
        ticket_lat=ticket_lat,
        ticket_lng=ticket_lng,
        capture_lat=capture_lat,
        capture_lng=capture_lng,
        before_image_url=b_url,
        after_image_url=a_url,
    )

    ver_status = verification_res.get("verificationStatus", "NEEDS_REVIEW")
    now = datetime.utcnow()
    gps_meta = {"lat": capture_lat, "lng": capture_lng, "accuracy": gps_accuracy}

    # Update SQLite
    if orm_report:
        orm_report.repair_before_image = b_url
        orm_report.repair_after_image = a_url
        orm_report.repair_before_gps = json.dumps(gps_meta)
        orm_report.repair_after_gps = json.dumps(gps_meta)
        orm_report.ai_verification_status = ver_status
        orm_report.ai_verification_report = json.dumps(verification_res)

        if ver_status == "VERIFIED":
            orm_report.current_stage = "Closed"
            orm_report.resolved_at = now
            orm_report.resolved_by = "AI_AUTO_VERIFIED"
            if orm_report.assigned_maintainer_id:
                m_orm = db.query(MaintainerORM).filter(MaintainerORM.id == orm_report.assigned_maintainer_id).first()
                if m_orm:
                    m_orm.completed_tasks_count = (m_orm.completed_tasks_count or 0) + 1
        elif ver_status == "REJECTED":
            orm_report.current_stage = "Reopened"
        else:
            orm_report.current_stage = "Final verification"

        db.commit()

    # Update MongoDB
    update_report_ai_repair_verification(report_id, verification_res)

    return AIRepairVerificationResponseSchema(**verification_res)


@router.post("/reports/{report_id}/repair/manual-decision")
def manual_repair_decision(
    report_id: str,
    payload: ManualRepairDecisionRequestSchema,
    db: Session = Depends(get_db)
):
    """Administrator manual override to APPROVE or REJECT a repair under review."""
    action_clean = payload.action.upper().strip()
    if action_clean not in ["APPROVE", "REJECT"]:
        raise HTTPException(status_code=400, detail="Action must be APPROVE or REJECT")

    now = datetime.utcnow()
    orm_report = db.query(InspectionReportORM).filter(
        (InspectionReportORM.id == report_id) | (InspectionReportORM.file_name.ilike(f"%{report_id}%"))
    ).first()

    if action_clean == "APPROVE":
        new_status = "Resolved"
        new_stage = "Closed"
        res_by = f"ADMIN_OVERRIDE ({payload.admin_name})"
        note_text = f"Admin {payload.admin_name} manually approved the road repair: {payload.notes or 'Quality standard satisfied.'}"
        ver_stat = "VERIFIED"
    else:
        new_status = "In Progress"
        new_stage = "Reopened"
        res_by = None
        note_text = f"Admin {payload.admin_name} rejected the repair: {payload.notes or 'Defects remain visible. Re-dispatch requested.'}"
        ver_stat = "REJECTED"

    if orm_report:
        orm_report.current_stage = new_stage
        orm_report.ai_verification_status = ver_stat
        if action_clean == "APPROVE":
            orm_report.resolved_at = now
            orm_report.resolved_by = res_by
            if orm_report.assigned_maintainer_id:
                m_orm = db.query(MaintainerORM).filter(MaintainerORM.id == orm_report.assigned_maintainer_id).first()
                if m_orm:
                    m_orm.completed_tasks_count = (m_orm.completed_tasks_count or 0) + 1
        db.commit()

    # Update MongoDB
    try:
        col = get_reports_collection()
        filter_query = {"client_report_id": report_id}
        if not col.find_one(filter_query):
            filter_query = {"id": report_id}
        col.update_one(
            filter_query,
            {
                "$set": {
                    "status": new_status,
                    "current_stage": new_stage,
                    "ai_verification_status": ver_stat,
                    "resolved_at": now.isoformat() if action_clean == "APPROVE" else None,
                    "resolved_by": res_by,
                    "updated_at": now
                },
                "$push": {
                    "timeline": {
                        "status": new_status,
                        "stage": new_stage,
                        "timestamp": now.isoformat(),
                        "note": note_text
                    }
                }
            }
        )
    except Exception as e:
        logger.warning(f"Could not update manual repair decision in MongoDB: {e}")

    return {
        "success": True,
        "report_id": report_id,
        "action": action_clean,
        "status": new_status,
        "current_stage": new_stage,
        "message": f"Repair decision successfully applied: {new_status}"
    }
