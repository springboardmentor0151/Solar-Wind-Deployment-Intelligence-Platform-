from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.project import Project
from app.models.user import User
from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse
)

router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)


@router.post("/", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_roles(current_user, ["admin", "manager"])

    new_project = Project(
        project_name=project.project_name,
        description=project.description,
        location=project.location,
        created_by=current_user.id
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


@router.get("/", response_model=list[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    updated_project: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_roles(current_user, ["admin", "manager"])

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    if project.created_by != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to update this project"
        )

    project.project_name = updated_project.project_name
    project.description = updated_project.description
    project.location = updated_project.location

    db.commit()
    db.refresh(project)

    return project

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_roles(current_user, ["admin", "manager"])

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    if project.created_by != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to delete this project"
        )

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully"
    }