from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.site import Site
from app.schemas.site import SiteCreate, SiteResponse

from app.auth.dependencies import admin_required


router = APIRouter(
    prefix="/sites",
    tags=["Sites"]
)


# ========================================
# CREATE SITE
# ========================================

@router.post("/", response_model=SiteResponse)
def create_site(
    site: SiteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(admin_required)
):
    new_site = Site(
        project_name=site.project_name,
        location_name=site.location_name,
        latitude=site.latitude,
        longitude=site.longitude,
        solar_score=site.solar_score,
        wind_score=site.wind_score,
        wind_potential=site.wind_potential,
        recommendation=site.recommendation,
    )

    db.add(new_site)
    db.commit()
    db.refresh(new_site)

    return new_site


# ========================================
# GET ALL SITES
# ========================================

@router.get("/", response_model=list[SiteResponse])
def get_sites(
    db: Session = Depends(get_db)
):
    return (
        db.query(Site)
        .order_by(Site.id.desc())
        .all()
    )


# ========================================
# GET ONE SITE
# ========================================

@router.get("/{site_id}", response_model=SiteResponse)
def get_site(
    site_id: int,
    db: Session = Depends(get_db)
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


# ========================================
# UPDATE SITE
# ========================================

@router.put("/{site_id}", response_model=SiteResponse)
def update_site(
    site_id: int,
    updated: SiteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(admin_required)
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

    site.project_name = updated.project_name
    site.location_name = updated.location_name
    site.latitude = updated.latitude
    site.longitude = updated.longitude
    site.solar_score = updated.solar_score
    site.wind_score = updated.wind_score
    site.wind_potential = updated.wind_potential
    site.recommendation = updated.recommendation

    db.commit()
    db.refresh(site)

    return site


# ========================================
# DELETE SITE
# ========================================

@router.delete("/{site_id}")
def delete_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(admin_required)
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

    db.delete(site)
    db.commit()

    return {
        "message": "Site deleted successfully"
    }