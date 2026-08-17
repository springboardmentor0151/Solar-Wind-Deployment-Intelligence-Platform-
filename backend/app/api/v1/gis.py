from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from app.api.deps import (
    get_gis_enrichment_service,
    get_gis_service,
)

from app.auth.dependencies import get_current_user
from app.auth.permissions import require_roles

from app.gis.exceptions import (
    GISException,
    InvalidCoordinatesError,
)

from app.gis.models.gis_result import GISResult

from app.schemas.geojson import (
    Feature,
    FeatureCollection,
)

from app.schemas.map import MapConfigResponse

from app.services.gis_enrichment_service import (
    GISEnrichmentService,
)

from app.services.gis_service import (
    GISService,
)


router = APIRouter(
    prefix="/gis",
    tags=["GIS"],
)


# =========================================================
# ALL SITES — GEOJSON
# =========================================================

@router.get(
    "/sites",
    response_model=FeatureCollection,
)
def get_all_sites(
    service: GISService = Depends(
        get_gis_service,
    ),
    current_user=Depends(
        require_roles(
            "Admin",
            "GIS Analyst",
            "Project Manager",
            "Renewable Energy Planner",
        )
    ),
):
    return service.get_all_sites_geojson()


# =========================================================
# SINGLE SITE — GEOJSON
# =========================================================

@router.get(
    "/sites/{site_id}",
    response_model=Feature,
)
def get_site(
    site_id: int,
    service: GISService = Depends(
        get_gis_service,
    ),
    current_user=Depends(
        get_current_user,
    ),
):
    try:
        return service.get_site_geojson(
            site_id
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


# =========================================================
# PROJECT SITES — GEOJSON
# =========================================================

@router.get(
    "/projects/{project_id}/sites",
    response_model=FeatureCollection,
)
def get_project_sites(
    project_id: int,
    service: GISService = Depends(
        get_gis_service,
    ),
    current_user=Depends(
        get_current_user,
    ),
):
    try:
        return service.get_project_geojson(
            project_id
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


# =========================================================
# BOUNDING BOX
# =========================================================

@router.get(
    "/bbox",
)
def get_bounding_box(
    service: GISService = Depends(
        get_gis_service,
    ),
    current_user=Depends(
        require_roles(
            "GIS Analyst",
            "Renewable Energy Planner",
            "Project Manager",
        )
    ),
):
    return service.get_bounding_box()


# =========================================================
# MAP SUMMARY
# =========================================================

@router.get(
    "/summary",
)
def get_summary(
    service: GISService = Depends(
        get_gis_service,
    ),
    current_user=Depends(
        require_roles(
            "GIS Analyst",
            "Renewable Energy Planner",
            "Project Manager",
        )
    ),
):
    return service.get_map_summary()


# =========================================================
# MAP CONFIGURATION
# =========================================================

@router.get(
    "/config",
    response_model=MapConfigResponse,
)
def get_map_config(
    service: GISService = Depends(
        get_gis_service,
    ),
    current_user=Depends(
        get_current_user,
    ),
):
    return service.get_map_config()


# =========================================================
# GIS / ENVIRONMENTAL ENRICHMENT
# =========================================================

@router.get(
    "/enrich",
    response_model=GISResult,
)
def enrich_coordinates(
    latitude: float = Query(
        ...,
        ge=-90,
        le=90,
    ),
    longitude: float = Query(
        ...,
        ge=-180,
        le=180,
    ),
    service: GISEnrichmentService = Depends(
        get_gis_enrichment_service,
    ),
    current_user=Depends(
        require_roles(
            "Admin",
            "GIS Analyst",
            "Project Manager",
            "Renewable Energy Planner",
        )
    ),
):
    """
    Enrich a geographic location using
    GIS/environmental data providers.

    This endpoint returns raw and directly derived
    geographic/environmental features.

    It does NOT calculate:

    - site suitability
    - deployment optimization
    - renewable recommendation
    - energy forecasting
    - investment recommendation
    """

    try:
        return service.enrich_site(
            latitude,
            longitude,
        )

    except InvalidCoordinatesError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    except GISException as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        )