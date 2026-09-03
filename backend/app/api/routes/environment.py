from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.environment import CoordinateRequest, EnvironmentalDataRead, ReverseGeocodeResponse
from app.services.environment_service import fetch_environmental_data
from app.services.geocoding_service import reverse_geocode


router = APIRouter(prefix="/environment", tags=["Environment"])


@router.post("/reverse-geocode", response_model=ReverseGeocodeResponse)
def reverse_geocode_location(
    payload: CoordinateRequest,
    _: User = Depends(get_current_user),
) -> ReverseGeocodeResponse:
    return ReverseGeocodeResponse(
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=reverse_geocode(payload.latitude, payload.longitude),
    )


@router.post("/fetch", response_model=EnvironmentalDataRead)
def fetch_environment(
    payload: CoordinateRequest,
    _: User = Depends(get_current_user),
) -> EnvironmentalDataRead:
    return fetch_environmental_data(payload.latitude, payload.longitude)
