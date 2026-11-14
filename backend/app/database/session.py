from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.database import models
    Base.metadata.create_all(bind=engine)
    
    # Safe migration: ensure image_phash, orb_keypoints_count, duplicate tracking, and 8-stage progress columns exist
    new_columns = [
        ("image_phash", "VARCHAR(64)"),
        ("orb_keypoints_count", "INTEGER DEFAULT 0"),
        ("canonical_issue_id", "VARCHAR(64)"),
        ("is_duplicate", "BOOLEAN DEFAULT 0"),
        ("duplicate_status", "VARCHAR(32) DEFAULT 'NEW_ISSUE'"),
        ("duplicate_review_status", "VARCHAR(32) DEFAULT 'NONE'"),
        ("duplicate_match_type", "VARCHAR(32)"),
        ("duplicate_match_reason", "TEXT"),
        ("current_stage", "VARCHAR(64) DEFAULT 'Reported'"),
        ("assigned_department", "VARCHAR(128)"),
        ("assigned_crew", "VARCHAR(128)"),
        ("expected_completion_date", "VARCHAR(64)"),
        ("repair_progress_json", "TEXT"),
        ("before_images_json", "TEXT"),
        ("during_images_json", "TEXT"),
        ("after_images_json", "TEXT"),
        ("reopened_count", "INTEGER DEFAULT 0"),
        ("reopened_reason", "TEXT"),
        ("altitude", "FLOAT"),
        ("gps_accuracy", "FLOAT"),
        ("readable_address", "VARCHAR(512)"),
        ("capture_timestamp", "VARCHAR(64)"),
        ("upload_timestamp", "VARCHAR(64)"),
        ("capture_method", "VARCHAR(32) DEFAULT 'in_app_camera'"),
        ("geotag_verified", "BOOLEAN DEFAULT 0"),
        ("exif_metadata_available", "BOOLEAN DEFAULT 0"),
        ("camera_make", "VARCHAR(64)"),
        ("camera_model", "VARCHAR(64)"),
        ("original_image_path", "VARCHAR(512)"),
        ("stamped_image_path", "VARCHAR(512)"),
        ("assigned_maintainer_id", "VARCHAR(64)"),
        ("assigned_maintainer_name", "VARCHAR(128)"),
        ("assignment_priority", "VARCHAR(32) DEFAULT 'MEDIUM'"),
        ("admin_instructions", "TEXT"),
        ("assigned_at", "DATETIME"),
        ("assigned_by", "VARCHAR(128)"),
        ("repair_started_at", "DATETIME"),
        ("repair_before_image", "VARCHAR(512)"),
        ("repair_before_gps", "TEXT"),
        ("repair_after_image", "VARCHAR(512)"),
        ("repair_after_gps", "TEXT"),
        ("ai_verification_status", "VARCHAR(32) DEFAULT 'NOT_STARTED'"),
        ("ai_verification_report", "TEXT"),
        ("resolved_at", "DATETIME"),
        ("resolved_by", "VARCHAR(64)"),
    ]
    with engine.connect() as conn:
        for col_name, col_type in new_columns:
            try:
                conn.execute(text(f"ALTER TABLE inspection_reports ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception:
                pass
    
    # Seed initial canonical benchmark records if database is fresh
    db = SessionLocal()
    try:
        count = db.query(models.InspectionReportORM).count()
        if count == 0:
            sample_report = models.InspectionReportORM(
                id="SCAN-CANONICAL-01",
                file_name="highway101_benchmark.jpg",
                image_url="/outputs/highway101_benchmark.jpg",
                annotated_image_url="/outputs/highway101_benchmark.jpg",
                analyzed_at=datetime.utcnow() - timedelta(hours=2),
                total_defects=2,
                potholes_count=1,
                cracks_count=1,
                critical_count=1,
                overall_condition="Critical",
                pci_score=42.0,
                hazard_index=84.0,
                estimated_patch_tons=1.45,
                location_name="US-101 Corridor (Northbound Lane 1, MP 14.2)",
                latitude=37.7749,
                longitude=-122.4194,
            )
            db.add(sample_report)
            db.flush()
            
            defect1 = models.DefectItemORM(
                id="DEF-CANONICAL-01",
                report_id="SCAN-CANONICAL-01",
                type="Pothole",
                raw_class="D40",
                severity="Critical",
                severity_score=86.5,
                confidence=96.4,
                box_x=26.0,
                box_y=24.0,
                box_width=52.0,
                box_height=54.0,
                width_cm=72.0,
                height_cm=58.0,
                estimated_depth_mm=86.0,
                area_cm2=4176.0,
                urgency="Immediate",
                repair_method="Hot-mix asphalt patch with edge milling and tack coat bonding"
            )
            defect2 = models.DefectItemORM(
                id="DEF-CANONICAL-02",
                report_id="SCAN-CANONICAL-01",
                type="Longitudinal Crack",
                raw_class="D00",
                severity="Medium",
                severity_score=48.0,
                confidence=91.2,
                box_x=6.0,
                box_y=14.0,
                box_width=22.0,
                box_height=68.0,
                width_cm=110.0,
                height_cm=16.0,
                estimated_depth_mm=24.0,
                area_cm2=1760.0,
                urgency="Priority (48h)",
                repair_method="Polymer-modified asphalt emulsion crack sealing"
            )
            db.add_all([defect1, defect2])
            db.commit()

        # Seed initial demo maintainers if none exist
        maintainer_count = db.query(models.MaintainerORM).count()
        if maintainer_count == 0:
            demo_maintainers = [
                models.MaintainerORM(
                    id="MNT-2026-001",
                    name="Carlos Mendez",
                    email="carlos.mendez@roadguard.ai",
                    password_hash="maintainer2026",
                    phone="+1 (555) 234-8901",
                    department="Rapid Patch Division",
                    status="ACTIVE",
                    assigned_tasks_count=2,
                    completed_tasks_count=18,
                    rating=4.9,
                ),
                models.MaintainerORM(
                    id="MNT-2026-002",
                    name="Aisha Khan",
                    email="aisha.khan@roadguard.ai",
                    password_hash="maintainer2026",
                    phone="+1 (555) 489-1120",
                    department="Asphalt Milling & Overlay",
                    status="ACTIVE",
                    assigned_tasks_count=1,
                    completed_tasks_count=24,
                    rating=4.95,
                ),
                models.MaintainerORM(
                    id="MNT-2026-003",
                    name="Liam O'Connor",
                    email="liam.oconnor@roadguard.ai",
                    password_hash="maintainer2026",
                    phone="+1 (555) 912-3456",
                    department="Emergency Response Unit",
                    status="ACTIVE",
                    assigned_tasks_count=3,
                    completed_tasks_count=15,
                    rating=4.8,
                ),
                models.MaintainerORM(
                    id="MNT-2026-004",
                    name="Elena Rostova",
                    email="elena.rostova@roadguard.ai",
                    password_hash="maintainer2026",
                    phone="+1 (555) 341-6789",
                    department="Concrete & Surface Repair",
                    status="INACTIVE",
                    assigned_tasks_count=0,
                    completed_tasks_count=12,
                    rating=4.7,
                ),
            ]
            db.add_all(demo_maintainers)
            db.commit()
    finally:
        db.close()
