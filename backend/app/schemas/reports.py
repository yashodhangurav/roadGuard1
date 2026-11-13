from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class DefectItemSchema(BaseModel):
    id: str
    report_id: str
    type: str
    raw_class: str
    severity: str
    severity_score: float
    confidence: float
    box: Dict[str, float]
    dimensions: Dict[str, float]
    urgency: str
    repair_method: str

    model_config = {"from_attributes": True}

class ReportSummarySchema(BaseModel):
    id: str
    file_name: str
    image_url: str
    annotated_image_url: str
    analyzed_at: str
    total_defects: int
    potholes_count: int
    cracks_count: int
    critical_count: int
    overall_condition: str
    pci_score: float
    hazard_index: float
    estimated_patch_tons: float
    location_name: str
    latitude: float
    longitude: float

    model_config = {"from_attributes": True}

class ReportDetailSchema(ReportSummarySchema):
    defects: List[DefectItemSchema] = []

class StatisticsResponse(BaseModel):
    total_inspections: int
    total_defects: int
    critical_defects: int
    potholes_count: int
    cracks_count: int
    avg_pci_score: float
    condition_breakdown: Dict[str, int]
    severity_breakdown: Dict[str, int]
    recent_reports: List[ReportSummarySchema]
