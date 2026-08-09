from pydantic import BaseModel


class EnvironmentalCreate(BaseModel):
    site_id: int
    solar_irradiance: float
    wind_speed: float
    temperature: float
    rainfall: float
    cloud_cover: float


class EnvironmentalResponse(BaseModel):
    id: int
    site_id: int
    solar_irradiance: float
    wind_speed: float
    temperature: float
    rainfall: float
    cloud_cover: float
    created_by: int

    class Config:
        from_attributes = True