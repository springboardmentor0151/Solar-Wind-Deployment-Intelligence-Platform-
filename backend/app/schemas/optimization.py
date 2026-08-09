from pydantic import BaseModel


class OptimizationRequest(BaseModel):
    available_land: float
    budget: float
    solar_efficiency: float
    wind_efficiency: float


class OptimizationResponse(BaseModel):
    recommended_solar_capacity: float
    recommended_wind_capacity: float
    estimated_cost: float