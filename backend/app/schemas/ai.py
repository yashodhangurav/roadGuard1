from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.detection import DetectedDefect, RoadDamageStats

class ExplainRequest(BaseModel):
    imageId: Optional[str] = None
    defects: List[DetectedDefect] = Field(default_factory=list)
    stats: Optional[RoadDamageStats] = None
    locationContext: Optional[str] = Field("Urban Arterial Roadway", description="Optional road location or corridor context")

class ExplainResponse(BaseModel):
    explanation: str
    damageSummary: str
    safetyRisks: List[str]
    urgencyAssessment: str
    disclaimer: str
    model: str = "gemma3:1b"

class RecommendRequest(BaseModel):
    imageId: Optional[str] = None
    defects: List[DetectedDefect] = Field(default_factory=list)
    stats: Optional[RoadDamageStats] = None
    roadType: Optional[str] = "Asphalt Concrete"
    weatherCondition: Optional[str] = "Dry"

class RecommendationItem(BaseModel):
    defectId: str
    type: str
    priority: str
    repairMethod: str
    materialsNeeded: str
    estimatedLaborHours: float
    equipmentNeeded: str

class RecommendResponse(BaseModel):
    recommendations: List[RecommendationItem]
    engineeringSummary: str
    estimatedTotalCostUsd: float
    model: str = "gemma3:1b"

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = Field(default_factory=list)
    inspectionContext: Optional[Dict[str, Any]] = Field(None, description="Current inspection or defect context")

class ChatResponse(BaseModel):
    reply: str
    timestamp: str
    model: str = "gemma3:1b"
