from pydantic import BaseModel, ConfigDict, Field

from app.schemas.environment import EnvironmentalDataRead


class PredictionRequest(BaseModel):
    project_type: str = Field(pattern="^(Solar|Wind|Hybrid)$")
    capacity_mw: float = Field(gt=0)
    environmental_data: EnvironmentalDataRead


class ForecastPoint(BaseModel):
    month: str
    solar_mwh: float
    wind_mwh: float
    hybrid_mwh: float

    model_config = ConfigDict(from_attributes=True)


class PredictionRead(BaseModel):
    solar_potential: float
    wind_potential: float
    energy_generation_forecast: float
    capacity_factor: float
    performance_ratio: float
    annual_energy_output: float
    wind_power_density: float
    suitability_score: float
    investment_score: float
    roi_estimate: float
    deployment_recommendation: str
    technology_recommendation: str
    confidence_score: float

    forecast: list[ForecastPoint]

    model_config = ConfigDict(from_attributes=True)