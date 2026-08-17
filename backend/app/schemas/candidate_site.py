from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CandidateSiteCreateResponse(BaseModel):
    id: int
    site_id: int
    status: str
    recommended_technology: str
    suitability_score: float = Field(ge=0, le=100)
    solar_score: float | None = None
    wind_score: float | None = None
    hybrid_score: float | None = None
    confidence: str
    recommendation_reason: str
    created_at: datetime
    reviewed_by: int | None = None
    reviewed_at: datetime | None = None
    rejection_reason: str | None = None
    project_id: int | None = None

    model_config = {
        "from_attributes": True,
    }


class CandidateReviewRequest(BaseModel):
    decision: str = Field(pattern="^(APPROVED|REJECTED)$")
    rejection_reason: Optional[str] = None


class CandidateReviewResponse(CandidateSiteCreateResponse):
    pass


class ProjectFromCandidateRequest(BaseModel):
    name: str = Field(min_length=3, max_length=150)
    description: Optional[str] = None
    region: str = Field(min_length=1, max_length=100)


class AssignCandidateToProjectRequest(BaseModel):
    project_id: int = Field(gt=0)