from fastapi import APIRouter

from backend.schemas import (
    SolarRequest,
    EnergyRequest,
    SuitabilityRequest,
)

from ml.predict import (
    predict_solar,
    predict_energy,
    predict_suitability,
)

router = APIRouter()


@router.post("/predict/solar")
def solar_prediction(data: SolarRequest):

    prediction = predict_solar(
        data.year,
        data.lat,
        data.lon,
        data.allsky_sw,
        data.clearsky_sw,
        data.albedo,
        data.cloud_amount,
        data.temp,
        data.dewpoint,
    )

    return {
        "prediction": prediction
    }


@router.post("/predict/energy")
def energy_prediction(data: EnergyRequest):

    prediction = predict_energy(
        data.day,
        data.month,
        data.year,
        data.temp2,
        data.temp2_max,
        data.temp2_min,
        data.temp2_avg,
        data.surface_pressure,
        data.wind_speed50_max,
        data.wind_speed50_min,
        data.wind_speed50_avg,
        data.precipitation,
    )

    return {
        "prediction": prediction
    }


@router.post("/predict/suitability")
def suitability_prediction(data: SuitabilityRequest):

    prediction = predict_suitability(
        data.lat,
        data.lon,
        data.allsky_sw,
        data.clearsky_sw,
        data.albedo,
        data.cloud_amount,
        data.temp,
        data.dewpoint,
        data.precipitation,
    )

    return {
        "prediction": prediction
    }