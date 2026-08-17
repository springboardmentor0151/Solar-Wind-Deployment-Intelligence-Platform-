from __future__ import annotations

from app.prediction.feature_builder.prediction_feature_builder import (
    PredictionFeatureBuilder,
)

from app.prediction.services.prediction_service import (
    PredictionService,
)

from app.services.environmental_service import (
    EnvironmentalService,
)


class RenewableIntelligenceService:
    """
    Orchestrates environmental/GIS intelligence and
    ML-based renewable energy prediction.

    Flow:

        Site
          ↓
        EnvironmentalService
          ↓
        EnvironmentalReport
          ↓
        PredictionFeatureBuilder
          ↓
        SolarPredictionRequest
        WindPredictionRequest
          ↓
        PredictionService
          ↓
        Solar ML + Wind ML
          ↓
        Renewable prediction
    """

    def __init__(
        self,
        environmental_service: EnvironmentalService,
        prediction_service: PredictionService,
    ) -> None:

        self.environmental_service = environmental_service
        self.prediction_service = prediction_service

    # =========================================================
    # SITE ANALYSIS
    # =========================================================

    def analyze_site(
        self,
        site_id: int,
    ) -> dict:
        """
        Generate complete renewable intelligence
        for a single site.

        EnvironmentalReport is the source of truth for
        environmental and GIS features.
        """

        environment = (
            self.environmental_service.get_site_environment(
                site_id,
            )
        )

        # -----------------------------------------------------
        # EnvironmentalReport is a Pydantic model.
        # It does NOT contain a `site` ORM object.
        # -----------------------------------------------------

        site_id_value = environment.site_id

        if site_id_value is None:
            raise ValueError(
                "Environmental report does not contain site_id."
            )

        # -----------------------------------------------------
        # Fetch the actual Site ORM object because the
        # PredictionFeatureBuilder requires latitude/longitude.
        # -----------------------------------------------------

        site = (
            self.environmental_service.site_repository.get_by_id(
                site_id_value
            )
        )

        if site is None:
            raise ValueError(
                f"Site {site_id_value} not found."
            )

        # -----------------------------------------------------
        # Convert EnvironmentalReport into the dictionary
        # expected by PredictionFeatureBuilder.
        # -----------------------------------------------------

        environment_data = {
            "weather": environment.weather.model_dump(),
            "solar": environment.solar.model_dump(),
            "gis": (
                environment.gis.model_dump()
                if environment.gis is not None
                else {}
            ),
        }

        # -----------------------------------------------------
        # Build ML feature requests
        # -----------------------------------------------------

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

        # -----------------------------------------------------
        # Execute ML prediction
        # -----------------------------------------------------

        prediction = (
            self.prediction_service.predict_renewable(
                solar_request=solar_request,
                wind_request=wind_request,
            )
        )

        # -----------------------------------------------------
        # Response
        # -----------------------------------------------------

        return {
            "site": {
                "id": site.id,
                "name": site.name,
                "latitude": site.latitude,
                "longitude": site.longitude,
            },
            "environment": environment_data,
            "predictions": prediction,
        }

    # =========================================================
    # PROJECT ANALYSIS
    # =========================================================

    def analyze_project(
        self,
        project_id: int,
    ) -> dict:
        """
        Generate renewable intelligence for every
        site belonging to a project.
        """

        project = (
            self.environmental_service.get_project_environment(
                project_id,
            )
        )

        results = []

        for item in project["sites"]:

            site = item["site"]

            environment_data = {
                "weather": (
                    item["weather"].model_dump()
                    if hasattr(
                        item["weather"],
                        "model_dump",
                    )
                    else item["weather"]
                ),

                "solar": (
                    item["solar"].model_dump()
                    if hasattr(
                        item["solar"],
                        "model_dump",
                    )
                    else item["solar"]
                ),

                "gis": (
                    item["gis"].model_dump()
                    if hasattr(
                        item["gis"],
                        "model_dump",
                    )
                    else item["gis"]
                ),
            }

            # -------------------------------------------------
            # Build ML requests
            # -------------------------------------------------

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

            # -------------------------------------------------
            # Execute ML prediction
            # -------------------------------------------------

            prediction = (
                self.prediction_service.predict_renewable(
                    solar_request=solar_request,
                    wind_request=wind_request,
                )
            )

            results.append(
                {
                    "site": {
                        "id": site.id,
                        "name": site.name,
                        "latitude": site.latitude,
                        "longitude": site.longitude,
                    },
                    "environment": environment_data,
                    "prediction": prediction,
                }
            )

        return {
            "project_id": project["project_id"],
            "project_name": project["project_name"],
            "sites": results,
        }