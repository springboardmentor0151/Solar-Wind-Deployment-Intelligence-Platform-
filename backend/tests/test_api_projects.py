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
from app.models.user import User
from app.core.security import get_password_hash

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_projects.db"

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
    # Register user
    response = client.post(
        "/api/auth/register",
        json={
            "email": "projectuser@example.com",
            "password": "testpass123",
            "full_name": "Project User"
        }
    )
    return response.json()


@pytest.fixture
def auth_headers(test_user):
    return {"Authorization": f"Bearer {test_user['access_token']}"}


def test_create_project_success(auth_headers):
    response = client.post(
        "/api/projects",
        json={
            "full_name": "Test Solar Project",
            "project_type": "Solar",
            "region": "Rajasthan",
            "capacity_mw": 50.0,
            "description": "Test project"
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == "Test Solar Project"
    assert data["data"]["project_type"] == "Solar"
    assert data["data"]["capacity_mw"] == 50.0


def test_create_project_missing_fields(auth_headers):
    response = client.post(
        "/api/projects",
        json={},
        headers=auth_headers
    )
    assert response.status_code == 422


def test_create_project_invalid_type(auth_headers):
    response = client.post(
        "/api/projects",
        json={
            "full_name": "Test Project",
            "project_type": "Invalid",
            "region": "Test",
            "capacity_mw": 50.0
        },
        headers=auth_headers
    )
    assert response.status_code == 422


def test_list_projects(auth_headers):
    # Create a project first
    client.post(
        "/api/projects",
        json={
            "full_name": "List Test Project",
            "project_type": "Wind",
            "region": "Gujarat",
            "capacity_mw": 100.0
        },
        headers=auth_headers
    )
    
    response = client.get("/api/projects", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "List Test Project"


def test_get_project_by_id(auth_headers):
    # Create project
    create_response = client.post(
        "/api/projects",
        json={
            "full_name": "Get By ID Project",
            "project_type": "Hybrid",
            "region": "Karnataka",
            "capacity_mw": 75.0
        },
        headers=auth_headers
    )
    project_id = create_response.json()["id"]
    
    # Get project
    response = client.get(f"/api/project/{project_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Get By ID Project"


def test_get_project_not_found(auth_headers):
    response = client.get("/api/project/99999", headers=auth_headers)
    assert response.status_code == 404


def test_delete_project(auth_headers):
    # Create project
    create_response = client.post(
        "/api/projects",
        json={
            "full_name": "Delete Test Project",
            "project_type": "Solar",
            "region": "Tamil Nadu",
            "capacity_mw": 25.0
        },
        headers=auth_headers
    )
    project_id = create_response.json()["id"]
    
    # Delete project
    response = client.delete(f"/api/project/{project_id}", headers=auth_headers)
    assert response.status_code == 204
    
    # Verify deleted
    get_response = client.get(f"/api/project/{project_id}", headers=auth_headers)
    assert get_response.status_code == 404


def test_create_project_unauthorized():
    response = client.post(
        "/api/projects",
        json={
            "full_name": "Unauthorized Project",
            "project_type": "Solar",
            "region": "Test",
            "capacity_mw": 50.0
        }
    )
    assert response.status_code == 401


def test_create_project_negative_capacity(auth_headers):
    response = client.post(
        "/api/projects",
        json={
            "full_name": "Invalid Capacity Project",
            "project_type": "Solar",
            "region": "Test",
            "capacity_mw": -10.0
        },
        headers=auth_headers
    )
    assert response.status_code == 422
