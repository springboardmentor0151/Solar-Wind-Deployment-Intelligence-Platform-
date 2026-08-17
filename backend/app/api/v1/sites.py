from fastapi import APIRouter, Depends

from app.api.deps import get_site_service

from app.auth.dependencies import get_current_user
from app.auth.permissions import require_roles

from app.models.user import User

from app.schemas.site import (
    SiteCreate,
    SiteResponse,
    SiteUpdate,
)

from app.services.site_service import SiteService


router = APIRouter(
    prefix="/sites",
    tags=["Sites"],
)


# =========================================================
# CREATE SITE
# =========================================================

@router.post(
    "",
    response_model=SiteResponse,
)
def create_site(
    site_data: SiteCreate,

    service: SiteService = Depends(
        get_site_service,
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Project Manager",
            "GIS Analyst",
        )
    ),
):
    """
    Create a site and automatically enrich it with
    GIS/environmental data.

    GIS Analysts create pre-project sites (project_id omitted).
    Project Managers/Admins retain the existing project-linked
    site creation capability.

    Flow:
        POST /sites
            ↓
        SiteService.create_site()
            ↓
        Save basic site record
            ↓
        GISEnrichmentService.enrich_site()
            ↓
        Update GIS/environmental fields
            ↓
        Return complete SiteResponse
    """

    return service.create_site(
        site_data,
        current_user,
    )


# =========================================================
# GET ALL SITES
# =========================================================

@router.get(
    "",
    response_model=list[SiteResponse],
)
def get_all_sites(
    service: SiteService = Depends(
        get_site_service,
    ),

    current_user: User = Depends(
        get_current_user,
    ),
):
    return service.get_all_sites(
        current_user,
    )


# =========================================================
# GET SITES BY PROJECT
# =========================================================

@router.get(
    "/project/{project_id}",
    response_model=list[SiteResponse],
)
def get_sites_by_project(
    project_id: int,

    service: SiteService = Depends(
        get_site_service,
    ),

    current_user: User = Depends(
        get_current_user,
    ),
):
    return service.get_sites_by_project(
        project_id,
        current_user,
    )


# =========================================================
# GET SITE BY ID
# =========================================================

@router.get(
    "/{site_id}",
    response_model=SiteResponse,
)
def get_site(
    site_id: int,

    service: SiteService = Depends(
        get_site_service,
    ),

    current_user: User = Depends(
        get_current_user,
    ),
):
    return service.get_site_by_id(
        site_id,
        current_user,
    )


# =========================================================
# UPDATE SITE
# =========================================================

@router.put(
    "/{site_id}",
    response_model=SiteResponse,
)
def update_site(
    site_id: int,
    site_data: SiteUpdate,

    service: SiteService = Depends(
        get_site_service,
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Project Manager",
            "GIS Analyst"
        )
    ),
):
    """
    Update a site.

    If latitude or longitude changes,
    SiteService re-runs GIS/environmental enrichment.
    """

    return service.update_site(
        site_id,
        site_data,
        current_user,
    )


# =========================================================
# DELETE SITE
# =========================================================

@router.delete(
    "/{site_id}",
)
def delete_site(
    site_id: int,

    service: SiteService = Depends(
        get_site_service,
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
        )
    ),
):
    return service.delete_site(
        site_id,
        current_user,
    )