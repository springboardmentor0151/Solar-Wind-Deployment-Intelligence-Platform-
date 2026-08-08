from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine

from app.routes.prediction import router as prediction_router

from app.models.user import User
from app.models.project import Project
from app.models.site import Site
from app.models.environmental_data import EnvironmentalData

from app.routes.auth import router as auth_router
from app.routes.project import router as project_router
from app.routes.site import router as site_router
from app.routes.environment import router as environment_router

from app.models.prediction_history import PredictionHistory

from app.routes.dashboard import router as dashboard_router

app = FastAPI(
    title="Solar & Wind Deployment Intelligence Platform",
    version="1.0.0"
)

# -----------------------------
# CORS Configuration
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Create Database Tables
# -----------------------------
Base.metadata.create_all(bind=engine)

# -----------------------------
# Register API Routes
# -----------------------------
app.include_router(auth_router)
app.include_router(project_router)
app.include_router(site_router)
app.include_router(environment_router)
app.include_router(prediction_router)
app.include_router(dashboard_router)

# -----------------------------
# Root Endpoint
# -----------------------------
@app.get("/")
def home():
    return {
        "status": "running",
        "message": "Infosys Internship Backend is working successfully."
    }

# -----------------------------
# Health Check
# -----------------------------
@app.get("/health")
def health():
    return {
        "status": "healthy"
    }