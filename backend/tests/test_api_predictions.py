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

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_predictions.db"

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
            "email": "prediction@example.com",
            "password": "testpass123",
            "full_name": "Prediction User"
        }
    )
    return response.json()


@pytest.fixture
def auth_headers(test_user):
    return {"Authorization": f"Bearer {test_user['access_token']}"}


def test_solar_prediction_success(auth_headers):
    payload = {
        "project_type": "Solar",
        "capacity_mw": 50.0,
        "environmental_data": {
            "solar_irradiance": 5.5,
            "wind_speed": 3.0,
            "wind_direction": 180.0,
            "temperature": 25.0,
            "humidity": 60.0,
            "rainfall": 800.0,
            "cloud_cover": 30.0,
            "elevation": 200.0,
            "land_slope": 5.0,
            "vegetation_index": 0.6,
            "nearby_roads_km": 10.0,
            "nearby_substations_km": 15.0,
            "nearby_transmission_lines_km": 20.0
        }
    }
    
    response = client.post("/api/prediction/solar", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "solar_potential" in data
    assert 0 <= data["solar_potential"] <= 100


def test_wind_prediction_success(auth_headers):
    payload = {
        "project_type": "Wind",
        "capacity_mw": 100.0,
        "environmental_data": {
            "solar_irradiance": 4.0,
            "wind_speed": 7.5,
            "wind_direction": 270.0,
            "temperature": 20.0,
            "humidity": 55.0,
            "rainfall": 600.0,
            "cloud_cover": 25.0,
            "elevation": 150.0,
            "land_slope": 3.0,
            "vegetation_index": 0.5,
            "nearby_roads_km": 8.0,
            "nearby_substations_km": 12.0,
            "nearby_transmission_lines_km": 18.0
        }
    }
    
    response = client.post("/api/prediction/wind", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "wind_potential" in data
    assert 0 <= data["wind_potential"] <= 100


def test_site_score_prediction(auth_headers):
    payload = {
        "project_type": "Hybrid",
        "capacity_mw": 75.0,
        "environmental_data": {
            "solar_irradiance": 5.0,
            "wind_speed": 5.5,
            "wind_direction": 225.0,
            "temperature": 22.0,
            "humidity": 58.0,
            "rainfall": 700.0,
            "cloud_cover": 28.0,
            "elevation": 180.0,
            "land_slope": 4.0,
            "vegetation_index": 0.55,
            "nearby_roads_km": 9.0,
            "nearby_substations_km": 14.0,
            "nearby_transmission_lines_km": 19.0
        }
    }
    
    response = client.post("/api/prediction/site-score", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "suitability_score" in data
    assert 0 <= data["suitability_score"] <= 100
    assert "recommendation" in data


def test_forecast_prediction(auth_headers):
    payload = {
        "project_type": "Solar",
        "capacity_mw": 50.0,
        "environmental_data": {
            "solar_irradiance": 5.5,
            "wind_speed": 3.0,
            "wind_direction": 180.0,
            "temperature": 25.0,
            "humidity": 60.0,
            "rainfall": 800.0,
            "cloud_cover": 30.0,
            "elevation": 200.0,
            "land_slope": 5.0,
            "vegetation_index": 0.6,
            "nearby_roads_km": 10.0,
            "nearby_substations_km": 15.0,
            "nearby_transmission_lines_km": 20.0
        }
    }
    
    response = client.post("/api/prediction/forecast", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "forecast" in data
    assert len(data["forecast"]) == 12  # 12 months


def test_prediction_unauthorized():
    response = client.post(
        "/api/prediction/solar",
        json={
            "project_type": "Solar",
            "capacity_mw": 50.0,
            "environmental_data": {}
        }
    )
    assert response.status_code == 401


def test_prediction_invalid_project_type(auth_headers):
    payload = {
        "project_type": "InvalidType",
        "capacity_mw": 50.0,
        "environmental_data": {
            "solar_irradiance": 5.5,
            "wind_speed": 3.0,
            "wind_direction": 180.0,
            "temperature": 25.0,
            "humidity": 60.0,
            "rainfall": 800.0,
            "cloud_cover": 30.0,
            "elevation": 200.0,
            "land_slope": 5.0,
            "vegetation_index": 0.6,
            "nearby_roads_km": 10.0,
            "nearby_substations_km": 15.0,
            "nearby_transmission_lines_km": 20.0
        }
    }
    
    response = client.post("/api/prediction/solar", json=payload, headers=auth_headers)
    assert response.status_code == 422


def test_prediction_missing_environmental_data(auth_headers):
    payload = {
        "project_type": "Solar",
        "capacity_mw": 50.0,
        "environmental_data": {}
    }
    
    response = client.post("/api/prediction/solar", json=payload, headers=auth_headers)
    assert response.status_code == 422


def test_prediction_zero_capacity(auth_headers):
    payload = {
        "project_type": "Solar",
        "capacity_mw": 0.0,
        "environmental_data": {
            "solar_irradiance": 5.5,
            "wind_speed": 3.0,
            "wind_direction": 180.0,
            "temperature": 25.0,
            "humidity": 60.0,
            "rainfall": 800.0,
            "cloud_cover": 30.0,
            "elevation": 200.0,
            "land_slope": 5.0,
            "vegetation_index": 0.6,
            "nearby_roads_km": 10.0,
            "nearby_substations_km": 15.0,
            "nearby_transmission_lines_km": 20.0
        }
    }
    
    response = client.post("/api/prediction/solar", json=payload, headers=auth_headers)
    # Should still work but with zero capacity
    assert response.status_code == 200
