# Deployment Guide - GeoEnergy AI Platform

This document explains how to set up, initialize, and deploy the **GeoEnergy AI – Smart Renewable Energy Intelligence Platform** in local and production container environments.

---

## 1. Prerequisites

Ensure the following tools are installed on your host system:
- **Python**: v3.10 or v3.11
- **Node.js**: v18.0 or higher (with npm)
- **Docker** and **Docker Compose**

---

## 2. Local Environment Setup

### Backend (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   ```
3. Install Python requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Start development API server:
   ```bash
   uvicorn app.main:app --port 8000 --reload
   ```

### Frontend (Vite + React)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start React client:
   ```bash
   npm run dev
   ```

---

## 3. Containerized Deployment (Docker)

We package and run the services concurrently using multi-container Docker Compose.

### Build and Start Containers
From the root directory of the repository, execute:
```bash
docker-compose up --build -d
```

### Port Mappings
- **React Frontend**: Hosted via Nginx on port `80` (accessible at [http://localhost/](http://localhost/)).
- **FastAPI Backend**: Exposed on port `8000` (accessible at [http://localhost:8000/docs](http://localhost:8000/docs)).

---

## 4. Health Monitoring

Validate the backend and database connection status via the automated health check:
- **URL**: `GET http://localhost:8000/api/health`
- **Expected Response**:
  ```json
  {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2026-08-08T00:10:00Z"
  }
  ```

---

## 5. Troubleshooting & Maintenance

### Database Migrations / Resets
If database columns are missing or out of sync:
1. Stop running containers: `docker-compose down`
2. Delete the persistent sqlite database file on host.
3. Restart containers: `docker-compose up -d`. Auto-migrations run on FastAPI server boot.

### View Container Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```
