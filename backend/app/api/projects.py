from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.oauth2 import get_current_user
from app.auth.roles import require_role
from app.database.database import get_db
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
)
from app.services.project_service import ProjectService

router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)


@router.post(
    "",
    response_model=ProjectResponse
)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Admin"))
):
    try:
        return ProjectService.create_project(
            db,
            project,
            current_user["user_id"]
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "",
    response_model=list[ProjectResponse]
)
def get_projects(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return ProjectService.get_all_projects(db)


@router.get(
    "/{project_id}",
    response_model=ProjectResponse
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        return ProjectService.get_project_by_id(
            db,
            project_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.put(
    "/{project_id}",
    response_model=ProjectResponse
)
def update_project(
    project_id: int,
    project: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Admin"))
):
    try:
        return ProjectService.update_project(
            db,
            project_id,
            project
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Admin"))
):
    try:
        ProjectService.delete_project(
            db,
            project_id
        )

        return {
            "message": "Project deleted successfully."
        }

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )