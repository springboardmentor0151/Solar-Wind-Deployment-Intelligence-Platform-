from fastapi import APIRouter
from app.services.location_analysis import analyze_location

router = APIRouter()

@router.post("/analyze")
def analyze(data: dict):
    latitude = data.get("latitude")
    longitude = data.get("longitude")

    return analyze_location(latitude, longitude)