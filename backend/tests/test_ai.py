from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_ai_explain_endpoint():
    payload = {
        "imageId": "TEST-01",
        "locationContext": "Highway 101 Northbound",
        "defects": [
            {
                "id": "DEF-01",
                "type": "Pothole",
                "raw_class": "D40",
                "severity": "Critical",
                "severity_score": 88.5,
                "confidence": 94.2,
                "box": {"x": 20.0, "y": 30.0, "width": 40.0, "height": 35.0},
                "dimensions": {"widthCm": 65.0, "heightCm": 50.0, "estimatedDepthMm": 85.0, "areaCm2": 3250.0},
                "urgency": "Immediate",
                "repairMethod": "Hot-mix asphalt patch with edge milling"
            }
        ],
        "stats": {
            "totalDefects": 1,
            "potholesCount": 1,
            "cracksCount": 0,
            "deteriorationCount": 0,
            "criticalCount": 1,
            "overallCondition": "Critical",
            "hazardIndex": 85.0,
            "pciScore": 40.0,
            "estimatedPatchTons": 0.81,
            "scanDurationMs": 750.0
        }
    }
    response = client.post("/api/ai/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "explanation" in data
    assert len(data["safetyRisks"]) > 0
    assert "Immediate" in data["urgencyAssessment"]
    assert "disclaimer" in data

def test_ai_recommend_endpoint():
    payload = {
        "roadType": "Asphalt Concrete",
        "weatherCondition": "Dry",
        "defects": [
            {
                "id": "DEF-01",
                "type": "Pothole",
                "raw_class": "D40",
                "severity": "Critical",
                "severity_score": 88.5,
                "confidence": 94.2,
                "box": {"x": 20.0, "y": 30.0, "width": 40.0, "height": 35.0},
                "dimensions": {"widthCm": 65.0, "heightCm": 50.0, "estimatedDepthMm": 85.0, "areaCm2": 3250.0},
                "urgency": "Immediate",
                "repairMethod": "Hot-mix asphalt patch with edge milling"
            }
        ]
    }
    response = client.post("/api/ai/recommend", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["recommendations"]) == 1
    assert data["estimatedTotalCostUsd"] > 0
    assert "engineeringSummary" in data

def test_ai_chat_endpoint():
    payload = {
        "message": "What is the typical repair method for severe potholes?"
    }
    response = client.post("/api/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 0
