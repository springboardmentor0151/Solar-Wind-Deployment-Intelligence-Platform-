from __future__ import annotations

import logging

from app.gis.clients.elevation_client import (
    ElevationClient,
)

from app.gis.clients.osm_client import (
    OSMClient,
)

from app.gis.clients.sentinel_client import (
    SentinelClient,
)

from app.gis.coordinates import (
    validate_coordinates,
)

from app.gis.exceptions import (
    InvalidCoordinatesError,
)

from app.gis.models.gis_result import (
    GISResult,
)


logger = logging.getLogger(__name__)


class GISEnrichmentService:
    """
    GIS Data Enrichment Service.

    Collects geographic/environmental features from:

        - OpenStreetMap / Overpass
        - Open-Elevation
        - Sentinel Hub

    Produces raw/derived GIS data for downstream:

        - Environmental analysis
        - Feature engineering
        - ML prediction
        - Site suitability

    This service does NOT calculate:

        - ML predictions
        - renewable recommendations
        - deployment optimization
        - investment recommendations
    """

    def __init__(
        self,
        osm_client: OSMClient,
        elevation_client: ElevationClient,
        sentinel_client: SentinelClient,
    ):
        self.osm_client = osm_client
        self.elevation_client = elevation_client
        self.sentinel_client = sentinel_client

    # =========================================================
    # OSM
    # =========================================================

    def _get_osm_features(
        self,
        latitude: float,
        longitude: float,
    ) -> dict:

        try:
            features = self.osm_client.get_site_features(
                latitude,
                longitude,
            )

            if not isinstance(features, dict):
                logger.warning(
                    "OSM returned an invalid response for "
                    "(%s, %s).",
                    latitude,
                    longitude,
                )

                return self._empty_osm_result()

            return {
                "land_use": features.get(
                    "land_use"
                ),
                "road_distance": features.get(
                    "road_distance"
                ),
                "substation_distance": features.get(
                    "substation_distance"
                ),
                "transmission_distance": features.get(
                    "transmission_distance"
                ),
                "water_distance": features.get(
                    "water_distance"
                ),
                "protected_distance": features.get(
                    "protected_distance"
                ),
            }

        except Exception as exc:
            logger.exception(
                "OSM enrichment failed for "
                "(%s, %s): %s",
                latitude,
                longitude,
                exc,
            )

            return self._empty_osm_result()

    @staticmethod
    def _empty_osm_result() -> dict:
        """
        Missing GIS provider values remain None.

        Never replace missing provider data with zero.
        """

        return {
            "land_use": None,
            "road_distance": None,
            "substation_distance": None,
            "transmission_distance": None,
            "water_distance": None,
            "protected_distance": None,
        }

    # =========================================================
    # ELEVATION + SLOPE
    # =========================================================

    def _get_elevation_features(
        self,
        latitude: float,
        longitude: float,
    ) -> tuple[
        float | None,
        float | None,
    ]:

        elevation = None
        slope = None

        # -----------------------------------------------------
        # Elevation
        # -----------------------------------------------------

        try:
            elevation = (
                self.elevation_client.get_elevation(
                    latitude,
                    longitude,
                )
            )

        except Exception as exc:
            logger.exception(
                "Elevation lookup failed for "
                "(%s, %s): %s",
                latitude,
                longitude,
                exc,
            )

        # -----------------------------------------------------
        # Slope
        # -----------------------------------------------------

        try:
            slope = (
                self.elevation_client.get_slope(
                    latitude,
                    longitude,
                )
            )

        except Exception as exc:
            logger.exception(
                "Slope calculation failed for "
                "(%s, %s): %s",
                latitude,
                longitude,
                exc,
            )

        return elevation, slope

    # =========================================================
    # SENTINEL / NDVI
    # =========================================================

    def _get_vegetation_index(
        self,
        latitude: float,
        longitude: float,
    ) -> float | None:

        try:
            return (
                self.sentinel_client.get_vegetation_index(
                    latitude,
                    longitude,
                )
            )

        except Exception as exc:
            logger.exception(
                "Vegetation index lookup failed for "
                "(%s, %s): %s",
                latitude,
                longitude,
                exc,
            )

            return None

    # =========================================================
    # INFRASTRUCTURE DESCRIPTION
    # =========================================================

    @staticmethod
    def _build_infrastructure_description(
        road_distance: float | None,
        substation_distance: float | None,
        transmission_distance: float | None,
    ) -> str | None:

        infrastructure = []

        if road_distance is not None:
            infrastructure.append(
                f"Road ({road_distance:.2f} km)"
            )

        if substation_distance is not None:
            infrastructure.append(
                f"Substation ({substation_distance:.2f} km)"
            )

        if transmission_distance is not None:
            infrastructure.append(
                "Transmission Line "
                f"({transmission_distance:.2f} km)"
            )

        if not infrastructure:
            return None

        return ", ".join(infrastructure)

    # =========================================================
    # MAIN ENRICHMENT
    # =========================================================

    def enrich_site(
        self,
        latitude: float,
        longitude: float,
    ) -> GISResult:

        if not validate_coordinates(
            latitude,
            longitude,
        ):
            raise InvalidCoordinatesError(
                "Invalid latitude or longitude."
            )

        # -----------------------------------------------------
        # OSM
        # -----------------------------------------------------

        osm = self._get_osm_features(
            latitude,
            longitude,
        )

        # -----------------------------------------------------
        # Elevation + slope
        # -----------------------------------------------------

        elevation, slope = (
            self._get_elevation_features(
                latitude,
                longitude,
            )
        )

        # -----------------------------------------------------
        # Sentinel / NDVI
        # -----------------------------------------------------

        vegetation_index = (
            self._get_vegetation_index(
                latitude,
                longitude,
            )
        )

        # -----------------------------------------------------
        # Existing infrastructure
        # -----------------------------------------------------

        infrastructure = (
            self._build_infrastructure_description(
                road_distance=osm[
                    "road_distance"
                ],
                substation_distance=osm[
                    "substation_distance"
                ],
                transmission_distance=osm[
                    "transmission_distance"
                ],
            )
        )

        # -----------------------------------------------------
        # Final result
        # -----------------------------------------------------

        return GISResult(
            land_use=osm["land_use"],

            elevation=elevation,

            road_distance=osm[
                "road_distance"
            ],

            nearest_substation_distance=osm[
                "substation_distance"
            ],

            nearest_transmission_line_distance=osm[
                "transmission_distance"
            ],

            existing_infrastructure=infrastructure,

            water_body_distance=osm[
                "water_distance"
            ],

            protected_area_distance=osm[
                "protected_distance"
            ],

            land_slope=slope,

            vegetation_index=vegetation_index,
        )