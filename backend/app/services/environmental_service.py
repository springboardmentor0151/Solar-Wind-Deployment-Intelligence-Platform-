"""
Environmental Data Collection Engine
=====================================
Pulls live solar/wind/climate data from NASA POWER + Open-Meteo, live elevation
from Open-Elevation, and live infrastructure proximity from OpenStreetMap's
Overpass API.

If any live source is unreachable (offline dev environment, rate limiting,
provider outage) the service transparently falls back to a physically-informed
synthetic model so every downstream engine (solar/wind prediction, suitability
scoring, forecasting) always has data to work with. Each response reports which
sources were actually used via `meta.sources`.

Every fallback logs *why* the live call failed (status code, timeout, parse
error, etc.) to the backend console, so a failure is always diagnosable instead
of silently swapping in synthetic data.
"""
import logging
import math
import random
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger("renewsite.environmental")

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


# --------------------------------------------------------------------------- #
# Public entry point
# --------------------------------------------------------------------------- #
async def get_environmental_profile(lat: float, lon: float) -> dict[str, Any]:
    """Aggregate solar, wind, climate, elevation, and infra data for a point."""
    sources_used: list[str] = []

    solar_wind_climate = await _fetch_nasa_power(lat, lon)
    if solar_wind_climate:
        sources_used.append("NASA POWER (climatology)")
    else:
        solar_wind_climate = _synthetic_nasa_power(lat, lon)
        sources_used.append("Synthetic climate model (NASA POWER unreachable)")

    open_meteo = await _fetch_open_meteo(lat, lon)
    if open_meteo:
        sources_used.append("Open-Meteo (forecast)")
        solar_wind_climate["current_wind_speed"] = open_meteo.get("current_wind_speed")
        solar_wind_climate["current_temperature"] = open_meteo.get("current_temperature")

    elevation = await _fetch_elevation(lat, lon)
    if elevation is not None:
        sources_used.append("Open-Elevation")
    else:
        elevation = _synthetic_elevation(lat, lon)
        sources_used.append("Synthetic terrain model (Open-Elevation unreachable)")

    infra = await _fetch_infrastructure(lat, lon)
    if infra:
        sources_used.append("OpenStreetMap Overpass")
    else:
        infra = _synthetic_infrastructure(lat, lon)
        sources_used.append("Synthetic infrastructure model (Overpass unreachable)")

    land_slope = _estimate_slope(lat, lon, elevation)
    vegetation_index = _synthetic_ndvi(lat, lon)

    return {
        "solar_irradiance_monthly": solar_wind_climate["irradiance_monthly"],
        "wind_speed_monthly": solar_wind_climate["wind_speed_monthly"],
        "temperature_monthly": solar_wind_climate["temperature_monthly"],
        "rainfall_monthly": solar_wind_climate["rainfall_monthly"],
        "cloud_cover_monthly": solar_wind_climate["cloud_cover_monthly"],
        "wind_direction_prevailing_deg": solar_wind_climate.get("wind_direction_deg", 180.0),
        "elevation_m": elevation,
        "land_slope_pct": land_slope,
        "vegetation_index": vegetation_index,
        "infrastructure": infra,
        "meta": {"sources": sources_used},
    }


# --------------------------------------------------------------------------- #
# NASA POWER — solar irradiance / wind speed / temperature / rainfall climatology
# --------------------------------------------------------------------------- #
async def _fetch_nasa_power(lat: float, lon: float) -> dict[str, Any] | None:
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN,WS10M,T2M,PRECTOTCORR,CLOUD_AMT",
        "community": "RE",
        "longitude": lon,
        "latitude": lat,
        "format": "JSON",
        "start": settings.NASA_POWER_START_YEAR,
        "end": settings.NASA_POWER_END_YEAR,
    }
    try:
        async with httpx.AsyncClient(timeout=settings.EXTERNAL_TIMEOUT) as client:
            resp = await client.get(settings.NASA_POWER_BASE_URL, params=params)
            if resp.status_code != 200:
                logger.warning(
                    "NASA POWER returned HTTP %s for (%s, %s): %s",
                    resp.status_code, lat, lon, resp.text[:300],
                )
                return None
            data = resp.json()
        params_block = data["properties"]["parameter"]
        months = [f"{i:02d}" for i in range(1, 13)]

        def series(key):
            return [params_block[key][m] for m in months]

        return {
            "irradiance_monthly": series("ALLSKY_SFC_SW_DWN"),
            "wind_speed_monthly": series("WS10M"),
            "temperature_monthly": series("T2M"),
            "rainfall_monthly": series("PRECTOTCORR"),
            "cloud_cover_monthly": series("CLOUD_AMT"),
        }
    except Exception as e:
        logger.warning("NASA POWER fetch failed for (%s, %s): %s: %s", lat, lon, type(e).__name__, e)
        return None


def _synthetic_nasa_power(lat: float, lon: float) -> dict[str, Any]:
    """Physically-informed synthetic climatology, seeded deterministically by location."""
    rng = random.Random(f"{round(lat, 2)}:{round(lon, 2)}")
    abs_lat = abs(lat)

    # Base annual solar irradiance decreases with |latitude| and increases near deserts (dry bands ~15-35deg)
    desert_band = math.exp(-((abs_lat - 23) ** 2) / (2 * 12 ** 2))
    base_irr = 3.5 + 3.2 * desert_band + max(0, (1 - abs_lat / 90)) * 1.5
    base_irr = min(base_irr, 7.5)

    base_wind = 3.0 + 3.5 * math.exp(-((abs_lat - 45) ** 2) / (2 * 15 ** 2)) + rng.uniform(-0.4, 0.4)
    base_temp = 28 - (abs_lat * 0.55) + rng.uniform(-1.5, 1.5)
    base_rain = 2.5 + 3.0 * math.exp(-((abs_lat - 5) ** 2) / (2 * 10 ** 2))
    base_cloud = 35 + 25 * math.exp(-((abs_lat - 5) ** 2) / (2 * 10 ** 2))

    irr, wind, temp, rain, cloud = [], [], [], [], []
    for m in range(12):
        # seasonal phase shifts sign depending on hemisphere
        phase = math.sin((m - (2 if lat >= 0 else 8)) / 12 * 2 * math.pi)
        irr.append(round(max(1.0, base_irr + phase * 1.1 + rng.uniform(-0.15, 0.15)), 2))
        wind.append(round(max(0.5, base_wind + phase * 0.8 + rng.uniform(-0.2, 0.2)), 2))
        temp.append(round(base_temp + phase * 8 + rng.uniform(-0.5, 0.5), 1))
        rain.append(round(max(0.0, base_rain + (1 - phase) * 1.5 + rng.uniform(-0.3, 0.3)), 2))
        cloud.append(round(min(100, max(5, base_cloud + (1 - phase) * 10 + rng.uniform(-3, 3))), 1))

    return {
        "irradiance_monthly": irr,
        "wind_speed_monthly": wind,
        "temperature_monthly": temp,
        "rainfall_monthly": rain,
        "cloud_cover_monthly": cloud,
        "wind_direction_deg": round(rng.uniform(0, 360), 1),
    }


# --------------------------------------------------------------------------- #
# Open-Meteo — current conditions (adds real-time freshness on top of climatology)
# --------------------------------------------------------------------------- #
async def _fetch_open_meteo(lat: float, lon: float) -> dict[str, Any] | None:
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,wind_speed_10m,cloud_cover",
    }
    try:
        async with httpx.AsyncClient(timeout=settings.EXTERNAL_TIMEOUT) as client:
            resp = await client.get(settings.OPEN_METEO_FORECAST_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
        current = data.get("current", {})
        return {
            "current_wind_speed": current.get("wind_speed_10m"),
            "current_temperature": current.get("temperature_2m"),
        }
    except Exception as e:
        logger.warning("Open-Meteo fetch failed for (%s, %s): %s: %s", lat, lon, type(e).__name__, e)
        return None


# --------------------------------------------------------------------------- #
# Open-Elevation — terrain elevation
# --------------------------------------------------------------------------- #
async def _fetch_elevation(lat: float, lon: float) -> float | None:
    try:
        async with httpx.AsyncClient(timeout=settings.EXTERNAL_TIMEOUT) as client:
            resp = await client.get(settings.OPEN_ELEVATION_URL, params={"locations": f"{lat},{lon}"})
            resp.raise_for_status()
            data = resp.json()
        return float(data["results"][0]["elevation"])
    except Exception as e:
        logger.warning("Open-Elevation fetch failed for (%s, %s): %s: %s", lat, lon, type(e).__name__, e)
        return None


def _synthetic_elevation(lat: float, lon: float) -> float:
    rng = random.Random(f"elev:{round(lat, 2)}:{round(lon, 2)}")
    # crude synthetic terrain using layered sine noise
    val = (
        200
        + 400 * math.sin(lat / 8) * math.cos(lon / 10)
        + 150 * math.sin(lat / 3 + lon / 5)
        + rng.uniform(-50, 50)
    )
    return round(max(-50, val), 1)


def _estimate_slope(lat: float, lon: float, elevation: float) -> float:
    rng = random.Random(f"slope:{round(lat, 3)}:{round(lon, 3)}")
    base = min(25.0, abs(elevation) / 250 * rng.uniform(0.5, 1.5))
    return round(max(0.1, base), 2)


def _synthetic_ndvi(lat: float, lon: float) -> float:
    rng = random.Random(f"ndvi:{round(lat, 2)}:{round(lon, 2)}")
    abs_lat = abs(lat)
    desert_band = math.exp(-((abs_lat - 23) ** 2) / (2 * 12 ** 2))
    tropical_band = math.exp(-((abs_lat - 2) ** 2) / (2 * 8 ** 2))
    ndvi = 0.15 + 0.55 * tropical_band - 0.1 * desert_band + rng.uniform(-0.05, 0.05)
    return round(min(0.95, max(0.02, ndvi)), 2)


# --------------------------------------------------------------------------- #
# OpenStreetMap Overpass — infrastructure proximity (roads, substations, water, urban)
# --------------------------------------------------------------------------- #
async def _fetch_infrastructure(lat: float, lon: float) -> dict[str, Any] | None:
    radius_m = 15000
    query = f"""
    [out:json][timeout:{int(settings.EXTERNAL_TIMEOUT)}];
    (
      way["highway"~"^(primary|secondary|trunk|motorway)$"](around:{radius_m},{lat},{lon});
      node["power"="substation"](around:{radius_m},{lat},{lon});
      way["power"="line"](around:{radius_m},{lat},{lon});
      node["place"~"^(city|town)$"](around:{radius_m},{lat},{lon});
      way["natural"="water"](around:{radius_m},{lat},{lon});
      way["landuse"="residential"](around:{radius_m},{lat},{lon});
    );
    out center 20;
    """
    try:
        async with httpx.AsyncClient(timeout=settings.OVERPASS_TIMEOUT) as client:
            resp = await client.post(settings.OVERPASS_URL, data={"data": query})
            if resp.status_code != 200:
                logger.warning(
                    "Overpass returned HTTP %s for (%s, %s): %s",
                    resp.status_code, lat, lon, resp.text[:300],
                )
                return None
            data = resp.json()

        elements = data.get("elements", [])

        def nearest_km(tag_pred):
            best = None
            for el in elements:
                if not tag_pred(el.get("tags", {}), el.get("type")):
                    continue
                elat = el.get("lat") or el.get("center", {}).get("lat")
                elon = el.get("lon") or el.get("center", {}).get("lon")
                if elat is None:
                    continue
                d = _haversine_km(lat, lon, elat, elon)
                if best is None or d < best:
                    best = d
            return round(best, 2) if best is not None else round(radius_m / 1000 * 1.3, 2)

        return {
            "distance_to_road_km": nearest_km(lambda t, ty: "highway" in t),
            "distance_to_substation_km": nearest_km(lambda t, ty: t.get("power") == "substation"),
            "distance_to_transmission_line_km": nearest_km(lambda t, ty: t.get("power") == "line"),
            "distance_to_urban_center_km": nearest_km(lambda t, ty: t.get("place") in ("city", "town")),
            "distance_to_water_km": nearest_km(lambda t, ty: t.get("natural") == "water"),
            "near_protected_zone": False,  # Overpass protected-area query omitted for latency
            "near_agricultural_land": any(t.get("landuse") == "farmland" for t in
                                           (el.get("tags", {}) for el in elements)),
        }
    except Exception as e:
        logger.warning("Overpass fetch/parse failed for (%s, %s): %s: %s", lat, lon, type(e).__name__, e)
        return None


def _synthetic_infrastructure(lat: float, lon: float) -> dict[str, Any]:
    rng = random.Random(f"infra:{round(lat, 2)}:{round(lon, 2)}")
    abs_lat = abs(lat)
    remoteness = 1.0 if (abs_lat > 55 or abs_lat < 5) else rng.uniform(0.3, 1.0)
    return {
        "distance_to_road_km": round(rng.uniform(0.5, 8) * (1 + remoteness), 2),
        "distance_to_substation_km": round(rng.uniform(2, 25) * (1 + remoteness), 2),
        "distance_to_transmission_line_km": round(rng.uniform(1, 20) * (1 + remoteness), 2),
        "distance_to_urban_center_km": round(rng.uniform(5, 60) * (1 + remoteness), 2),
        "distance_to_water_km": round(rng.uniform(1, 30), 2),
        "near_protected_zone": rng.random() < 0.08,
        "near_agricultural_land": rng.random() < 0.35,
    }


def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))
