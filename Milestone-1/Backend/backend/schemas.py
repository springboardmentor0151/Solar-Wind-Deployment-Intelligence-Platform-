"""
Pydantic models for the site-analysis API.

FastAPI uses these automatically to validate incoming requests and to
document the response shape at /docs.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field, field_validator


class SiteAnalysisRequest(BaseModel):
    projectId: str = Field(..., min_length=1)
    siteId: str = Field(..., min_length=1)
    latitude: float
    longitude: float

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, value: float) -> float:
        if not -90 <= value <= 90:
            raise ValueError("latitude must be between -90 and 90")
        return value

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, value: float) -> float:
        if not -180 <= value <= 180:
            raise ValueError("longitude must be between -180 and 180")
        return value


class EnvironmentalData(BaseModel):
    solarIrradiance: Optional[float] = None  # kWh/m^2/day
    temperature: Optional[float] = None      # deg C
    windSpeed: Optional[float] = None        # m/s


class TerrainData(BaseModel):
    elevation: Optional[float] = None  # meters


class GisData(BaseModel):
    nearbyRoads: bool = False
    roadCount: int = 0
    nearbyPowerInfrastructure: bool = False
    powerInfrastructureCount: int = 0
    nearbyWaterBodies: bool = False
    waterBodyCount: int = 0
    landUse: list[str] = []


class SourceStatus(BaseModel):
    nasaPower: str = "not_attempted"
    elevation: str = "not_attempted"
    openStreetMap: str = "not_attempted"

class SolarPrediction(BaseModel):
    annualIrradiance: Optional[float] = None
    peakSunHours: Optional[float] = None
    dailyEnergyOutput: Optional[float] = None
    annualEnergyOutput: Optional[float] = None
    capacityFactor: Optional[float] = None
    performanceRatio: Optional[float] = None
    solarPotential: Optional[str] = None
    panelEfficiency: Optional[float] = None


class SiteAnalysisResponse(BaseModel):
    success: bool
    environmentalData: EnvironmentalData
    terrainData: TerrainData
    gisData: GisData
    solarPrediction: SolarPrediction
    sources: SourceStatus
    errors: dict[str, str] = {}
