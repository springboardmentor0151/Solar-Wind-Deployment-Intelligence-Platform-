from pydantic import BaseModel


class DashboardResponse(BaseModel):
    total_projects: int
    total_sites: int
    total_assets: int
    total_forecast_energy: float
    average_suitability_score: float
    total_investment: float