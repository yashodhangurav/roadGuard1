import os
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.config import settings
from app.services.yolo_service import yolo_service
from app.services.phash_service import phash_service
from app.services.orb_service import orb_service
from app.schemas.detection import DetectionResponse
from app.database.session import get_db
from app.database.models import InspectionReportORM, DefectItemORM

router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

async def process_image_upload(
    file: UploadFile,
    location_name: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    db: Optional[Session] = None
) -> DetectionResponse:
    # 1. Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file format '{ext}'. Supported formats: JPG, JPEG, PNG, WEBP."
        )

    # 2. Validate MIME type
    content_type = (file.content_type or "").lower()
    if content_type and content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Invalid MIME type '{content_type}'. Must be a valid image file."
        )

    # 3. Read content and validate size
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}"
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded image file is empty (0 bytes)."
        )

    if len(content) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed limit of {settings.MAX_FILE_SIZE_MB}MB."
        )

    # 4. Run real inference
    try:
        result = yolo_service.detect_image(content, file.filename or "road_image.jpg")
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Computer Vision inference error: {str(e)}"
        )

    # 5. Persist to SQLite Database
    if db is not None:
        try:
            image_phash = phash_service.compute_phash(content)
            kps, des, _ = orb_service.extract_features(content)
            orb_service.save_features_cache(result.imageId, kps, des)

            report_orm = InspectionReportORM(
                id=result.imageId,
                file_name=result.fileName,
                image_url=result.imageUrl,
                annotated_image_url=result.annotatedImageUrl,
                analyzed_at=datetime.utcnow(),
                total_defects=result.stats.totalDefects,
                potholes_count=result.stats.potholesCount,
                cracks_count=result.stats.cracksCount,
                critical_count=result.stats.criticalCount,
                overall_condition=result.stats.overallCondition,
                pci_score=result.stats.pciScore,
                hazard_index=result.stats.hazardIndex,
                estimated_patch_tons=result.stats.estimatedPatchTons,
                location_name=location_name or "Highway Route 101, MP 14.2",
                latitude=latitude if latitude is not None else 37.7749,
                longitude=longitude if longitude is not None else -122.4194,
                image_phash=image_phash,
                orb_keypoints_count=len(kps),
            )
            db.add(report_orm)
            db.flush()

            for d in result.defects:
                defect_orm = DefectItemORM(
                    id=d.id,
                    report_id=result.imageId,
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
                    estimated_depth_mm=d.dimensions.estimatedDepthMm or 0.0,
                    area_cm2=d.dimensions.areaCm2,
                    urgency=d.urgency,
                    repair_method=d.repairMethod,
                )
                db.add(defect_orm)
            db.commit()
        except Exception as db_err:
            db.rollback()
            # Do not fail scan request if database logging throws
            pass

    return result

@router.post(
    "/detect/image",
    response_model=DetectionResponse,
    summary="Detect road damage from uploaded image",
    description="Runs real YOLO model inference on uploaded image, calculates severity metrics, generates annotated image, and saves to database.",
)
async def detect_road_image(
    file: UploadFile = File(...),
    location: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    return await process_image_upload(file, location, latitude, longitude, db)

@router.post(
    "/detect",
    response_model=DetectionResponse,
    summary="Direct detection endpoint (frontend compatible)",
    description="Alias endpoint for frontend integration matching detectionApi.ts contract.",
)
async def detect_road_image_alias(
    file: UploadFile = File(...),
    location: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    return await process_image_upload(file, location, latitude, longitude, db)

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}

@router.post(
    "/detect/video",
    response_model=DetectionResponse,
    summary="Detect road damage from uploaded video footage",
    description="Samples video frames, executes YOLO inference across frames, detects potholes and distresses, generates an annotated keyframe, and logs report to database.",
)
async def detect_road_video(
    file: UploadFile = File(...),
    location: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported video format '{ext}'. Supported formats: MP4, AVI, MOV, MKV, WEBM."
        )

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded video: {str(e)}"
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded video file is empty (0 bytes)."
        )

    try:
        result = yolo_service.detect_video(content, file.filename or "road_video.mp4")
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video inference error: {str(e)}"
        )

    # Persist report to SQLite
    if db is not None:
        try:
            report_orm = InspectionReportORM(
                id=result.imageId,
                file_name=result.fileName,
                image_url=result.imageUrl,
                annotated_image_url=result.annotatedImageUrl,
                analyzed_at=datetime.utcnow(),
                total_defects=result.stats.totalDefects,
                potholes_count=result.stats.potholesCount,
                cracks_count=result.stats.cracksCount,
                critical_count=result.stats.criticalCount,
                overall_condition=result.stats.overallCondition,
                pci_score=result.stats.pciScore,
                hazard_index=result.stats.hazardIndex,
                estimated_patch_tons=result.stats.estimatedPatchTons,
                location_name=location or "Highway Route 101 (Video Survey)",
                latitude=latitude if latitude is not None else 37.7749,
                longitude=longitude if longitude is not None else -122.4194,
            )
            db.add(report_orm)
            db.flush()

            for d in result.defects:
                defect_orm = DefectItemORM(
                    id=d.id,
                    report_id=result.imageId,
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
                    estimated_depth_mm=d.dimensions.estimatedDepthMm or 0.0,
                    area_cm2=d.dimensions.areaCm2,
                    urgency=d.urgency,
                    repair_method=d.repairMethod,
                )
                db.add(defect_orm)
            db.commit()
        except Exception:
            db.rollback()

    return result
