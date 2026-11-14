import math
import logging
import uuid
from typing import Optional, Dict, Any, Tuple, List
from datetime import datetime
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.core.config import settings

logger = logging.getLogger("roadguard.mongodb")

_mongo_client: Optional[MongoClient] = None

def get_mongo_client() -> MongoClient:
    """Return a singleton MongoClient instance."""
    global _mongo_client
    if _mongo_client is None:
        try:
            logger.info("Initializing MongoDB Atlas connection pool...")
            _mongo_client = MongoClient(
                settings.MONGODB_URI,
                maxPoolSize=50,
                minPoolSize=5,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
                socketTimeoutMS=20000,
                retryWrites=True,
                appName="RoadGuardOfflineSync"
            )
            # Fast ping test
            _mongo_client.admin.command("ping")
            logger.info("Successfully connected to MongoDB Atlas!")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB Atlas: {e}")
            raise
    return _mongo_client

def get_mongo_db() -> Database:
    """Return the RoadGuard database instance."""
    client = get_mongo_client()
    return client[settings.MONGODB_DB_NAME]

def get_reports_collection() -> Collection:
    """Return the reports collection."""
    db = get_mongo_db()
    return db[settings.MONGODB_COLLECTION_REPORTS]

def get_maintainers_collection() -> Collection:
    """Return the maintainers collection."""
    db = get_mongo_db()
    return db["maintainers"]

def init_mongodb():
    """Ensure indexes exist for performance and idempotency."""
    try:
        col = get_reports_collection()
        # 1. Idempotency unique index on client_report_id (UUID)
        col.create_index("client_report_id", unique=True, sparse=True, name="idx_client_report_id_unique")
        # 2. Time-series sorting index
        col.create_index([("submitted_at", -1)], name="idx_submitted_at_desc")
        # 3. Status filter index
        col.create_index("status", name="idx_status")
        # 4. Geospatial 2dsphere index for location radius searches
        col.create_index([("location.coordinates", "2dsphere")], name="idx_location_2dsphere")
        # 5. Perceptual image hash index for duplicate detection
        col.create_index("image_phash", sparse=True, name="idx_image_phash")
        # 6. Canonical issue and duplicate tracking indexes
        col.create_index("canonical_issue_id", sparse=True, name="idx_canonical_issue_id")
        col.create_index("duplicate_status", sparse=True, name="idx_duplicate_status")
        col.create_index("duplicate_review_status", sparse=True, name="idx_duplicate_review_status")
        # 7. Progress monitoring lifecycle indexes
        col.create_index("current_stage", sparse=True, name="idx_current_stage")
        col.create_index("assigned_department", sparse=True, name="idx_assigned_department")
        # 8. Geotag verification and capture method indexes
        col.create_index("geotag_verified", sparse=True, name="idx_geotag_verified")
        col.create_index("capture_method", sparse=True, name="idx_capture_method")
        # 9. Maintainer assignment and AI repair verification indexes
        col.create_index("assigned_maintainer_id", sparse=True, name="idx_assigned_maintainer_id")
        col.create_index("ai_verification_status", sparse=True, name="idx_ai_verification_status")

        # Initialize maintainers collection indexes
        m_col = get_maintainers_collection()
        m_col.create_index("email", unique=True, name="idx_maintainer_email_unique")
        m_col.create_index("status", name="idx_maintainer_status")
        m_col.create_index("id", unique=True, name="idx_maintainer_id_unique")

        logger.info("MongoDB Atlas indexes initialized successfully.")
    except Exception as e:
        logger.warning(f"Could not initialize MongoDB indexes (will retry on usage): {e}")

def check_mongo_health() -> Dict[str, Any]:
    """Health check for MongoDB Atlas."""
    try:
        client = get_mongo_client()
        ping_res = client.admin.command("ping")
        col = get_reports_collection()
        doc_count = col.count_documents({})
        return {
            "status": "connected",
            "cluster": "Atlas",
            "database": settings.MONGODB_DB_NAME,
            "collection": settings.MONGODB_COLLECTION_REPORTS,
            "total_reports": doc_count,
            "ping_ok": bool(ping_res.get("ok")),
        }
    except Exception as e:
        return {
            "status": "disconnected",
            "error": str(e)
        }

def find_by_client_report_id(client_report_id: str) -> Optional[Dict[str, Any]]:
    """Look up an existing synchronized report by its idempotency client UUID."""
    if not client_report_id:
        return None
    try:
        col = get_reports_collection()
        return col.find_one({"client_report_id": client_report_id})
    except PyMongoError as e:
        logger.error(f"Error checking client_report_id {client_report_id}: {e}")
        return None

def save_synced_report_to_mongodb(report_data: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Atomically insert or retrieve a synced report in MongoDB Atlas.
    Returns: (is_new: bool, report_id_str: str)
    """
    col = get_reports_collection()
    client_id = report_data.get("client_report_id")

    # If client_report_id exists, check if already in DB
    if client_id:
        existing = col.find_one({"client_report_id": client_id})
        if existing:
            return False, str(existing["_id"])

    # Ensure document metadata
    now = datetime.utcnow()
    report_data["synced_at"] = now
    if "created_at" not in report_data:
        report_data["created_at"] = now

    # Ensure 8-stage progress monitoring initialized
    if "current_stage" not in report_data:
        report_data["current_stage"] = "Reported"
    if "before_images" not in report_data:
        report_data["before_images"] = [report_data["image_url"]] if report_data.get("image_url") else []
    if "during_images" not in report_data:
        report_data["during_images"] = []
    if "after_images" not in report_data:
        report_data["after_images"] = []
    if "reopened_count" not in report_data:
        report_data["reopened_count"] = 0
    if "repair_progress_history" not in report_data:
        init_photos = []
        if report_data.get("image_url"):
            init_photos.append({
                "url": report_data["image_url"],
                "stage": "before",
                "caption": "Initial citizen submission evidence",
                "actor_name": report_data.get("citizen", {}).get("name", "Citizen Reporter"),
                "actor_role": "Citizen",
                "uploaded_at": now.isoformat(),
            })
        report_data["repair_progress_history"] = [
            {
                "id": f"prog-{uuid.uuid4().hex[:8]}",
                "stage": "Reported",
                "status": "Submitted",
                "timestamp": now.isoformat(),
                "actor_name": report_data.get("citizen", {}).get("name", "Citizen Reporter"),
                "actor_role": "Citizen",
                "department": None,
                "crew": None,
                "expected_completion_date": None,
                "notes": report_data.get("description") or "Citizen submitted road damage report with GNSS coordinates.",
                "reopen_reason": None,
                "photos": init_photos,
            }
        ]

    try:
        result = col.insert_one(report_data)
        return True, str(result.inserted_id)
    except DuplicateKeyError:
        # Race condition handled gracefully: another concurrent worker already inserted it!
        existing = col.find_one({"client_report_id": client_id})
        if existing:
            return False, str(existing["_id"])
        raise

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great Circle distance in meters between two lat/lon coordinates."""
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return round(R * c, 1)

def find_nearby_reports(
    latitude: float,
    longitude: float,
    radius_meters: float = 50.0,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Search for road incident reports within `radius_meters` of the given coordinates.
    Uses MongoDB 2dsphere index with $nearSphere.
    Returns list of reports with calculated `distance_meters`.
    """
    try:
        col = get_reports_collection()
        # Query using $nearSphere
        cursor = col.find({
            "location.coordinates": {
                "$nearSphere": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [longitude, latitude],
                    },
                    "$maxDistance": radius_meters,
                }
            }
        }).limit(limit)

        results = []
        for doc in cursor:
            doc_id = str(doc.get("_id", ""))
            loc = doc.get("location", {})
            coords = loc.get("coordinates", [0, 0])
            doc_lng = float(coords[0]) if len(coords) > 0 else 0.0
            doc_lat = float(coords[1]) if len(coords) > 1 else 0.0

            dist = haversine_distance_meters(latitude, longitude, doc_lat, doc_lng)

            results.append({
                "id": doc_id,
                "client_report_id": doc.get("client_report_id", doc_id),
                "category": doc.get("category", "Pothole"),
                "severity": doc.get("severity", "High"),
                "status": doc.get("status", "Submitted"),
                "description": doc.get("description", ""),
                "latitude": doc_lat,
                "longitude": doc_lng,
                "address": loc.get("address", f"{doc_lat:.5f}, {doc_lng:.5f}"),
                "distance_meters": dist,
                "image_url": doc.get("image_url", ""),
                "annotated_image_url": doc.get("annotated_image_url", ""),
                "image_phash": doc.get("image_phash"),
                "canonical_issue_id": doc.get("canonical_issue_id"),
                "is_duplicate": doc.get("is_duplicate", False),
                "duplicate_status": doc.get("duplicate_status", "NEW_ISSUE"),
                "duplicate_review_status": doc.get("duplicate_review_status", "NONE"),
                "submitted_at": doc.get("submitted_at") or (doc.get("created_at").isoformat() if hasattr(doc.get("created_at"), "isoformat") else str(doc.get("created_at"))),
                "pci_score": doc.get("yolo_detection", {}).get("pci_score"),
                "total_defects": doc.get("yolo_detection", {}).get("total_defects", 0),
            })

        results.sort(key=lambda x: x["distance_meters"])
        return results
    except Exception as e:
        logger.error(f"Error querying nearby reports in MongoDB: {e}")
        return []

def sanitize_mongo_doc(obj: Any) -> Any:
    """Recursively convert ObjectId to string and datetime to ISO format for JSON serialization."""
    from bson import ObjectId
    if isinstance(obj, dict):
        new_dict = {}
        for k, v in obj.items():
            if k == "_id":
                new_dict["id"] = str(v)
            else:
                new_dict[k] = sanitize_mongo_doc(v)
        return new_dict
    elif isinstance(obj, list):
        return [sanitize_mongo_doc(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def find_reports_by_canonical_id(canonical_id: str) -> List[Dict[str, Any]]:
    """Retrieve all linked duplicate submissions attached to a canonical issue."""
    try:
        col = get_reports_collection()
        target_ids = {canonical_id}
        parent = find_report_by_id_or_client_id(canonical_id)
        if parent:
            if parent.get("id"):
                target_ids.add(str(parent["id"]))
            if parent.get("client_report_id"):
                target_ids.add(str(parent["client_report_id"]))

        cursor = col.find({"canonical_issue_id": {"$in": list(target_ids)}}).sort("submitted_at", 1)
        results = []
        for doc in cursor:
            results.append(sanitize_mongo_doc(doc))
        return results
    except Exception as e:
        logger.error(f"Error finding child duplicates for canonical issue {canonical_id}: {e}")
        return []

def find_pending_duplicate_reviews(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve all reports whose duplicate matching is uncertain and pending admin review."""
    try:
        col = get_reports_collection()
        cursor = col.find({"duplicate_review_status": "PENDING_ADMIN_REVIEW"}).sort("created_at", -1).limit(limit)
        results = []
        for doc in cursor:
            results.append(sanitize_mongo_doc(doc))
        return results
    except Exception as e:
        logger.error(f"Error finding pending duplicate reviews: {e}")
        return []

def update_duplicate_review_decision(
    report_id: str,
    action: str,
    canonical_id: Optional[str] = None,
    admin_notes: Optional[str] = None
) -> bool:
    """
    Apply admin review decision:
    - 'CONFIRM_DUPLICATE': mark is_duplicate=True, status='CONFIRMED_DUPLICATE', review_status='APPROVED_BY_ADMIN'
    - 'DISMISS_DUPLICATE': mark is_duplicate=False, status='NEW_ISSUE', review_status='DISMISSED_BY_ADMIN'
    """
    try:
        from bson import ObjectId
        col = get_reports_collection()
        
        filter_query = {"client_report_id": report_id}
        if ObjectId.is_valid(report_id):
            filter_query = {"$or": [{"_id": ObjectId(report_id)}, {"client_report_id": report_id}]}

        if action == "CONFIRM_DUPLICATE":
            update_data = {
                "is_duplicate": True,
                "duplicate_status": "CONFIRMED_DUPLICATE",
                "duplicate_review_status": "APPROVED_BY_ADMIN",
            }
            if canonical_id:
                update_data["canonical_issue_id"] = canonical_id
        else:
            update_data = {
                "is_duplicate": False,
                "duplicate_status": "NEW_ISSUE",
                "duplicate_review_status": "DISMISSED_BY_ADMIN",
                "canonical_issue_id": None,
            }

        if admin_notes:
            update_data["duplicate_admin_notes"] = admin_notes
        update_data["duplicate_reviewed_at"] = datetime.utcnow()

        res = col.update_one(filter_query, {"$set": update_data})
        return res.modified_count > 0 or res.matched_count > 0
    except Exception as e:
        logger.error(f"Error updating duplicate review decision for {report_id}: {e}")
        return False


STAGE_TO_STATUS_MAP = {
    "Reported": "Submitted",
    "Admin verified": "Under Review",
    "Assigned to department": "Under Review",
    "Scheduled": "In Progress",
    "Repair in progress": "In Progress",
    "Repair completed": "Under Review",
    "Final verification": "Under Review",
    "Closed": "Resolved",
    "Reopened": "In Progress",
}

VALID_PROGRESS_STAGES = [
    "Reported",
    "Admin verified",
    "Assigned to department",
    "Scheduled",
    "Repair in progress",
    "Repair completed",
    "Final verification",
    "Closed",
    "Reopened",
]

def find_report_by_id_or_client_id(report_id: str) -> Optional[Dict[str, Any]]:
    """Look up a report document by either MongoDB _id or client_report_id."""
    try:
        from bson import ObjectId
        col = get_reports_collection()
        filter_query = {"client_report_id": report_id}
        if ObjectId.is_valid(report_id):
            filter_query = {"$or": [{"_id": ObjectId(report_id)}, {"client_report_id": report_id}]}
        doc = col.find_one(filter_query)
        return sanitize_mongo_doc(doc) if doc else None
    except Exception as e:
        logger.error(f"Error finding report {report_id}: {e}")
        return None

def update_report_progress_stage(
    report_id: str,
    stage: str,
    actor_name: str,
    actor_role: str,
    department: Optional[str] = None,
    crew: Optional[str] = None,
    expected_completion_date: Optional[str] = None,
    notes: Optional[str] = None,
    reopen_reason: Optional[str] = None,
    photo_urls: Optional[List[Dict[str, Any]]] = None
) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """
    Advance or update a canonical road damage issue through the 8 progress stages:
    1. Reported
    2. Admin verified
    3. Assigned to department
    4. Scheduled
    5. Repair in progress
    6. Repair completed
    7. Final verification
    8. Closed or Reopened
    Also updates linked child duplicate reports so citizen timelines stay synchronized.
    """
    try:
        from bson import ObjectId
        col = get_reports_collection()
        now = datetime.utcnow()
        now_iso = now.isoformat()

        filter_query = {"client_report_id": report_id}
        if ObjectId.is_valid(report_id):
            filter_query = {"$or": [{"_id": ObjectId(report_id)}, {"client_report_id": report_id}]}

        existing = col.find_one(filter_query)
        if not existing:
            return False, None

        actual_client_id = existing.get("client_report_id") or str(existing["_id"])
        new_status = STAGE_TO_STATUS_MAP.get(stage, "In Progress")

        # Prepare new progress event entry
        progress_event_id = f"prog-{uuid.uuid4().hex[:8]}"
        new_history_entry = {
            "id": progress_event_id,
            "stage": stage,
            "status": new_status,
            "timestamp": now_iso,
            "actor_name": actor_name,
            "actor_role": actor_role,
            "department": department or existing.get("assigned_department"),
            "crew": crew or existing.get("assigned_crew"),
            "expected_completion_date": expected_completion_date or existing.get("expected_completion_date"),
            "notes": notes or f"Stage updated to {stage} by {actor_name} ({actor_role}).",
            "reopen_reason": reopen_reason if stage == "Reopened" else None,
            "photos": photo_urls or [],
        }

        # Build MongoDB $set updates
        set_updates: Dict[str, Any] = {
            "current_stage": stage,
            "status": new_status,
            "updated_at": now,
        }

        if department:
            set_updates["assigned_department"] = department
        if crew:
            set_updates["assigned_crew"] = crew
        if expected_completion_date:
            set_updates["expected_completion_date"] = expected_completion_date
        if stage == "Reopened":
            set_updates["reopened_count"] = (existing.get("reopened_count") or 0) + 1
            set_updates["reopened_reason"] = reopen_reason or notes or "Incomplete repair requires rework."

        timeline_note = notes or f"Progress advanced to: {stage} by {actor_name}."
        if stage == "Reopened" and reopen_reason:
            timeline_note = f"ISSUE REOPENED for rework: {reopen_reason}"
        elif stage == "Scheduled" and expected_completion_date:
            timeline_note = f"Repair scheduled. Target completion: {expected_completion_date}. {notes or ''}"

        timeline_entry = {
            "status": new_status,
            "stage": stage,
            "timestamp": now_iso,
            "note": timeline_note,
        }

        # Atomically push history and update document
        col.update_one(
            filter_query,
            {
                "$set": set_updates,
                "$push": {
                    "repair_progress_history": new_history_entry,
                    "timeline": timeline_entry,
                }
            }
        )

        # Propagate to any linked duplicate submissions (preserving all citizen reports)
        col.update_many(
            {"canonical_issue_id": actual_client_id},
            {
                "$set": {
                    "current_stage": stage,
                    "status": new_status,
                    "assigned_department": set_updates.get("assigned_department", existing.get("assigned_department")),
                    "assigned_crew": set_updates.get("assigned_crew", existing.get("assigned_crew")),
                    "expected_completion_date": set_updates.get("expected_completion_date", existing.get("expected_completion_date")),
                    "updated_at": now,
                },
                "$push": {
                    "timeline": {
                        "status": new_status,
                        "stage": stage,
                        "timestamp": now_iso,
                        "note": f"Canonical issue #{actual_client_id} updated: {stage}. {timeline_note}",
                    }
                }
            }
        )

        updated_doc = col.find_one(filter_query)
        return True, sanitize_mongo_doc(updated_doc)
    except Exception as e:
        logger.error(f"Error updating report progress stage for {report_id}: {e}")
        return False, None

def add_repair_progress_photo(
    report_id: str,
    photo_url: str,
    stage: str,  # 'before', 'during', 'after'
    caption: Optional[str] = None,
    actor_name: str = "Authorized Department User",
    actor_role: str = "Department Crew",
    department: Optional[str] = None
) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """
    Append an authorized repair photograph ('before', 'during', or 'after') to the canonical issue.
    """
    try:
        from bson import ObjectId
        col = get_reports_collection()
        now = datetime.utcnow()
        now_iso = now.isoformat()

        filter_query = {"client_report_id": report_id}
        if ObjectId.is_valid(report_id):
            filter_query = {"$or": [{"_id": ObjectId(report_id)}, {"client_report_id": report_id}]}

        existing = col.find_one(filter_query)
        if not existing:
            return False, None

        photo_record = {
            "url": photo_url,
            "stage": stage.lower(),
            "caption": caption or f"{stage.capitalize()} repair photograph uploaded by {actor_name}",
            "actor_name": actor_name,
            "actor_role": actor_role,
            "department": department or existing.get("assigned_department"),
            "uploaded_at": now_iso,
        }

        # Target bucket
        bucket = f"{stage.lower()}_images"
        if bucket not in ["before_images", "during_images", "after_images"]:
            bucket = "during_images"

        progress_event = {
            "id": f"prog-{uuid.uuid4().hex[:8]}",
            "stage": f"Photo: {stage.capitalize()}",
            "status": existing.get("status", "In Progress"),
            "timestamp": now_iso,
            "actor_name": actor_name,
            "actor_role": actor_role,
            "department": department or existing.get("assigned_department"),
            "notes": caption or f"New {stage} repair photograph uploaded by {actor_name}.",
            "photos": [photo_record],
        }

        col.update_one(
            filter_query,
            {
                "$push": {
                    bucket: photo_url,
                    "repair_progress_history": progress_event,
                    "timeline": {
                        "status": existing.get("status", "In Progress"),
                        "stage": existing.get("current_stage", "Repair in progress"),
                        "timestamp": now_iso,
                        "note": f"Repair photograph ({stage}) attached by {actor_name}: {caption or 'Evidence recorded'}",
                    }
                },
                "$set": {"updated_at": now}
            }
        )

        updated_doc = col.find_one(filter_query)
        return True, sanitize_mongo_doc(updated_doc)
    except Exception as e:
        logger.error(f"Error adding repair progress photo for {report_id}: {e}")
        return False, None


# --------------------------------------------------------------------------
# Maintainer Management & AI Repair Verification MongoDB Operations
# --------------------------------------------------------------------------

def get_maintainers_list(status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve list of maintainers from MongoDB Atlas."""
    try:
        col = get_maintainers_collection()
        query = {}
        if status_filter:
            query["status"] = status_filter.upper()
        docs = list(col.find(query).sort("name", 1))
        return [sanitize_mongo_doc(d) for d in docs]
    except Exception as e:
        logger.error(f"Error getting maintainers list from MongoDB: {e}")
        return []

def get_maintainer_by_id(maintainer_id: str) -> Optional[Dict[str, Any]]:
    """Find a maintainer document by ID."""
    try:
        col = get_maintainers_collection()
        doc = col.find_one({"id": maintainer_id})
        return sanitize_mongo_doc(doc) if doc else None
    except Exception as e:
        logger.error(f"Error fetching maintainer {maintainer_id}: {e}")
        return None

def get_maintainer_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Find a maintainer document by email."""
    try:
        col = get_maintainers_collection()
        doc = col.find_one({"email": email.strip().lower()})
        return sanitize_mongo_doc(doc) if doc else None
    except Exception as e:
        logger.error(f"Error fetching maintainer by email {email}: {e}")
        return None

def save_or_update_maintainer(doc: Dict[str, Any]) -> Tuple[bool, str]:
    """Insert or update a maintainer record in MongoDB."""
    try:
        col = get_maintainers_collection()
        mid = doc.get("id") or f"MNT-2026-{uuid.uuid4().hex[:6].upper()}"
        doc["id"] = mid
        doc["email"] = doc.get("email", "").strip().lower()
        now = datetime.utcnow()
        doc["updated_at"] = now
        if "created_at" not in doc:
            doc["created_at"] = now

        col.update_one({"id": mid}, {"$set": doc}, upsert=True)
        return True, mid
    except Exception as e:
        logger.error(f"Error saving maintainer to MongoDB: {e}")
        return False, str(e)

def assign_report_to_maintainer(
    report_id: str,
    maintainer_id: str,
    maintainer_name: str,
    priority: str = "MEDIUM",
    instructions: str = "",
    target_date: Optional[str] = None,
    assigned_by: str = "Administrator"
) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """Assign a road hazard report to a specific maintainer."""
    try:
        col = get_reports_collection()
        filter_query = {"client_report_id": report_id}
        existing = col.find_one(filter_query)
        if not existing:
            filter_query = {"id": report_id}
            existing = col.find_one(filter_query)
        if not existing:
            try:
                from bson import ObjectId
                filter_query = {"_id": ObjectId(report_id)}
                existing = col.find_one(filter_query)
            except Exception:
                pass

        if not existing:
            return False, None

        now = datetime.utcnow()
        now_iso = now.isoformat()

        timeline_entry = {
            "status": "In Progress",
            "stage": "Assigned to department",
            "timestamp": now_iso,
            "note": f"Task assigned to maintainer {maintainer_name} ({priority} Priority). Instructions: {instructions or 'Standard remediation'}",
        }

        progress_event = {
            "id": f"prog-{uuid.uuid4().hex[:8]}",
            "stage": "Assigned to department",
            "status": "In Progress",
            "timestamp": now_iso,
            "actor_name": assigned_by,
            "actor_role": "Administrator",
            "department": "Rapid Patch Division",
            "crew": maintainer_name,
            "expected_completion_date": target_date,
            "notes": instructions or f"Dispatched to maintainer {maintainer_name}.",
            "photos": [],
        }

        col.update_one(
            filter_query,
            {
                "$set": {
                    "assigned_maintainer_id": maintainer_id,
                    "assigned_maintainer_name": maintainer_name,
                    "assignment_priority": priority.upper(),
                    "admin_instructions": instructions,
                    "assigned_at": now_iso,
                    "assigned_by": assigned_by,
                    "expected_completion_date": target_date,
                    "status": "In Progress",
                    "current_stage": "Assigned to department",
                    "updated_at": now,
                },
                "$push": {
                    "timeline": timeline_entry,
                    "repair_progress_history": progress_event,
                }
            }
        )

        # Increment assigned tasks count for maintainer
        try:
            m_col = get_maintainers_collection()
            m_col.update_one({"id": maintainer_id}, {"$inc": {"assigned_tasks_count": 1}})
        except Exception:
            pass

        updated = col.find_one(filter_query)
        return True, sanitize_mongo_doc(updated)
    except Exception as e:
        logger.error(f"Error assigning report {report_id} to maintainer {maintainer_id}: {e}")
        return False, None

def get_tasks_for_maintainer(maintainer_id: str, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve all reports assigned to a given maintainer."""
    try:
        col = get_reports_collection()
        query: Dict[str, Any] = {"assigned_maintainer_id": maintainer_id}
        if status_filter:
            if status_filter.upper() == "COMPLETED":
                query["status"] = "Resolved"
            elif status_filter.upper() == "IN_PROGRESS":
                query["status"] = "In Progress"
            elif status_filter.upper() == "NEEDS_REVIEW":
                query["ai_verification_status"] = "NEEDS_REVIEW"
            elif status_filter.upper() == "REPAIR_REQUIRED":
                query["ai_verification_status"] = "REJECTED"

        docs = list(col.find(query).sort("submitted_at", -1))
        return [sanitize_mongo_doc(d) for d in docs]
    except Exception as e:
        logger.error(f"Error querying tasks for maintainer {maintainer_id}: {e}")
        return []

def update_report_ai_repair_verification(
    report_id: str,
    verification_data: Dict[str, Any]
) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """Store AI Before/After verification results and update issue status accordingly."""
    try:
        col = get_reports_collection()
        filter_query = {"client_report_id": report_id}
        existing = col.find_one(filter_query)
        if not existing:
            filter_query = {"id": report_id}
            existing = col.find_one(filter_query)
        if not existing:
            try:
                from bson import ObjectId
                filter_query = {"_id": ObjectId(report_id)}
                existing = col.find_one(filter_query)
            except Exception:
                pass

        if not existing:
            return False, None

        status_result = verification_data.get("verificationStatus", "NEEDS_REVIEW")
        now = datetime.utcnow()
        now_iso = now.isoformat()

        update_set: Dict[str, Any] = {
            "ai_verification_status": status_result,
            "ai_verification_report": verification_data,
            "repair_before_image": verification_data.get("beforeImageUrl"),
            "repair_after_image": verification_data.get("afterImageUrl"),
            "updated_at": now,
        }

        # Status transition logic
        if status_result == "VERIFIED":
            update_set["status"] = "Resolved"
            update_set["current_stage"] = "Closed"
            update_set["resolved_at"] = now_iso
            update_set["resolved_by"] = "AI_AUTO_VERIFIED"
            note_text = f"AI Repair Verification PASSED: Pothole successfully repaired ({verification_data.get('confidence', 0.95)*100:.1f}% confidence). Issue auto-resolved."
        elif status_result == "REJECTED":
            update_set["status"] = "In Progress"
            update_set["current_stage"] = "Reopened"
            note_text = f"AI Repair Verification REJECTED: Pothole still visible or repair incomplete. Reason: {verification_data.get('reason', 'Damage persists')}."
        else:
            update_set["status"] = "Under Review"
            update_set["current_stage"] = "Final verification"
            note_text = f"AI Repair Verification UNCERTAIN: Queued for municipal administrator QA audit. Reason: {verification_data.get('reason', 'Inspection required')}."

        timeline_entry = {
            "status": update_set.get("status", existing.get("status")),
            "stage": update_set.get("current_stage", existing.get("current_stage")),
            "timestamp": now_iso,
            "note": note_text,
        }

        col.update_one(
            filter_query,
            {
                "$set": update_set,
                "$push": {"timeline": timeline_entry}
            }
        )

        # If verified, increment maintainer's completed_tasks_count
        if status_result == "VERIFIED" and existing.get("assigned_maintainer_id"):
            try:
                m_col = get_maintainers_collection()
                m_col.update_one(
                    {"id": existing["assigned_maintainer_id"]},
                    {"$inc": {"completed_tasks_count": 1}}
                )
            except Exception:
                pass

        updated = col.find_one(filter_query)
        return True, sanitize_mongo_doc(updated)
    except Exception as e:
        logger.error(f"Error updating AI repair verification for {report_id}: {e}")
        return False, None




