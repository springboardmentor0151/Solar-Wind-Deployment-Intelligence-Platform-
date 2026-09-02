import os

os.environ["DATABASE_URL"] = "sqlite:///./test_milestone4.db"

from fastapi.testclient import TestClient

from app.main import app
from app.database.database import Base, SessionLocal, engine
from app.models.site import Site


Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)


def setup_function():
    db = SessionLocal()
    db.query(Site).delete()
    db.add(
        Site(
            project_name="Milestone 4 Test",
            location_name="Test Renewable Site",
            latitude=21.1458,
            longitude=79.0882,
            solar_score=70.49,
            wind_score=42.99,
            wind_potential=25.75,
            recommendation="Moderate Renewable Potential",
        )
    )
    db.commit()
    db.close()


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_sites_endpoint():
    response = client.get("/sites/")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_site_analysis():
    db = SessionLocal()
    site_id = db.query(Site).first().id
    db.close()

    response = client.get(f"/analysis/site/{site_id}")
    assert response.status_code == 200
    body = response.json()
    assert body["solar_score"] == 70.49
    assert "recommended_technology" in body


def test_optimization():
    response = client.get("/analysis/optimize")
    assert response.status_code == 200
    body = response.json()
    assert body["total_sites"] == 1
    assert body["recommended_site"]["rank"] == 1


def test_executive_analytics():
    db = SessionLocal()
    site_id = db.query(Site).first().id
    db.close()

    response = client.get("/analytics/executive")
    assert response.status_code == 200
    body = response.json()
    assert body["total_sites"] == 1
    assert body["top_site"]["site_id"] == site_id
