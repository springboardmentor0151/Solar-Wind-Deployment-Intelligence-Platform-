from fastapi import APIRouter

from app.schemas.environmental import (
    LocationRequest,
    EnvironmentalResponse,
)

from app.services.environmental_service import EnvironmentalService


router = APIRouter(
    prefix="/environment",
    tags=["Environment"],
)


@router.post(
    "/analyze",
    response_model=EnvironmentalResponse,
)
def analyze_location(location: LocationRequest):

    return EnvironmentalService.analyze_location(
        location.latitude,
        location.longitude,
    )