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

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_analytics.db"

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
            "email": "analytics@example.com",
            "password": "testpass123",
            "full_name": "Analytics User"
        }
    )
    return response.json()


@pytest.fixture
def auth_headers(test_user):
    return {"Authorization": f"Bearer {test_user['access_token']}"}


def test_dashboard_empty_database(auth_headers):
    response = client.get("/api/analytics/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_projects"] == 0
    assert data["total_analyzed_sites"] == 0


def test_dashboard_with_projects(auth_headers):
    # Create a project
    client.post(
        "/api/projects",
        json={
            "full_name": "Analytics Test Project",
            "project_type": "Solar",
            "region": "Rajasthan",
            "capacity_mw": 50.0
        },
        headers=auth_headers
    )
    
    response = client.get("/api/analytics/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_projects"] == 1
    assert "project_kpis" in data
    assert "renewable_kpis" in data
    assert "environmental_kpis" in data
    assert "investment_kpis" in data


def test_analytics_projects(auth_headers):
    # Create projects
    client.post(
        "/api/projects",
        json={
            "full_name": "Project 1",
            "project_type": "Solar",
            "region": "Region 1",
            "capacity_mw": 50.0
        },
        headers=auth_headers
    )
    
    response = client.get("/api/analytics/projects", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "projects" in data
    assert "count" in data


def test_analytics_resources_empty(auth_headers):
    response = client.get("/api/analytics/resources", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["solar_potential"] is None
    assert data["wind_potential"] is None


def test_analytics_investment_empty(auth_headers):
    response = client.get("/api/analytics/investment", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_capacity_mw"] == 0
    assert data["total_cost_estimate"] == 0


def test_analytics_suitability_empty(auth_headers):
    response = client.get("/api/analytics/suitability", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["distribution"] is not None
    assert data["average_score"] == 0


def test_analytics_trends_empty(auth_headers):
    response = client.get("/api/analytics/trends", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["trend_points"] == []
    assert data["count"] == 0


def test_analytics_unauthorized():
    response = client.get("/api/analytics/dashboard")
    assert response.status_code == 401
    
    response = client.get("/api/analytics/projects")
    assert response.status_code == 401
    
    response = client.get("/api/analytics/resources")
    assert response.status_code == 401
    
    response = client.get("/api/analytics/investment")
    assert response.status_code == 401
    
    response = client.get("/api/analytics/suitability")
    assert response.status_code == 401
    
    response = client.get("/api/analytics/trends")
    assert response.status_code == 401


def test_dashboard_kpi_calculations(auth_headers):
    # Create multiple projects
    for i in range(3):
        client.post(
            "/api/projects",
            json={
                "full_name": f"KPI Test Project {i}",
                "project_type": ["Solar", "Wind", "Hybrid"][i],
                "region": f"Region {i}",
                "capacity_mw": 50.0 + i * 10
            },
            headers=auth_headers
        )
    
    response = client.get("/api/analytics/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_projects"] == 3
    assert data["estimated_capacity_mw"] == 180.0  # 50 + 60 + 70
    assert "latest_projects" in data
    assert len(data["latest_projects"]) <= 6
