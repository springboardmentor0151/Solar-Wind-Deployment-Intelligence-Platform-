from fastapi import APIRouter
from app.schemas.forecast import (
    ForecastRequest,
    ForecastResponse
)

router = APIRouter(
    prefix="/forecast",
    tags=["Energy Forecast"]
)


@router.post("/", response_model=ForecastResponse)
def forecast_energy(data: ForecastRequest):

    estimated_solar = round(
        data.solar_irradiance * data.days * 0.22,
        2
    )

    estimated_wind = round(
        data.wind_speed * data.days * 0.35,
        2
    )

    total = round(
        estimated_solar + estimated_wind,
        2
    )

    return ForecastResponse(
        estimated_solar_energy=estimated_solar,
        estimated_wind_energy=estimated_wind,
        total_energy=total
    )
    