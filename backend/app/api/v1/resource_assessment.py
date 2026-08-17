from fastapi import APIRouter, Depends

from app.api.deps import get_resource_assessment_service
from app.auth.permissions import require_roles
from app.schemas.resource_assessment import ResourceAssessmentResponse
from app.services.resource_assessment_service import ResourceAssessmentService

router = APIRouter(prefix="/resource-assessment", tags=["Resource Assessment"])


@router.get("/sites/{site_id}", response_model=ResourceAssessmentResponse)
def get_site_resource_assessment(
    site_id: int,
    service: ResourceAssessmentService = Depends(get_resource_assessment_service),
    current_user=Depends(
        require_roles(
            "GIS Analyst",
            "Renewable Energy Planner",
            "Project Manager",
            "Admin",
        )
    ),
):
    return service.assess(site_id)
