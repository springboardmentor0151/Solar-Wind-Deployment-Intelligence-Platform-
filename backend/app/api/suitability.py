from fastapi import APIRouter

from app.schemas.suitability import (
    SuitabilityRequest,
    SuitabilityResponse,
)
from app.services.suitability_service import SuitabilityService

router = APIRouter(
    prefix="/suitability",
    tags=["Site Suitability"],
)


@router.post(
    "",
    response_model=SuitabilityResponse,
)
def analyze_site(request: SuitabilityRequest):
    return SuitabilityService.analyze(
        request.latitude,
        request.longitude,
    )