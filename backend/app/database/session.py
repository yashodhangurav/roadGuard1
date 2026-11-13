from datetime import datetime, timedelta
from sqlalchemy import create_engine
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
    finally:
        db.close()
