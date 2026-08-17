from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.repositories.investment_recommendation_repository import (
    InvestmentRecommendationRepository,
)

from app.schemas.investment_recommendation import (
    FinancialMetrics,
    InvestmentRecommendation,
    InvestmentRecommendationResponse,
    InvestmentRisk,
    InvestmentRiskAssessment,
)

from app.services.deployment_optimization_service import (
    DeploymentOptimizationService,
)

from app.services.energy_forecasting_service import (
    EnergyForecastingService,
)


class InvestmentRecommendationService:
    """
    Investment Recommendation Engine.

    Authoritative inputs:

        Deployment Optimization Engine
                    +
        Energy Forecasting Engine
                    +
        Site data

    Produces:

        - Financial feasibility
        - Investment score
        - Risk assessment
        - Investment recommendation
        - Investment priority

    This service does not recreate:
        - site suitability
        - renewable prediction
        - deployment optimization
        - energy forecasting
    """

    # =========================================================
    # DEFAULT FINANCIAL ASSUMPTIONS
    # =========================================================

    DEFAULT_SOLAR_CAPEX_PER_MW = 50_000_000.0
    DEFAULT_WIND_CAPEX_PER_MW = 70_000_000.0

    DEFAULT_SOLAR_OPEX_RATE = 0.02
    DEFAULT_WIND_OPEX_RATE = 0.03
    DEFAULT_HYBRID_OPEX_RATE = 0.025

    # =========================================================
    # INVESTMENT THRESHOLDS
    # =========================================================

    INVESTMENT_THRESHOLD = 75.0
    CONDITIONAL_THRESHOLD = 55.0
    EVALUATION_THRESHOLD = 40.0

    # =========================================================
    # INITIALIZATION
    # =========================================================

    def __init__(
        self,
        db: Session,
        deployment_optimization_service: DeploymentOptimizationService,
        energy_forecasting_service: EnergyForecastingService,
    ) -> None:

        self.repository = (
            InvestmentRecommendationRepository(db)
        )

        self.deployment_optimization_service = (
            deployment_optimization_service
        )

        self.energy_forecasting_service = (
            energy_forecasting_service
        )

    # =========================================================
    # MAIN EVALUATION
    # =========================================================

    def evaluate_investment(
        self,
        site_id: int,
    ) -> InvestmentRecommendationResponse:

        site = self.repository.get_site(site_id)

        if site is None:
            raise ValueError(
                f"Site {site_id} not found."
            )

        # =====================================================
        # 1. DEPLOYMENT OPTIMIZATION
        # =====================================================

        deployment = (
            self.deployment_optimization_service.optimize_site(
                site_id=site_id,
            )
        )

        deployment_data = self._model_dump(
            deployment
        )

        # =====================================================
        # 2. ENERGY FORECASTING
        # =====================================================

        forecast = (
            self.energy_forecasting_service.forecast(
                site_id=site_id,
            )
        )

        forecast_data = self._model_dump(
            forecast
        )

        # =====================================================
        # 3. EXTRACT DEPLOYMENT DATA
        # =====================================================

        capacity_plan = (
            deployment_data.get(
                "capacity_plan",
                {},
            )
            or {}
        )

        technology = self._normalize_technology(
            deployment_data.get(
                "technology",
                "Unsuitable",
            )
        )

        capacity_mw = self._normalize(
            capacity_plan.get(
                "recommended_capacity_mw",
                0.0,
            )
        )

        solar_capacity_mw = self._normalize(
            capacity_plan.get(
                "solar_capacity_mw",
                0.0,
            )
        )

        wind_capacity_mw = self._normalize(
            capacity_plan.get(
                "wind_capacity_mw",
                0.0,
            )
        )

        overall_site_score = self._normalize(
            deployment_data.get(
                "optimization_score",
                0.0,
            )
        )

        # =====================================================
        # 4. RESOURCE SCORES
        #
        # Deployment Optimization currently exposes the
        # overall deployment score but not necessarily the
        # individual solar/wind scores.
        #
        # Use individual scores when available.
        # Otherwise use the deployment score as the canonical
        # fallback instead of treating missing scores as zero.
        # =====================================================

        solar_score = self._normalize(
            deployment_data.get(
                "solar_score"
            )
        )

        wind_score = self._normalize(
            deployment_data.get(
                "wind_score"
            )
        )

        if solar_score <= 0:
            solar_score = overall_site_score

        if wind_score <= 0:
            wind_score = overall_site_score

        # =====================================================
        # 5. ENERGY FORECAST DATA
        # =====================================================

        annual_generation = self._normalize(
            forecast_data.get(
                "annual_generation_mwh",
                0.0,
            )
        )

        revenue_forecast = (
            forecast_data.get(
                "revenue_forecast",
                {},
            )
            or {}
        )

        annual_revenue = self._normalize(
            revenue_forecast.get(
                "estimated_annual_revenue",
                0.0,
            )
        )

        # =====================================================
        # 6. BUILD CANONICAL INTELLIGENCE
        # =====================================================

        intelligence: dict[str, Any] = {

            "recommended_technology": technology,

            "capacity_mw": capacity_mw,

            "solar_capacity_mw": solar_capacity_mw,

            "wind_capacity_mw": wind_capacity_mw,

            "overall_deployment_score": (
                overall_site_score
            ),

            "solar_score": solar_score,

            "wind_score": wind_score,

            "annual_generation_mwh": (
                annual_generation
            ),

            "annual_revenue": annual_revenue,
        }

        # =====================================================
        # 7. SAFETY NORMALIZATION
        #
        # Hybrid deployment must have component capacity.
        # If upstream service returns only total capacity,
        # split it according to resource scores.
        # =====================================================

        if technology == "Hybrid Solar-Wind":

            if capacity_mw > 0:

                component_total = (
                    solar_capacity_mw
                    + wind_capacity_mw
                )

                if component_total <= 0:

                    score_total = (
                        solar_score
                        + wind_score
                    )

                    if score_total > 0:

                        solar_capacity_mw = (
                            capacity_mw
                            * solar_score
                            / score_total
                        )

                        wind_capacity_mw = (
                            capacity_mw
                            * wind_score
                            / score_total
                        )

                    else:

                        solar_capacity_mw = (
                            capacity_mw / 2.0
                        )

                        wind_capacity_mw = (
                            capacity_mw / 2.0
                        )

                elif abs(
                    component_total - capacity_mw
                ) > 0.01:

                    scale = (
                        capacity_mw
                        / component_total
                    )

                    solar_capacity_mw *= scale
                    wind_capacity_mw *= scale

        elif technology == "Solar":

            solar_capacity_mw = capacity_mw
            wind_capacity_mw = 0.0

        elif technology == "Wind":

            wind_capacity_mw = capacity_mw
            solar_capacity_mw = 0.0

        # =====================================================
        # 8. FINANCIAL CALCULATIONS
        # =====================================================

        capex = self._calculate_capex(
            technology=technology,
            capacity_mw=capacity_mw,
            solar_capacity_mw=solar_capacity_mw,
            wind_capacity_mw=wind_capacity_mw,
            intelligence=intelligence,
        )

        annual_opex = self._calculate_opex(
            technology=technology,
            capex=capex,
            intelligence=intelligence,
        )

        annual_net_cash_flow = max(
            0.0,
            annual_revenue - annual_opex,
        )

        roi = self._calculate_roi(
            annual_net_cash_flow=annual_net_cash_flow,
            capex=capex,
        )

        payback_period = (
            self._calculate_payback_period(
                capex=capex,
                annual_net_cash_flow=(
                    annual_net_cash_flow
                ),
            )
        )

        financial_metrics = FinancialMetrics(
            capex=round(
                capex,
                2,
            ),

            annual_opex=round(
                annual_opex,
                2,
            ),

            annual_revenue=round(
                annual_revenue,
                2,
            ),

            annual_net_cash_flow=round(
                annual_net_cash_flow,
                2,
            ),

            roi_percentage=round(
                roi,
                2,
            ),

            payback_period_years=(
                payback_period
            ),
        )

        # =====================================================
        # 9. RISK ASSESSMENT
        # =====================================================

        financial_risk_score = (
            self._calculate_financial_risk(
                roi=roi,
                payback_period=payback_period,
            )
        )

        site_risk_score = (
            self._calculate_site_risk(
                overall_site_score
            )
        )

        resource_risk_score = (
            self._calculate_resource_risk(
                solar_score=solar_score,
                wind_score=wind_score,
                technology=technology,
            )
        )

        overall_risk_score = (
            financial_risk_score * 0.40
            + site_risk_score * 0.35
            + resource_risk_score * 0.25
        )

        risk = self._get_risk_level(
            overall_risk_score
        )

        risk_assessment = InvestmentRiskAssessment(
            overall_risk=risk,

            financial_risk_score=round(
                financial_risk_score,
                2,
            ),

            site_risk_score=round(
                site_risk_score,
                2,
            ),

            resource_risk_score=round(
                resource_risk_score,
                2,
            ),

            explanation=(
                self._generate_risk_explanation(
                    risk
                )
            ),
        )

        # =====================================================
        # 10. INVESTMENT SCORE
        # =====================================================

        investment_score = (
            self._calculate_investment_score(
                roi=roi,
                site_score=overall_site_score,
                risk_score=overall_risk_score,
            )
        )

        # =====================================================
        # 11. RECOMMENDATION
        # =====================================================

        recommendation = (
            self._generate_recommendation(
                investment_score=investment_score,
                risk=risk,
            )
        )

        # =====================================================
        # 12. FEASIBILITY
        # =====================================================

        feasibility_status = (
            self._get_feasibility_status(
                investment_score
            )
        )

        # =====================================================
        # 13. PRIORITY
        # =====================================================

        priority = (
            self._get_investment_priority(
                investment_score
            )
        )

        # =====================================================
        # 14. STRENGTHS / CONCERNS
        # =====================================================

        strengths = (
            self._identify_strengths(
                roi=roi,
                site_score=overall_site_score,
                annual_revenue=annual_revenue,
            )
        )

        concerns = (
            self._identify_concerns(
                roi=roi,
                payback_period=payback_period,
                risk=risk,
            )
        )

        # =====================================================
        # 15. RECOMMENDATION REASON
        # =====================================================

        reason = (
            self._generate_recommendation_reason(
                recommendation=recommendation,
                investment_score=investment_score,
                roi=roi,
                payback_period=payback_period,
                risk=risk,
            )
        )

        # =====================================================
        # 16. ASSUMPTIONS
        # =====================================================

        assumptions = (
            self._build_assumptions(
                intelligence=intelligence
            )
        )

        # =====================================================
        # 17. FINAL RESPONSE
        # =====================================================

        return InvestmentRecommendationResponse(

            site_id=site_id,

            recommendation=recommendation,

            investment_score=round(
                investment_score,
                2,
            ),

            financial_metrics=(
                financial_metrics
            ),

            risk_assessment=(
                risk_assessment
            ),

            feasibility_status=(
                feasibility_status
            ),

            investment_priority=priority,

            expected_generation_mwh=round(
                annual_generation,
                2,
            ),

            expected_annual_revenue=round(
                annual_revenue,
                2,
            ),

            recommendation_reason=reason,

            strengths=strengths,

            concerns=concerns,

            assumptions=assumptions,
        )

    # =========================================================
    # TECHNOLOGY
    # =========================================================

    @staticmethod
    def _normalize_technology(
        technology: Any,
    ) -> str:

        if technology is None:
            return "Unsuitable"

        if hasattr(
            technology,
            "value",
        ):
            technology = technology.value

        value = str(
            technology
        ).strip()

        normalized = value.lower()

        aliases = {
            "solar": "Solar",
            "wind": "Wind",
            "hybrid": "Hybrid Solar-Wind",
            "hybrid solar-wind": "Hybrid Solar-Wind",
            "hybrid solar wind": "Hybrid Solar-Wind",
            "solar-wind": "Hybrid Solar-Wind",
            "solar wind": "Hybrid Solar-Wind",
            "unsuitable": "Unsuitable",
        }

        return aliases.get(
            normalized,
            value,
        )

    # =========================================================
    # CAPEX
    # =========================================================

    def _calculate_capex(
        self,
        technology: str,
        capacity_mw: float,
        solar_capacity_mw: float,
        wind_capacity_mw: float,
        intelligence: dict[str, Any],
    ) -> float:

        solar_capex = (
            self._get_configured_value(
                intelligence,
                "solar_capex_per_mw",
                self.DEFAULT_SOLAR_CAPEX_PER_MW,
            )
        )

        wind_capex = (
            self._get_configured_value(
                intelligence,
                "wind_capex_per_mw",
                self.DEFAULT_WIND_CAPEX_PER_MW,
            )
        )

        if technology == "Solar":

            return max(
                0.0,
                capacity_mw,
            ) * solar_capex

        if technology == "Wind":

            return max(
                0.0,
                capacity_mw,
            ) * wind_capex

        if technology == "Hybrid Solar-Wind":

            return (
                max(
                    0.0,
                    solar_capacity_mw,
                )
                * solar_capex
                +
                max(
                    0.0,
                    wind_capacity_mw,
                )
                * wind_capex
            )

        return 0.0

    # =========================================================
    # OPEX
    # =========================================================

    def _calculate_opex(
        self,
        technology: str,
        capex: float,
        intelligence: dict[str, Any],
    ) -> float:

        if capex <= 0:
            return 0.0

        if technology == "Solar":

            rate = (
                self._get_configured_value(
                    intelligence,
                    "solar_opex_rate",
                    self.DEFAULT_SOLAR_OPEX_RATE,
                )
            )

        elif technology == "Wind":

            rate = (
                self._get_configured_value(
                    intelligence,
                    "wind_opex_rate",
                    self.DEFAULT_WIND_OPEX_RATE,
                )
            )

        elif technology == "Hybrid Solar-Wind":

            rate = (
                self._get_configured_value(
                    intelligence,
                    "hybrid_opex_rate",
                    self.DEFAULT_HYBRID_OPEX_RATE,
                )
            )

        else:

            rate = 0.0

        return capex * rate

    # =========================================================
    # ROI
    # =========================================================

    @staticmethod
    def _calculate_roi(
        annual_net_cash_flow: float,
        capex: float,
    ) -> float:

        if capex <= 0:
            return 0.0

        return (
            annual_net_cash_flow
            / capex
        ) * 100.0

    # =========================================================
    # PAYBACK
    # =========================================================

    @staticmethod
    def _calculate_payback_period(
        capex: float,
        annual_net_cash_flow: float,
    ) -> float | None:

        if capex <= 0:
            return None

        if annual_net_cash_flow <= 0:
            return None

        return round(
            capex
            / annual_net_cash_flow,
            2,
        )

    # =========================================================
    # FINANCIAL RISK
    # =========================================================

    @staticmethod
    def _calculate_financial_risk(
        roi: float,
        payback_period: float | None,
    ) -> float:
        """
        Calculate financial risk from ROI and payback period.

        Lower score = lower financial risk.
        Higher score = higher financial risk.
        """

        if roi >= 20:
            roi_risk = 0.0

        elif roi >= 15:
            roi_risk = 10.0

        elif roi >= 10:
            roi_risk = 25.0

        elif roi >= 5:
            roi_risk = 50.0

        else:
            roi_risk = 80.0

        if payback_period is None:
            payback_risk = 80.0

        elif payback_period <= 5:
            payback_risk = 0.0

        elif payback_period <= 7:
            payback_risk = 10.0

        elif payback_period <= 10:
            payback_risk = 25.0

        elif payback_period <= 15:
            payback_risk = 50.0

        else:
            payback_risk = 80.0

        return round(
            min(
                100.0,
                (
                    roi_risk * 0.60
                    + payback_risk * 0.40
                ),
            ),
            2,
        )


    # =========================================================
    # SITE RISK
    # =========================================================

    @staticmethod
    def _calculate_site_risk(
        site_score: float,
    ) -> float:
        """
        Convert site suitability score into risk.

        Suitability:
            80-100 -> very low risk
            65-79  -> low risk
            50-64  -> moderate risk
            35-49  -> high risk
            <35    -> very high risk
        """

        score = max(
            0.0,
            min(
                100.0,
                float(site_score),
            ),
        )

        if score >= 80:
            return 10.0

        if score >= 65:
            return 25.0

        if score >= 50:
            return 45.0

        if score >= 35:
            return 70.0

        return 90.0


    # =========================================================
    # RESOURCE RISK
    # =========================================================

    @staticmethod
    def _calculate_resource_risk(
        solar_score: float,
        wind_score: float,
        technology: str,
    ) -> float:
        """
        Calculate renewable resource risk.

        Uses the resource score relevant to the selected
        technology rather than treating missing values as zero.
        """

        solar_score = max(
            0.0,
            min(
                100.0,
                float(solar_score),
            ),
        )

        wind_score = max(
            0.0,
            min(
                100.0,
                float(wind_score),
            ),
        )

        if technology == "Solar":

            resource_score = solar_score

        elif technology == "Wind":

            resource_score = wind_score

        elif technology == "Hybrid Solar-Wind":

            resource_score = (
                solar_score
                + wind_score
            ) / 2.0

        else:

            return 90.0

        # Convert resource suitability into risk.

        if resource_score >= 80:
            return 10.0

        if resource_score >= 65:
            return 25.0

        if resource_score >= 50:
            return 45.0

        if resource_score >= 35:
            return 70.0

        return 90.0

    # =========================================================
    # RISK LEVEL
    # =========================================================

    @staticmethod
    def _get_risk_level(
        risk_score: float,
    ) -> InvestmentRisk:
        """
        Classify overall investment risk.

        0-34.99   -> Low
        35-64.99  -> Medium
        65-100    -> High
        """

        score = max(
            0.0,
            min(
                100.0,
                float(risk_score),
            ),
        )

        if score < 35.0:
            return InvestmentRisk.LOW

        if score < 65.0:
            return InvestmentRisk.MEDIUM

        return InvestmentRisk.HIGH

    # =========================================================
    # RISK EXPLANATION
    # =========================================================

    @staticmethod
    def _generate_risk_explanation(
        risk: InvestmentRisk,
    ) -> str:

        if risk == InvestmentRisk.LOW:

            return (
                "The site presents relatively low investment "
                "risk based on the current financial, site "
                "suitability and renewable resource indicators."
            )

        if risk == InvestmentRisk.MEDIUM:

            return (
                "The site presents moderate investment risk. "
                "Further financial, environmental and deployment "
                "validation is recommended before investment approval."
            )

        if risk == InvestmentRisk.HIGH:

            return (
                "The site presents high investment risk. "
                "Additional feasibility analysis and risk mitigation "
                "should be completed before investment."
            )

        return (
            "Investment risk could not be classified reliably "
            "from the available assessment indicators."
        )

    # =========================================================
    # INVESTMENT SCORE
    # =========================================================

    @staticmethod
    def _calculate_investment_score(
        roi: float,
        site_score: float,
        risk_score: float,
    ) -> float:

        roi_score = min(
            100.0,
            max(
                0.0,
                roi * 5.0,
            ),
        )

        risk_adjusted_score = (
            100.0 - risk_score
        )

        score = (
            roi_score * 0.40
            + site_score * 0.35
            + risk_adjusted_score * 0.25
        )

        return max(
            0.0,
            min(
                100.0,
                round(
                    score,
                    2,
                ),
            ),
        )

    # =========================================================
    # RECOMMENDATION
    # =========================================================

    @staticmethod
    def _generate_recommendation(
        investment_score: float,
        risk: InvestmentRisk,
    ) -> InvestmentRecommendation:

        if (
            investment_score >= 75.0
            and risk == InvestmentRisk.LOW
        ):

            return InvestmentRecommendation.INVEST

        if (
            investment_score >= 55.0
            and risk != InvestmentRisk.HIGH
        ):

            return (
                InvestmentRecommendation
                .INVEST_WITH_CONDITIONS
            )

        if investment_score >= 40.0:

            return (
                InvestmentRecommendation
                .FURTHER_EVALUATION
            )

        return (
            InvestmentRecommendation
            .DO_NOT_INVEST
        )

    # =========================================================
    # FEASIBILITY
    # =========================================================

    @staticmethod
    def _get_feasibility_status(
        investment_score: float,
    ) -> str:

        if investment_score >= 75:

            return "Financially Attractive"

        if investment_score >= 55:

            return "Potentially Feasible"

        if investment_score >= 40:

            return "Requires Further Evaluation"

        return "Not Currently Feasible"

    # =========================================================
    # PRIORITY
    # =========================================================

    @staticmethod
    def _get_investment_priority(
        investment_score: float,
    ) -> str:

        if investment_score >= 85:

            return "High"

        if investment_score >= 70:

            return "Medium"

        return "Low"

    # =========================================================
    # STRENGTHS
    # =========================================================

    @staticmethod
    def _identify_strengths(
        roi: float,
        site_score: float,
        annual_revenue: float,
    ) -> list[str]:

        strengths: list[str] = []

        if roi >= 15:

            strengths.append(
                "Attractive estimated return on investment."
            )

        if site_score >= 70:

            strengths.append(
                "Strong overall site deployment suitability."
            )

        if annual_revenue > 0:

            strengths.append(
                "Renewable generation provides an "
                "estimated annual revenue stream."
            )

        return strengths

    # =========================================================
    # CONCERNS
    # =========================================================

    @staticmethod
    def _identify_concerns(
        roi: float,
        payback_period: float | None,
        risk: InvestmentRisk,
    ) -> list[str]:

        concerns: list[str] = []

        if roi < 10:

            concerns.append(
                "Estimated ROI is relatively low."
            )

        if (
            payback_period is not None
            and payback_period > 10
        ):

            concerns.append(
                "Estimated payback period is relatively long."
            )

        if risk == InvestmentRisk.HIGH:

            concerns.append(
                "Overall investment risk is high."
            )

        return concerns

    # =========================================================
    # RECOMMENDATION REASON
    # =========================================================

    @staticmethod
    def _generate_recommendation_reason(
        recommendation: InvestmentRecommendation,
        investment_score: float,
        roi: float,
        payback_period: float | None,
        risk: InvestmentRisk,
    ) -> str:

        payback_text = (
            f"{payback_period:.2f} years"
            if payback_period is not None
            else "undefined"
        )

        if recommendation == (
            InvestmentRecommendation.INVEST
        ):

            return (
                "The project is recommended for investment "
                "because its combined financial, site and "
                "resource assessment is favorable. "
                f"Estimated ROI is {roi:.2f}% with an "
                f"estimated payback period of "
                f"{payback_text}. "
                f"Overall risk is {risk.value}."
            )

        if recommendation == (
            InvestmentRecommendation.INVEST_WITH_CONDITIONS
        ):

            return (
                "Investment may be appropriate subject to "
                "additional financial and project validation. "
                f"The investment score is "
                f"{investment_score:.2f} and overall risk is "
                f"{risk.value}."
            )

        if recommendation == (
            InvestmentRecommendation.FURTHER_EVALUATION
        ):

            return (
                "The project requires further feasibility "
                "and financial evaluation before an "
                "investment decision is made. "
                f"The investment score is "
                f"{investment_score:.2f} and overall risk is "
                f"{risk.value}."
            )

        return (
            "The current assessment does not support "
            "investment without substantial improvement "
            "or additional evidence."
        )

    # =========================================================
    # ASSUMPTIONS
    # =========================================================

    def _build_assumptions(
        self,
        intelligence: dict[str, Any],
    ) -> list[str]:

        assumptions: list[str] = []

        assumptions.append(
            "Deployment capacity and technology were obtained "
            "from the Deployment Optimization Engine."
        )

        assumptions.append(
            "Annual generation and revenue were obtained "
            "from the Energy Forecasting Engine."
        )

        if (
            "solar_capex_per_mw"
            not in intelligence
        ):

            assumptions.append(
                "Default solar CAPEX of "
                "INR 50,000,000 per MW was used."
            )

        if (
            "wind_capex_per_mw"
            not in intelligence
        ):

            assumptions.append(
                "Default wind CAPEX of "
                "INR 70,000,000 per MW was used."
            )

        if (
            "solar_opex_rate"
            not in intelligence
        ):

            assumptions.append(
                "Default solar OPEX rate of "
                "2.0% of CAPEX was used."
            )

        if (
            "wind_opex_rate"
            not in intelligence
        ):

            assumptions.append(
                "Default wind OPEX rate of "
                "3.0% of CAPEX was used."
            )

        if (
            "hybrid_opex_rate"
            not in intelligence
        ):

            assumptions.append(
                "Default hybrid OPEX rate of "
                "2.5% of CAPEX was used."
            )

        assumptions.append(
            "Investment thresholds and risk classification "
            "are implementation assumptions and are not "
            "defined by the internship specification."
        )

        return assumptions

    # =========================================================
    # CONFIGURATION
    # =========================================================

    @staticmethod
    def _get_configured_value(
        intelligence: dict[str, Any],
        key: str,
        default: float,
    ) -> float:

        value = intelligence.get(
            key,
            default,
        )

        if value is None:

            return float(default)

        try:

            value = float(value)

        except (
            TypeError,
            ValueError,
        ):

            return float(default)

        if value < 0:

            return float(default)

        return value

    # =========================================================
    # NORMALIZATION
    # =========================================================

    @staticmethod
    def _normalize(
        value: Any,
    ) -> float:

        if value is None:

            return 0.0

        try:

            value = float(value)

        except (
            TypeError,
            ValueError,
        ):

            return 0.0

        if value < 0:

            return 0.0

        return value

    # =========================================================
    # PYDANTIC / OBJECT CONVERSION
    # =========================================================

    @staticmethod
    def _model_dump(
        value: Any,
    ) -> dict[str, Any]:

        if value is None:

            return {}

        if hasattr(
            value,
            "model_dump",
        ):

            return value.model_dump()

        if isinstance(
            value,
            dict,
        ):

            return value

        if hasattr(
            value,
            "dict",
        ):

            return value.dict()

        raise TypeError(
            "Expected a Pydantic model or dictionary, "
            f"got {type(value).__name__}."
        )