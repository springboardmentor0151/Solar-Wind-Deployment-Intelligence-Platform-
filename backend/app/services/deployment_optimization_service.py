from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.deployment_optimization_repository import (
    DeploymentOptimizationRepository,
)

from app.schemas.deployment_optimization import (
    CapacityPlan,
    DeploymentOptimizationResponse,
    DeploymentTechnology,
    ExpansionPlan,
    LocationRecommendation,
)

from app.services.site_suitability_service import (
    SiteSuitabilityService,
)

from app.services.renewable_recommendation_service import (
    RenewableRecommendationService,
)


class DeploymentOptimizationService:
    """
    Deployment Optimization Engine.

    Complete flow:

        Site
          ↓
        SiteSuitabilityService
          ↓
        RenewableRecommendationService
          ↓
        DeploymentOptimizationService
          ↓
        Deployment plan

    This service does NOT ask the client to provide suitability
    or renewable recommendation JSON.

    It consumes the existing intelligence services directly.
    """

    MINIMUM_DEPLOYMENT_SCORE = 50.0

    MAX_SINGLE_TECH_CAPACITY_MW = 100.0
    MAX_HYBRID_CAPACITY_MW = 150.0

    def __init__(
        self,
        db: Session,
        suitability_service: SiteSuitabilityService,
        recommendation_service: RenewableRecommendationService,
    ) -> None:

        self.repository = (
            DeploymentOptimizationRepository(db)
        )

        self.suitability_service = (
            suitability_service
        )

        self.recommendation_service = (
            recommendation_service
        )

    # =========================================================
    # MAIN OPTIMIZATION
    # =========================================================

    def optimize_site(
        self,
        site_id: int,
    ) -> DeploymentOptimizationResponse:
        """
        Generate deployment optimization for one site.

        No suitability/recommendation payload is required
        from the API client.
        """

        site = self.repository.get_site(
            site_id
        )

        if site is None:
            raise ValueError(
                f"Site {site_id} not found."
            )

        # =====================================================
        # STEP 1
        # Generate authoritative site suitability
        # =====================================================

        suitability = (
            self.suitability_service.evaluate_site(
                site_id=site_id,
            )
        )

        suitability_data = (
            suitability.model_dump()
        )

        # =====================================================
        # STEP 2
        # Generate renewable technology recommendation
        # =====================================================

        recommendation = (
            self.recommendation_service.recommend(
                site_id=site_id,
                suitability_data=suitability_data,
            )
        )

        recommendation_data = (
            recommendation.model_dump()
        )

        # =====================================================
        # STEP 3
        # Extract canonical values
        # =====================================================

        deployment_score = self._normalize(
            suitability_data.get(
                "overall_score"
            )
        )

        solar_score = self._normalize(
            suitability_data.get(
                "solar_score"
            )
        )

        wind_score = self._normalize(
            suitability_data.get(
                "wind_score"
            )
        )

        technology = self._extract_technology(
            recommendation_data
        )

        hybrid_score = self._extract_hybrid_score(
            recommendation_data
        )

        # =====================================================
        # STEP 4
        # Deployment feasibility
        # =====================================================

        recommended_location = (
            suitability_data.get(
                "deployment_feasible",
                False,
            )
            and technology
            != DeploymentTechnology.UNSUITABLE
        )

        hybrid_recommended = (
            technology
            == DeploymentTechnology.HYBRID
        )

        # =====================================================
        # STEP 5
        # Capacity planning
        # =====================================================

        capacity_plan = (
            self._calculate_capacity_plan(
                technology=technology,
                deployment_score=deployment_score,
                solar_score=solar_score,
                wind_score=wind_score,
            )
        )

        # =====================================================
        # STEP 6
        # Location recommendation
        # =====================================================

        location_recommendation = (
            self._build_location_recommendation(
                site_id=site_id,
                deployment_score=deployment_score,
                technology=technology,
            )
        )

        # =====================================================
        # STEP 7
        # Expansion planning
        # =====================================================

        expansion_plan = (
            self._build_expansion_plan(
                deployment_score=deployment_score,
                technology=technology,
            )
        )

        # =====================================================
        # STEP 8
        # Optimization reason
        # =====================================================

        reason = (
            self._generate_optimization_reason(
                technology=technology,
                deployment_score=deployment_score,
                hybrid_score=hybrid_score,
                capacity_plan=capacity_plan,
            )
        )

        # =====================================================
        # FINAL RESPONSE
        # =====================================================

        return DeploymentOptimizationResponse(
            site_id=site_id,

            recommended_location=(
                recommended_location
            ),

            technology=technology,

            optimization_score=(
                deployment_score
            ),

            capacity_plan=capacity_plan,

            hybrid_recommended=(
                hybrid_recommended
            ),

            location_recommendation=(
                location_recommendation
            ),

            expansion_plan=(
                expansion_plan
            ),

            optimization_reason=reason,
        )

    # =========================================================
    # TECHNOLOGY
    # =========================================================

    @staticmethod
    def _extract_technology(
        recommendation: dict,
    ) -> DeploymentTechnology:
        """
        Extract technology from RenewableRecommendationService.

        Supports common response names such as:
            technology
            recommended_technology
        """

        value = recommendation.get(
            "technology"
        )

        if value is None:
            value = recommendation.get(
                "recommended_technology"
            )

        if value is None:
            return DeploymentTechnology.UNSUITABLE

        # Pydantic enum may already be represented as a string
        if hasattr(value, "value"):
            value = value.value

        try:
            return DeploymentTechnology(
                value
            )

        except ValueError:
            return DeploymentTechnology.UNSUITABLE

    # =========================================================
    # HYBRID SCORE
    # =========================================================

    @staticmethod
    def _extract_hybrid_score(
        recommendation: dict,
    ) -> float:

        value = recommendation.get(
            "hybrid_score"
        )

        if isinstance(value, dict):
            value = value.get(
                "score"
            )

        if value is None:
            return 0.0

        try:
            return max(
                0.0,
                min(
                    100.0,
                    float(value),
                ),
            )

        except (
            TypeError,
            ValueError,
        ):
            return 0.0

    # =========================================================
    # CAPACITY
    # =========================================================

    def _calculate_capacity_plan(
        self,
        technology: DeploymentTechnology,
        deployment_score: float,
        solar_score: float,
        wind_score: float,
    ) -> CapacityPlan:
        """
        Determine recommended capacity using the canonical
        suitability and renewable recommendation outputs.

        Capacity is deliberately kept as deployment business logic.
        """

        if (
            technology
            == DeploymentTechnology.UNSUITABLE
        ):
            return CapacityPlan(
                recommended_capacity_mw=0.0,
                solar_capacity_mw=0.0,
                wind_capacity_mw=0.0,
                capacity_strategy=(
                    "No renewable capacity is recommended "
                    "because the site is currently unsuitable."
                ),
            )

        # -----------------------------------------------------
        # Single technology
        # -----------------------------------------------------

        if technology == DeploymentTechnology.SOLAR:

            capacity = min(
                deployment_score,
                self.MAX_SINGLE_TECH_CAPACITY_MW,
            )

            return CapacityPlan(
                recommended_capacity_mw=round(
                    capacity,
                    2,
                ),
                solar_capacity_mw=round(
                    capacity,
                    2,
                ),
                wind_capacity_mw=0.0,
                capacity_strategy=(
                    "Prioritize solar capacity according "
                    "to the site's suitability score."
                ),
            )

        if technology == DeploymentTechnology.WIND:

            capacity = min(
                deployment_score,
                self.MAX_SINGLE_TECH_CAPACITY_MW,
            )

            return CapacityPlan(
                recommended_capacity_mw=round(
                    capacity,
                    2,
                ),
                solar_capacity_mw=0.0,
                wind_capacity_mw=round(
                    capacity,
                    2,
                ),
                capacity_strategy=(
                    "Prioritize wind capacity according "
                    "to the site's suitability score."
                ),
            )

        # -----------------------------------------------------
        # Hybrid
        # -----------------------------------------------------

        if technology == DeploymentTechnology.HYBRID:

            total_capacity = min(
                deployment_score
                * 1.5,
                self.MAX_HYBRID_CAPACITY_MW,
            )

            total_resource = (
                solar_score
                + wind_score
            )

            if total_resource <= 0:
                solar_capacity = (
                    total_capacity / 2
                )
                wind_capacity = (
                    total_capacity / 2
                )

            else:
                solar_ratio = (
                    solar_score
                    / total_resource
                )

                wind_ratio = (
                    wind_score
                    / total_resource
                )

                solar_capacity = (
                    total_capacity
                    * solar_ratio
                )

                wind_capacity = (
                    total_capacity
                    * wind_ratio
                )

            return CapacityPlan(
                recommended_capacity_mw=round(
                    total_capacity,
                    2,
                ),
                solar_capacity_mw=round(
                    solar_capacity,
                    2,
                ),
                wind_capacity_mw=round(
                    wind_capacity,
                    2,
                ),
                capacity_strategy=(
                    "Allocate hybrid capacity according "
                    "to the relative solar and wind "
                    "suitability scores."
                ),
            )

        return CapacityPlan(
            recommended_capacity_mw=0.0,
            solar_capacity_mw=0.0,
            wind_capacity_mw=0.0,
            capacity_strategy=(
                "No deployment capacity is recommended."
            ),
        )

    # =========================================================
    # LOCATION RECOMMENDATION
    # =========================================================

    @staticmethod
    def _build_location_recommendation(
        site_id: int,
        deployment_score: float,
        technology: DeploymentTechnology,
    ) -> LocationRecommendation:

        if deployment_score >= 85:

            reason = (
                "Site has excellent deployment suitability "
                "and is a strong candidate for renewable "
                "energy deployment."
            )

        elif deployment_score >= 70:

            reason = (
                "Site has high deployment suitability "
                "and is a strong deployment candidate."
            )

        elif deployment_score >= 50:

            reason = (
                "Site has moderate deployment suitability "
                "and may support deployment with "
                "appropriate constraints."
            )

        else:

            reason = (
                "Site does not currently meet the preferred "
                "deployment suitability threshold."
            )

        return LocationRecommendation(
            site_id=site_id,
            deployment_score=deployment_score,
            technology=technology,
            recommendation_reason=reason,
        )

    # =========================================================
    # EXPANSION
    # =========================================================

    @staticmethod
    def _build_expansion_plan(
        deployment_score: float,
        technology: DeploymentTechnology,
    ) -> ExpansionPlan:

        if (
            technology
            == DeploymentTechnology.UNSUITABLE
        ):
            return ExpansionPlan(
                expansion_recommended=False,
                expansion_priority="Low",
                expansion_reason=(
                    "Expansion is not recommended because "
                    "the site is currently unsuitable."
                ),
            )

        if deployment_score >= 85:

            return ExpansionPlan(
                expansion_recommended=True,
                expansion_priority="High",
                expansion_reason=(
                    "Excellent site suitability supports "
                    "future renewable capacity expansion."
                ),
            )

        if deployment_score >= 70:

            return ExpansionPlan(
                expansion_recommended=True,
                expansion_priority="Medium",
                expansion_reason=(
                    "Strong site suitability may support "
                    "future capacity expansion."
                ),
            )

        if deployment_score >= 50:

            return ExpansionPlan(
                expansion_recommended=True,
                expansion_priority="Low",
                expansion_reason=(
                    "Limited expansion may be considered "
                    "after evaluating the initial deployment."
                ),
            )

        return ExpansionPlan(
            expansion_recommended=False,
            expansion_priority="Low",
            expansion_reason=(
                "Expansion is not recommended because "
                "site suitability is below the deployment "
                "threshold."
            ),
        )

    # =========================================================
    # OPTIMIZATION REASON
    # =========================================================

    @staticmethod
    def _generate_optimization_reason(
        technology: DeploymentTechnology,
        deployment_score: float,
        hybrid_score: float,
        capacity_plan: CapacityPlan,
    ) -> str:

        if (
            technology
            == DeploymentTechnology.SOLAR
        ):
            return (
                "Solar deployment is prioritized based "
                "on the site's renewable suitability. "
                f"Recommended solar capacity: "
                f"{capacity_plan.solar_capacity_mw} MW."
            )

        if (
            technology
            == DeploymentTechnology.WIND
        ):
            return (
                "Wind deployment is prioritized based "
                "on the site's renewable suitability. "
                f"Recommended wind capacity: "
                f"{capacity_plan.wind_capacity_mw} MW."
            )

        if (
            technology
            == DeploymentTechnology.HYBRID
        ):
            return (
                "Hybrid solar-wind deployment is "
                "recommended based on complementary "
                "renewable resource suitability. "
                f"Recommended total capacity: "
                f"{capacity_plan.recommended_capacity_mw} MW."
            )

        return (
            "Deployment is not recommended because "
            "the site does not currently meet the "
            "required renewable suitability criteria."
        )

    # =========================================================
    # NORMALIZATION
    # =========================================================

    @staticmethod
    def _normalize(
        value,
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

        return round(
            max(
                0.0,
                min(
                    100.0,
                    value,
                ),
            ),
            2,
        )