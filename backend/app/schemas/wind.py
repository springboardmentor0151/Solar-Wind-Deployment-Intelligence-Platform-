from pydantic import BaseModel

class WindRequest(BaseModel):
    latitude: float
    longitude: float


class WindResponse(BaseModel):
    wind_speed: float
    elevation: float
    wind_score: int
    suitability: str
    recommendation: str