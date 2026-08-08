from datetime import datetime
from pydantic import BaseModel


class EnvironmentalDataCreate(BaseModel):
    site_id: int
    temperature: float
    humidity: float
    wind_speed: float
    solar_irradiance: float
    rainfall: float
    air_pressure: float


class EnvironmentalDataResponse(EnvironmentalDataCreate):
    id: int
    recorded_at: datetime

    model_config = {
        "from_attributes": True
    }