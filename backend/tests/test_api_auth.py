import sys
from pathlib import Path

# Add backend directory to Python path (so 'app' module can be imported)
BACKEND_DIR = str(Path(__file__).resolve().parents[1])
if BACKEND_DIR not in sys.path:
    sys.path.append(BACKEND_DIR)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from main import app
from app.core.security import get_password_hash
from app.models.user import User

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth.db"

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


def test_register_success():
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpass123",
            "full_name": "Test User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_register_duplicate_email():
    client.post(
        "/api/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "testpass123",
            "full_name": "Test User"
        }
    )
    response = client.post(
        "/api/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "testpass123",
            "full_name": "Test User"
        }
    )
    assert response.status_code == 409
    assert "already registered" in response.json()["detail"].lower()


def test_register_invalid_email():
    response = client.post(
        "/api/auth/register",
        json={
            "email": "invalid-email",
            "password": "testpass123",
            "full_name": "Test User"
        }
    )
    assert response.status_code == 422


def test_login_success():
    # Register first
    client.post(
        "/api/auth/register",
        json={
            "email": "login@example.com",
            "password": "testpass123",
            "full_name": "Login User"
        }
    )
    
    # Login
    response = client.post(
        "/api/auth/login",
        json={
            "email": "login@example.com",
            "password": "testpass123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_login_invalid_credentials():
    response = client.post(
        "/api/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "wrongpass"
        }
    )
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


def test_login_missing_fields():
    response = client.post(
        "/api/auth/login",
        json={}
    )
    assert response.status_code == 422


def test_protected_route_without_token():
    response = client.get("/api/users/me")
    assert response.status_code == 401


def test_protected_route_with_invalid_token():
    response = client.get(
        "/api/users/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401


def test_protected_route_with_valid_token():
    # Register and get token
    register_response = client.post(
        "/api/auth/register",
        json={
            "email": "protected@example.com",
            "password": "testpass123",
            "full_name": "Protected User"
        }
    )
    token = register_response.json()["access_token"]
    
    # Access protected route
    response = client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "protected@example.com"


def test_jwt_token_format():
    register_response = client.post(
        "/api/auth/register",
        json={
            "email": "jwt@example.com",
            "password": "testpass123",
            "full_name": "JWT User"
        }
    )
    token = register_response.json()["access_token"]
    
    # JWT tokens have 3 parts separated by dots
    parts = token.split(".")
    assert len(parts) == 3
