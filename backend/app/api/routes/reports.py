from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.database.models import InspectionReportORM, DefectItemORM
from app.schemas.reports import (
    ReportSummarySchema,
    ReportDetailSchema,
    DefectItemSchema,
    StatisticsResponse,
)

router = APIRouter(tags=["Inspection Reports & Statistics"])

@router.get(
    "/reports",
    response_model=List[ReportSummarySchema],
    summary="List all road damage inspection reports",
    description="Returns stored inspection records with optional condition filtering, search, and pagination.",
)
def get_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    condition: Optional[str] = Query(None, description="Filter by condition (Critical, Poor, Fair, Good)"),
    search: Optional[str] = Query(None, description="Search by location or filename"),
    db: Session = Depends(get_db)
):
    query = db.query(InspectionReportORM)
    if condition:
        query = query.filter(InspectionReportORM.overall_condition.ilike(condition))
    if search:
        query = query.filter(
            (InspectionReportORM.location_name.ilike(f"%{search}%")) |
            (InspectionReportORM.file_name.ilike(f"%{search}%"))
        )
    reports = query.order_by(InspectionReportORM.analyzed_at.desc()).offset(skip).limit(limit).all()
    
    results = []
    for r in reports:
        results.append(ReportSummarySchema(
            id=r.id,
            file_name=r.file_name,
            image_url=r.image_url,
            annotated_image_url=r.annotated_image_url,
            analyzed_at=r.analyzed_at.isoformat() if r.analyzed_at else "",
            total_defects=r.total_defects,
            potholes_count=r.potholes_count,
            cracks_count=r.cracks_count,
            critical_count=r.critical_count,
            overall_condition=r.overall_condition,
            pci_score=r.pci_score,
            hazard_index=r.hazard_index,
            estimated_patch_tons=r.estimated_patch_tons,
            location_name=r.location_name,
            latitude=r.latitude,
            longitude=r.longitude,
        ))
    return results

@router.get(
    "/reports/{report_id}",
    response_model=ReportDetailSchema,
    summary="Get single inspection report with defects",
    description="Returns detailed report by ID including all detected defect coordinates and metrics.",
)
def get_report_by_id(report_id: str, db: Session = Depends(get_db)):
    report = db.query(InspectionReportORM).filter(InspectionReportORM.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection report with ID '{report_id}' not found."
        )

    defects = []
    for d in report.defects:
        defects.append(DefectItemSchema(
            id=d.id,
            report_id=d.report_id,
            type=d.type,
            raw_class=d.raw_class,
            severity=d.severity,
            severity_score=d.severity_score,
            confidence=d.confidence,
            box={
                "x": d.box_x,
                "y": d.box_y,
                "width": d.box_width,
                "height": d.box_height,
            },
            dimensions={
                "widthCm": d.width_cm,
                "heightCm": d.height_cm,
                "estimatedDepthMm": d.estimated_depth_mm,
                "areaCm2": d.area_cm2,
            },
            urgency=d.urgency,
            repair_method=d.repair_method,
        ))

    return ReportDetailSchema(
        id=report.id,
        file_name=report.file_name,
        image_url=report.image_url,
        annotated_image_url=report.annotated_image_url,
        analyzed_at=report.analyzed_at.isoformat() if report.analyzed_at else "",
        total_defects=report.total_defects,
        potholes_count=report.potholes_count,
        cracks_count=report.cracks_count,
        critical_count=report.critical_count,
        overall_condition=report.overall_condition,
        pci_score=report.pci_score,
        hazard_index=report.hazard_index,
        estimated_patch_tons=report.estimated_patch_tons,
        location_name=report.location_name,
        latitude=report.latitude,
        longitude=report.longitude,
        defects=defects,
    )

@router.get(
    "/statistics",
    response_model=StatisticsResponse,
    summary="Get network-wide road condition statistics",
    description="Aggregates total inspected segments, defect distributions, average PCI, and critical metrics.",
)
def get_statistics(db: Session = Depends(get_db)):
    total_inspections = db.query(InspectionReportORM).count()
    total_defects = db.query(DefectItemORM).count()
    critical_defects = db.query(DefectItemORM).filter(DefectItemORM.severity == "Critical").count()
    potholes_count = db.query(DefectItemORM).filter(DefectItemORM.type == "Pothole").count()
    cracks_count = db.query(DefectItemORM).filter(DefectItemORM.type.ilike("%Crack%")).count()

    avg_pci = db.query(func.avg(InspectionReportORM.pci_score)).scalar() or 85.0

    # Condition breakdown
    conditions = {"Critical": 0, "Poor": 0, "Fair": 0, "Good": 0}
    cond_rows = db.query(InspectionReportORM.overall_condition, func.count(InspectionReportORM.id)).group_by(InspectionReportORM.overall_condition).all()
    for cond, count in cond_rows:
        if cond in conditions:
            conditions[cond] = count

    # Severity breakdown
    severities = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    sev_rows = db.query(DefectItemORM.severity, func.count(DefectItemORM.id)).group_by(DefectItemORM.severity).all()
    for sev, count in sev_rows:
        if sev in severities:
            severities[sev] = count

    recent = db.query(InspectionReportORM).order_by(InspectionReportORM.analyzed_at.desc()).limit(5).all()
    recent_summaries = [
        ReportSummarySchema(
            id=r.id,
            file_name=r.file_name,
            image_url=r.image_url,
            annotated_image_url=r.annotated_image_url,
            analyzed_at=r.analyzed_at.isoformat() if r.analyzed_at else "",
            total_defects=r.total_defects,
            potholes_count=r.potholes_count,
            cracks_count=r.cracks_count,
            critical_count=r.critical_count,
            overall_condition=r.overall_condition,
            pci_score=r.pci_score,
            hazard_index=r.hazard_index,
            estimated_patch_tons=r.estimated_patch_tons,
            location_name=r.location_name,
            latitude=r.latitude,
            longitude=r.longitude,
        ) for r in recent
    ]

    return StatisticsResponse(
        total_inspections=total_inspections,
        total_defects=total_defects,
        critical_defects=critical_defects,
        potholes_count=potholes_count,
        cracks_count=cracks_count,
        avg_pci_score=round(float(avg_pci), 1),
        condition_breakdown=conditions,
        severity_breakdown=severities,
        recent_reports=recent_summaries,
    )
