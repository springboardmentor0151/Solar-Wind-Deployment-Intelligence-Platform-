from datetime import datetime

from pydantic import BaseModel, Field

from app.models.project import ProjectType
from app.schemas.environment import EnvironmentalDataRead
from app.schemas.prediction import ForecastPoint, PredictionRead


class LocationPayload(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    address: str


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    project_type: ProjectType
    region: str = Field(min_length=2, max_length=160)
    capacity_mw: float = Field(gt=0)
    description: str | None = None
    location: LocationPayload
    environmental_data: EnvironmentalDataRead
    prediction: PredictionRead


class ProjectSummary(BaseModel):
    id: int
    name: str
    project_type: ProjectType
    region: str
    capacity_mw: float
    suitability_score: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectRead(ProjectSummary):
    description: str | None
    location: LocationPayload
    environmental_data: EnvironmentalDataRead
    prediction: PredictionRead
    forecasts: list[ForecastPoint]
