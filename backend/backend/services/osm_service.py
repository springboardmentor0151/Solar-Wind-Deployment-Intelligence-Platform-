"""
OpenStreetMap GIS integration via the public Overpass API.
"""

from __future__ import annotations

import asyncio
import httpx
from typing import Optional

from ..config import settings

_POWER_TAGS = [
    "line",
    "substation",
    "tower",
    "pole",
    "generator",
    "plant",
    "cable",
]


def _build_overpass_query(lat: float, lon: float, radius_m: int) -> str:
    power_filter = "|".join(_POWER_TAGS)

    return f"""
    [out:json][timeout:90];
    (
      way["highway"](around:{radius_m},{lat},{lon});
    )->.roads;

    (
      node["power"~"^({power_filter})$"](around:{radius_m},{lat},{lon});
      way["power"~"^({power_filter})$"](around:{radius_m},{lat},{lon});
    )->.power;

    (
      way["natural"="water"](around:{radius_m},{lat},{lon});
      way["waterway"](around:{radius_m},{lat},{lon});
      relation["natural"="water"](around:{radius_m},{lat},{lon});
    )->.water;

    (
      way["landuse"](around:{radius_m},{lat},{lon});
    )->.landuse;

    .roads out count;
    .power out count;
    .water out count;
    .landuse out tags 15;
    """


def _is_count_element(element: dict) -> bool:
    tags = element.get("tags", {})
    return set(tags.keys()) == {
        "total",
        "nodes",
        "ways",
        "relations",
    }


def _parse_overpass_response(payload: dict) -> dict:
    elements = payload.get("elements", [])

    counts = [
        el
        for el in elements
        if _is_count_element(el)
    ]

    landuse_elements = [
        el
        for el in elements
        if not _is_count_element(el)
    ]

    road_count = int(counts[0]["tags"]["total"]) if len(counts) > 0 else 0
    power_count = int(counts[1]["tags"]["total"]) if len(counts) > 1 else 0
    water_count = int(counts[2]["tags"]["total"]) if len(counts) > 2 else 0

    land_use = sorted(
        {
            el["tags"]["landuse"]
            for el in landuse_elements
            if "landuse" in el.get("tags", {})
        }
    )

    return {
        "nearbyRoads": road_count > 0,
        "roadCount": road_count,
        "nearbyPowerInfrastructure": power_count > 0,
        "powerInfrastructureCount": power_count,
        "nearbyWaterBodies": water_count > 0,
        "waterBodyCount": water_count,
        "landUse": land_use,
    }
async def _query_overpass(url: str, query: str) -> dict:
    """
    Sends one Overpass request with the required headers.
    """

    headers = {
        "User-Agent": settings.OVERPASS_USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=settings.OSM_TIMEOUT) as client:
        response = await client.post(
            url,
            data={"data": query},
            headers=headers,
        )

        response.raise_for_status()

        return response.json()


async def fetch_osm_gis_data(
    latitude: float,
    longitude: float,
) -> tuple[Optional[dict], str, Optional[str]]:

    query = _build_overpass_query(
        latitude,
        longitude,
        settings.OSM_SEARCH_RADIUS_METERS,
    )

    endpoints_to_try = [settings.OVERPASS_BASE_URL] + [
        url
        for url in settings.OVERPASS_FALLBACK_URLS
        if url != settings.OVERPASS_BASE_URL
    ]

    last_error: Optional[str] = None

    for url in endpoints_to_try:

        for attempt in range(2):

            try:

                payload = await _query_overpass(
                    url,
                    query,
                )

                return (
                    _parse_overpass_response(payload),
                    "success",
                    None,
                )
            except httpx.TimeoutException:

                if attempt == 0:
                    await asyncio.sleep(1)
                    continue

                last_error = "OpenStreetMap/Overpass request timed out."

            except httpx.HTTPStatusError as exc:

                if (
                    exc.response.status_code in (429, 500, 502, 503, 504)
                    and attempt == 0
                ):
                    await asyncio.sleep(1)
                    continue

                last_error = (
                    f"Overpass API returned HTTP {exc.response.status_code}."
                )

            except (KeyError, ValueError, TypeError, IndexError):

                last_error = (
                    "Overpass API returned an unexpected response format."
                )

                break

            except httpx.RequestError as exc:

                last_error = f"Overpass request failed: {exc}"

                break

            except Exception as exc:

                last_error = f"Unexpected Overpass error: {exc}"

                break

    return None, "error", last_error