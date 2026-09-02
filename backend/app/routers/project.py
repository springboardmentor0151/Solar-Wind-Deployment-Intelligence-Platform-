from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectResponse
from app.auth.dependencies import admin_required


router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)


# -----------------------------
# Create Project
# -----------------------------

@router.post("/", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user = Depends(admin_required)
):

    new_project = Project(
        project_name=project.project_name,
        description=project.description
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


# -----------------------------
# Get All Projects
# -----------------------------

@router.get("/", response_model=list[ProjectResponse])
def get_projects(
    db: Session = Depends(get_db)
):

    projects = db.query(Project).all()

    return projects


# -----------------------------
# Get Project By ID
# -----------------------------

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db)
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


# -----------------------------
# Update Project
# -----------------------------

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    updated_project: ProjectCreate,
    db: Session = Depends(get_db)
):

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    project.project_name = updated_project.project_name
    project.description = updated_project.description

    db.commit()
    db.refresh(project)

    return project


# -----------------------------
# Delete Project
# -----------------------------

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
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