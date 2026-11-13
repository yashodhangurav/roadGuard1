from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_reports_list():
    response = client.get("/api/reports")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    report = data[0]
    assert "id" in report
    assert "total_defects" in report
    assert "pci_score" in report
    assert "location_name" in report

def test_get_single_report():
    response = client.get("/api/reports")
    assert response.status_code == 200
    reports = response.json()
    assert len(reports) > 0
    report_id = reports[0]["id"]

    detail_res = client.get(f"/api/reports/{report_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == report_id
    assert "defects" in detail
    assert isinstance(detail["defects"], list)

def test_get_statistics():
    response = client.get("/api/statistics")
    assert response.status_code == 200
    stats = response.json()
    assert "total_inspections" in stats
    assert "total_defects" in stats
    assert "condition_breakdown" in stats
    assert "severity_breakdown" in stats
    assert stats["total_inspections"] >= 1
    assert "Critical" in stats["condition_breakdown"]
