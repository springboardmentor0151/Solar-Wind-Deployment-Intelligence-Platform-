from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectRead, ProjectSummary
from app.services.project_service import (
    create_project,
    delete_project,
    get_project_or_none,
    list_projects,
    to_project_read,
    to_project_summary,
)


router = APIRouter(tags=["Projects"])


@router.get("/projects", response_model=list[ProjectSummary])
def read_projects(_: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[ProjectSummary]:
    return [to_project_summary(project) for project in list_projects(db)]


@router.post("/projects", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def save_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectRead:
    project = create_project(db, current_user.id, payload)
    return to_project_read(project)


@router.get("/project/{project_id}", response_model=ProjectRead)
def read_project(
    project_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectRead:
    project = get_project_or_none(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return to_project_read(project)


@router.delete("/project/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project(
    project_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    if not delete_project(db, project_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
