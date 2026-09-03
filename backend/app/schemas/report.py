from datetime import datetime

from pydantic import BaseModel


class ReportSummary(BaseModel):
    id: int
    project_id: int
    project_name: str
    report_type: str
    file_name: str
    created_at: datetime


class DashboardMetric(BaseModel):
    total_projects: int
    average_site_score: float
    solar_capacity: float
    wind_capacity: float
    latest_projects: list[dict]
    recent_reports: list[dict]
