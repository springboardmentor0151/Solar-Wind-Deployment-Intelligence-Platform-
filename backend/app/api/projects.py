from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.project import Project
from app.models.user import User

from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse
)

from app.auth.password import (
    get_current_user,
    admin_required
)

router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)


@router.post("/", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    try:
        new_project = Project(
            name=project.name,
            description=project.description,
            location=project.location,
            energy_type=project.energy_type,
            created_by=current_user.id
        )

        db.add(new_project)
        db.commit()
        db.refresh(new_project)

        return new_project

    except Exception as e:
        db.rollback()
        print("\n========== PROJECT CREATE ERROR ==========")
        print(e)
        print("==========================================\n")
        raise


@router.get("/", response_model=list[ProjectResponse])
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Project).all()


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

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
    current_user: User = Depends(admin_required)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    project.name = updated_project.name
    project.description = updated_project.description
    project.location = updated_project.location
    project.energy_type = updated_project.energy_type
    project.status = updated_project.status

    db.commit()
    db.refresh(project)

    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully"
    }