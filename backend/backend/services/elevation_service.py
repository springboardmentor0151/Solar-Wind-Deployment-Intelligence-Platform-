"""
Elevation / Terrain Integration

Uses the Open-Elevation API to fetch elevation data.
"""

from __future__ import annotations

import asyncio
from typing import Optional

import httpx

from ..config import settings


async def fetch_elevation_data(
    latitude: float,
    longitude: float,
) -> tuple[Optional[dict], str, Optional[str]]:
    """
    Returns:
        (data, status, error_message)
    """

    params = {
        "locations": f"{latitude},{longitude}"
    }

    timeout = httpx.Timeout(
        connect=10.0,
        read=20.0,
        write=10.0,
        pool=10.0,
    )

    max_retries = 3

    for attempt in range(max_retries):

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:

                response = await client.get(
                    settings.ELEVATION_BASE_URL,
                    params=params,
                )

                response.raise_for_status()

                payload = response.json()

            results = payload.get("results", [])

            if not results:
                return (
                    {"elevation": None},
                    "success",
                    "No elevation data available.",
                )

            elevation = results[0].get("elevation")

            return (
                {"elevation": elevation},
                "success",
                None,
            )

        except httpx.TimeoutException:

            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
                continue

            return (
                {"elevation": None},
                "success",
                "Elevation service timed out.",
            )

        except httpx.HTTPStatusError as exc:

            return (
                {"elevation": None},
                "success",
                f"Elevation service returned HTTP {exc.response.status_code}.",
            )

        except httpx.RequestError:

            return (
                {"elevation": None},
                "success",
                "Unable to connect to elevation service.",
            )

        except ValueError:

            return (
                {"elevation": None},
                "success",
                "Invalid response received from elevation service.",
            )

        except Exception as exc:

            return (
                {"elevation": None},
                "success",
                "Unexpected error while fetching elevation.",
            )

    return (
        {"elevation": None},
        "success",
        "Elevation unavailable.",
    )