from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.projects import router as project_router
from app.api.sites import router as site_router
from app.api.dashboard import router as dashboard_router
from app.api.analysis import router as analysis_router

from app.database.database import Base, engine
from app.models.user import User
from app.models.project import Project
from app.models.site import Site

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Solar & Wind Deployment Intelligence Platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(project_router)
app.include_router(site_router)
app.include_router(dashboard_router)
app.include_router(analysis_router)


@app.get("/")
def home():
    return {
        "message": "Backend is running successfully!"
    }