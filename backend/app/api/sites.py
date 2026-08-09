from app.services.nasa_power import get_nasa_power_data
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.site import Site
from app.schemas.site import SiteCreate, SiteUpdate, SiteResponse

router = APIRouter(
    prefix="/sites",
    tags=["Sites"]
)


@router.post("/", response_model=SiteResponse)
def create_site(site: SiteCreate, db: Session = Depends(get_db)):
    new_site = Site(**site.model_dump())

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
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Site not found"
        )

    for key, value in updated_site.model_dump().items():
        setattr(site, key, value)

    db.commit()
    db.refresh(site)

    return site


@router.delete("/{site_id}")
def delete_site(site_id: int, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()

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

@router.get("/environment/")
def get_environment_data(
    latitude: float,
    longitude: float
):
    return get_nasa_power_data(
        latitude,
        longitude
    )