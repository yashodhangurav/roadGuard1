from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class MaintainerBaseSchema(BaseModel):
    name: str = Field(..., description="Maintainer's full name")
    email: str = Field(..., description="Unique email address")
    phone: Optional[str] = Field(None, description="Contact mobile number")
    department: str = Field("Rapid Patch Division", description="Municipal road works department")
    status: str = Field("ACTIVE", description="ACTIVE | INACTIVE | ON_LEAVE")

class MaintainerCreateSchema(MaintainerBaseSchema):
    password: str = Field(..., min_length=6, description="Password for maintainer login")

class MaintainerUpdateSchema(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None

class MaintainerResponseSchema(MaintainerBaseSchema):
    id: str
    assigned_tasks_count: int = 0
    completed_tasks_count: int = 0
    rating: float = 5.0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}

class MaintainerLoginRequestSchema(BaseModel):
    email: str = Field(..., description="Maintainer email")
    password: str = Field(..., description="Maintainer password")

class MaintainerLoginResponseSchema(BaseModel):
    success: bool
    user: Optional[MaintainerResponseSchema] = None
    token: Optional[str] = None
    role: str = "maintainer"
    error: Optional[str] = None

class TaskAssignmentRequestSchema(BaseModel):
    maintainer_id: str = Field(..., description="ID of the maintainer to assign")
    priority: str = Field("MEDIUM", description="LOW | MEDIUM | HIGH | CRITICAL")
    admin_instructions: Optional[str] = Field("", description="Work instructions for the maintainer")
    target_completion_date: Optional[str] = Field(None, description="Target deadline (YYYY-MM-DD)")
    assigned_by: Optional[str] = Field("Administrator", description="Name of assigning administrator")

class TaskAssignmentResponseSchema(BaseModel):
    success: bool
    report_id: str
    assigned_maintainer_id: str
    assigned_maintainer_name: str
    priority: str
    status: str
    current_stage: str
    target_completion_date: Optional[str] = None
    message: str

class BeforeAfterAnalysisDetails(BaseModel):
    potholeDetected: bool
    defectCount: int
    damageAreaCm2: float
    confidence: float
    severity: str
    boundingBoxes: List[Dict[str, Any]] = []

class AIRepairVerificationResponseSchema(BaseModel):
    issueId: str
    verificationStatus: str = Field(..., description="VERIFIED | REJECTED | NEEDS_REVIEW")
    repairSuccess: bool
    confidence: float
    remainingDamage: bool
    areaReductionPercentage: float
    surfaceRestorationScore: float
    locationVerified: bool
    distanceFromTicketMeters: Optional[float] = None
    beforeAnalysis: BeforeAfterAnalysisDetails
    afterAnalysis: BeforeAfterAnalysisDetails
    reason: str
    beforeImageUrl: Optional[str] = None
    afterImageUrl: Optional[str] = None
    verifiedAt: str

class ManualRepairDecisionRequestSchema(BaseModel):
    action: str = Field(..., description="APPROVE or REJECT")
    notes: Optional[str] = Field("", description="Admin QA rationale")
    admin_name: Optional[str] = Field("Administrator", description="Admin reviewer name")

