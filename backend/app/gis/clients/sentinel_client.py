import logging

import requests

from app.core.config import settings
from app.gis.exceptions import SentinelServiceError

logger = logging.getLogger(__name__)


SENTINEL_TOKEN_URL = (
    "https://identity.dataspace.copernicus.eu/auth/realms/"
    "CDSE/protocol/openid-connect/token"
)

SENTINEL_STATISTICS_URL = (
    "https://sh.dataspace.copernicus.eu/api/v1/statistics"
)

REQUEST_TIMEOUT = 30


class SentinelClient:
    """
    Client for Copernicus Sentinel Hub.

    Provides satellite-derived vegetation information
    such as NDVI for GIS enrichment.

    This client does not calculate GIS suitability,
    infrastructure scores, or deployment scores.
    """

    def is_configured(self) -> bool:
        return bool(
            settings.SENTINEL_CLIENT_ID
            and settings.SENTINEL_CLIENT_SECRET
        )

    def _get_access_token(self) -> str:
        """
        Obtain a Sentinel Hub OAuth2 access token.
        """

        if not self.is_configured():
            raise SentinelServiceError(
                "Sentinel Hub credentials are not configured."
            )

        try:
            response = requests.post(
                SENTINEL_TOKEN_URL,
                data={
                    "grant_type": "client_credentials",
                    "client_id": settings.SENTINEL_CLIENT_ID,
                    "client_secret": settings.SENTINEL_CLIENT_SECRET,
                },
                timeout=REQUEST_TIMEOUT,
            )

            response.raise_for_status()

            token = response.json().get("access_token")

            if not token:
                raise SentinelServiceError(
                    "Sentinel Hub response did not contain an access token."
                )

            return token

        except requests.Timeout as exc:
            logger.exception(
                "Sentinel Hub authentication timed out."
            )

            raise SentinelServiceError(
                "Sentinel Hub authentication timed out."
            ) from exc

        except requests.RequestException as exc:
            logger.exception(
                "Sentinel Hub authentication failed."
            )

            raise SentinelServiceError(
                f"Sentinel Hub authentication failed: {exc}"
            ) from exc

    def get_vegetation_index(
        self,
        latitude: float,
        longitude: float,
    ) -> float | None:
        """
        Retrieve mean NDVI for a site.

        NDVI is treated as GIS enrichment data.

        Returns None when:
        - Sentinel is not configured
        - no valid satellite observations exist
        """

        if not self.is_configured():
            logger.info(
                "Sentinel Hub is not configured. "
                "Skipping NDVI lookup for (%s, %s).",
                latitude,
                longitude,
            )
            return None

        try:
            token = self._get_access_token()

            offset = 0.005

            request_body = {
                "input": {
                    "bounds": {
                        "bbox": [
                            longitude - offset,
                            latitude - offset,
                            longitude + offset,
                            latitude + offset,
                        ]
                    },
                    "data": [
                        {
                            "type": "sentinel-2-l2a"
                        }
                    ],
                },
                "aggregation": {
                    "timeRange": {
                        "from": "2024-01-01T00:00:00Z",
                        "to": "2024-12-31T23:59:59Z",
                    },
                    "aggregationInterval": {
                        "of": "P1D",
                    },
                    "evalscript": (
                        "//VERSION=3\n"
                        "function setup() {\n"
                        "  return {\n"
                        "    input: [\"B04\", \"B08\"],\n"
                        "    output: { bands: 1 }\n"
                        "  };\n"
                        "}\n"
                        "function evaluatePixel(sample) {\n"
                        "  let denominator = sample.B08 + sample.B04;\n"
                        "  if (denominator === 0) {\n"
                        "    return [0];\n"
                        "  }\n"
                        "  let ndvi = "
                        "(sample.B08 - sample.B04) / denominator;\n"
                        "  return [ndvi];\n"
                        "}"
                    ),
                },
            }

            response = requests.post(
                SENTINEL_STATISTICS_URL,
                json=request_body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                timeout=REQUEST_TIMEOUT,
            )

            response.raise_for_status()

            data = response.json()

            intervals = data.get("data", [])

            ndvi_values = []

            for interval in intervals:
                try:
                    mean = (
                        interval
                        .get("outputs", {})
                        .get("default", {})
                        .get("bands", {})
                        .get("B0", {})
                        .get("stats", {})
                        .get("mean")
                    )

                    if mean is not None:
                        ndvi_values.append(float(mean))

                except (TypeError, ValueError):
                    continue

            if not ndvi_values:
                logger.info(
                    "No valid NDVI observations returned for "
                    "(%s, %s).",
                    latitude,
                    longitude,
                )
                return None

            return round(
                sum(ndvi_values) / len(ndvi_values),
                4,
            )

        except SentinelServiceError:
            raise

        except requests.Timeout as exc:
            logger.exception(
                "Sentinel Hub request timed out."
            )

            raise SentinelServiceError(
                "Sentinel Hub request timed out."
            ) from exc

        except requests.RequestException as exc:
            logger.exception(
                "Sentinel Hub request failed."
            )

            raise SentinelServiceError(
                f"Sentinel Hub request failed: {exc}"
            ) from exc

        except (KeyError, TypeError, ValueError) as exc:
            logger.exception(
                "Invalid Sentinel Hub response."
            )

            raise SentinelServiceError(
                f"Invalid Sentinel Hub response: {exc}"
            ) from exc