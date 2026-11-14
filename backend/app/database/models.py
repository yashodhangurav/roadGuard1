from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base

class InspectionReportORM(Base):
    __tablename__ = "inspection_reports"

    id = Column(String(64), primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    image_url = Column(String(512), nullable=False)
    annotated_image_url = Column(String(512), nullable=False)
    analyzed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    total_defects = Column(Integer, default=0)
    potholes_count = Column(Integer, default=0)
    cracks_count = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    
    overall_condition = Column(String(32), default="Fair", index=True)
    pci_score = Column(Float, default=100.0)
    hazard_index = Column(Float, default=0.0)
    estimated_patch_tons = Column(Float, default=0.0)
    
    location_name = Column(String(255), default="Highway Route 101, MP 14.2")
    latitude = Column(Float, default=37.7749)
    longitude = Column(Float, default=-122.4194)
    image_phash = Column(String(64), nullable=True, index=True)
    orb_keypoints_count = Column(Integer, default=0)
    
    # Hybrid Duplicate Detection & Canonical Issue Tracking
    canonical_issue_id = Column(String(64), nullable=True, index=True)
    is_duplicate = Column(Boolean, default=False, index=True)
    duplicate_status = Column(String(32), default="NEW_ISSUE", index=True)  # "NEW_ISSUE", "CONFIRMED_DUPLICATE", "NEEDS_REVIEW", "DISMISSED"
    duplicate_review_status = Column(String(32), default="NONE", index=True)  # "NONE", "PENDING_ADMIN_REVIEW", "APPROVED_BY_ADMIN", "DISMISSED_BY_ADMIN"
    duplicate_match_type = Column(String(32), nullable=True)  # "PHASH_IDENTICAL", "ORB_VIEWPOINT", "COMBINED", "PROBABLE_ORB", "VISUAL_RESEMBLANCE"
    duplicate_match_reason = Column(Text, nullable=True)

    # 8-Stage Progress Monitoring & Repair Lifecycle Tracking
    current_stage = Column(String(64), default="Reported", index=True)
    assigned_department = Column(String(128), nullable=True, index=True)
    assigned_crew = Column(String(128), nullable=True)
    expected_completion_date = Column(String(64), nullable=True)
    repair_progress_json = Column(Text, nullable=True)
    before_images_json = Column(Text, nullable=True)
    during_images_json = Column(Text, nullable=True)
    after_images_json = Column(Text, nullable=True)
    reopened_count = Column(Integer, default=0)
    reopened_reason = Column(Text, nullable=True)

    # Geotag-Verified Photo Capture & Live GPS Camera Telemetry
    altitude = Column(Float, nullable=True)
    gps_accuracy = Column(Float, nullable=True)
    readable_address = Column(String(512), nullable=True)
    capture_timestamp = Column(String(64), nullable=True)
    upload_timestamp = Column(String(64), nullable=True)
    capture_method = Column(String(32), default="in_app_camera", index=True)  # "in_app_camera", "existing_geotagged_upload"
    geotag_verified = Column(Boolean, default=False, index=True)
    exif_metadata_available = Column(Boolean, default=False)
    camera_make = Column(String(64), nullable=True)
    camera_model = Column(String(64), nullable=True)
    original_image_path = Column(String(512), nullable=True)
    stamped_image_path = Column(String(512), nullable=True)

    # Maintainer Management & Assignment
    assigned_maintainer_id = Column(String(64), ForeignKey("maintainers.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_maintainer_name = Column(String(128), nullable=True)
    assignment_priority = Column(String(32), default="MEDIUM")  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    admin_instructions = Column(Text, nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    assigned_by = Column(String(128), nullable=True)
    repair_started_at = Column(DateTime, nullable=True)

    # AI Repair Verification Evidence & Telemetry
    repair_before_image = Column(String(512), nullable=True)
    repair_before_gps = Column(Text, nullable=True)
    repair_after_image = Column(String(512), nullable=True)
    repair_after_gps = Column(Text, nullable=True)
    ai_verification_status = Column(String(32), default="NOT_STARTED", index=True)  # "NOT_STARTED", "PENDING", "VERIFIED", "REJECTED", "NEEDS_REVIEW"
    ai_verification_report = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(64), nullable=True)  # "AI_AUTO_VERIFIED", "ADMIN_OVERRIDE"

    defects = relationship("DefectItemORM", back_populates="report", cascade="all, delete-orphan")
    assigned_maintainer = relationship("MaintainerORM", foreign_keys=[assigned_maintainer_id])

class MaintainerORM(Base):
    __tablename__ = "maintainers"

    id = Column(String(64), primary_key=True, index=True)  # e.g. "MNT-2026-001"
    name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    phone = Column(String(32), nullable=True)
    department = Column(String(128), default="Rapid Patch Division", index=True)
    status = Column(String(32), default="ACTIVE", index=True)  # "ACTIVE", "INACTIVE", "ON_LEAVE"
    assigned_tasks_count = Column(Integer, default=0)
    completed_tasks_count = Column(Integer, default=0)
    rating = Column(Float, default=5.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DefectItemORM(Base):
    __tablename__ = "defect_items"

    id = Column(String(64), primary_key=True, index=True)
    report_id = Column(String(64), ForeignKey("inspection_reports.id", ondelete="CASCADE"), index=True)
    
    type = Column(String(64), nullable=False, index=True)
    raw_class = Column(String(32), default="D40")
    severity = Column(String(32), nullable=False, index=True)
    severity_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    
    # Normalized bounding box (0 - 100 percentages)
    box_x = Column(Float, nullable=False)
    box_y = Column(Float, nullable=False)
    box_width = Column(Float, nullable=False)
    box_height = Column(Float, nullable=False)
    
    # Physical dimensions
    width_cm = Column(Float, default=0.0)
    height_cm = Column(Float, default=0.0)
    estimated_depth_mm = Column(Float, default=0.0)
    area_cm2 = Column(Float, default=0.0)
    
    urgency = Column(String(64), default="Routine")
    repair_method = Column(Text, default="")

    report = relationship("InspectionReportORM", back_populates="defects")
