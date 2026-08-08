# API Documentation - GeoEnergy AI Platform

This document describes all REST API endpoints available in the **GeoEnergy AI – Smart Renewable Energy Intelligence Platform** backend.

---

## 1. Authentication APIs

### Register Account
- **Endpoint**: `POST /api/auth/register`
- **Authentication Required**: No
- **Request Body**:
  ```json
  {
    "username": "planner_new",
    "email": "planner_new@geo.ai",
    "password": "Password123!",
    "full_name": "New Planner"
  }
  ```
- **Response Body**:
  ```json
  {
    "id": 12,
    "username": "planner_new",
    "email": "planner_new@geo.ai",
    "role": "planner",
    "is_active": true,
    "is_onboarded": false
  }
  ```

### User Login
- **Endpoint**: `POST /api/auth/login`
- **Authentication Required**: No (OAuth2 Password flow)
- **Request Body**: `username=planner&password=planner123` (Form Data)
- **Response Body**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer"
  }
  ```

### Google OAuth Login
- **Endpoint**: `POST /api/auth/google-login`
- **Authentication Required**: No
- **Request Body**:
  ```json
  {
    "credential": "GOOGLE_ID_TOKEN_STRING"
  }
  ```
- **Response Body**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer"
  }
  ```

---

## 2. Projects & Siting Workflow

### Get Projects List
- **Endpoint**: `GET /api/projects`
- **Authentication Required**: Yes (Bearer Token)
- **Response Body**: Array of `ProjectResponse` objects. Returning only projects assigned to/owned by the logged-in role (Admin gets all).

### Fetch Project Details
- **Endpoint**: `GET /api/projects/{project_id}`
- **Authentication Required**: Yes
- **Response Body**: Detailed `ProjectResponse` schema containing owner name, milestone checklists, and assignee IDs. Returns HTTP 200 read-only for any authorized user.

### Claim Project Review
- **Endpoint**: `POST /api/projects/{project_id}/claim`
- **Authentication Required**: Yes (GIS Analyst or Project Manager)
- **Response Body**: Updated `ProjectResponse` showing assignment register and status updates.

### Release Project Review
- **Endpoint**: `POST /api/projects/{project_id}/release`
- **Authentication Required**: Yes (Assigned Analyst or Manager)
- **Response Body**: Updated `ProjectResponse` with cleared assignees.

---

## 3. Reports & Telemetry Downloads

### Download Report (Excel/CSV)
- **Endpoint**: `GET /api/sites/{site_id}/download/excel`
- **Authentication Required**: Yes
- **Parameters**: `report_type=site_assessment` (Query param)
- **Response Headers**:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename=feasibility_report.xlsx`

### Download Report (PDF/HTML)
- **Endpoint**: `GET /api/sites/{site_id}/download/pdf`
- **Authentication Required**: Yes
- **Parameters**: `report_type=wind_potential`
- **Response Headers**:
  - `Content-Type: text/html` (Print-friendly format)
  - `Content-Disposition: attachment; filename=wind_potential_report.html`

---

## 4. Monitoring & Health Check

### Health Status
- **Endpoint**: `GET /api/health`
- **Authentication Required**: No
- **Response Body**:
  ```json
  {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2026-08-08T00:10:00Z"
  }
  ```
