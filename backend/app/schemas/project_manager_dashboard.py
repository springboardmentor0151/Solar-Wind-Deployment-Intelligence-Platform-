from pydantic import BaseModel, Field


class ProjectOverview(BaseModel):

    total_projects: int

    active_projects: int

    total_sites: int

    recommended_sites: int

    total_capacity_mw: float

    total_generation_mwh: float


class FinancialAnalytics(BaseModel):

    total_capex: float

    total_annual_opex: float

    total_annual_revenue: float

    total_net_cash_flow: float

    average_roi_percentage: float

    average_payback_period_years: float | None


class RiskAssessment(BaseModel):

    overall_risk: str

    low_risk_projects: int

    medium_risk_projects: int

    high_risk_projects: int

    risk_score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    risk_summary: str


class ExecutiveSummary(BaseModel):

    headline: str

    key_strengths: list[str]

    key_concerns: list[str]

    recommended_actions: list[str]


class ProjectManagerDashboardResponse(BaseModel):

    project_overview: ProjectOverview

    financial_analytics: FinancialAnalytics

    risk_assessment: RiskAssessment

    executive_summary: ExecutiveSummary