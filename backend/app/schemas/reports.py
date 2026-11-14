from typing import List, Optional, Dict, Any
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
    image_phash: Optional[str] = None
    orb_keypoints_count: Optional[int] = 0
    canonical_issue_id: Optional[str] = None
    is_duplicate: Optional[bool] = False
    duplicate_status: Optional[str] = "NEW_ISSUE"
    duplicate_review_status: Optional[str] = "NONE"
    duplicate_match_type: Optional[str] = None
    # 8-Stage Progress Lifecycle Fields
    current_stage: Optional[str] = "Reported"
    status: Optional[str] = "Submitted"
    assigned_department: Optional[str] = None
    assigned_crew: Optional[str] = None
    expected_completion_date: Optional[str] = None
    reopened_count: Optional[int] = 0
    reopened_reason: Optional[str] = None
    before_images: Optional[List[str]] = []
    during_images: Optional[List[str]] = []
    after_images: Optional[List[str]] = []
    # Geotag-Verified Telemetry Fields
    altitude: Optional[float] = None
    gps_accuracy: Optional[float] = None
    readable_address: Optional[str] = None
    capture_timestamp: Optional[str] = None
    upload_timestamp: Optional[str] = None
    capture_method: Optional[str] = "in_app_camera"
    geotag_verified: Optional[bool] = False
    exif_metadata_available: Optional[bool] = False
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None
    original_image_path: Optional[str] = None
    stamped_image_path: Optional[str] = None
    original_image_url: Optional[str] = None
    stamped_image_url: Optional[str] = None
    # Maintainer Assignment Fields
    assigned_maintainer_id: Optional[str] = None
    assigned_maintainer_name: Optional[str] = None
    assignment_priority: Optional[str] = "MEDIUM"
    admin_instructions: Optional[str] = None
    assigned_at: Optional[str] = None
    assigned_by: Optional[str] = None
    repair_started_at: Optional[str] = None
    # AI Repair Verification Fields
    repair_before_image: Optional[str] = None
    repair_before_gps: Optional[Any] = None
    repair_after_image: Optional[str] = None
    repair_after_gps: Optional[Any] = None
    ai_verification_status: Optional[str] = "NOT_STARTED"
    ai_verification_report: Optional[Dict[str, Any]] = None
    resolved_at: Optional[str] = None
    resolved_by: Optional[str] = None

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

class NearbyReportItemSchema(BaseModel):
    id: str
    client_report_id: Optional[str] = None
    category: str = "Pothole"
    severity: str = "High"
    status: str = "Submitted"
    description: Optional[str] = ""
    latitude: float
    longitude: float
    address: Optional[str] = None
    distance_meters: float
    image_url: Optional[str] = ""
    annotated_image_url: Optional[str] = ""
    image_phash: Optional[str] = None
    submitted_at: Optional[str] = None
    pci_score: Optional[float] = None
    total_defects: Optional[int] = 0

class NearbyReportsResponse(BaseModel):
    center: Dict[str, float]
    radius_meters: float
    total_found: int
    reports: List[NearbyReportItemSchema]

class OrbMatchingMetricsSchema(BaseModel):
    query_keypoints_count: int = 0
    train_keypoints_count: int = 0
    good_matches_count: int = 0
    ransac_inliers_count: int = 0
    inlier_ratio: float = 0.0
    has_homography: bool = False
    match_verdict: str = "DISTINCT"
    similarity_score: float = 0.0

class DuplicateCandidateSchema(BaseModel):
    report_id: str
    client_report_id: Optional[str] = None
    canonical_issue_id: Optional[str] = None
    distance: int  # pHash Hamming distance
    similarity_score: float  # Composite or primary visual similarity
    match_level: str  # IDENTICAL, NEAR_IDENTICAL, VIEWPOINT_MATCH, HIGH_SIMILARITY, DISTINCT
    match_type: Optional[str] = "PHASH"  # PHASH, ORB_VIEWPOINT, COMBINED, PROBABLE_ORB, VISUAL_RESEMBLANCE
    match_reason: Optional[str] = None
    verdict: Optional[str] = None  # CONFIRMED_DUPLICATE, NEEDS_REVIEW, NEW_ISSUE
    confidence_tier: Optional[str] = None  # HIGH, MODERATE, LOW
    evidence_score: Optional[float] = None
    is_candidate_duplicate: bool
    category: str
    severity: str
    status: str
    distance_meters: Optional[float] = None
    address: Optional[str] = None
    image_url: Optional[str] = None
    annotated_image_url: Optional[str] = None
    submitted_at: Optional[str] = None
    orb_metrics: Optional[OrbMatchingMetricsSchema] = None

class DuplicateDetectionSummarySchema(BaseModel):
    image_phash: Optional[str] = None
    orb_keypoints_detected: Optional[int] = 0
    candidates_evaluated: int = 0
    has_potential_duplicate: bool = False
    duplicate_candidates: List[DuplicateCandidateSchema] = []
    top_match: Optional[DuplicateCandidateSchema] = None

class CheckDuplicateResponse(BaseModel):
    query_phash: str
    orb_keypoints_detected: int = 0
    search_radius_meters: float
    total_nearby_evaluated: int
    has_duplicate_candidate: bool
    overall_verdict: Optional[str] = "NEW_ISSUE"
    duplicate_candidates: List[DuplicateCandidateSchema]

class DuplicateReviewRequestSchema(BaseModel):
    action: str  # "CONFIRM_DUPLICATE" or "DISMISS_DUPLICATE"
    canonical_issue_id: Optional[str] = None
    admin_notes: Optional[str] = None

class DuplicateReviewResponseSchema(BaseModel):
    success: bool
    report_id: str
    action: str
    is_duplicate: bool
    duplicate_status: str
    duplicate_review_status: str
    canonical_issue_id: Optional[str] = None
    message: str


# -------------------------------------------------------------
# 8-Stage Road Damage Progress Monitoring & Repair Schemas
# -------------------------------------------------------------

class RepairPhotoSchema(BaseModel):
    url: str
    stage: str  # "before" | "during" | "after"
    caption: Optional[str] = None
    actor_name: Optional[str] = "Department User"
    actor_role: Optional[str] = "Department Crew"
    department: Optional[str] = None
    uploaded_at: Optional[str] = None

class RepairProgressHistoryEntrySchema(BaseModel):
    id: str
    stage: str
    status: str
    timestamp: str
    actor_name: str
    actor_role: str
    department: Optional[str] = None
    crew: Optional[str] = None
    expected_completion_date: Optional[str] = None
    notes: Optional[str] = None
    reopen_reason: Optional[str] = None
    photos: List[RepairPhotoSchema] = []

class ProgressStageUpdateRequestSchema(BaseModel):
    stage: str = Field(..., description="One of: Reported, Admin verified, Assigned to department, Scheduled, Repair in progress, Repair completed, Final verification, Closed, Reopened")
    actor_name: str = Field(..., description="Name of person performing action")
    actor_role: str = Field(..., description="Role: Administrator, Department User, QA Inspector, etc.")
    department: Optional[str] = None
    crew: Optional[str] = None
    expected_completion_date: Optional[str] = None
    notes: Optional[str] = None
    reopen_reason: Optional[str] = None

class ProgressResponseSchema(BaseModel):
    success: bool
    report_id: str
    current_stage: str
    status: str
    assigned_department: Optional[str] = None
    assigned_crew: Optional[str] = None
    expected_completion_date: Optional[str] = None
    reopened_count: int = 0
    reopened_reason: Optional[str] = None
    before_images: List[str] = []
    during_images: List[str] = []
    after_images: List[str] = []
    repair_progress_history: List[RepairProgressHistoryEntrySchema] = []
    linked_duplicates_count: int = 0
    message: str

class UploadPhotoResponseSchema(BaseModel):
    success: bool
    report_id: str
    photo_url: str
    stage: str
    caption: Optional[str] = None
    message: str




