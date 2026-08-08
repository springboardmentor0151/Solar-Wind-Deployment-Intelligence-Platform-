from fastapi import APIRouter

from app.schemas.solar import (
    SolarRequest,
    SolarResponse
)

from app.services.solar_service import SolarService

router = APIRouter(
    prefix="/solar",
    tags=["Solar Prediction"]
)


@router.post(
    "/predict",
    response_model=SolarResponse
)
def predict(data: SolarRequest):

    return SolarService.predict(
        data.latitude,
        data.longitude
    )