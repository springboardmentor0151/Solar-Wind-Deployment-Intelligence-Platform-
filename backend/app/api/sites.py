from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.roles import require_role
from app.auth.oauth2 import get_current_user
from app.database.database import get_db
from app.schemas.site import (
    SiteCreate,
    SiteUpdate,
    SiteResponse,
)
from app.services.site_service import SiteService

router = APIRouter(
    prefix="/sites",
    tags=["Sites"]
)


@router.post(
    "",
    response_model=SiteResponse
)
def create_site(
    site: SiteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Admin"))
):
    try:
        return SiteService.create_site(
            db,
            site
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "",
    response_model=list[SiteResponse]
)
def get_sites(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return SiteService.get_all_sites(db)

@router.get(
    "/project/{project_id}",
    response_model=list[SiteResponse]
)
def get_sites_by_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return SiteService.get_sites_by_project(
        db,
        project_id
    )

@router.get(
    "/{site_id}",
    response_model=SiteResponse
)
def get_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        return SiteService.get_site_by_id(
            db,
            site_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.put(
    "/{site_id}",
    response_model=SiteResponse
)
def update_site(
    site_id: int,
    site: SiteUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Admin"))
):
    try:
        return SiteService.update_site(
            db,
            site_id,
            site
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.delete("/{site_id}")
def delete_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Admin"))
):
    try:
        SiteService.delete_site(
            db,
            site_id
        )

        return {
            "message": "Site deleted successfully."
        }

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )