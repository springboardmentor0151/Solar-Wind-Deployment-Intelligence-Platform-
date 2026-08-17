import logging

import requests

from app.core.config import settings
from app.environmental.constants import (
    DEFAULT_LANGUAGE,
    DEFAULT_UNITS,
    REQUEST_TIMEOUT,
    WEATHER_API_URL,
)
from app.environmental.exceptions import (
    WeatherServiceError,
)
from app.environmental.models.weather_result import (
    WeatherResult,
)
from app.environmental.providers.weather_query import (
    CURRENT_WEATHER_ENDPOINT,
)

logger = logging.getLogger(__name__)


class WeatherClient:
    """
    Client for OpenWeather API.

    Responsibility:
        Retrieve raw weather observations for a
        latitude/longitude.

    No scoring or suitability logic belongs here.
    """

    def get_weather(
        self,
        latitude: float,
        longitude: float,
    ) -> WeatherResult:

        logger.info(
            "Fetching weather for (%s, %s)",
            latitude,
            longitude,
        )

        try:

            response = requests.get(
                f"{WEATHER_API_URL}{CURRENT_WEATHER_ENDPOINT}",
                params={
                    "lat": latitude,
                    "lon": longitude,
                    "appid": settings.OPENWEATHER_API_KEY,
                    "units": DEFAULT_UNITS,
                    "lang": DEFAULT_LANGUAGE,
                },
                timeout=REQUEST_TIMEOUT,
            )

            response.raise_for_status()

            data = response.json()

            main = data.get("main", {})
            wind = data.get("wind", {})
            clouds = data.get("clouds", {})
            rain = data.get("rain", {})

            return WeatherResult(
                temperature=main.get("temp"),
                humidity=main.get("humidity"),
                rainfall=rain.get("1h"),
                wind_speed=wind.get("speed"),
                wind_direction=wind.get("deg"),
                pressure=main.get("pressure"),
                cloud_cover=clouds.get("all"),
            )

        except requests.Timeout as exc:

            logger.exception(
                "OpenWeather request timed out."
            )

            raise WeatherServiceError(
                "Weather request timed out."
            ) from exc

        except requests.RequestException as exc:

            logger.exception(
                "OpenWeather request failed."
            )

            raise WeatherServiceError(
                f"OpenWeather API failed: {exc}"
            ) from exc

        except (ValueError, TypeError) as exc:

            logger.exception(
                "Invalid OpenWeather response."
            )

            raise WeatherServiceError(
                "OpenWeather returned invalid data."
            ) from exc