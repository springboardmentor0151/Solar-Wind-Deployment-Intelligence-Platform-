from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class RenewableTechnology(str, Enum):
    SOLAR = "Solar"
    WIND = "Wind"
    HYBRID = "Hybrid Solar-Wind"
    UNSUITABLE = "Unsuitable"


class RecommendationConfidence(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class TechnologyScore(BaseModel):
    score: float = Field(..., ge=0, le=100)

    resource_score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    suitability_score: float = Field(
        ...,
        ge=0,
        le=100,
    )


class RenewableRecommendationResponse(BaseModel):
    site_id: int

    recommended_technology: RenewableTechnology

    confidence: RecommendationConfidence

    solar: TechnologyScore
    wind: TechnologyScore

    hybrid_score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    overall_site_score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    deployment_feasible: bool

    recommendation_reason: str

    strengths: list[str]

    constraints: list[str]

    recommended_capacity_type: Optional[str] = None