from pydantic import BaseModel


class ReportRequest(BaseModel):
    latitude: float
    longitude: float


class ReportResponse(BaseModel):
    site_name: str
    solar: dict
    wind: dict
    environment: dict
    forecast: dict
    investment: dict