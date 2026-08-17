from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.gis_analyst_dashboard_repository import (
    GISAnalystDashboardRepository,
)

from app.schemas.gis_analyst_dashboard import (
    EnvironmentalAnalytics,
    GISAnalystDashboardResponse,
    GISSummary,
    GISVisualizationSite,
    SiteComparisonItem,
    TerrainMapSite,
)

class GISAnalystDashboardService:
    """
    GIS Analyst Dashboard orchestration service.

    Responsibilities:
        - Read persisted site/GIS enrichment data.
        - Aggregate GIS/environmental analytics.
        - Build terrain information.
        - Build site comparison data.
        - Read persisted candidate intelligence/suitability when available.

    This service does NOT:
        - call GIS providers directly
        - perform GIS enrichment
        - calculate another suitability formula
        - calculate ML predictions
        - modify Site records
    """

    def __init__(
        self,
        db: Session,
    ):
        self.repository = (
            GISAnalystDashboardRepository(db)
        )

    # =========================================================
    # MAIN DASHBOARD
    # =========================================================

    def get_dashboard(
        self,
    ) -> GISAnalystDashboardResponse:

        sites = self.repository.get_sites()

        # CandidateSite is the persisted source of truth for expensive
        # suitability/intelligence results. Fetch all candidates once so
        # dashboard rendering never recalculates suitability per site.
        candidate_by_site = self.repository.get_candidate_map()

        visualization_sites: list[
            GISVisualizationSite
        ] = []

        terrain_sites: list[
            TerrainMapSite
        ] = []

        comparison_sites: list[
            SiteComparisonItem
        ] = []

        # -----------------------------------------------------
        # Analytics collections
        # -----------------------------------------------------

        slope_values: list[float] = []
        vegetation_values: list[float] = []

        water_distance_values: list[float] = []
        protected_distance_values: list[float] = []

        road_distance_values: list[float] = []
        substation_distance_values: list[float] = []
        transmission_distance_values: list[float] = []

        enriched_sites = 0

        # =====================================================
        # PROCESS EACH SITE
        # =====================================================

        for site in sites:

            site_id = int(site.id)

            site_name = self._site_name(site)

            latitude = self._float(
                getattr(
                    site,
                    "latitude",
                    None,
                )
            )

            longitude = self._float(
                getattr(
                    site,
                    "longitude",
                    None,
                )
            )

            # =================================================
            # GIS DATA
            # =================================================

            land_use = (
                getattr(
                    site,
                    "land_use",
                    None,
                )
                or "Unknown"
            )

            land_slope = self._float(
                getattr(
                    site,
                    "land_slope",
                    None,
                )
            )

            vegetation_index = self._float(
                getattr(
                    site,
                    "vegetation_index",
                    None,
                )
            )

            road_distance = self._float(
                getattr(
                    site,
                    "road_distance",
                    None,
                )
            )

            substation_distance = self._float(
                getattr(
                    site,
                    "nearest_substation_distance",
                    None,
                )
            )

            transmission_distance = self._float(
                getattr(
                    site,
                    "nearest_transmission_line_distance",
                    None,
                )
            )

            water_distance = self._float(
                getattr(
                    site,
                    "water_body_distance",
                    None,
                )
            )

            protected_distance = self._float(
                getattr(
                    site,
                    "protected_area_distance",
                    None,
                )
            )

            # =================================================
            # GIS ENRICHMENT STATUS
            # =================================================

            if self._has_gis_data(site):
                enriched_sites += 1

            # =================================================
            # PERSISTED SITE SUITABILITY
            # =================================================

            # Do not invoke SiteSuitabilityService here. Dashboard
            # rendering must remain a read-only, bounded-cost operation.
            candidate = candidate_by_site.get(site_id)

            suitability_score = self._candidate_suitability_score(
                candidate
            )

            # =================================================
            # VISUALIZATION
            # =================================================

            visualization_sites.append(
                GISVisualizationSite(
                    site_id=site_id,
                    site_name=site_name,
                    latitude=(
                        latitude
                        if latitude is not None
                        else 0.0
                    ),
                    longitude=(
                        longitude
                        if longitude is not None
                        else 0.0
                    ),
                    suitability_score=round(
                        suitability_score,
                        2,
                    ),
                    land_use=land_use,
                )
            )

            # =================================================
            # TERRAIN
            # =================================================

            terrain_sites.append(
                TerrainMapSite(
                    site_id=site_id,
                    site_name=site_name,
                    latitude=(
                        latitude
                        if latitude is not None
                        else 0.0
                    ),
                    longitude=(
                        longitude
                        if longitude is not None
                        else 0.0
                    ),
                    land_slope=(
                        round(
                            land_slope,
                            2,
                        )
                        if land_slope is not None
                        else 0.0
                    ),
                )
            )

            # =================================================
            # SITE COMPARISON
            # =================================================

            comparison_sites.append(
                SiteComparisonItem(
                    site_id=site_id,
                    site_name=site_name,

                    suitability_score=round(
                        suitability_score,
                        2,
                    ),

                    land_use=land_use,

                    land_slope=(
                        round(
                            land_slope,
                            2,
                        )
                        if land_slope is not None
                        else 0.0
                    ),

                    vegetation_index=(
                        round(
                            vegetation_index,
                            4,
                        )
                        if vegetation_index is not None
                        else 0.0
                    ),

                    road_distance=(
                        round(
                            road_distance,
                            2,
                        )
                        if road_distance is not None
                        else 0.0
                    ),

                    substation_distance=(
                        round(
                            substation_distance,
                            2,
                        )
                        if substation_distance is not None
                        else 0.0
                    ),

                    transmission_line_distance=(
                        round(
                            transmission_distance,
                            2,
                        )
                        if transmission_distance is not None
                        else 0.0
                    ),

                    water_body_distance=(
                        round(
                            water_distance,
                            2,
                        )
                        if water_distance is not None
                        else 0.0
                    ),

                    protected_area_distance=(
                        round(
                            protected_distance,
                            2,
                        )
                        if protected_distance is not None
                        else 0.0
                    ),
                )
            )

            # =================================================
            # ANALYTICS
            #
            # IMPORTANT:
            # None is NOT treated as zero for averages.
            # =================================================

            self._append_if_present(
                slope_values,
                land_slope,
            )

            self._append_if_present(
                vegetation_values,
                vegetation_index,
            )

            self._append_if_present(
                water_distance_values,
                water_distance,
            )

            self._append_if_present(
                protected_distance_values,
                protected_distance,
            )

            self._append_if_present(
                road_distance_values,
                road_distance,
            )

            self._append_if_present(
                substation_distance_values,
                substation_distance,
            )

            self._append_if_present(
                transmission_distance_values,
                transmission_distance,
            )

        # =====================================================
        # ENVIRONMENTAL ANALYTICS
        # =====================================================

        environmental_analytics = (
            EnvironmentalAnalytics(
                average_vegetation_index=self._average(
                    vegetation_values
                ),

                average_water_body_distance=self._average(
                    water_distance_values
                ),

                average_protected_area_distance=self._average(
                    protected_distance_values
                ),

                average_road_distance=self._average(
                    road_distance_values
                ),

                average_substation_distance=self._average(
                    substation_distance_values
                ),

                average_transmission_line_distance=self._average(
                    transmission_distance_values
                ),
            )
        )

        # =====================================================
        # SUMMARY
        # =====================================================

        summary = GISSummary(
            total_sites=len(sites),

            enriched_sites=enriched_sites,

            average_slope=self._average(
                slope_values
            ),

            average_vegetation_index=self._average(
                vegetation_values
            ),
        )

        # =====================================================
        # FINAL RESPONSE
        # =====================================================

        return GISAnalystDashboardResponse(
            summary=summary,

            visualization_sites=(
                visualization_sites
            ),

            environmental_analytics=(
                environmental_analytics
            ),

            terrain_sites=(
                terrain_sites
            ),

            site_comparison=(
                comparison_sites
            ),
        )

    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _site_name(site) -> str:

        return (
            getattr(
                site,
                "name",
                None,
            )
            or getattr(
                site,
                "site_name",
                None,
            )
            or f"Site {site.id}"
        )

    # ---------------------------------------------------------
    # Safe float conversion
    # ---------------------------------------------------------

    @staticmethod
    def _float(
        value,
        default=None,
    ):

        if value is None:
            return default

        try:
            return float(value)

        except (
            TypeError,
            ValueError,
        ):
            return default

    # ---------------------------------------------------------
    # Persisted candidate suitability
    # ---------------------------------------------------------

    @staticmethod
    def _candidate_suitability_score(
        candidate,
    ) -> float:
        if candidate is None:
            return 0.0

        value = getattr(
            candidate,
            "suitability_score",
            None,
        )

        if value is None:
            snapshot = getattr(
                candidate,
                "analysis_snapshot",
                None,
            )
            if isinstance(snapshot, dict):
                suitability = snapshot.get("suitability")
                if isinstance(suitability, dict):
                    value = (
                        suitability.get("overall_score")
                        if suitability.get("overall_score") is not None
                        else suitability.get("suitability_score")
                    )
                if value is None:
                    value = snapshot.get("suitability_score")

        try:
            return float(value) if value is not None else 0.0
        except (TypeError, ValueError):
            return 0.0

    # ---------------------------------------------------------
    # Append only real values
    # ---------------------------------------------------------

    @staticmethod
    def _append_if_present(
        values: list[float],
        value,
    ) -> None:

        if value is None:
            return

        try:
            values.append(
                float(value)
            )

        except (
            TypeError,
            ValueError,
        ):
            return

    # ---------------------------------------------------------
    # Average
    # ---------------------------------------------------------

    @staticmethod
    def _average(
        values: list[float],
    ) -> float:

        if not values:
            return 0.0

        return round(
            sum(values) / len(values),
            2,
        )

    # ---------------------------------------------------------
    # GIS enrichment check
    # ---------------------------------------------------------

    @staticmethod
    def _has_gis_data(site) -> bool:

        fields = (
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

        return any(
            getattr(
                site,
                field,
                None,
            ) is not None
            for field in fields
        )