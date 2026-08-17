from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.profile import router as profile_router
from app.api.v1.projects import router as project_router
from app.api.v1.sites import router as site_router
from app.api.v1.gis import router as gis_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.environment import router as environment_router
from app.api.v1.prediction import router as prediction_router
from app.api.v1.suitability import router as suitability_router
from app.api.v1.renewable_recommendation import router as renewable_recommendation_router
from app.api.v1.deployment_optimization import (
    router as deployment_optimization_router,
)
from app.api.v1.energy_forecasting import (
    router as energy_forecasting_router,
)
from app.api.v1.investment_recommendation import (
    router as investment_recommendation_router,
)
from app.api.v1.planner_dashboard import (
    router as planner_dashboard_router,
)
from app.api.v1.gis_analyst_dashboard import (
    router as gis_analyst_dashboard_router,
)
from app.api.v1.project_manager_dashboard import (
    router as project_manager_dashboard_router,
)
from app.api.v1.reports import (
    router as reports_router,
)
from app.api.v1.notifications import router as notifications_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.candidate_sites import router as candidate_sites_router
from app.api.v1.deployment_history import router as deployment_history_router
from app.api.v1.resource_assessment import router as resource_assessment_router


api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(profile_router)
api_router.include_router(project_router)
api_router.include_router(site_router)
api_router.include_router(gis_router)
api_router.include_router(dashboard_router)
api_router.include_router(environment_router)
api_router.include_router(prediction_router)
api_router.include_router(suitability_router)
api_router.include_router(
    renewable_recommendation_router
)
api_router.include_router(
    deployment_optimization_router
)
api_router.include_router(
    energy_forecasting_router
)
api_router.include_router(
    investment_recommendation_router
)
api_router.include_router(
    planner_dashboard_router
)
api_router.include_router(
    gis_analyst_dashboard_router
)
api_router.include_router(
    project_manager_dashboard_router
)
api_router.include_router(
    reports_router
)
api_router.include_router(
    notifications_router
)
api_router.include_router(alerts_router)
api_router.include_router(candidate_sites_router)
api_router.include_router(deployment_history_router)
api_router.include_router(resource_assessment_router)
