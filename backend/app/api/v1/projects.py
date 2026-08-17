from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.auth.dependencies import get_current_user
from app.auth.permissions import require_roles
from app.models.user import User
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.project_service import ProjectService
from app.services.notification_trigger_service import (
    NotificationTriggerService,
)
from app.api.deps import (
    get_notification_trigger_service,
    get_project_repository,
)


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


def get_project_service(
    project_repository: ProjectRepository = Depends(
        get_project_repository,
    ),
    notification_trigger_service: NotificationTriggerService = Depends(
        get_notification_trigger_service,
    ),
) -> ProjectService:
    return ProjectService(
        repository=project_repository,
        notification_trigger_service=notification_trigger_service,
    )


@router.post(
    "",
    response_model=ProjectResponse,
)
def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Project Manager",
        )
    ),
    service: ProjectService = Depends(
        get_project_service,
    ),
):
    return service.create_project(
        project_data,
        current_user,
    )


@router.get(
    "",
    response_model=list[ProjectResponse],
)
def get_projects(
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(
        get_project_service,
    ),
):
    return service.get_all_projects(
        current_user,
    )


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(
        get_project_service,
    ),
):
    return service.get_project_by_id(
        project_id,
        current_user,
    )


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Project Manager",
        )
    ),
    service: ProjectService = Depends(
        get_project_service,
    ),
):
    return service.update_project(
        project_id,
        project_data,
        current_user,
    )


@router.delete(
    "/{project_id}",
)
def delete_project(
    project_id: int,
    current_user: User = Depends(
        require_roles("Admin"),
    ),
    service: ProjectService = Depends(
        get_project_service,
    ),
):
    return service.delete_project(
        project_id,
        current_user,
    )