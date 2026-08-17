from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class InvestmentRecommendation(str, Enum):
    INVEST = "Invest"
    INVEST_WITH_CONDITIONS = "Invest with Conditions"
    FURTHER_EVALUATION = "Further Evaluation Required"
    DO_NOT_INVEST = "Do Not Invest"


class InvestmentRisk(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class FinancialMetrics(BaseModel):
    capex: float = Field(..., ge=0)
    annual_opex: float = Field(..., ge=0)

    annual_revenue: float = Field(..., ge=0)

    annual_net_cash_flow: float = Field(
        ...,
        ge=0,
    )

    roi_percentage: float = Field(
        ...,
        ge=0,
    )

    payback_period_years: Optional[float] = Field(
        default=None,
        ge=0,
    )


class InvestmentRiskAssessment(BaseModel):
    overall_risk: InvestmentRisk

    financial_risk_score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    site_risk_score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    resource_risk_score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    explanation: str


class InvestmentRecommendationResponse(BaseModel):
    site_id: int

    recommendation: InvestmentRecommendation

    investment_score: float = Field(
        ...,
        ge=0,
        le=100,
    )

    financial_metrics: FinancialMetrics

    risk_assessment: InvestmentRiskAssessment

    feasibility_status: str

    investment_priority: str

    expected_generation_mwh: float = Field(
        ...,
        ge=0,
    )

    expected_annual_revenue: float = Field(
        ...,
        ge=0,
    )

    recommendation_reason: str

    strengths: list[str]

    concerns: list[str]

    assumptions: list[str]