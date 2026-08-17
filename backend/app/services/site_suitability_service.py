# app/services/site_suitability_service.py

from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.suitability_repository import (
    SuitabilityRepository,
)

from app.schemas.suitability import (
    SiteSuitabilityResponse,
    SuitabilityCategory,
    SuitabilityFactor,
)

from app.prediction.feature_builder.prediction_feature_builder import (
    PredictionFeatureBuilder,
)

from app.prediction.services.prediction_service import (
    PredictionService,
)

from app.services.environmental_service import (
    EnvironmentalService,
)


class SiteSuitabilityService:
    """
    Site Suitability Intelligence Engine.

    Flow:

        Site
          ↓
        Environmental Service
          ↓
        Prediction Feature Builder
          ↓
        Solar / Wind ML Prediction
          ↓
        Renewable Resource Scores
          ↓
        GIS / Environmental / Economic Scores
          ↓
        Weighted Overall Suitability Score
          ↓
        Feasibility + Recommendation

    Important:
    The ML training datasets produce generation values in MW
    roughly in the 0.00 - 0.13 MW range.

    Therefore the generation-to-suitability thresholds must use
    the same unit and scale as the trained ML models.
    """

    # =========================================================
    # SUITABILITY WEIGHTS
    # =========================================================

    RESOURCE_WEIGHT = 0.35
    GEOGRAPHIC_WEIGHT = 0.25
    INFRASTRUCTURE_WEIGHT = 0.15
    ENVIRONMENTAL_WEIGHT = 0.15
    ECONOMIC_WEIGHT = 0.10

    # =========================================================
    # ML GENERATION → SUITABILITY
    #
    # Training data generation values are approximately:
    #
    # Solar: 0.00 - 0.13 MW
    # Wind : 0.00 - 0.13 MW
    #
    # The old thresholds of 0.5 / 1 / 2 / 3 MW were therefore
    # incorrectly scaled and converted normal ML predictions
    # into scores around 0-5.
    # =========================================================

    SOLAR_GENERATION_THRESHOLDS = (
        (0.00, 0.0),
        (0.03, 20.0),
        (0.06, 40.0),
        (0.09, 70.0),
        (0.12, 100.0),
    )

    WIND_GENERATION_THRESHOLDS = (
        (0.00, 0.0),
        (0.03, 20.0),
        (0.06, 40.0),
        (0.09, 70.0),
        (0.12, 100.0),
    )

    def __init__(
        self,
        db: Session,
        environmental_service: EnvironmentalService,
        prediction_service: PredictionService,
    ) -> None:

        self.repository = SuitabilityRepository(db)

        self.environmental_service = (
            environmental_service
        )

        self.prediction_service = (
            prediction_service
        )

    # =========================================================
    # MAIN
    # =========================================================

    def evaluate_site(
        self,
        site_id: int,
    ) -> SiteSuitabilityResponse:

        # =========================================================
        # 1. GET SITE
        # =========================================================

        site = self.repository.get_site(site_id)

        if site is None:
            raise ValueError(
                f"Site {site_id} not found."
            )

        # =========================================================
        # 2. GET ENVIRONMENTAL + GIS DATA
        # =========================================================

        environment = (
            self.environmental_service.get_site_environment(
                site_id
            )
        )

        # EnvironmentalReport is a Pydantic model.
        # PredictionFeatureBuilder expects a dictionary.
        environment_data = self._model_dump(
            environment
        )

        # =========================================================
        # 3. BUILD ML FEATURE REQUESTS
        # =========================================================

        solar_request = (
            PredictionFeatureBuilder.build_solar(
                site=site,
                environment=environment_data,
            )
        )

        wind_request = (
            PredictionFeatureBuilder.build_wind(
                site=site,
                environment=environment_data,
            )
        )

        # =========================================================
        # 4. EXECUTE ML PREDICTION
        # =========================================================

        prediction = (
            self.prediction_service.predict_renewable(
                solar_request=solar_request,
                wind_request=wind_request,
            )
        )

        # =========================================================
        # 5. CONVERT PREDICTION TO DICTIONARY
        # =========================================================

        prediction_data = self._model_dump(
            prediction
        )

        # =========================================================
        # 6. EXTRACT SOLAR + WIND GENERATION
        # =========================================================

        solar_generation = (
            self._extract_prediction(
                prediction_data,
                "solar_generation_mw",
            )
        )

        wind_generation = (
            self._extract_prediction(
                prediction_data,
                "wind_generation_mw",
            )
        )

        # =========================================================
        # 7. CONVERT GENERATION TO RESOURCE SCORES
        # =========================================================

        solar_score = (
            self._generation_to_suitability(
                solar_generation,
                self.SOLAR_GENERATION_THRESHOLDS,
            )
        )

        wind_score = (
            self._generation_to_suitability(
                wind_generation,
                self.WIND_GENERATION_THRESHOLDS,
            )
        )

        renewable_resource_score = (
            self._calculate_resource_score(
                solar_score,
                wind_score,
            )
        )

        # =========================================================
        # 8. EXTRACT ENVIRONMENTAL / GIS SECTIONS
        # =========================================================

        gis = environment_data.get(
            "gis",
            {},
        )

        if gis is None:
            gis = {}

        weather = environment_data.get(
            "weather",
            {},
        )

        if weather is None:
            weather = {}

        # =========================================================
        # 9. CALCULATE SUITABILITY FACTORS
        # =========================================================

        geographic_score = (
            self._calculate_geographic_score(
                gis
            )
        )

        infrastructure_score = (
            self._calculate_infrastructure_score(
                gis
            )
        )

        environmental_score = (
            self._calculate_environmental_score(
                weather,
                gis,
            )
        )

        economic_score = (
            self._calculate_economic_score(
                gis
            )
        )

        # =========================================================
        # 10. BUILD FACTOR OBJECTS
        # =========================================================

        renewable_resource = self._build_factor(
            score=renewable_resource_score,
            weight=self.RESOURCE_WEIGHT,
            explanation=(
                "Renewable resource suitability derived "
                "from solar and wind ML generation predictions."
            ),
        )

        geographic_suitability = self._build_factor(
            score=geographic_score,
            weight=self.GEOGRAPHIC_WEIGHT,
            explanation=(
                "Geographic and terrain suitability."
            ),
        )

        infrastructure_accessibility = self._build_factor(
            score=infrastructure_score,
            weight=self.INFRASTRUCTURE_WEIGHT,
            explanation=(
                "Infrastructure accessibility."
            ),
        )

        environmental_impact = self._build_factor(
            score=environmental_score,
            weight=self.ENVIRONMENTAL_WEIGHT,
            explanation=(
                "Environmental constraints."
            ),
        )

        economic_feasibility = self._build_factor(
            score=economic_score,
            weight=self.ECONOMIC_WEIGHT,
            explanation=(
                "Economic feasibility."
            ),
        )

        # =========================================================
        # 11. CALCULATE OVERALL WEIGHTED SCORE
        # =========================================================

        overall_score = round(
            renewable_resource.weighted_score
            + geographic_suitability.weighted_score
            + infrastructure_accessibility.weighted_score
            + environmental_impact.weighted_score
            + economic_feasibility.weighted_score,
            2,
        )

        # =========================================================
        # 12. CATEGORY
        # =========================================================

        category = self._get_category(
            overall_score
        )

        # =========================================================
        # 13. DEPLOYMENT FEASIBILITY
        # =========================================================

        deployment_feasible = (
            self._is_deployment_feasible(
                overall_score=overall_score,
                environmental_score=environmental_score,
                geographic_score=geographic_score,
            )
        )

        # =========================================================
        # 14. STRENGTHS
        # =========================================================

        strengths = self._build_strengths(
            renewable_resource_score,
            geographic_score,
            infrastructure_score,
            environmental_score,
            economic_score,
        )

        # =========================================================
        # 15. CONSTRAINTS
        # =========================================================

        constraints = self._build_constraints(
            renewable_resource_score,
            geographic_score,
            infrastructure_score,
            environmental_score,
            economic_score,
        )

        # =========================================================
        # 16. RECOMMENDATION
        # =========================================================

        recommendation = (
            self._build_recommendation(
                overall_score=overall_score,
                category=category,
                deployment_feasible=deployment_feasible,
            )
        )

        # =========================================================
        # 17. RESPONSE
        # =========================================================

        return SiteSuitabilityResponse(
            site_id=site_id,

            overall_score=overall_score,

            category=category,

            renewable_resource=renewable_resource,

            geographic_suitability=(
                geographic_suitability
            ),

            infrastructure_accessibility=(
                infrastructure_accessibility
            ),

            environmental_impact=(
                environmental_impact
            ),

            economic_feasibility=(
                economic_feasibility
            ),

            deployment_feasible=(
                deployment_feasible
            ),

            recommendation=recommendation,

            strengths=strengths,

            constraints=constraints,

            solar_score=solar_score,

            wind_score=wind_score,
        )
        
    # =========================================================
    # PREDICTION EXTRACTION
    # =========================================================

    @staticmethod
    def _extract_prediction(
        prediction: dict,
        key: str,
    ) -> float:

        value = prediction.get(key)

        if value is not None:
            return SiteSuitabilityService._normalize_number(
                value
            )

        for section in (
            "solar",
            "wind",
            "prediction",
            "predictions",
        ):

            nested = prediction.get(
                section
            )

            if isinstance(nested, dict):

                value = nested.get(key)

                if value is not None:
                    return (
                        SiteSuitabilityService
                        ._normalize_number(value)
                    )

                value = nested.get(
                    "generation_mw"
                )

                if value is not None:
                    return (
                        SiteSuitabilityService
                        ._normalize_number(value)
                    )

        return 0.0

    # =========================================================
    # GENERATION → SUITABILITY
    # =========================================================

    @staticmethod
    def _generation_to_suitability(
        generation: float,
        thresholds: tuple,
    ) -> float:

        generation = max(
            0.0,
            float(generation),
        )

        previous_generation = (
            thresholds[0][0]
        )

        previous_score = (
            thresholds[0][1]
        )

        for (
            current_generation,
            current_score,
        ) in thresholds[1:]:

            if generation <= current_generation:

                if (
                    current_generation
                    == previous_generation
                ):
                    return current_score

                ratio = (
                    generation
                    - previous_generation
                ) / (
                    current_generation
                    - previous_generation
                )

                score = (
                    previous_score
                    + ratio
                    * (
                        current_score
                        - previous_score
                    )
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

            previous_generation = (
                current_generation
            )

            previous_score = (
                current_score
            )

        return 100.0

    # =========================================================
    # RESOURCE SCORE
    # =========================================================

    @staticmethod
    def _calculate_resource_score(
        solar_score: float,
        wind_score: float,
    ) -> float:

        scores = [
            score
            for score in (
                solar_score,
                wind_score,
            )
            if score > 0
        ]

        if not scores:
            return 0.0

        return round(
            sum(scores) / len(scores),
            2,
        )

    # =========================================================
    # FACTOR
    # =========================================================

    def _build_factor(
        self,
        score: float,
        weight: float,
        explanation: str,
    ) -> SuitabilityFactor:

        score = max(
            0.0,
            min(100.0, float(score)),
        )

        weight = max(
            0.0,
            min(1.0, float(weight)),
        )

        weighted_score = (
            score * weight
        )

        if score >= 80:
            factor_status = "Excellent"

        elif score >= 60:
            factor_status = "Good"

        elif score >= 40:
            factor_status = "Moderate"

        elif score >= 20:
            factor_status = "Low"

        else:
            factor_status = "Very Low"

        return SuitabilityFactor(
            score=round(
                score,
                2,
            ),

            weight=round(
                weight,
                4,
            ),

            weighted_score=round(
                weighted_score,
                2,
            ),

            status=factor_status,

            explanation=explanation,
        )
    
    # =========================================================
    # CATEGORY
    # =========================================================

    @staticmethod
    def _get_category(
        score: float,
    ) -> SuitabilityCategory:

        if score >= 85:
            return SuitabilityCategory.EXCELLENT

        if score >= 70:
            return SuitabilityCategory.HIGHLY_SUITABLE

        if score >= 50:
            return SuitabilityCategory.MODERATELY_SUITABLE

        if score >= 30:
            return SuitabilityCategory.LOW_SUITABILITY

        return SuitabilityCategory.UNSUITABLE

    # =========================================================
    # DEPLOYMENT FEASIBILITY
    # =========================================================

    @staticmethod
    def _is_deployment_feasible(
        overall_score: float,
        environmental_score: float,
        geographic_score: float,
    ) -> bool:

        return (
            overall_score >= 50
            and environmental_score >= 30
            and geographic_score >= 30
        )

    # =========================================================
    # GEOGRAPHIC
    # =========================================================

    @staticmethod
    def _calculate_geographic_score(
        gis: dict,
    ) -> float:

        if not gis:
            return 50.0

        score = 50.0

        elevation = (
            gis.get("elevation_m")
        )

        if elevation is not None:

            try:
                elevation = float(
                    elevation
                )

                if 0 <= elevation <= 2000:
                    score += 20

                elif elevation <= 3000:
                    score += 10

                else:
                    score -= 10

            except (
                TypeError,
                ValueError,
            ):
                pass

        slope = gis.get(
            "slope"
        )

        if slope is None:
            slope = gis.get(
                "slope_degrees"
            )

        if slope is not None:

            try:
                slope = float(
                    slope
                )

                if slope <= 5:
                    score += 20

                elif slope <= 15:
                    score += 10

                elif slope > 30:
                    score -= 20

            except (
                TypeError,
                ValueError,
            ):
                pass

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
    # INFRASTRUCTURE
    # =========================================================

    @staticmethod
    def _calculate_infrastructure_score(
        gis: dict,
    ) -> float:

        if not gis:
            return 50.0

        score = 50.0

        for key in (
            "road_distance_km",
            "transmission_distance_km",
            "substation_distance_km",
        ):

            value = gis.get(key)

            if value is None:
                continue

            try:
                distance = float(
                    value
                )

                if distance <= 5:
                    score += 15

                elif distance <= 15:
                    score += 5

                elif distance > 50:
                    score -= 15

            except (
                TypeError,
                ValueError,
            ):
                continue

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
    # ENVIRONMENTAL
    # =========================================================

    @staticmethod
    def _calculate_environmental_score(
        weather: dict,
        gis: dict,
    ) -> float:

        score = 70.0

        cloud_cover = weather.get(
            "cloud_cover"
        )

        if cloud_cover is not None:

            try:
                cloud_cover = float(
                    cloud_cover
                )

                if cloud_cover > 80:
                    score -= 15

                elif cloud_cover > 60:
                    score -= 5

            except (
                TypeError,
                ValueError,
            ):
                pass

        rainfall = weather.get(
            "rainfall"
        )

        if rainfall is not None:

            try:
                rainfall = float(
                    rainfall
                )

                if rainfall > 20:
                    score -= 10

            except (
                TypeError,
                ValueError,
            ):
                pass

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
    # ECONOMIC
    # =========================================================

    @staticmethod
    def _calculate_economic_score(
        gis: dict,
    ) -> float:

        # Economic feasibility is kept neutral until
        # validated CAPEX / OPEX / tariff data is available.
        return 50.0

    # =========================================================
    # STRENGTHS
    # =========================================================

    @staticmethod
    def _build_strengths(
        renewable_resource_score: float,
        geographic_score: float,
        infrastructure_score: float,
        environmental_score: float,
        economic_score: float,
    ) -> list[str]:

        strengths = []

        if renewable_resource_score >= 70:
            strengths.append(
                "Strong renewable resource potential."
            )

        if geographic_score >= 70:
            strengths.append(
                "Geographic and terrain conditions are favorable."
            )

        if infrastructure_score >= 70:
            strengths.append(
                "Good infrastructure accessibility."
            )

        if environmental_score >= 70:
            strengths.append(
                "Environmental conditions are relatively favorable."
            )

        if economic_score >= 70:
            strengths.append(
                "Economic feasibility indicators are favorable."
            )

        return strengths

    # =========================================================
    # CONSTRAINTS
    # =========================================================

    @staticmethod
    def _build_constraints(
        renewable_resource_score: float,
        geographic_score: float,
        infrastructure_score: float,
        environmental_score: float,
        economic_score: float,
    ) -> list[str]:

        constraints = []

        if renewable_resource_score < 50:
            constraints.append(
                "Renewable resource potential is relatively low."
            )

        if geographic_score < 50:
            constraints.append(
                "Geographic or terrain suitability is limited."
            )

        if infrastructure_score < 50:
            constraints.append(
                "Infrastructure accessibility may require improvement."
            )

        if environmental_score < 50:
            constraints.append(
                "Environmental conditions require additional assessment."
            )

        if economic_score < 50:
            constraints.append(
                "Economic feasibility requires further validation."
            )

        return constraints

    # =========================================================
    # RECOMMENDATION
    # =========================================================

    @staticmethod
    def _build_recommendation(
        overall_score: float,
        category: SuitabilityCategory,
        deployment_feasible: bool,
    ) -> str:

        if not deployment_feasible:
            return (
                "The site does not currently meet "
                "the required deployment feasibility criteria."
            )

        if category == SuitabilityCategory.EXCELLENT:
            return (
                "The site is highly suitable for "
                "renewable energy deployment."
            )

        if category == SuitabilityCategory.HIGHLY_SUITABLE:
            return (
                "The site is highly suitable for "
                "renewable energy deployment."
            )

        if category == SuitabilityCategory.MODERATELY_SUITABLE:
            return (
                "The site is moderately suitable and "
                "requires detailed feasibility validation."
            )

        if category == SuitabilityCategory.LOW_SUITABILITY:
            return (
                "The site has limited renewable deployment "
                "suitability and requires further analysis."
            )

        return (
            "The site is currently unsuitable for "
            "renewable energy deployment."
        )

    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _normalize_number(
        value,
    ) -> float:

        if value is None:
            return 0.0

        try:
            return max(
                0.0,
                float(value),
            )

        except (
            TypeError,
            ValueError,
        ):
            return 0.0

    @staticmethod
    def _model_dump(
        value,
    ) -> dict:

        if value is None:
            return {}

        if isinstance(value, dict):
            return value

        if hasattr(value, "model_dump"):
            return value.model_dump(
                mode="python"
            )

        if hasattr(value, "dict"):
            return value.dict()

        return {}