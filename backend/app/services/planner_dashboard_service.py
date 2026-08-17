from __future__ import annotations

from typing import Any
from sqlalchemy.orm import Session
from app.repositories.planner_dashboard_repository import PlannerDashboardRepository
from app.schemas.planner_dashboard import (
    GenerationForecastItem, InvestmentRecommendationItem,
    PlannerDashboardResponse, PlannerSummary, RecommendedSite,
    SuitabilityScoreItem,
)

class PlannerDashboardService:
    """Fast read-only Planner overview over persisted candidate intelligence."""

    RECOMMENDED_SITE_SCORE = 50.0
    INVESTMENT_OPPORTUNITY_SCORE = 60.0

    def __init__(self, db: Session, **_unused: Any) -> None:
        self.repository = PlannerDashboardRepository(db)

    def get_dashboard(self) -> PlannerDashboardResponse:
        candidates = self.repository.get_candidate_sites()
        recommended_sites = []
        generation_forecast = []
        suitability_scores = []
        investment_recommendations = []

        for candidate in candidates:
            site = candidate.site
            if site is None:
                continue

            site_id = int(candidate.site_id)
            site_name = getattr(site, "name", None) or f"Site {site_id}"
            suitability_score = self._number(candidate.suitability_score)
            technology = str(candidate.recommended_technology or "Unknown")
            snapshot = candidate.analysis_snapshot or {}
            suitability = snapshot.get("suitability") or {}
            investment = snapshot.get("investment") or snapshot.get("investment_recommendation") or {}
            forecast = snapshot.get("forecast") or snapshot.get("energy_forecast") or {}

            category = self._enum_value(
                suitability.get("category") or suitability.get("suitability_category")
            )
            if category == "Unknown":
                category = self._category_from_score(suitability_score)

            suitability_scores.append(SuitabilityScoreItem(
                site_id=site_id, site_name=site_name,
                score=round(suitability_score, 2)
            ))

            status = str(candidate.status or "PENDING_REVIEW")
            deployment_status = {
                "APPROVED": "Approved",
                "REJECTED": "Rejected",
                "PENDING_REVIEW": "Pending PM Review",
            }.get(status, status.replace("_", " ").title())

            if suitability_score >= self.RECOMMENDED_SITE_SCORE and technology.lower() != "unsuitable":
                recommended_sites.append(RecommendedSite(
                    site_id=site_id, site_name=site_name, technology=technology,
                    suitability_category=category,
                    suitability_score=round(suitability_score, 2),
                    deployment_status=deployment_status,
                ))

            annual_generation = self._number(
                forecast.get("annual_generation_mwh")
                or forecast.get("expected_generation_mwh")
                or investment.get("expected_generation_mwh")
            )
            if annual_generation > 0:
                generation_forecast.append(GenerationForecastItem(
                    period=site_name, technology=technology,
                    generation_mwh=round(annual_generation, 2)
                ))

            investment_score = self._number(investment.get("investment_score"))
            investment_recommendation = self._enum_value(investment.get("recommendation"))
            feasibility_status = self._enum_value(investment.get("feasibility_status"))
            if (
                investment_score >= self.INVESTMENT_OPPORTUNITY_SCORE
                and investment_recommendation.lower()
                not in {"do not invest", "not recommended"}
            ):
                investment_recommendations.append(InvestmentRecommendationItem(
                    site_id=site_id, site_name=site_name, technology=technology,
                    investment_score=round(investment_score, 2),
                    recommendation=investment_recommendation,
                    feasibility_status=feasibility_status,
                ))

        return PlannerDashboardResponse(
            summary=PlannerSummary(
                recommendedSites=len(recommended_sites),
                totalForecastMwh=round(sum(x.generation_mwh for x in generation_forecast), 2),
                averageSuitability=round(
                    sum(x.score for x in suitability_scores) / len(suitability_scores)
                    if suitability_scores else 0.0, 2
                ),
                investmentOpportunities=len(investment_recommendations),
            ),
            recommended_sites=recommended_sites,
            generation_forecast=generation_forecast,
            suitability_scores=suitability_scores,
            investment_recommendations=investment_recommendations,
        )

    @staticmethod
    def _number(value: Any) -> float:
        try: return float(value or 0)
        except (TypeError, ValueError): return 0.0

    @staticmethod
    def _enum_value(value: Any) -> str:
        if value is None: return "Unknown"
        if hasattr(value, "value"): return str(value.value)
        return str(value)

    @staticmethod
    def _category_from_score(score: float) -> str:
        if score >= 80: return "Excellent"
        if score >= 65: return "Good"
        if score >= 50: return "Moderate"
        return "Low"
