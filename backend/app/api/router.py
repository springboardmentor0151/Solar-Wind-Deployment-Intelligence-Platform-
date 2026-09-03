from fastapi import APIRouter

from app.api.routes import analytics, auth, dashboard, environment, gis, health, prediction, projects, reports, users


api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(environment.router)
api_router.include_router(prediction.router)
api_router.include_router(reports.router)
api_router.include_router(dashboard.router)
api_router.include_router(analytics.router)
api_router.include_router(gis.router)
