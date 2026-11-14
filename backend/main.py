import os
import requests
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.router import api_router
from app.services.yolo_service import yolo_service
from app.database.session import init_db
from app.database.mongodb import init_mongodb, check_mongo_health

# Initialize database tables, MongoDB Atlas indexes and canonical seeds on module load
init_db()
init_mongodb()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered road damage detection and maintenance platform using YOLOv8, SQLite, and Ollama Gemma 3:1B",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for generated annotated images
app.mount("/outputs", StaticFiles(directory=str(settings.OUTPUTS_DIR)), name="outputs")

# Include API routes
app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/api/health", tags=["Health"])
def health_check():
    # Check Ollama status
    ollama_ok = False
    ollama_info = "unreachable"
    try:
        r = requests.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=1.5)
        if r.status_code == 200:
            models = [m.get("name") for m in r.json().get("models", [])]
            ollama_ok = any(settings.OLLAMA_MODEL in m for m in models)
            ollama_info = f"Online (Model '{settings.OLLAMA_MODEL}' {'found' if ollama_ok else 'not found'})"
    except Exception as e:
        ollama_info = f"Offline ({e.__class__.__name__})"

    return {
        "status": "healthy" if yolo_service.model_loaded else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "model": {
            "name": yolo_service.model_name,
            "loaded": yolo_service.model_loaded,
            "architecture": yolo_service.architecture,
            "weights_path": settings.YOLO_MODEL_PATH,
            "supported_classes": [
                "D00 — Longitudinal Crack",
                "D10 — Transverse Crack",
                "D20 — Alligator Crack",
                "D40 — Pothole"
            ],
            "unsupported_classes": [
                "CHUNK_HOLE (Untrained in checkpoint)",
                "WATER_FILLED_HOLE (Untrained in checkpoint)"
            ]
        },
        "ollama": {
            "endpoint": settings.OLLAMA_BASE_URL,
            "target_model": settings.OLLAMA_MODEL,
            "status": ollama_info,
            "ready": ollama_ok
        },
        "mongodb": check_mongo_health()
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
