from pydantic import BaseModel


class OptimizationRequest(BaseModel):
    latitude: float
    longitude: float


class OptimizationResponse(BaseModel):
    location: str
    recommended_plant: str
    capacity_mw: int
    land_required_acres: int
    annual_generation_gwh: int
    infrastructure_units: int
    recommendation: str