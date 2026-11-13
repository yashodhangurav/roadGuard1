import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
WEIGHTS_DIR = BASE_DIR / "weights"
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUTS_DIR = BASE_DIR / "outputs"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "RoadSentinel AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # YOLO Settings
    YOLO_MODEL_PATH: str = str(WEIGHTS_DIR / "pothole_yolov8.pt")
    YOLO_FALLBACK_MODEL: str = "yolo11n.pt"
    CONFIDENCE_THRESHOLD: float = 0.25
    IOU_THRESHOLD: float = 0.45
    
    # File validation
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    MAX_FILE_SIZE_MB: int = 15
    MAX_FILE_SIZE_BYTES: int = 15 * 1024 * 1024
    
    # Ollama integration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma3:1b"
    OLLAMA_TIMEOUT: int = 120
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'roadsentinel.db'}"
    
    # Directories
    UPLOADS_DIR: Path = UPLOADS_DIR
    OUTPUTS_DIR: Path = OUTPUTS_DIR

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

settings = Settings()
