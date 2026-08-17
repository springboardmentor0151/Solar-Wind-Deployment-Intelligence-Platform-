from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_environmental_service
from app.auth.permissions import require_roles
from app.services.environmental_service import EnvironmentalService
from app.environmental.models.environmental_report import (
    EnvironmentalReport,
)

router = APIRouter(
    prefix="/environment",
    tags=["Environmental"],
)


@router.get(
    "/sites/{site_id}",
    response_model=EnvironmentalReport,
)
def get_site_environment(
    site_id: int,
    service: EnvironmentalService = Depends(
        get_environmental_service,
    ),
    current_user=Depends(
        require_roles(
            "Admin",
            "GIS Analyst",
            "Project Manager",
            "Renewable Energy Planner",
        )
    ),
):
    return service.get_site_environment(site_id)


@router.get(
    "/projects/{project_id}",
)
def get_project_environment(
    project_id: int,
    service: EnvironmentalService = Depends(
        get_environmental_service,
    ),
    current_user=Depends(
        require_roles(
            "Admin",
            "GIS Analyst",
            "Project Manager",
            "Renewable Energy Planner",
        )
    ),
):
    return service.get_project_environment(project_id)