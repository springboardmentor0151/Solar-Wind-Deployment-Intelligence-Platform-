from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from .. import models, database, auth

router = APIRouter(prefix="/projects", tags=["Projects"])


class ProjectCreate(BaseModel):
    name: str
    region: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    lat: Optional[float] = None  
    lon: Optional[float] = None  
    lng: Optional[float] = None  


@router.get("/")
def get_projects(db: Session = Depends(database.get_db), current_user = Depends(auth.get_current_user)):
    return db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()


@router.post("/", status_code=201)
def create_project(project: ProjectCreate, db: Session = Depends(database.get_db), current_user = Depends(auth.get_current_user)):
    lat_val = project.latitude if project.latitude is not None else (project.lat if project.lat is not None else None)
    lon_val = project.longitude if project.longitude is not None else (project.lon if project.lon is not None else project.lng)

    new_project = models.Project(
        name=project.name,
        region=project.region,
        description=project.description,
        latitude=lat_val,
        longitude=lon_val,
        owner_id=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: str, db: Session = Depends(database.get_db), current_user = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return None


@router.patch("/{project_id}/status")
def update_project_status(project_id: str, new_status: str, db: Session = Depends(database.get_db), current_user = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.status = new_status
    db.commit()
    return {"message": "Status updated successfully"}