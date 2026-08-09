from fastapi import APIRouter

from app.schemas.prediction import (
    SolarPredictionRequest,
    SolarPredictionResponse,
    WindPredictionRequest,
    WindPredictionResponse
)

router = APIRouter(
    prefix="/prediction",
    tags=["Prediction Engine"]
)


# ---------------------------------
# Solar Prediction
# ---------------------------------
@router.post("/solar", response_model=SolarPredictionResponse)
def predict_solar(data: SolarPredictionRequest):

    peak_sun_hours = round(data.solar_irradiance * 0.75, 2)

    performance_ratio = round(
        data.panel_efficiency * 0.90,
        2
    )

    expected_energy_output = round(
        peak_sun_hours * performance_ratio,
        2
    )

    return SolarPredictionResponse(
        peak_sun_hours=peak_sun_hours,
        expected_energy_output=expected_energy_output,
        performance_ratio=performance_ratio
    )


# ---------------------------------
# Wind Prediction
# ---------------------------------
@router.post("/wind", response_model=WindPredictionResponse)
def predict_wind(data: WindPredictionRequest):

    wind_power_density = round(
        0.5 * data.air_density * (data.wind_speed ** 3),
        2
    )

    capacity_factor = round(
        data.turbine_efficiency * 0.85,
        2
    )

    expected_energy_output = round(
        wind_power_density * capacity_factor / 100,
        2
    )

    return WindPredictionResponse(
        wind_power_density=wind_power_density,
        expected_energy_output=expected_energy_output,
        capacity_factor=capacity_factor
    )