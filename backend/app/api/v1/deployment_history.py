from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.auth.permissions import require_roles
from app.schemas.deployment_history import (
    DeploymentCreate,
    DeploymentHistoryResponse,
    DeploymentStatusUpdate,
)
from app.services.deployment_history_service import DeploymentHistoryService

router = APIRouter(prefix="/deployments", tags=["Deployment History"])


@router.get(
    "/projects/{project_id}",
    response_model=list[DeploymentHistoryResponse],
)
def list_project_deployments(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("Admin", "Project Manager", "Renewable Energy Planner")
    ),
):
    return DeploymentHistoryService(db).list_for_project(project_id, current_user)


@router.post(
    "/projects/{project_id}",
    response_model=DeploymentHistoryResponse,
)
def create_project_deployment(
    project_id: int,
    data: DeploymentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("Admin", "Project Manager")),
):
    return DeploymentHistoryService(db).create(project_id, data, current_user)


@router.put(
    "/{deployment_id}/status",
    response_model=DeploymentHistoryResponse,
)
def update_deployment_status(
    deployment_id: int,
    data: DeploymentStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("Admin", "Project Manager")),
):
    return DeploymentHistoryService(db).update_status(
        deployment_id, data, current_user
    )
