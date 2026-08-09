"""
Configuration loader for the Solar & Wind backend.

All values come from environment variables (loaded from a .env file via
python-dotenv). Nothing here is hardcoded — see .env.example for the
variables you need to set locally.
"""

from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ------------------------------------------------------------------
    # Frontend CORS Origins
    # ------------------------------------------------------------------
    FRONTEND_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]

    # ------------------------------------------------------------------
    # API Timeouts (seconds)
    # Increased timeout values because public APIs may respond slowly.
    # ------------------------------------------------------------------
    NASA_POWER_TIMEOUT: float = float(
        os.getenv("NASA_POWER_TIMEOUT", "20")
    )

    ELEVATION_TIMEOUT: float = float(
        os.getenv("ELEVATION_TIMEOUT", "20")
    )

    OSM_TIMEOUT: float = float(
        os.getenv("OSM_TIMEOUT", "20")
    )

    # ------------------------------------------------------------------
    # OSM Search Radius (meters)
    # ------------------------------------------------------------------
    OSM_SEARCH_RADIUS_METERS: int = int(
        os.getenv("OSM_SEARCH_RADIUS_METERS", "1000")
    )

    # ------------------------------------------------------------------
    # External API URLs
    # ------------------------------------------------------------------
    NASA_POWER_BASE_URL: str = os.getenv(
        "NASA_POWER_BASE_URL",
        "https://power.larc.nasa.gov/api/temporal/climatology/point",
    )

    ELEVATION_BASE_URL: str = os.getenv(
        "ELEVATION_BASE_URL",
        "https://api.open-elevation.com/api/v1/lookup",
    )

    OVERPASS_BASE_URL: str = os.getenv(
        "OVERPASS_BASE_URL",
        "https://overpass-api.de/api/interpreter",
    )

    # ------------------------------------------------------------------
    # Overpass Backup Servers
    # ------------------------------------------------------------------
    OVERPASS_FALLBACK_URLS: list[str] = [
        url.strip()
        for url in os.getenv(
            "OVERPASS_FALLBACK_URLS",
            "https://overpass.kumi.systems/api/interpreter,"
            "https://lz4.overpass-api.de/api/interpreter",
        ).split(",")
        if url.strip()
    ]

    # ------------------------------------------------------------------
    # User-Agent for Overpass API
    # ------------------------------------------------------------------
    OVERPASS_USER_AGENT: str = os.getenv(
        "OVERPASS_USER_AGENT",
        "SolarWindDeploymentIntelligence/1.0 "
        "(Milestone2; contact: varshithabhavanam6@gmail.com)",
    )


settings = Settings()