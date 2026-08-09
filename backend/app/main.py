import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import Base, engine
from app.db import models  # noqa: F401 (ensures models are registered before create_all)
from app.api import auth, sites, dashboard, reports, admin

# Make sure our services' logger.warning(...) calls (e.g. "NASA POWER fetch failed: ...")
# actually show up in the console uvicorn is running in.
logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s: %(message)s")
logging.getLogger("renewsite.environmental").setLevel(logging.INFO)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered platform recommending optimal locations for solar & wind "
                "deployment using geospatial analytics, live climate data, and trained "
                "ML models for resource prediction and site suitability scoring.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(sites.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(admin.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "service": settings.APP_NAME,
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/api/v1/health", tags=["Health"])
def health():
    return {"status": "ok"}
