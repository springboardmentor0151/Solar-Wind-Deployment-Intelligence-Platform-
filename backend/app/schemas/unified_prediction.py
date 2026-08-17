from __future__ import annotations

from pydantic import BaseModel, Field


class RenewablePredictionRequest(BaseModel):

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

    # -------------------------
    # Solar
    # -------------------------

    ghi: float = Field(..., ge=0)
    dni: float = Field(..., ge=0)
    dhi: float = Field(..., ge=0)

    # -------------------------
    # Environment
    # -------------------------

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

    # -------------------------
    # Wind
    # -------------------------

    air_density_kg_m3: float = Field(
        ...,
        gt=0,
    )


class RenewablePredictionResponse(BaseModel):

    latitude: float
    longitude: float

    solar_generation_mw: float
    wind_generation_mw: float
    total_generation_mw: float

    model_version: str

    data_source: str