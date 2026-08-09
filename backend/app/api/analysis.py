from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.environmental_engine import get_environmental_profile
from app.services.report_generator import generate_resource_report

router = APIRouter(
    prefix="/analysis",
    tags=["Environmental Analysis"]
)


class LocationRequest(BaseModel):
    latitude: float
    longitude: float


@router.post("/environment")
def environmental_analysis(location: LocationRequest):
    """
    Fetch complete environmental profile.
    """

    try:
        return get_environmental_profile(
            location.latitude,
            location.longitude
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/report")
def resource_assessment_report(location: LocationRequest):
    """
    Generate complete renewable energy resource assessment report.
    """

    try:
        return generate_resource_report(
            location.latitude,
            location.longitude
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )