from pydantic import BaseModel, Field


class LocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class EnvironmentalResponse(BaseModel):
    latitude: float
    longitude: float

    temperature: float
    humidity: float

    solar_radiation: float
    wind_speed: float

    elevation: float

    air_quality: str

    terrain: str
    land_type: str
    road_access: str
    grid_connection: str