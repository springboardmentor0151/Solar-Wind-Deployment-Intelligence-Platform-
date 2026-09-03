from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health_endpoint_status() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"
    assert payload["healthy"] is True


def test_registration_and_login_flow() -> None:
    email = "analyst+flow@example.com"
    payload = {
        "full_name": "Milestone User",
        "email": email,
        "password": "StrongPass123!",
        "role": "Planner",
    }

    register_response = client.post("/api/auth/register", json=payload)
    assert register_response.status_code == 201, register_response.text
    token = register_response.json()["access_token"]
    assert token

    login_response = client.post("/api/auth/login", json={"email": email, "password": "StrongPass123!"})
    assert login_response.status_code == 200, login_response.text
    assert login_response.json()["access_token"]

    me_response = client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == email


def test_analytics_dashboard_requires_auth() -> None:
    response = client.get("/api/analytics/dashboard")
    assert response.status_code == 401


def test_invalid_project_payload_is_rejected() -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Bad User",
            "email": "bad@example.com",
            "password": "short",
            "role": "Planner",
        },
    )
    assert response.status_code == 422
