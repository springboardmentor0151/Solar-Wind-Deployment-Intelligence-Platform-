from pydantic import BaseModel


class SolarRequest(BaseModel):
    latitude: float
    longitude: float


class SolarResponse(BaseModel):
    solar_score: int
    suitability: str
    recommendation: str