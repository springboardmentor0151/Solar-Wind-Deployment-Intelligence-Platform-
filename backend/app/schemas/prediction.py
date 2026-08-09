from pydantic import BaseModel


class SolarPredictionRequest(BaseModel):
    solar_irradiance: float
    temperature: float
    panel_efficiency: float


class SolarPredictionResponse(BaseModel):
    peak_sun_hours: float
    expected_energy_output: float
    performance_ratio: float


class WindPredictionRequest(BaseModel):
    wind_speed: float
    air_density: float
    turbine_efficiency: float


class WindPredictionResponse(BaseModel):
    wind_power_density: float
    expected_energy_output: float
    capacity_factor: float