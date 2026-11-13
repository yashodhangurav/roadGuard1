from fastapi import APIRouter
from app.api.routes import detection, ai, reports

api_router = APIRouter()
api_router.include_router(detection.router, tags=["Road Damage Detection"])
api_router.include_router(reports.router, tags=["Inspection Reports & Statistics"])
api_router.include_router(ai.router, tags=["Ollama AI Assistant"])
