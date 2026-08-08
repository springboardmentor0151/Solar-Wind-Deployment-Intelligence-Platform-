from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles

from app.models.site import Site
from app.schemas.site import SiteCreate, SiteResponse

router = APIRouter(
    prefix="/sites",
    tags=["Sites"]
)


@router.post(
    "/",
    response_model=SiteResponse,
    status_code=status.HTTP_201_CREATED
)
def create_site(
    site: SiteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["Admin", "Planner"]))
):
    new_site = Site(
        site_name=site.site_name,
        latitude=site.latitude,
        longitude=site.longitude,
        area=site.area,
        project_id=site.project_id
    )

    db.add(new_site)
    db.commit()
    db.refresh(new_site)

    return new_site


@router.get(
    "/",
    response_model=list[SiteResponse]
)
def get_sites(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Site).all()


@router.get(
    "/{site_id}",
    response_model=SiteResponse
)
def get_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    site = (
        db.query(Site)
        .filter(Site.id == site_id)
        .first()
    )

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Site not found"
        )

    return site

@router.put(
    "/{site_id}",
    response_model=SiteResponse
)
def update_site(
    site_id: int,
    site: SiteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["Admin", "Planner"]))
):
    db_site = (
        db.query(Site)
        .filter(Site.id == site_id)
        .first()
    )

    if not db_site:
        raise HTTPException(
            status_code=404,
            detail="Site not found"
        )

    db_site.site_name = site.site_name
    db_site.latitude = site.latitude
    db_site.longitude = site.longitude
    db_site.area = site.area
    db_site.project_id = site.project_id

    db.commit()
    db.refresh(db_site)

    return db_site

@router.delete(
    "/{site_id}"
)
def delete_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["Admin"]))
):
    db_site = (
        db.query(Site)
        .filter(Site.id == site_id)
        .first()
    )

    if not db_site:
        raise HTTPException(
            status_code=404,
            detail="Site not found"
        )

    db.delete(db_site)
    db.commit()

    return {
        "message": "Site deleted successfully"
    }