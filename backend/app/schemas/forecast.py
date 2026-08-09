from pydantic import BaseModel


class ForecastRequest(BaseModel):
    solar_irradiance: float
    wind_speed: float
    temperature: float
    days: int


class ForecastResponse(BaseModel):
    estimated_solar_energy: float
    estimated_wind_energy: float
    total_energy: float