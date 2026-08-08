from pydantic import BaseModel


class SuitabilityRequest(BaseModel):
    latitude: float
    longitude: float


class SuitabilityResponse(BaseModel):
    location: str
    overall_score: int
    suitability: str
    recommendation: str
    solar_score: int
    wind_score: int