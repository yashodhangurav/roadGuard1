from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
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

    defects = relationship("DefectItemORM", back_populates="report", cascade="all, delete-orphan")

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
