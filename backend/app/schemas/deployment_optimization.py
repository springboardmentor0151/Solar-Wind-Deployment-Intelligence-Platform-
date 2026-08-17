from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class DeploymentTechnology(str, Enum):
    SOLAR = "Solar"
    WIND = "Wind"
    HYBRID = "Hybrid Solar-Wind"
    UNSUITABLE = "Unsuitable"


class CapacityPlan(BaseModel):
    recommended_capacity_mw: float = Field(
        ...,
        ge=0,
    )

    solar_capacity_mw: float = Field(
        ...,
        ge=0,
    )

    wind_capacity_mw: float = Field(
        ...,
        ge=0,
    )

    capacity_strategy: str


class LocationRecommendation(BaseModel):
    site_id: int

    deployment_score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    technology: DeploymentTechnology

    recommendation_reason: str


class ExpansionPlan(BaseModel):
    expansion_recommended: bool

    expansion_priority: str

    expansion_reason: str


class DeploymentOptimizationResponse(BaseModel):
    site_id: int

    recommended_location: bool

    technology: DeploymentTechnology

    optimization_score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    capacity_plan: CapacityPlan

    hybrid_recommended: bool

    location_recommendation: LocationRecommendation

    expansion_plan: ExpansionPlan

    optimization_reason: str