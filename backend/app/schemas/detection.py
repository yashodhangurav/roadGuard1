from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    """Normalized bounding box coordinates as percentages (0 - 100)"""
    x: float = Field(..., description="Top-left X coordinate percentage (0 - 100)")
    y: float = Field(..., description="Top-left Y coordinate percentage (0 - 100)")
    width: float = Field(..., description="Box width percentage (0 - 100)")
    height: float = Field(..., description="Box height percentage (0 - 100)")
    xyxy: Optional[List[float]] = Field(None, description="Absolute pixel coordinates [x1, y1, x2, y2]")

class DefectDimensions(BaseModel):
    widthCm: float = Field(..., description="Estimated physical defect width in cm")
    heightCm: float = Field(..., description="Estimated physical defect height in cm")
    estimatedDepthMm: Optional[float] = Field(None, description="Image-derived shadow/contrast depth proxy in mm (not true 3D LIDAR depth)")
    areaCm2: float = Field(..., description="Estimated physical surface defect area in cm^2")

class DetectedDefect(BaseModel):
    id: str
    type: str = Field(..., description="Damage type name (e.g. Pothole, Longitudinal Crack, Alligator Crack)")
    raw_class: str = Field("D40", description="Dataset class code (D00, D10, D20, D40)")
    severity: str = Field(..., description="Calculated severity (Low, Medium, High, Critical)")
    severity_score: float = Field(..., description="Composite deterministic severity score (0 - 100)")
    confidence: float = Field(..., description="Model detection confidence percentage (0 - 100)")
    box: BoundingBox
    dimensions: DefectDimensions
    urgency: str = Field(..., description="Maintenance urgency (Immediate, Priority (48h), Routine, Monitor)")
    repairMethod: str = Field(..., description="Recommended engineering repair method")

class RoadDamageStats(BaseModel):
    totalDefects: int
    potholesCount: int
    cracksCount: int
    deteriorationCount: int
    criticalCount: int
    overallCondition: str = Field(..., description="Critical, Poor, Fair, Good")
    hazardIndex: float = Field(..., description="Composite hazard index (0 - 100)")
    pciScore: float = Field(..., description="Estimated Pavement Condition Index (0 - 100 ASTM D6433 proxy)")
    estimatedPatchTons: float = Field(..., description="Estimated asphalt patch material requirement in metric tons")
    scanDurationMs: float

class ModelInfo(BaseModel):
    name: str = "YOLOv8s-RoadDamage-Edge"
    version: str = "v1.0.0-verified"
    architecture: str = "YOLOv8s (Ultralytics PyTorch)"
    inferenceTimeMs: float
    supportedClasses: List[str] = [
        "D00 — Longitudinal Crack",
        "D10 — Transverse Crack",
        "D20 — Alligator Crack",
        "D40 — Pothole"
    ]
    unsupportedClasses: List[str] = [
        "CHUNK_HOLE (Untrained in checkpoint)",
        "WATER_FILLED_HOLE (Untrained in checkpoint)"
    ]

class DetectionResponse(BaseModel):
    imageId: str
    fileName: str
    imageUrl: str
    annotatedImageUrl: str
    analyzedAt: str
    defects: List[DetectedDefect]
    stats: RoadDamageStats
    backend: str = "Live YOLOv8 API"
    backendEndpoint: str = "/api/detect/image"
    modelInfo: ModelInfo
