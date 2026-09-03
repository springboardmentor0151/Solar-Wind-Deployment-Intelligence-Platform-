from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.analytics_service import (
    build_analytics_dashboard,
    build_analytics_investment,
    build_analytics_projects,
    build_analytics_resources,
    build_analytics_suitability,
    build_analytics_trends,
)


router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", summary="Executive dashboard KPIs and trends")
def read_dashboard_metrics(_: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return build_analytics_dashboard(db)


@router.get("/projects", summary="Project-level analytics")
def read_project_analytics(_: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return build_analytics_projects(db)


@router.get("/resources", summary="Renewable resource analytics")
def read_resource_analytics(_: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return build_analytics_resources(db)


@router.get("/investment", summary="Investment and ROI analytics")
def read_investment_analytics(_: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return build_analytics_investment(db)


@router.get("/suitability", summary="Suitability distribution analytics")
def read_suitability_analytics(_: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return build_analytics_suitability(db)


@router.get("/trends", summary="Energy and suitability trend analytics")
def read_trend_analytics(_: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return build_analytics_trends(db)
