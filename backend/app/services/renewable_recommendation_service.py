from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.renewable_recommendation_repository import (
    RenewableRecommendationRepository,
)

from app.schemas.renewable_recommendation import (
    RecommendationConfidence,
    RenewableRecommendationResponse,
    RenewableTechnology,
    TechnologyScore,
)


class RenewableRecommendationService:
    """
    Renewable Energy Recommendation Engine.

    Responsibility
    --------------
    Determines the most appropriate renewable technology
    for a site:

        - Solar
        - Wind
        - Hybrid Solar-Wind
        - Unsuitable

    The service does NOT:
        - perform ML prediction
        - fetch NASA data
        - fetch weather data
        - perform GIS calculations
        - recalculate site suitability

    It consumes the already-generated Site Suitability result.

    Flow:

        Environmental + GIS
                ↓
        Solar/Wind ML Prediction
                ↓
        Site Suitability
                ↓
        Renewable Recommendation
    """

    # ---------------------------------------------------------
    # Business thresholds
    # ---------------------------------------------------------

    MINIMUM_DEPLOYMENT_SCORE = 30.0

    SOLAR_THRESHOLD = 65.0
    WIND_THRESHOLD = 65.0
    HYBRID_THRESHOLD = 60.0

    def __init__(self, db: Session) -> None:

        self.repository = (
            RenewableRecommendationRepository(db)
        )

    # =========================================================
    # MAIN RECOMMENDATION
    # =========================================================

    def recommend(
        self,
        site_id: int,
        suitability_data: dict,
    ) -> RenewableRecommendationResponse:
        """
        Generate renewable technology recommendation
        using the existing site suitability result.

        Expected suitability_data:

        {
            "site_id": 1,
            "overall_score": 75,
            "deployment_feasible": true,
            "solar_score": ...,
            "wind_score": ...,
            "renewable_resource": {...},
            "geographic_suitability": {...},
            "infrastructure_accessibility": {...},
            "environmental_impact": {...},
            "economic_feasibility": {...},
            ...
        }
        """

        site = self.repository.get_site(site_id)

        if site is None:
            raise ValueError(
                f"Site {site_id} not found."
            )

        # -----------------------------------------------------
        # Overall suitability
        # -----------------------------------------------------

        overall_site_score = self._normalize(
            suitability_data.get("overall_score")
        )

        deployment_feasible = bool(
            suitability_data.get(
                "deployment_feasible",
                overall_site_score
                >= self.MINIMUM_DEPLOYMENT_SCORE,
            )
        )

        # -----------------------------------------------------
        # Resource / technology scores
        # -----------------------------------------------------

        solar_resource = self._extract_score(
            suitability_data,
            "solar_score",
        )

        wind_resource = self._extract_score(
            suitability_data,
            "wind_score",
        )

        # -----------------------------------------------------
        # Technology-specific suitability
        #
        # If the suitability engine does not currently expose
        # separate solar/wind suitability scores, use the
        # corresponding renewable resource score.
        # -----------------------------------------------------

        solar_suitability = self._extract_score(
            suitability_data,
            "solar_suitability_score",
            fallback=solar_resource,
        )

        wind_suitability = self._extract_score(
            suitability_data,
            "wind_suitability_score",
            fallback=wind_resource,
        )

        # -----------------------------------------------------
        # Calculate technology scores
        # -----------------------------------------------------

        solar_score = (
            self._calculate_technology_score(
                solar_resource,
                solar_suitability,
            )
        )

        wind_score = (
            self._calculate_technology_score(
                wind_resource,
                wind_suitability,
            )
        )

        hybrid_score = (
            self._calculate_hybrid_score(
                solar_score,
                wind_score,
            )
        )

        # -----------------------------------------------------
        # Select technology
        # -----------------------------------------------------

        if not deployment_feasible:

            technology = (
                RenewableTechnology.UNSUITABLE
            )

        else:

            technology = self._select_technology(
                solar_score=solar_score,
                wind_score=wind_score,
                hybrid_score=hybrid_score,
            )

        # -----------------------------------------------------
        # Confidence
        # -----------------------------------------------------

        confidence = (
            self._calculate_confidence(
                technology=technology,
                solar_score=solar_score,
                wind_score=wind_score,
                overall_site_score=overall_site_score,
            )
        )

        # -----------------------------------------------------
        # Strengths / constraints
        # -----------------------------------------------------

        strengths = self._identify_strengths(
            solar_score=solar_score,
            wind_score=wind_score,
            overall_site_score=overall_site_score,
        )

        constraints = self._identify_constraints(
            solar_score=solar_score,
            wind_score=wind_score,
            overall_site_score=overall_site_score,
        )

        # -----------------------------------------------------
        # Recommendation explanation
        # -----------------------------------------------------

        recommendation_reason = (
            self._generate_reason(
                technology=technology,
                solar_score=solar_score,
                wind_score=wind_score,
                hybrid_score=hybrid_score,
            )
        )

        recommended_capacity_type = (
            self._get_capacity_type(
                technology
            )
        )

        # -----------------------------------------------------
        # Response
        # -----------------------------------------------------

        return RenewableRecommendationResponse(
            site_id=site_id,

            recommended_technology=technology,

            confidence=confidence,

            solar=TechnologyScore(
                score=solar_score,
                resource_score=solar_resource,
                suitability_score=solar_suitability,
            ),

            wind=TechnologyScore(
                score=wind_score,
                resource_score=wind_resource,
                suitability_score=wind_suitability,
            ),

            hybrid_score=hybrid_score,

            overall_site_score=overall_site_score,

            deployment_feasible=deployment_feasible,

            recommendation_reason=recommendation_reason,

            strengths=strengths,

            constraints=constraints,

            recommended_capacity_type=(
                recommended_capacity_type
            ),
        )

    # =========================================================
    # TECHNOLOGY SCORE
    # =========================================================

    @staticmethod
    def _calculate_technology_score(
        resource_score: float,
        suitability_score: float,
    ) -> float:
        """
        Combine resource and technology suitability.

        Business rule:

            Resource       = 60%
            Suitability    = 40%
        """

        score = (
            resource_score * 0.60
            + suitability_score * 0.40
        )

        return round(
            max(
                0.0,
                min(
                    100.0,
                    score,
                ),
            ),
            2,
        )

    # =========================================================
    # HYBRID SCORE
    # =========================================================

    @staticmethod
    def _calculate_hybrid_score(
        solar_score: float,
        wind_score: float,
    ) -> float:

        if solar_score <= 0 and wind_score <= 0:
            return 0.0

        average_score = (
            solar_score + wind_score
        ) / 2.0

        balance = (
            100.0
            - abs(
                solar_score - wind_score
            )
        )

        hybrid_score = (
            average_score * 0.70
            + balance * 0.30
        )

        return round(
            max(
                0.0,
                min(
                    100.0,
                    hybrid_score,
                ),
            ),
            2,
        )

    # =========================================================
    # TECHNOLOGY SELECTION
    # =========================================================

    def _select_technology(
        self,
        solar_score: float,
        wind_score: float,
        hybrid_score: float,
    ) -> RenewableTechnology:

        solar_available = (
            solar_score
            >= self.SOLAR_THRESHOLD
        )

        wind_available = (
            wind_score
            >= self.WIND_THRESHOLD
        )

        hybrid_available = (
            hybrid_score
            >= self.HYBRID_THRESHOLD
        )

        # -----------------------------------------------------
        # Both technologies are strong
        # -----------------------------------------------------

        if (
            solar_available
            and wind_available
            and hybrid_available
        ):
            return RenewableTechnology.HYBRID

        # -----------------------------------------------------
        # Solar clearly stronger
        # -----------------------------------------------------

        if (
            solar_available
            and solar_score > wind_score
        ):
            return RenewableTechnology.SOLAR

        # -----------------------------------------------------
        # Wind clearly stronger
        # -----------------------------------------------------

        if (
            wind_available
            and wind_score > solar_score
        ):
            return RenewableTechnology.WIND

        # -----------------------------------------------------
        # Both have moderate potential
        # -----------------------------------------------------

        if hybrid_available:
            return RenewableTechnology.HYBRID

        # -----------------------------------------------------
        # One technology is usable
        # -----------------------------------------------------

        if solar_available:
            return RenewableTechnology.SOLAR

        if wind_available:
            return RenewableTechnology.WIND

        return RenewableTechnology.UNSUITABLE

    # =========================================================
    # CONFIDENCE
    # =========================================================

    @staticmethod
    def _calculate_confidence(
        technology: RenewableTechnology,
        solar_score: float,
        wind_score: float,
        overall_site_score: float,
    ) -> RecommendationConfidence:

        if (
            technology
            == RenewableTechnology.UNSUITABLE
        ):
            return RecommendationConfidence.HIGH

        if technology == RenewableTechnology.SOLAR:

            if solar_score >= 80:
                return RecommendationConfidence.HIGH

            if solar_score >= 65:
                return RecommendationConfidence.MEDIUM

            return RecommendationConfidence.LOW

        if technology == RenewableTechnology.WIND:

            if wind_score >= 80:
                return RecommendationConfidence.HIGH

            if wind_score >= 65:
                return RecommendationConfidence.MEDIUM

            return RecommendationConfidence.LOW

        # -----------------------------------------------------
        # Hybrid
        # -----------------------------------------------------

        if (
            solar_score >= 75
            and wind_score >= 75
            and overall_site_score >= 70
        ):
            return RecommendationConfidence.HIGH

        if (
            solar_score >= 65
            and wind_score >= 65
        ):
            return RecommendationConfidence.MEDIUM

        return RecommendationConfidence.LOW

    # =========================================================
    # STRENGTHS
    # =========================================================

    @staticmethod
    def _identify_strengths(
        solar_score: float,
        wind_score: float,
        overall_site_score: float,
    ) -> list[str]:

        strengths: list[str] = []

        if solar_score >= 75:
            strengths.append(
                "Strong solar deployment potential."
            )

        if wind_score >= 75:
            strengths.append(
                "Strong wind deployment potential."
            )

        if (
            solar_score >= 65
            and wind_score >= 65
        ):
            strengths.append(
                "Both solar and wind resources "
                "support hybrid deployment."
            )

        if overall_site_score >= 70:
            strengths.append(
                "Overall site conditions are "
                "favorable for renewable deployment."
            )

        return strengths

    # =========================================================
    # CONSTRAINTS
    # =========================================================

    @staticmethod
    def _identify_constraints(
        solar_score: float,
        wind_score: float,
        overall_site_score: float,
    ) -> list[str]:

        constraints: list[str] = []

        if solar_score < 50:
            constraints.append(
                "Solar suitability is relatively low."
            )

        if wind_score < 50:
            constraints.append(
                "Wind suitability is relatively low."
            )

        if overall_site_score < 50:
            constraints.append(
                "Overall site suitability requires "
                "additional evaluation."
            )

        return constraints

    # =========================================================
    # RECOMMENDATION REASON
    # =========================================================

    @staticmethod
    def _generate_reason(
        technology: RenewableTechnology,
        solar_score: float,
        wind_score: float,
        hybrid_score: float,
    ) -> str:

        if technology == RenewableTechnology.SOLAR:

            return (
                "Solar is recommended because the site "
                "shows stronger solar potential and "
                "suitability than wind."
            )

        if technology == RenewableTechnology.WIND:

            return (
                "Wind is recommended because the site "
                "shows stronger wind potential and "
                "suitability than solar."
            )

        if technology == RenewableTechnology.HYBRID:

            return (
                "Hybrid solar-wind deployment is recommended "
                "because both technologies demonstrate "
                "strong and complementary site potential."
            )

        return (
            "The site does not currently demonstrate "
            "sufficient renewable deployment suitability."
        )

    # =========================================================
    # CAPACITY TYPE
    # =========================================================

    @staticmethod
    def _get_capacity_type(
        technology: RenewableTechnology,
    ) -> str | None:

        if technology == RenewableTechnology.SOLAR:
            return "Solar Capacity"

        if technology == RenewableTechnology.WIND:
            return "Wind Capacity"

        if technology == RenewableTechnology.HYBRID:
            return "Hybrid Solar-Wind Capacity"

        return None

    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _normalize(value) -> float:

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

    @classmethod
    def _extract_score(
        cls,
        intelligence: dict,
        key: str,
        fallback: float = 0.0,
    ) -> float:

        value = intelligence.get(key)

        if isinstance(value, dict):
            value = value.get("score")

        if value is None:
            value = fallback

        return cls._normalize(value)