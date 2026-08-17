from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class SuitabilityCategory(str, Enum):
    EXCELLENT = "Excellent"
    HIGHLY_SUITABLE = "Highly Suitable"
    MODERATELY_SUITABLE = "Moderately Suitable"
    LOW_SUITABILITY = "Low Suitability"
    UNSUITABLE = "Unsuitable"


class SuitabilityFactor(BaseModel):
    score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    weight: float = Field(
        ...,
        ge=0,
        le=1,
    )

    weighted_score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    status: str

    explanation: Optional[str] = None


class SiteSuitabilityResponse(BaseModel):
    site_id: int

    overall_score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    category: SuitabilityCategory

    renewable_resource: SuitabilityFactor

    geographic_suitability: SuitabilityFactor

    infrastructure_accessibility: SuitabilityFactor

    environmental_impact: SuitabilityFactor

    economic_feasibility: SuitabilityFactor

    deployment_feasible: bool

    recommendation: str

    strengths: list[str]

    constraints: list[str]

    solar_score: Optional[float] = Field(
        default=None,
        ge=0,
        le=100,
    )

    wind_score: Optional[float] = Field(
        default=None,
        ge=0,
        le=100,
    )