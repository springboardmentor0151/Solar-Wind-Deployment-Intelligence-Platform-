from __future__ import annotations

from pydantic import BaseModel, Field


class SolarPredictionRequest(BaseModel):
    """
    Online inference request matching SOLAR_FEATURES.
    """

    latitude: float = Field(
        ...,
        ge=-90,
        le=90,
    )

    longitude: float = Field(
        ...,
        ge=-180,
        le=180,
    )

    ghi: float = Field(
        ...,
        ge=0,
    )

    dni: float = Field(
        ...,
        ge=0,
    )

    dhi: float = Field(
        ...,
        ge=0,
    )

    temperature_c: float

    humidity_pct: float = Field(
        ...,
        ge=0,
        le=100,
    )

    cloud_cover_pct: float = Field(
        ...,
        ge=0,
        le=100,
    )

    pressure_hpa: float = Field(
        ...,
        gt=0,
    )

    wind_speed_m_s: float = Field(
        ...,
        ge=0,
    )

    elevation_m: float


class WindPredictionRequest(BaseModel):
    """
    Online inference request matching WIND_FEATURES.
    """

    latitude: float = Field(
        ...,
        ge=-90,
        le=90,
    )

    longitude: float = Field(
        ...,
        ge=-180,
        le=180,
    )

    wind_speed_m_s: float = Field(
        ...,
        ge=0,
    )

    air_density_kg_m3: float = Field(
        ...,
        gt=0,
    )

    temperature_c: float

    humidity_pct: float = Field(
        ...,
        ge=0,
        le=100,
    )

    pressure_hpa: float = Field(
        ...,
        gt=0,
    )

    elevation_m: float


class PredictionResponse(BaseModel):
    """
    Single-resource prediction response.
    """

    domain: str

    prediction_mw: float

    model_version: str

    data_source: str