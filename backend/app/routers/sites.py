from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db


router = APIRouter(
    prefix="/projects/{project_id}/sites",
    tags=["Sites"],
)


def _get_owned_project(project_id: str, db: Session, current_user: models.User) -> models.Project:
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role.value != "administrator" and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this project")

    return project


@router.post("/", response_model=schemas.SiteOut, status_code=status.HTTP_201_CREATED)
def create_site(
    project_id: str,
    site_in: schemas.SiteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    _get_owned_project(project_id, db, current_user)

    
    new_site = models.Site(
        project_id=project_id,
        name=site_in.name,
        latitude=site_in.latitude,
        longitude=site_in.longitude,
    )
    db.add(new_site)
    db.commit()
    db.refresh(new_site)
    return new_site


@router.get("/", response_model=List[schemas.SiteOut])
def list_sites(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    _get_owned_project(project_id, db, current_user)
    return db.query(models.Site).filter(models.Site.project_id == project_id).all()


@router.get("/{site_id}", response_model=schemas.SiteOut)
def get_site(
    project_id: str,
    site_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    _get_owned_project(project_id, db, current_user)

    site = db.query(models.Site).filter(
        models.Site.id == site_id,
        models.Site.project_id == project_id
    ).first()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    return site