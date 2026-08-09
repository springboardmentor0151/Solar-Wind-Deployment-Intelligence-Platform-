from fastapi import APIRouter

from app.schemas.assessment import (
    ResourceAssessmentRequest,
    ResourceAssessmentResponse
)

router = APIRouter(
    prefix="/assessment",
    tags=["Resource Assessment"]
)


@router.post("/", response_model=ResourceAssessmentResponse)
def assess_resource(data: ResourceAssessmentRequest):

    # Calculate overall score
    overall_score = round(
        (
            data.solar_score +
            data.wind_score +
            data.environmental_score
        ) / 3,
        2
    )

    # Recommendation
    if overall_score >= 80:
        recommendation = "Excellent"
    elif overall_score >= 70:
        recommendation = "Highly Suitable"
    elif overall_score >= 60:
        recommendation = "Moderately Suitable"
    elif overall_score >= 50:
        recommendation = "Low Suitability"
    else:
        recommendation = "Unsuitable"

    return ResourceAssessmentResponse(
        overall_score=overall_score,
        recommendation=recommendation
    )