from pydantic import BaseModel


class InvestmentRequest(BaseModel):
    project_cost: float
    annual_energy_output: float
    electricity_price: float
    maintenance_cost: float


class InvestmentResponse(BaseModel):
    annual_revenue: float
    annual_profit: float
    payback_period: float
    recommendation: str