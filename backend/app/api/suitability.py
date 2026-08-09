from fastapi import APIRouter

from app.schemas.suitability import (
    SuitabilityRequest,
    SuitabilityResponse
)

router = APIRouter(
    prefix="/suitability",
    tags=["Site Suitability"]
)


@router.post("/", response_model=SuitabilityResponse)
def calculate_suitability(data: SuitabilityRequest):

    overall_score = round(
        (
            data.solar_score +
            data.wind_score +
            data.terrain_score +
            data.infrastructure_score +
            data.environmental_score +
            data.economic_score
        ) / 6,
        2
    )

    if overall_score >= 85:
        category = "Excellent"
    elif overall_score >= 70:
        category = "Highly Suitable"
    elif overall_score >= 55:
        category = "Moderately Suitable"
    elif overall_score >= 40:
        category = "Low Suitability"
    else:
        category = "Unsuitable"

    return SuitabilityResponse(
        overall_score=overall_score,
        category=category
    )