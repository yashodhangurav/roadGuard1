from fastapi import APIRouter, HTTPException, status
from app.services.ollama_service import ollama_service
from app.schemas.ai import (
    ExplainRequest,
    ExplainResponse,
    RecommendRequest,
    RecommendResponse,
    ChatRequest,
    ChatResponse,
)

router = APIRouter(prefix="/ai", tags=["Ollama AI Assistant"])

@router.post(
    "/explain",
    response_model=ExplainResponse,
    summary="Explain verified road damage using Gemma 3:1B",
    description="Generates an objective civil engineering explanation of verified defects, hazards, and urgency.",
)
async def explain_road_damage(req: ExplainRequest):
    try:
        return await ollama_service.explain_defects(
            defects=req.defects,
            stats=req.stats,
            location_context=req.locationContext or "Urban Arterial Roadway"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ollama explanation error: {str(e)}"
        )

@router.post(
    "/recommend",
    response_model=RecommendResponse,
    summary="Generate engineering maintenance recommendations",
    description="Calculates repair materials, equipment, labor hours, and cost with Gemma 3:1B dispatch synthesis.",
)
async def generate_recommendations(req: RecommendRequest):
    try:
        return await ollama_service.generate_recommendations(
            defects=req.defects,
            stats=req.stats,
            road_type=req.roadType or "Asphalt Concrete",
            weather_condition=req.weatherCondition or "Dry"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ollama recommendation error: {str(e)}"
        )

@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with RoadSentinel AI assistant",
    description="Interactive conversational interface for highway maintenance staff, referencing verified defect records.",
)
async def chat_assistant(req: ChatRequest):
    try:
        return await ollama_service.chat(
            query=req.message,
            history=req.history,
            inspection_context=req.inspectionContext
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ollama chat error: {str(e)}"
        )
