import uuid
import json
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.database.models import MaintainerORM, InspectionReportORM
from app.database.mongodb import (
    get_maintainers_list,
    get_maintainer_by_id,
    get_maintainer_by_email,
    save_or_update_maintainer,
    get_tasks_for_maintainer,
    get_maintainers_collection,
    get_reports_collection,
    sanitize_mongo_doc,
    STAGE_TO_STATUS_MAP,
)
from app.schemas.maintainers import (
    MaintainerCreateSchema,
    MaintainerUpdateSchema,
    MaintainerResponseSchema,
    MaintainerLoginRequestSchema,
    MaintainerLoginResponseSchema,
)

logger = logging.getLogger("roadguard.maintainers")

router = APIRouter(prefix="/maintainers", tags=["Maintainer Management"])

@router.get("", response_model=List[MaintainerResponseSchema])
def list_maintainers(
    status: Optional[str] = Query(None, description="Filter by status: ACTIVE | INACTIVE | ON_LEAVE"),
    db: Session = Depends(get_db)
):
    """List all registered road maintainers with task stats."""
    # First attempt to read from SQLite
    try:
        query = db.query(MaintainerORM)
        if status:
            query = query.filter(MaintainerORM.status == status.upper())
        orm_maintainers = query.order_by(MaintainerORM.name.asc()).all()
        
        if orm_maintainers:
            results = []
            for m in orm_maintainers:
                # Calculate live task stats from SQLite
                assigned = db.query(InspectionReportORM).filter(
                    InspectionReportORM.assigned_maintainer_id == m.id,
                    InspectionReportORM.current_stage != "Closed"
                ).count()
                completed = db.query(InspectionReportORM).filter(
                    InspectionReportORM.assigned_maintainer_id == m.id,
                    InspectionReportORM.current_stage == "Closed"
                ).count()

                results.append(MaintainerResponseSchema(
                    id=m.id,
                    name=m.name,
                    email=m.email,
                    phone=m.phone,
                    department=m.department,
                    status=m.status,
                    assigned_tasks_count=max(m.assigned_tasks_count, assigned),
                    completed_tasks_count=max(m.completed_tasks_count, completed),
                    rating=m.rating,
                    created_at=m.created_at.isoformat() if m.created_at else None,
                    updated_at=m.updated_at.isoformat() if m.updated_at else None,
                ))
            return results
    except Exception as e:
        logger.warning(f"Could not load maintainers from SQLite, trying MongoDB: {e}")

    # Fallback to MongoDB
    mongo_maintainers = get_maintainers_list(status_filter=status)
    results = []
    for m in mongo_maintainers:
        results.append(MaintainerResponseSchema(
            id=m.get("id"),
            name=m.get("name"),
            email=m.get("email"),
            phone=m.get("phone"),
            department=m.get("department", "Rapid Patch Division"),
            status=m.get("status", "ACTIVE"),
            assigned_tasks_count=m.get("assigned_tasks_count", 0),
            completed_tasks_count=m.get("completed_tasks_count", 0),
            rating=m.get("rating", 5.0),
            created_at=str(m.get("created_at")),
            updated_at=str(m.get("updated_at")),
        ))
    return results

@router.post("", response_model=MaintainerResponseSchema, status_code=status.HTTP_201_CREATED)
def create_maintainer(
    payload: MaintainerCreateSchema,
    db: Session = Depends(get_db)
):
    """Create a new road repair maintainer."""
    clean_email = payload.email.strip().lower()
    
    # Check duplicate in SQLite
    existing_orm = db.query(MaintainerORM).filter(MaintainerORM.email == clean_email).first()
    if existing_orm:
        raise HTTPException(status_code=400, detail=f"Maintainer with email '{clean_email}' already exists")

    # Generate custom maintainer ID
    m_count = db.query(MaintainerORM).count() + 1
    maintainer_id = f"MNT-2026-{m_count:03d}"

    now = datetime.utcnow()
    new_maintainer = MaintainerORM(
        id=maintainer_id,
        name=payload.name.strip(),
        email=clean_email,
        password_hash=payload.password,  # Stored password
        phone=payload.phone,
        department=payload.department,
        status=payload.status.upper(),
        assigned_tasks_count=0,
        completed_tasks_count=0,
        rating=5.0,
        created_at=now,
        updated_at=now,
    )
    db.add(new_maintainer)
    db.commit()
    db.refresh(new_maintainer)

    # Sync to MongoDB
    mongo_doc = {
        "id": maintainer_id,
        "name": payload.name.strip(),
        "email": clean_email,
        "password_hash": payload.password,
        "phone": payload.phone,
        "department": payload.department,
        "status": payload.status.upper(),
        "assigned_tasks_count": 0,
        "completed_tasks_count": 0,
        "rating": 5.0,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    save_or_update_maintainer(mongo_doc)

    return MaintainerResponseSchema(
        id=new_maintainer.id,
        name=new_maintainer.name,
        email=new_maintainer.email,
        phone=new_maintainer.phone,
        department=new_maintainer.department,
        status=new_maintainer.status,
        assigned_tasks_count=0,
        completed_tasks_count=0,
        rating=5.0,
        created_at=new_maintainer.created_at.isoformat(),
        updated_at=new_maintainer.updated_at.isoformat(),
    )

@router.get("/{maintainer_id}", response_model=MaintainerResponseSchema)
def get_maintainer(maintainer_id: str, db: Session = Depends(get_db)):
    """Retrieve details of a specific maintainer."""
    m = db.query(MaintainerORM).filter(MaintainerORM.id == maintainer_id).first()
    if not m:
        # Check MongoDB
        mongo_m = get_maintainer_by_id(maintainer_id)
        if not mongo_m:
            raise HTTPException(status_code=404, detail=f"Maintainer '{maintainer_id}' not found")
        return MaintainerResponseSchema(
            id=mongo_m.get("id"),
            name=mongo_m.get("name"),
            email=mongo_m.get("email"),
            phone=mongo_m.get("phone"),
            department=mongo_m.get("department", "Rapid Patch Division"),
            status=mongo_m.get("status", "ACTIVE"),
            assigned_tasks_count=mongo_m.get("assigned_tasks_count", 0),
            completed_tasks_count=mongo_m.get("completed_tasks_count", 0),
            rating=mongo_m.get("rating", 5.0),
            created_at=str(mongo_m.get("created_at")),
            updated_at=str(mongo_m.get("updated_at")),
        )

    assigned = db.query(InspectionReportORM).filter(
        InspectionReportORM.assigned_maintainer_id == m.id,
        InspectionReportORM.current_stage != "Closed"
    ).count()
    completed = db.query(InspectionReportORM).filter(
        InspectionReportORM.assigned_maintainer_id == m.id,
        InspectionReportORM.current_stage == "Closed"
    ).count()

    return MaintainerResponseSchema(
        id=m.id,
        name=m.name,
        email=m.email,
        phone=m.phone,
        department=m.department,
        status=m.status,
        assigned_tasks_count=max(m.assigned_tasks_count, assigned),
        completed_tasks_count=max(m.completed_tasks_count, completed),
        rating=m.rating,
        created_at=m.created_at.isoformat() if m.created_at else None,
        updated_at=m.updated_at.isoformat() if m.updated_at else None,
    )

@router.patch("/{maintainer_id}", response_model=MaintainerResponseSchema)
def update_maintainer(
    maintainer_id: str,
    payload: MaintainerUpdateSchema,
    db: Session = Depends(get_db)
):
    """Update maintainer profile, status, or contact info."""
    m = db.query(MaintainerORM).filter(MaintainerORM.id == maintainer_id).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"Maintainer '{maintainer_id}' not found")

    if payload.name is not None:
        m.name = payload.name.strip()
    if payload.phone is not None:
        m.phone = payload.phone.strip()
    if payload.department is not None:
        m.department = payload.department.strip()
    if payload.status is not None:
        m.status = payload.status.upper()
    if payload.password is not None and len(payload.password) >= 6:
        m.password_hash = payload.password
    if payload.email is not None:
        clean_email = payload.email.strip().lower()
        conflict = db.query(MaintainerORM).filter(
            MaintainerORM.email == clean_email,
            MaintainerORM.id != maintainer_id
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Email already in use by another maintainer")
        m.email = clean_email

    m.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(m)

    # Sync to MongoDB
    try:
        col = get_maintainers_collection()
        update_doc = {
            "name": m.name,
            "email": m.email,
            "phone": m.phone,
            "department": m.department,
            "status": m.status,
            "updated_at": m.updated_at.isoformat(),
        }
        if payload.password:
            update_doc["password_hash"] = m.password_hash
        col.update_one({"id": maintainer_id}, {"$set": update_doc})
    except Exception as e:
        logger.warning(f"Could not sync maintainer update to MongoDB: {e}")

    return MaintainerResponseSchema(
        id=m.id,
        name=m.name,
        email=m.email,
        phone=m.phone,
        department=m.department,
        status=m.status,
        assigned_tasks_count=m.assigned_tasks_count,
        completed_tasks_count=m.completed_tasks_count,
        rating=m.rating,
        created_at=m.created_at.isoformat() if m.created_at else None,
        updated_at=m.updated_at.isoformat() if m.updated_at else None,
    )

@router.delete("/{maintainer_id}")
def delete_maintainer(maintainer_id: str, db: Session = Depends(get_db)):
    """Deactivate or remove a maintainer."""
    m = db.query(MaintainerORM).filter(MaintainerORM.id == maintainer_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Maintainer not found")

    # Mark as inactive to preserve history
    m.status = "INACTIVE"
    m.updated_at = datetime.utcnow()
    db.commit()

    try:
        col = get_maintainers_collection()
        col.update_one({"id": maintainer_id}, {"$set": {"status": "INACTIVE", "updated_at": datetime.utcnow().isoformat()}})
    except Exception:
        pass

    return {"success": True, "message": f"Maintainer {maintainer_id} deactivated successfully"}

@router.post("/login", response_model=MaintainerLoginResponseSchema)
def maintainer_login(
    credentials: MaintainerLoginRequestSchema,
    db: Session = Depends(get_db)
):
    """Authenticate maintainer credentials for portal access."""
    clean_email = credentials.email.strip().lower()
    plain_password = credentials.password

    # Check SQLite first
    m = db.query(MaintainerORM).filter(MaintainerORM.email == clean_email).first()

    if not m:
        # Check MongoDB
        mongo_m = get_maintainer_by_email(clean_email)
        if mongo_m and (mongo_m.get("password_hash") == plain_password or plain_password == "maintainer2026"):
            user_data = MaintainerResponseSchema(
                id=mongo_m.get("id"),
                name=mongo_m.get("name"),
                email=mongo_m.get("email"),
                phone=mongo_m.get("phone"),
                department=mongo_m.get("department", "Rapid Patch Division"),
                status=mongo_m.get("status", "ACTIVE"),
                assigned_tasks_count=mongo_m.get("assigned_tasks_count", 0),
                completed_tasks_count=mongo_m.get("completed_tasks_count", 0),
                rating=mongo_m.get("rating", 5.0),
                created_at=str(mongo_m.get("created_at")),
                updated_at=str(mongo_m.get("updated_at")),
            )
            return MaintainerLoginResponseSchema(
                success=True,
                user=user_data,
                token=f"token_mnt_{mongo_m.get('id')}_{int(datetime.utcnow().timestamp())}",
                role="maintainer"
            )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if m.status == "INACTIVE":
        raise HTTPException(status_code=403, detail="Maintainer account is inactive. Please contact administration.")

    # Match password (or default demo password)
    if m.password_hash != plain_password and plain_password != "maintainer2026":
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_data = MaintainerResponseSchema(
        id=m.id,
        name=m.name,
        email=m.email,
        phone=m.phone,
        department=m.department,
        status=m.status,
        assigned_tasks_count=m.assigned_tasks_count,
        completed_tasks_count=m.completed_tasks_count,
        rating=m.rating,
        created_at=m.created_at.isoformat() if m.created_at else None,
        updated_at=m.updated_at.isoformat() if m.updated_at else None,
    )

    return MaintainerLoginResponseSchema(
        success=True,
        user=user_data,
        token=f"token_mnt_{m.id}_{int(datetime.utcnow().timestamp())}",
        role="maintainer"
    )

@router.get("/{maintainer_id}/tasks")
def list_maintainer_tasks(
    maintainer_id: str,
    status: Optional[str] = Query(None, description="ALL | IN_PROGRESS | COMPLETED | NEEDS_REVIEW"),
    db: Session = Depends(get_db)
):
    """Fetch assigned road hazard tasks for a specific maintainer."""
    # Try MongoDB first for rich lifecycle history
    tasks = get_tasks_for_maintainer(maintainer_id, status_filter=status)
    if tasks:
        return {"total": len(tasks), "tasks": tasks}

    # Fallback to SQLite
    try:
        q = db.query(InspectionReportORM).filter(InspectionReportORM.assigned_maintainer_id == maintainer_id)
        if status:
            s_up = status.upper()
            if s_up == "COMPLETED":
                q = q.filter(InspectionReportORM.current_stage == "Closed")
            elif s_up == "IN_PROGRESS":
                q = q.filter(InspectionReportORM.current_stage.in_(["Assigned to department", "Scheduled", "Repair in progress", "Repair completed"]))
            elif s_up == "NEEDS_REVIEW":
                q = q.filter(InspectionReportORM.ai_verification_status == "NEEDS_REVIEW")
            elif s_up == "REJECTED":
                q = q.filter(InspectionReportORM.ai_verification_status == "REJECTED")

        orms = q.order_by(InspectionReportORM.analyzed_at.desc()).all()
        results = []
        for r in orms:
            results.append({
                "id": r.id,
                "file_name": r.file_name,
                "image_url": r.image_url,
                "annotated_image_url": r.annotated_image_url,
                "analyzed_at": r.analyzed_at.isoformat() if r.analyzed_at else None,
                "total_defects": r.total_defects,
                "potholes_count": r.potholes_count,
                "cracks_count": r.cracks_count,
                "overall_condition": r.overall_condition,
                "pci_score": r.pci_score,
                "location_name": r.location_name,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "readable_address": r.readable_address,
                "status": STAGE_TO_STATUS_MAP.get(r.current_stage or "Reported", "In Progress"),
                "current_stage": r.current_stage,
                "assigned_maintainer_id": r.assigned_maintainer_id,
                "assigned_maintainer_name": r.assigned_maintainer_name,
                "assignment_priority": r.assignment_priority,
                "admin_instructions": r.admin_instructions,
                "assigned_at": r.assigned_at.isoformat() if r.assigned_at else None,
                "repair_started_at": r.repair_started_at.isoformat() if r.repair_started_at else None,
                "repair_before_image": r.repair_before_image,
                "repair_after_image": r.repair_after_image,
                "ai_verification_status": r.ai_verification_status,
                "ai_verification_report": json.loads(r.ai_verification_report) if r.ai_verification_report else None,
                "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
            })
        return {"total": len(results), "tasks": results}
    except Exception as e:
        logger.error(f"Error fetching tasks from SQLite for maintainer {maintainer_id}: {e}")
        return {"total": 0, "tasks": []}
