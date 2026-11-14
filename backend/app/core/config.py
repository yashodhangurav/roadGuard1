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
    YOLO_MODEL_PATH: str = str(WEIGHTS_DIR / "road_hazard_yolo11n.onnx")
    YOLO_FALLBACK_MODEL: str = str(WEIGHTS_DIR / "pothole_yolov8.pt")
    CONFIDENCE_THRESHOLD: float = 0.20
    IOU_THRESHOLD: float = 0.45
    
    # File validation
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    MAX_FILE_SIZE_MB: int = 25
    MAX_FILE_SIZE_BYTES: int = 25 * 1024 * 1024
    
    # Ollama integration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma3:1b"
    OLLAMA_TIMEOUT: int = 120
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'roadsentinel.db'}"
    MONGODB_URI: str = "mongodb+srv://guravyashodhan_db_user:Yashu%40123@cluster0.rpxc1ds.mongodb.net/roadguard?retryWrites=true&w=majority&appName=Cluster0"
    MONGODB_DB_NAME: str = "roadguard"
    MONGODB_COLLECTION_REPORTS: str = "reports"
    
    # Hybrid Duplicate Detection Engine Config
    DUPLICATE_GPS_SEARCH_RADIUS_METERS: float = 50.0
    DUPLICATE_CLOSE_PROXIMITY_METERS: float = 15.0
    DUPLICATE_PHASH_IDENTICAL_HAMMING: int = 4
    DUPLICATE_PHASH_SIMILAR_HAMMING: int = 10
    DUPLICATE_ORB_MIN_INLIERS_CONFIRMED: int = 20
    DUPLICATE_ORB_MIN_RATIO_CONFIRMED: float = 0.35
    DUPLICATE_ORB_MIN_INLIERS_UNCERTAIN: int = 10
    DUPLICATE_ORB_MIN_RATIO_UNCERTAIN: float = 0.22
    DUPLICATE_LOWE_RATIO: float = 0.75
    DUPLICATE_RANSAC_REPROJ_THRESH: float = 5.0
    
    # Directories
    WEIGHTS_DIR: Path = WEIGHTS_DIR
    UPLOADS_DIR: Path = UPLOADS_DIR
    OUTPUTS_DIR: Path = OUTPUTS_DIR

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

settings = Settings()
