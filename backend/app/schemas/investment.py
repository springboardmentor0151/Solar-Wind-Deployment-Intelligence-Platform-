from pydantic import BaseModel


class InvestmentRequest(BaseModel):
    latitude: float
    longitude: float


class InvestmentResponse(BaseModel):
    investment_score: int
    roi: float
    payback_period: float
    risk: str
    recommendation: str