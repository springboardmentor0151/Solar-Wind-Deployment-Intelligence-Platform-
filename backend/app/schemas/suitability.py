from pydantic import BaseModel


class SuitabilityRequest(BaseModel):
    solar_score: float
    wind_score: float
    terrain_score: float
    infrastructure_score: float
    environmental_score: float
    economic_score: float


class SuitabilityResponse(BaseModel):
    overall_score: float
    category: str