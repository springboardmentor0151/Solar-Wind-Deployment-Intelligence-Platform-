from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.site import Site
from app.models.user import User
from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.schemas.site import (
    SiteCreate,
    SiteUpdate,
    SiteResponse
)

router = APIRouter(
    prefix="/sites",
    tags=["Sites"]
)


@router.post("/", response_model=SiteResponse)
def create_site(
    site: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_roles(current_user, ["admin", "manager"])

    new_site = Site(
        site_name=site.site_name,
        latitude=site.latitude,
        longitude=site.longitude,
        capacity_mw=site.capacity_mw,
        site_type=site.site_type,
        project_id=site.project_id,
        created_by=current_user.id
    )

    db.add(new_site)
    db.commit()
    db.refresh(new_site)

    return new_site


@router.get("/", response_model=list[SiteResponse])
def get_sites(db: Session = Depends(get_db)):
    return db.query(Site).all()
@router.get("/{site_id}", response_model=SiteResponse)
def get_site(site_id: int, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Site not found"
        )

    return site
@router.put("/{site_id}", response_model=SiteResponse)
def update_site(
    site_id: int,
    updated_site: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_roles(current_user, ["admin", "manager"])

    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Site not found"
        )

    if site.created_by != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to update this site"
        )

    site.site_name = updated_site.site_name
    site.latitude = updated_site.latitude
    site.longitude = updated_site.longitude
    site.capacity_mw = updated_site.capacity_mw
    site.site_type = updated_site.site_type
    site.project_id = updated_site.project_id

    db.commit()
    db.refresh(site)

    return site
@router.delete("/{site_id}")
def delete_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_roles(current_user, ["admin", "manager"])

    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Site not found"
        )

    if site.created_by != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to delete this site"
        )

    db.delete(site)
    db.commit()

    return {
        "message": "Site deleted successfully"
    }