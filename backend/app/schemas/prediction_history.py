from pydantic import BaseModel
from datetime import datetime


class PredictionHistoryResponse(BaseModel):
    id: int
    site_id: int
    predicted_power: float
    solar_score: int
    wind_score: int
    overall_score: int
    best_energy_source: str
    recommendation: str
    model_name: str
    created_at: datetime

    class Config:
        from_attributes = True