from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.repositories.project_manager_dashboard_repository import (
    ProjectManagerDashboardRepository,
)
from app.schemas.project_manager_dashboard import (
    ExecutiveSummary,
    FinancialAnalytics,
    ProjectManagerDashboardResponse,
    ProjectOverview,
    RiskAssessment,
)


class ProjectManagerDashboardService:
    """
    Fast, read-only Project Manager dashboard.

    The dashboard MUST NOT run the expensive intelligence pipeline for
    every site on every request.

    Candidate intelligence is generated during candidate creation/backfill
    and persisted in CandidateSite.analysis_snapshot. This service only
    aggregates those stored snapshots.
    """

    RECOMMENDED_SITE_SCORE = 50.0
    INVESTMENT_OPPORTUNITY_SCORE = 60.0

    def __init__(self, db: Session, **_unused: Any) -> None:
        self.repository = ProjectManagerDashboardRepository(db)

    def get_dashboard(self) -> ProjectManagerDashboardResponse:
        projects = self.repository.get_projects()
        sites = self.repository.get_sites()
        candidates = self.repository.get_approved_candidates()

        total_projects = len(projects)
        active_projects = sum(
            1 for project in projects if self._is_active_project(project)
        )
        total_sites = len(sites)

        recommended_sites = 0
        total_capacity_mw = 0.0
        total_generation_mwh = 0.0

        total_capex = 0.0
        total_annual_opex = 0.0
        total_annual_revenue = 0.0
        total_net_cash_flow = 0.0

        roi_values: list[float] = []
        payback_values: list[float] = []

        low_risk_projects = 0
        medium_risk_projects = 0
        high_risk_projects = 0
        risk_scores: list[float] = []

        for candidate in candidates:
            site = candidate.site
            if site is None:
                continue

            snapshot = candidate.analysis_snapshot or {}
            investment = (
                snapshot.get("investment")
                or snapshot.get("investment_recommendation")
                or {}
            )
            forecast = (
                snapshot.get("forecast")
                or snapshot.get("energy_forecast")
                or {}
            )

            # -------------------------------------------------
            # IMPORTANT:
            # Do not call DeploymentOptimizationService,
            # InvestmentRecommendationService, or
            # EnergyForecastingService here.
            #
            # Everything below comes from the persisted snapshot.
            # -------------------------------------------------

            technology = str(
                candidate.recommended_technology or "Unknown"
            )

            suitability_score = self._number(
                candidate.suitability_score
            )

            recommendation = self._enum_value(
                investment.get("recommendation")
            )

            if (
                suitability_score >= self.RECOMMENDED_SITE_SCORE
                and technology.lower() != "unsuitable"
                and recommendation.lower()
                not in {"do not invest", "not recommended"}
            ):
                recommended_sites += 1

            annual_generation = self._number(
                forecast.get("annual_generation_mwh")
                or forecast.get("expected_generation_mwh")
                or investment.get("expected_generation_mwh")
            )
            total_generation_mwh += annual_generation

            financial = investment.get("financial_metrics") or {}

            total_capex += self._number(financial.get("capex"))
            total_annual_opex += self._number(
                financial.get("annual_opex")
            )
            total_annual_revenue += self._number(
                financial.get("annual_revenue")
            )
            total_net_cash_flow += self._number(
                financial.get("annual_net_cash_flow")
            )

            roi = self._number(financial.get("roi_percentage"))
            if roi > 0:
                roi_values.append(roi)

            payback = financial.get("payback_period_years")
            if payback is not None:
                payback_value = self._number(payback)
                if payback_value > 0:
                    payback_values.append(payback_value)

            risk = investment.get("risk_assessment") or {}

            risk_level = self._enum_value(
                risk.get("overall_risk")
            )

            if risk_level == "Low":
                low_risk_projects += 1
            elif risk_level == "High":
                high_risk_projects += 1
            else:
                medium_risk_projects += 1

            financial_risk = self._number(
                risk.get("financial_risk_score")
            )
            site_risk = self._number(
                risk.get("site_risk_score")
            )
            resource_risk = self._number(
                risk.get("resource_risk_score")
            )

            risk_scores.append(
                financial_risk * 0.40
                + site_risk * 0.35
                + resource_risk * 0.25
            )

            # Capacity was not part of the historical CandidateSite
            # snapshot contract. Use it only if a future snapshot
            # explicitly contains it; never recalculate deployment here.
            total_capacity_mw += self._number(
                snapshot.get("deployment", {}).get(
                    "capacity_mw"
                )
                or snapshot.get("deployment", {}).get(
                    "recommended_capacity_mw"
                )
                or investment.get("capacity_mw")
            )

        average_roi = (
            sum(roi_values) / len(roi_values)
            if roi_values
            else 0.0
        )

        average_payback = (
            sum(payback_values) / len(payback_values)
            if payback_values
            else None
        )

        portfolio_risk_score = (
            sum(risk_scores) / len(risk_scores)
            if risk_scores
            else 0.0
        )

        overall_risk = self._get_overall_risk(
            portfolio_risk_score
        )

        project_overview = ProjectOverview(
            total_projects=total_projects,
            active_projects=active_projects,
            total_sites=total_sites,
            recommended_sites=recommended_sites,
            total_capacity_mw=round(total_capacity_mw, 2),
            total_generation_mwh=round(total_generation_mwh, 2),
        )

        financial_analytics = FinancialAnalytics(
            total_capex=round(total_capex, 2),
            total_annual_opex=round(total_annual_opex, 2),
            total_annual_revenue=round(total_annual_revenue, 2),
            total_net_cash_flow=round(total_net_cash_flow, 2),
            average_roi_percentage=round(average_roi, 2),
            average_payback_period_years=(
                round(average_payback, 2)
                if average_payback is not None
                else None
            ),
        )

        risk_assessment = RiskAssessment(
            overall_risk=overall_risk,
            low_risk_projects=low_risk_projects,
            medium_risk_projects=medium_risk_projects,
            high_risk_projects=high_risk_projects,
            risk_score=round(portfolio_risk_score, 2),
            risk_summary=self._build_risk_summary(
                overall_risk=overall_risk,
                high_risk_projects=high_risk_projects,
            ),
        )

        strengths: list[str] = []
        concerns: list[str] = []
        actions: list[str] = []

        if recommended_sites > 0:
            strengths.append(
                f"{recommended_sites} site(s) currently meet "
                "the stored investment criteria."
            )

        if total_generation_mwh > 0:
            strengths.append(
                "The portfolio has stored renewable energy "
                "generation potential."
            )

        if average_roi >= 15:
            strengths.append(
                "Portfolio-level estimated ROI is financially attractive."
            )

        if high_risk_projects > 0:
            concerns.append(
                f"{high_risk_projects} site(s) currently have high "
                "investment risk."
            )
            actions.append(
                "Review high-risk sites before investment approval."
            )

        if recommended_sites < len(candidates):
            concerns.append(
                "Not all approved candidate sites currently meet "
                "the preferred investment criteria."
            )
            actions.append(
                "Prioritize additional feasibility analysis for "
                "lower-performing sites."
            )

        if average_roi < 10 and roi_values:
            concerns.append(
                "Portfolio-level estimated ROI requires improvement."
            )
            actions.append(
                "Review project economics, CAPEX, OPEX and "
                "revenue assumptions."
            )

        if not actions:
            actions.append(
                "Continue detailed feasibility validation before "
                "final deployment decisions."
            )

        executive_summary = ExecutiveSummary(
            headline=(
                f"{recommended_sites} site(s) are currently recommended "
                f"for deployment, with an estimated annual generation "
                f"of {total_generation_mwh:.2f} MWh. Average estimated "
                f"ROI is {average_roi:.2f}%, while overall portfolio "
                f"risk is {overall_risk}."
            ),
            key_strengths=strengths,
            key_concerns=concerns,
            recommended_actions=actions,
        )

        return ProjectManagerDashboardResponse(
            project_overview=project_overview,
            financial_analytics=financial_analytics,
            risk_assessment=risk_assessment,
            executive_summary=executive_summary,
        )

    @staticmethod
    def _number(value: Any) -> float:
        try:
            return float(value or 0)
        except (TypeError, ValueError):
            return 0.0

    @staticmethod
    def _enum_value(value: Any) -> str:
        if value is None:
            return "Unknown"
        if hasattr(value, "value"):
            return str(value.value)
        return str(value)

    @staticmethod
    def _is_active_project(project) -> bool:
        value = getattr(project, "status", None)

        if value is None:
            return True

        if hasattr(value, "value"):
            value = value.value

        return str(value).lower() in {
            "active",
            "in progress",
            "ongoing",
        }

    @staticmethod
    def _get_overall_risk(risk_score: float) -> str:
        if risk_score <= 35:
            return "Low"
        if risk_score <= 65:
            return "Medium"
        return "High"

    @staticmethod
    def _build_risk_summary(
        overall_risk: str,
        high_risk_projects: int,
    ) -> str:
        if overall_risk == "Low":
            return (
                "Overall portfolio risk is currently low based on "
                "the available stored investment risk indicators."
            )

        if overall_risk == "Medium":
            return (
                "Overall portfolio risk is moderate and requires "
                "continued monitoring."
            )

        return (
            f"Overall portfolio risk is high, with "
            f"{high_risk_projects} high-risk site(s) requiring "
            "additional review."
        )
