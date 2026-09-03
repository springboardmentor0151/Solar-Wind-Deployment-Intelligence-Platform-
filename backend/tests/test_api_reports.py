import sys
from pathlib import Path

# Add project root to Python path (parent of backend directory)
project_root = Path(__file__).resolve().parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_reports.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

Base.metadata.create_all(bind=engine)

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user():
    response = client.post(
        "/api/auth/register",
        json={
            "email": "reports@example.com",
            "password": "testpass123",
            "full_name": "Reports User"
        }
    )
    return response.json()


@pytest.fixture
def auth_headers(test_user):
    return {"Authorization": f"Bearer {test_user['access_token']}"}


@pytest.fixture
def test_project(auth_headers):
    # Create project with full data
    create_response = client.post(
        "/api/projects",
        json={
            "full_name": "Report Test Project",
            "project_type": "Solar",
            "region": "Rajasthan",
            "capacity_mw": 50.0,
            "description": "Test project for reports"
        },
        headers=auth_headers
    )
    return create_response.json()["id"]


def test_list_reports_empty(auth_headers):
    response = client.get("/api/reports", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_get_report_detail_success(auth_headers, test_project):
    response = client.get(f"/api/reports/{test_project}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "project_information" in data
    assert "environmental_assessment" in data
    assert "renewable_assessment" in data
    assert "deployment_recommendation" in data
    assert "forecast" in data
    assert "final_recommendation" in data


def test_get_report_detail_not_found(auth_headers):
    response = client.get("/api/reports/99999", headers=auth_headers)
    assert response.status_code == 404


def test_download_pdf_success(auth_headers, test_project):
    response = client.post(f"/api/reports/pdf?project_id={test_project}", headers=auth_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment" in response.headers["content-disposition"]
    assert f"project-{test_project}-report.pdf" in response.headers["content-disposition"]


def test_download_pdf_not_found(auth_headers):
    response = client.post("/api/reports/pdf?project_id=99999", headers=auth_headers)
    assert response.status_code == 404


def test_download_excel_success(auth_headers, test_project):
    response = client.post(f"/api/reports/excel?project_id={test_project}", headers=auth_headers)
    assert response.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers["content-type"]
    assert "attachment" in response.headers["content-disposition"]
    assert f"project-{test_project}-report.xlsx" in response.headers["content-disposition"]


def test_download_excel_not_found(auth_headers):
    response = client.post("/api/reports/excel?project_id=99999", headers=auth_headers)
    assert response.status_code == 404


def test_reports_unauthorized():
    response = client.get("/api/reports")
    assert response.status_code == 401
    
    response = client.post("/api/reports/pdf?project_id=1")
    assert response.status_code == 401
    
    response = client.post("/api/reports/excel?project_id=1")
    assert response.status_code == 401


def test_report_content_structure(auth_headers, test_project):
    response = client.get(f"/api/reports/{test_project}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    
    # Check project information
    project_info = data["project_information"]
    assert "name" in project_info
    assert "project_type" in project_info
    assert "region" in project_info
    assert "capacity_mw" in project_info
    assert "latitude" in project_info
    assert "longitude" in project_info
    
    # Check environmental assessment
    env_assessment = data["environmental_assessment"]
    assert "solar_irradiance" in env_assessment
    assert "wind_speed" in env_assessment
    assert "temperature" in env_assessment
    assert "humidity" in env_assessment
    assert "rainfall" in env_assessment
    assert "elevation" in env_assessment
    
    # Check renewable assessment
    renewable = data["renewable_assessment"]
    assert "solar_potential" in renewable
    assert "wind_potential" in renewable
    assert "suitability_score" in renewable
    assert "recommended_technology" in renewable
    
    # Check forecast
    assert isinstance(data["forecast"], list)
    
    # Check final recommendation
    assert "final_recommendation" in data
    assert data["final_recommendation"] in [
        "Highly Suitable",
        "Suitable",
        "Moderately Suitable",
        "Low Suitability",
        "Not Suitable",
        "No data available"
    ]
