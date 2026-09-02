from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import Base, engine

# Models
from app.models.user import User
from app.models.project import Project
from app.models.site import Site

# Routers
from app.routers.location import router as location_router
from app.routers.user import router as user_router
from app.routers.project import router as project_router
from app.routers.site import router as site_router
from app.routers.analysis import router as analysis_router
from app.routers.investment import router as investment_router

from app.routers.forecast import router as forecast_router

# ========================================
# CREATE FASTAPI APPLICATION
# ========================================

app = FastAPI(
    title="Solar & Wind Deployment Intelligence Platform",
    description="Renewable energy site intelligence and optimization platform",
    version="1.0.0",
)


# ========================================
# DATABASE
# ========================================

Base.metadata.create_all(bind=engine)


# ========================================
# CORS
# ========================================

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",

    "http://localhost:5174",
    "http://127.0.0.1:5174",

    "http://localhost:5175",
    "http://127.0.0.1:5175",

    "http://localhost:5176",
    "http://127.0.0.1:5176",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========================================
# ROUTERS
# ========================================

app.include_router(location_router)
app.include_router(user_router)
app.include_router(project_router)
app.include_router(site_router)
app.include_router(analysis_router)
app.include_router(investment_router)
app.include_router(forecast_router)


# ========================================
# HOME
# ========================================

@app.get("/")
def home():
    return {
        "message": "Welcome to Solar & Wind Deployment Intelligence Platform",
        "status": "running",
    }


# ========================================
# HEALTH CHECK
# ========================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SolarWindPlatform",
    }