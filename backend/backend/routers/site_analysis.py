"""
Site analysis router.

POST /api/site-analysis is the single combined endpoint the frontend calls.
It fans out to NASA POWER, the elevation service, and OpenStreetMap
concurrently, then merges whatever came back into one response — a failure
in any one source is reported per-source in `sources` / `errors`, not as a
total request failure (unless ALL three fail).
"""

from __future__ import annotations

import asyncio

from fastapi import APIRouter

from ..schemas import (
    SiteAnalysisRequest,
    SiteAnalysisResponse,
    EnvironmentalData,
    TerrainData,
    GisData,
    SourceStatus,
    SolarPrediction,
)
from ..services.nasa_power_service import fetch_nasa_power_data
from ..services.elevation_service import fetch_elevation_data
from ..services.osm_service import fetch_osm_gis_data
from ..services.solarPredictions import calculate_solar_prediction

router = APIRouter(prefix="/api", tags=["site-analysis"])


@router.post("/site-analysis", response_model=SiteAnalysisResponse)
async def analyze_site(request: SiteAnalysisRequest) -> SiteAnalysisResponse:
    lat, lon = request.latitude, request.longitude

    # Run all three external lookups concurrently — this is the main reason
    # FastAPI/async was chosen over a synchronous framework for this route.
    nasa_result, elevation_result, osm_result = await asyncio.gather(
        fetch_nasa_power_data(lat, lon),
        fetch_elevation_data(lat, lon),
        fetch_osm_gis_data(lat, lon),
    )

    nasa_data, nasa_status, nasa_error = nasa_result
    elevation_data, elevation_status, elevation_error = elevation_result
    osm_data, osm_status, osm_error = osm_result

    # Generate solar prediction
    solar_prediction = {}

    if nasa_data:
        solar_prediction = calculate_solar_prediction(nasa_data)

    errors: dict[str, str] = {}
    if nasa_error:
        errors["nasaPower"] = nasa_error
    if elevation_error:
        errors["elevation"] = elevation_error
    if osm_error:
        errors["openStreetMap"] = osm_error

    all_failed = (
        nasa_status == "error"
        and elevation_status == "error"
        and osm_status == "error"
    )

    return SiteAnalysisResponse(
        success=not all_failed,
        environmentalData=EnvironmentalData(**(nasa_data or {})),
        terrainData=TerrainData(**(elevation_data or {})),
        gisData=GisData(**(osm_data or {})),
        sources=SourceStatus(
            nasaPower=nasa_status,
            elevation=elevation_status,
            openStreetMap=osm_status,
        ),
        solarPrediction=SolarPrediction(**solar_prediction),
        errors=errors,
    )


# ---------------------------------------------------------------------------
# Individual endpoints below are not required by the frontend — they exist
# purely so each data source can be tested in isolation via /docs or curl,
# without needing a projectId/siteId payload.
# ---------------------------------------------------------------------------


@router.get("/nasa-power")
async def get_nasa_power(latitude: float, longitude: float) -> dict:
    data, status, error = await fetch_nasa_power_data(latitude, longitude)
    return {"data": data, "status": status, "error": error}


@router.get("/elevation")
async def get_elevation(latitude: float, longitude: float) -> dict:
    data, status, error = await fetch_elevation_data(latitude, longitude)
    return {"data": data, "status": status, "error": error}


@router.get("/osm-gis")
async def get_osm_gis(latitude: float, longitude: float) -> dict:
    data, status, error = await fetch_osm_gis_data(latitude, longitude)
    return {"data": data, "status": status, "error": error}
