from datetime import datetime
from pydantic import BaseModel, Field


class SiteAlert(BaseModel):
    site_id: int
    alert_type: str
    severity: str = Field(pattern=r"^(info|warning|critical)$")
    title: str
    message: str
    source: str


class AlertEvaluationResponse(BaseModel):
    site_id: int
    evaluated_at: datetime
    alerts_created: int
    alerts: list[SiteAlert]
    status: str
