"""
NASA POWER integration.

Fetches long-term climatology (annual averages) for a given latitude/longitude
from NASA's free, keyless POWER API. Used for:
  - Solar irradiance   (ALLSKY_SFC_SW_DWN)
  - Temperature         (T2M)
  - Wind speed          (WS10M)

This function never raises — it always returns a (data, status, error) tuple
so that one failing external service doesn't take down the whole
/api/site-analysis response.
"""

from __future__ import annotations

import httpx
from typing import Optional

from ..config import settings


async def fetch_nasa_power_data(
    latitude: float, longitude: float
) -> tuple[Optional[dict], str, Optional[str]]:
    """
    Returns (data, status, error_message).

    status is one of: "success", "error"
    data, when present, has keys: solarIrradiance, temperature, windSpeed
    """
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN,T2M,WS10M",
        "community": "RE",
        "longitude": longitude,
        "latitude": latitude,
        "format": "JSON",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.NASA_POWER_TIMEOUT) as client:
            response = await client.get(settings.NASA_POWER_BASE_URL, params=params)
            response.raise_for_status()
            payload = response.json()

        parameters = payload["properties"]["parameter"]

        # NASA POWER climatology returns monthly values plus an "ANN" (annual
        # average) key — that annual figure is what we want for a single
        # representative number per site.
        solar_irradiance = parameters.get("ALLSKY_SFC_SW_DWN", {}).get("ANN")
        temperature = parameters.get("T2M", {}).get("ANN")
        wind_speed = parameters.get("WS10M", {}).get("ANN")

        if solar_irradiance is None and temperature is None and wind_speed is None:
            return None, "error", "NASA POWER returned no usable parameter values."

        return (
            {
                "solarIrradiance": solar_irradiance,
                "temperature": temperature,
                "windSpeed": wind_speed,
            },
            "success",
            None,
        )

    except httpx.TimeoutException:
        return None, "error", "NASA POWER request timed out."
    except httpx.HTTPStatusError as exc:
        return None, "error", f"NASA POWER returned HTTP {exc.response.status_code}."
    except (KeyError, ValueError, TypeError):
        return None, "error", "NASA POWER returned an unexpected response format."
    except httpx.RequestError as exc:
        return None, "error", f"NASA POWER request failed: {exc}"
