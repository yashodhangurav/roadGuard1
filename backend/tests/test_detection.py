import os
from pathlib import Path
from fastapi.testclient import TestClient
import pytest

from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model"]["loaded"] is True
    assert "YOLO" in data["model"]["architecture"]

def test_detect_invalid_file_extension():
    response = client.post(
        "/api/detect/image",
        files={"file": ("invalid_text.txt", b"not an image", "text/plain")}
    )
    assert response.status_code == 415
    assert "Unsupported file format" in response.json()["detail"]

def test_detect_empty_file():
    response = client.post(
        "/api/detect/image",
        files={"file": ("empty.jpg", b"", "image/jpeg")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_detect_real_road_image():
    sample_path = Path(__file__).resolve().parent / "sample_road.jpg"
    assert sample_path.exists(), "Sample road image missing"
    
    with open(sample_path, "rb") as f:
        file_bytes = f.read()
        
    response = client.post(
        "/api/detect/image",
        files={"file": ("sample_road.jpg", file_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert "imageId" in data
    assert "defects" in data
    assert "stats" in data
    assert "annotatedImageUrl" in data
    assert data["backend"] in ("Live YOLOv8 API", "Live YOLO11 API") or "Live" in data["backend"]
    assert data["modelInfo"]["name"] in ("YOLO11n-RoadHazard-Ensemble", "YOLOv8s-RoadDamage-Edge")
