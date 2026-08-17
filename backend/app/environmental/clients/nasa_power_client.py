import logging

import requests

from app.environmental.constants import (
    NASA_POWER_API_URL,
    REQUEST_TIMEOUT,
)
from app.environmental.exceptions import (
    NASAPowerServiceError,
)
from app.environmental.models.solar_result import (
    SolarResult,
)
from app.environmental.providers.nasa_power_query import (
    NASA_COMMUNITY,
    NASA_FORMAT,
    NASA_PARAMETERS,
    NASA_POWER_ENDPOINT,
)

logger = logging.getLogger(__name__)


class NASAPowerClient:
    """
    Client for NASA POWER API.

    Responsibility:
        Retrieve raw long-term solar resource data
        for a latitude/longitude.

    This client does NOT:
        - calculate suitability
        - calculate scores
        - make deployment recommendations
        - perform ML prediction
    """

    def get_solar_resource(
        self,
        latitude: float,
        longitude: float,
    ) -> SolarResult:

        logger.info(
            "Fetching NASA POWER data for (%s, %s)",
            latitude,
            longitude,
        )

        try:
            response = requests.get(
                f"{NASA_POWER_API_URL}{NASA_POWER_ENDPOINT}",
                params={
                    "parameters": ",".join(NASA_PARAMETERS),
                    "community": NASA_COMMUNITY,
                    "latitude": latitude,
                    "longitude": longitude,
                    "format": NASA_FORMAT,
                },
                timeout=REQUEST_TIMEOUT,
            )

            response.raise_for_status()

            data = response.json()

            parameters = (
                data.get("properties", {})
                .get("parameter", {})
            )

            if not parameters:
                raise NASAPowerServiceError(
                    "NASA POWER returned no parameter data."
                )

            ghi = parameters.get(
                "ALLSKY_SFC_SW_DWN",
                {},
            )

            dni = parameters.get(
                "ALLSKY_SFC_SW_DNI",
                {},
            )

            dhi = parameters.get(
                "ALLSKY_SFC_SW_DIFF",
                {},
            )

            def calculate_mean(
                values: dict,
            ) -> float | None:

                numeric_values = [
                    float(value)
                    for value in values.values()
                    if value is not None
                ]

                if not numeric_values:
                    return None

                return sum(numeric_values) / len(
                    numeric_values
                )

            ghi_value = calculate_mean(ghi)
            dni_value = calculate_mean(dni)
            dhi_value = calculate_mean(dhi)

            if (
                ghi_value is None
                and dni_value is None
                and dhi_value is None
            ):
                raise NASAPowerServiceError(
                    "NASA POWER returned no usable solar resource data."
                )

            return SolarResult(
                ghi=ghi_value,
                dni=dni_value,
                dhi=dhi_value,
                solar_irradiance=ghi_value,
            )

        except NASAPowerServiceError:
            raise

        except requests.Timeout as exc:

            logger.exception(
                "NASA POWER request timed out."
            )

            raise NASAPowerServiceError(
                "NASA POWER request timed out."
            ) from exc

        except requests.RequestException as exc:

            logger.exception(
                "NASA POWER request failed."
            )

            raise NASAPowerServiceError(
                f"NASA POWER request failed: {exc}"
            ) from exc

        except (ValueError, TypeError) as exc:

            logger.exception(
                "Invalid NASA POWER response."
            )

            raise NASAPowerServiceError(
                "NASA POWER returned invalid data."
            ) from exc