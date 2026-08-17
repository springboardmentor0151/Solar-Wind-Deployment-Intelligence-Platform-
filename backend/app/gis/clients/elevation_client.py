import math

import requests

from app.gis.constants import (
    OPEN_ELEVATION_API_URL,
    REQUEST_TIMEOUT,
)
from app.gis.exceptions import ElevationServiceError
from app.gis.providers.elevation_query import (
    OPEN_ELEVATION_ENDPOINT,
)
import logging
from app.core.logging import logger

logger = logging.getLogger(__name__)

# Offset (in degrees) used to sample a neighboring point when
# deriving terrain slope. ~100m at the equator.
SLOPE_SAMPLE_OFFSET_DEGREES = 0.0009


class ElevationClient:
    """
    Client for Open-Elevation API.
    """

    def get_elevation(
        self,
        latitude: float,
        longitude: float,
    ) -> float | None:
        """
        Retrieve elevation from the Open-Elevation API.
        """

        logger.info(
            "Fetching elevation for (%s, %s)",
            latitude,
            longitude,
        )

        try:

            response = requests.get(
                f"{OPEN_ELEVATION_API_URL}{OPEN_ELEVATION_ENDPOINT}",
                params={
                    "locations": f"{latitude},{longitude}",
                },
                timeout=REQUEST_TIMEOUT,
            )

            response.raise_for_status()

            data = response.json()

            results = data.get("results", [])

            if not results:
                logger.warning(
                    "No elevation data returned for (%s, %s).",
                    latitude,
                    longitude,
                )
                return None

            elevation = results[0].get("elevation")

            logger.info(
                "Elevation retrieved successfully: %s m",
                elevation,
            )

            return elevation

        except requests.Timeout as exc:
            logger.exception("Elevation API request timed out.")
            raise ElevationServiceError(
                "Elevation API request timed out."
            ) from exc

        except requests.RequestException as exc:
            logger.exception("Elevation API request failed.")
            raise ElevationServiceError(
                f"Elevation API failed: {exc}"
            ) from exc

    def get_slope(
        self,
        latitude: float,
        longitude: float,
    ) -> float | None:
        """
        Estimate terrain slope (in degrees) for a site.

        Samples the elevation at the site plus one point
        offset ~100m to the north and one point offset
        ~100m to the east, then derives the slope from the
        steepest gradient between the site and its neighbors.

        Used for GIS terrain suitability / land suitability
        assessment (Milestone 2 - Geographic Intelligence Engine).
        """

        try:
            center_elevation = self.get_elevation(
                latitude,
                longitude,
            )

            north_elevation = self.get_elevation(
                latitude + SLOPE_SAMPLE_OFFSET_DEGREES,
                longitude,
            )

            east_elevation = self.get_elevation(
                latitude,
                longitude + SLOPE_SAMPLE_OFFSET_DEGREES,
            )

        except ElevationServiceError:
            logger.exception(
                "Elevation API request failed while computing slope."
            )
            return None

        if (
            center_elevation is None
            or north_elevation is None
            or east_elevation is None
        ):
            return None

        # ~100m sample distance, matching SLOPE_SAMPLE_OFFSET_DEGREES.
        sample_distance_m = 100.0

        rise_north = abs(north_elevation - center_elevation)
        rise_east = abs(east_elevation - center_elevation)

        steepest_rise = max(rise_north, rise_east)

        slope_degrees = math.degrees(
            math.atan(steepest_rise / sample_distance_m)
        )

        return round(slope_degrees, 2)