from typing import Optional
from pydantic import BaseModel


class SiteCreate(BaseModel):
    project_name: Optional[str] = None
    location_name: Optional[str] = "Selected Location"

    latitude: float
    longitude: float

    solar_score: float = 0
    wind_score: float = 0
    wind_potential: float = 0

    recommendation: str = "Not specified"


class SiteResponse(BaseModel):
    id: int

    project_name: Optional[str] = None
    location_name: Optional[str] = None

    latitude: float
    longitude: float

    solar_score: float
    wind_score: float
    wind_potential: float

    recommendation: str

    class Config:
        from_attributes = True