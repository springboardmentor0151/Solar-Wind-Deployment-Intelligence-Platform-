from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.location_analysis import analyze_location


router = APIRouter()


class LocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


@router.post("/analyze")
def analyze(data: LocationRequest):
    try:
        result = analyze_location(
            data.latitude,
            data.longitude
        )

        return result

    except Exception as error:
        print("Location analysis error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to analyze this location"
        )