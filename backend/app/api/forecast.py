from fastapi import APIRouter

from app.schemas.forecast import (
    ForecastRequest,
    ForecastResponse
)

from app.services.forecast_service import ForecastService

router = APIRouter(
    prefix="/forecast",
    tags=["Forecast"]
)


@router.post(
    "/predict",
    response_model=ForecastResponse
)
def predict(data: ForecastRequest):

    return ForecastService.predict(
        data.latitude,
        data.longitude
    )