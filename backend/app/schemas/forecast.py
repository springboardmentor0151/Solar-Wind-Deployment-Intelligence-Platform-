from pydantic import BaseModel

class ForecastRequest(BaseModel):
    latitude: float
    longitude: float


class ForecastResponse(BaseModel):
    temperature: float
    humidity: int
    wind_speed: float
    cloud_cover: int
    precipitation: float