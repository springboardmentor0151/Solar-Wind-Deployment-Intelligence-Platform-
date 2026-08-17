import logging
import requests

from app.gis.constants import (
    DEFAULT_SEARCH_RADIUS,
    OVERPASS_API_URL,
    REQUEST_TIMEOUT,
)
from app.gis.coordinates import distance_between_points
from app.gis.exceptions import OSMServiceError
from app.gis.providers.overpass_query import (
    SITE_FEATURES_QUERY,
)

logger = logging.getLogger(__name__)


class OSMClient:
    """
    OpenStreetMap Overpass API Client.

    Uses ONE Overpass request to retrieve all nearby
    GIS features required by the platform.
    """

    def _execute_query(
        self,
        query: str,
    ) -> dict:

        logger.info("Executing Overpass query.")

        headers = {
            "User-Agent": (
                "SolarWindDeploymentIntelligence/1.0"
            ),
            "Accept": "application/json",
        }

        try:
            response = requests.post(
                OVERPASS_API_URL,
                data={"data": query},
                headers=headers,
                timeout=REQUEST_TIMEOUT,
            )

            response.raise_for_status()

            logger.info(
                "Overpass API request completed successfully."
            )

            return response.json()

        except requests.Timeout as exc:
            logger.exception(
                "Overpass API request timed out."
            )

            raise OSMServiceError(
                "OpenStreetMap request timed out."
            ) from exc

        except requests.RequestException as exc:
            logger.exception(
                "Overpass API request failed."
            )

            logger.error(
                "Status Code: %s",
                getattr(
                    exc.response,
                    "status_code",
                    None,
                ),
            )

            logger.error(
                "Response: %s",
                getattr(
                    exc.response,
                    "text",
                    None,
                ),
            )

            raise OSMServiceError(
                f"OpenStreetMap request failed: {exc}"
            ) from exc

    def _nearest_distance(
        self,
        latitude: float,
        longitude: float,
        elements: list,
    ) -> float | None:

        if not elements:
            return None

        distances = []

        for element in elements:

            if "lat" in element:
                lat = element["lat"]
                lon = element["lon"]

            elif "center" in element:
                lat = element["center"]["lat"]
                lon = element["center"]["lon"]

            else:
                continue

            distances.append(
                distance_between_points(
                    latitude,
                    longitude,
                    lat,
                    lon,
                )
            )

        return (
            round(min(distances), 2)
            if distances
            else None
        )

    def get_site_features(
        self,
        latitude: float,
        longitude: float,
    ) -> dict:

        query = SITE_FEATURES_QUERY.format(
            lat=latitude,
            lon=longitude,
            radius=DEFAULT_SEARCH_RADIUS,
        )

        data = self._execute_query(query)

        elements = data.get("elements", [])

        result = {
            "land_use": None,
            "road_distance": None,
            "substation_distance": None,
            "transmission_distance": None,
            "water_distance": None,
            "protected_distance": None,
        }

        roads = []
        substations = []
        transmission = []
        waters = []
        protected = []

        for element in elements:

            tags = element.get("tags", {})

            if (
                result["land_use"] is None
                and (
                    "landuse" in tags
                    or "natural" in tags
                    or "amenity" in tags
                    or "leisure" in tags
                )
            ):
                result["land_use"] = (
                    tags.get("landuse")
                    or tags.get("natural")
                    or tags.get("amenity")
                    or tags.get("leisure")
                )

            if "highway" in tags:
                roads.append(element)

            if tags.get("power") == "substation":
                substations.append(element)

            if tags.get("power") == "line":
                transmission.append(element)

            if (
                tags.get("natural") == "water"
                or "waterway" in tags
            ):
                waters.append(element)

            if (
                tags.get("boundary")
                == "protected_area"
                or tags.get("leisure")
                == "nature_reserve"
            ):
                protected.append(element)

        result["road_distance"] = self._nearest_distance(
            latitude,
            longitude,
            roads,
        )

        result[
            "substation_distance"
        ] = self._nearest_distance(
            latitude,
            longitude,
            substations,
        )

        result[
            "transmission_distance"
        ] = self._nearest_distance(
            latitude,
            longitude,
            transmission,
        )

        result["water_distance"] = self._nearest_distance(
            latitude,
            longitude,
            waters,
        )

        result[
            "protected_distance"
        ] = self._nearest_distance(
            latitude,
            longitude,
            protected,
        )

        return result