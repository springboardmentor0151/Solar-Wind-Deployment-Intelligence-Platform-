from app.api.asset import router as asset_router
from fastapi import FastAPI
from app.api.environmental import router as environmental_router

from app.database.database import engine, Base
from app.models.user import User
from app.models.project import Project
from app.models.asset import Asset
from app.models.environmental import EnvironmentalData
from app.api.site import router as site_router
from app.api.auth import router as auth_router
from app.api.project import router as project_router
from app.models.site import Site
from app.api.prediction import router as prediction_router
from app.api.assessment import router as assessment_router
from app.api.suitability import router as suitability_router
from app.api.forecast import router as forecast_router
from app.api.optimization import router as optimization_router
from app.api.investment import router as investment_router
from app.api.dashboard import router as dashboard_router
# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Solar & Wind Deployment Intelligence Platform",
    version="1.0.0"
)

# Include routers
app.include_router(auth_router)
app.include_router(project_router)
app.include_router(site_router)
app.include_router(asset_router)
app.include_router(environmental_router)
app.include_router(prediction_router)
app.include_router(assessment_router)
app.include_router(suitability_router)
app.include_router(forecast_router)
app.include_router(optimization_router)
app.include_router(investment_router)
app.include_router(dashboard_router)

@app.get("/")
def home():
    return {
        "message": "Welcome to Solar & Wind Deployment Intelligence Platform"
    }


@app.get("/health")
def health():
    return {
        "status": "Backend is running successfully"
    }