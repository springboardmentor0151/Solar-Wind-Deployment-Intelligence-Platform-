from __future__ import annotations

from fastapi import HTTPException

from app.environmental.clients.nasa_power_client import (
    NASAPowerClient,
)
from app.environmental.clients.weather_client import (
    WeatherClient,
)
from app.environmental.models.environmental_report import (
    EnvironmentalReport,
)
from app.gis.models.gis_result import GISResult
from app.repositories.project_repository import (
    ProjectRepository,
)
from app.repositories.site_repository import (
    SiteRepository,
)


class EnvironmentalService:
    """
    Environmental Intelligence Orchestrator.

    Responsibilities:
        - fetch OpenWeather data
        - fetch NASA POWER data
        - expose stored GIS enrichment alongside
          environmental data

    This service does NOT:
        - perform GIS enrichment
        - calculate heuristic scores
        - calculate suitability
        - calculate economic scores
        - calculate final site scores
        - perform ML prediction
        - make deployment recommendations
    """

    def __init__(
        self,
        site_repository: SiteRepository,
        project_repository: ProjectRepository,
        weather_client: WeatherClient,
        nasa_client: NASAPowerClient,
    ):
        self.site_repository = site_repository
        self.project_repository = project_repository

        self.weather_client = weather_client
        self.nasa_client = nasa_client

    # =========================================================
    # ENVIRONMENTAL PROVIDERS
    # =========================================================

    def _collect_environmental_data(
        self,
        latitude: float,
        longitude: float,
    ):
        weather = self.weather_client.get_weather(
            latitude,
            longitude,
        )

        solar = self.nasa_client.get_solar_resource(
            latitude,
            longitude,
        )

        return weather, solar

    # =========================================================
    # STORED GIS DATA
    # =========================================================

    @staticmethod
    def _build_gis_result(
        site,
    ) -> GISResult | None:
        """
        Convert already-stored GIS fields into GISResult.

        No GIS provider is called here.
        No GIS scoring is performed here.
        """

        gis_fields = (
            "land_use",
            "elevation",
            "road_distance",
            "nearest_substation_distance",
            "nearest_transmission_line_distance",
            "existing_infrastructure",
            "water_body_distance",
            "protected_area_distance",
            "land_slope",
            "vegetation_index",
        )

        has_gis_data = any(
            getattr(site, field, None) is not None
            for field in gis_fields
        )

        if not has_gis_data:
            return None

        return GISResult(
            land_use=site.land_use,
            elevation=site.elevation,
            road_distance=site.road_distance,
            nearest_substation_distance=(
                site.nearest_substation_distance
            ),
            nearest_transmission_line_distance=(
                site.nearest_transmission_line_distance
            ),
            existing_infrastructure=(
                site.existing_infrastructure
            ),
            water_body_distance=(
                site.water_body_distance
            ),
            protected_area_distance=(
                site.protected_area_distance
            ),
            land_slope=site.land_slope,
            vegetation_index=site.vegetation_index,
        )

    # =========================================================
    # SITE
    # =========================================================

    def get_site_environment(
        self,
        site_id: int,
    ) -> EnvironmentalReport:

        site = self.site_repository.get_by_id(site_id)

        if site is None:
            raise HTTPException(
                status_code=404,
                detail="Site not found.",
            )

        weather, solar = self._collect_environmental_data(
            site.latitude,
            site.longitude,
        )

        gis = self._build_gis_result(site)

        return EnvironmentalReport(
            site_name=site.name,
            site_id=site.id,
            latitude=site.latitude,
            longitude=site.longitude,
            weather=weather,
            solar=solar,
            gis=gis,
        )

    # =========================================================
    # PROJECT
    # =========================================================

    def get_project_environment(
        self,
        project_id: int,
    ) -> dict:

        project = self.project_repository.get_by_id(
            project_id,
        )

        if project is None:
            raise HTTPException(
                status_code=404,
                detail="Project not found.",
            )

        sites = self.site_repository.get_by_project(
            project_id,
        )

        reports = [
            self.get_site_environment(site.id)
            for site in sites
        ]

        return {
            "project_id": project.id,
            "project_name": project.name,
            "sites": reports,
        }

    # =========================================================
    # AD-HOC LOCATION
    # =========================================================

    def get_environmental_data(
        self,
        latitude: float,
        longitude: float,
    ) -> dict:

        weather, solar = self._collect_environmental_data(
            latitude,
            longitude,
        )

        return {
            "latitude": latitude,
            "longitude": longitude,
            "weather": weather,
            "solar": solar,
        }