from pydantic import BaseModel, Field


class PlannerSummary(BaseModel):

    recommendedSites: int

    totalForecastMwh: float

    averageSuitability: float

    investmentOpportunities: int


class RecommendedSite(BaseModel):

    site_id: int

    site_name: str

    technology: str

    suitability_category: str

    suitability_score: float

    deployment_status: str


class GenerationForecastItem(BaseModel):

    period: str

    technology: str

    generation_mwh: float


class SuitabilityScoreItem(BaseModel):

    site_id: int

    site_name: str

    score: float


class InvestmentRecommendationItem(BaseModel):

    site_id: int

    site_name: str

    technology: str

    investment_score: float

    recommendation: str

    feasibility_status: str


class PlannerDashboardResponse(BaseModel):

    summary: PlannerSummary

    recommended_sites: list[
        RecommendedSite
    ]

    generation_forecast: list[
        GenerationForecastItem
    ]

    suitability_scores: list[
        SuitabilityScoreItem
    ]

    investment_recommendations: list[
        InvestmentRecommendationItem
    ]