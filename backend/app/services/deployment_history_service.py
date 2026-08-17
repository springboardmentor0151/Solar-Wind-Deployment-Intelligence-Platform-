from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.deployment_history import DeploymentHistory
from app.models.project import Project
from app.models.site import Site
from app.repositories.deployment_history_repository import DeploymentHistoryRepository
from app.schemas.deployment_history import DeploymentCreate, DeploymentStatusUpdate


VALID_TRANSITIONS = {
    "PROJECT_PLANNING": {"DEPLOYMENT_PLANNED"},
    "DEPLOYMENT_PLANNED": {"ACTIVE"},
    "ACTIVE": {"COMPLETE"},
    "COMPLETE": set(),
}


class DeploymentHistoryService:
    """Manage the PM-controlled project deployment lifecycle."""

    def __init__(self, db: Session):
        self.db = db
        self.repository = DeploymentHistoryRepository(db)

    def list_for_project(self, project_id: int, current_user):
        self._check_project_access(project_id, current_user)
        return self.repository.get_by_project(project_id)

    def create(self, project_id: int, data: DeploymentCreate, current_user):
        self._check_project_access(project_id, current_user, write=True)

        project = self.db.query(Project).filter(Project.id == project_id).first()
        site = self.db.query(Site).filter(Site.id == data.site_id).first()
        if project is None:
            raise HTTPException(status_code=404, detail="Project not found")
        if site is None:
            raise HTTPException(status_code=404, detail="Site not found")
        if site.project_id != project_id:
            raise HTTPException(
                status_code=422,
                detail="The selected site does not belong to this project.",
            )

        deployment = DeploymentHistory(
            project_id=project_id,
            site_id=data.site_id,
            technology=data.technology,
            capacity_mw=data.capacity_mw,
            status="DEPLOYMENT_PLANNED",
            planned_start=data.planned_start,
            notes=data.notes,
            changed_by=current_user.id,
        )
        return self.repository.create(deployment)

    def update_status(self, deployment_id: int, data: DeploymentStatusUpdate, current_user):
        deployment = self.repository.get_by_id(deployment_id)
        if deployment is None:
            raise HTTPException(status_code=404, detail="Deployment record not found")

        self._check_project_access(deployment.project_id, current_user, write=True)

        allowed = VALID_TRANSITIONS.get(deployment.status, set())
        if data.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Invalid deployment transition: {deployment.status} -> {data.status}",
            )

        now = datetime.now(timezone.utc)
        deployment.status = data.status
        deployment.changed_by = current_user.id

        if data.actual_start is not None:
            deployment.actual_start = data.actual_start
        elif data.status == "ACTIVE" and deployment.actual_start is None:
            deployment.actual_start = now

        if data.completed_at is not None:
            deployment.completed_at = data.completed_at
        elif data.status == "COMPLETE":
            deployment.completed_at = now

        if data.notes is not None:
            deployment.notes = data.notes

        return self.repository.update(deployment)

    def _check_project_access(self, project_id: int, current_user, write: bool = False):
        if current_user.role.name == "Admin":
            return
        if current_user.role.name == "Project Manager" and current_user.id == self._project_owner(project_id):
            return
        if not write and current_user.role.name == "Renewable Energy Planner":
            # Planner gets read-only deployment history for planning context.
            if self._project_exists(project_id):
                return
        raise HTTPException(status_code=403, detail="You do not have access to this project deployment.")

    def _project_owner(self, project_id: int):
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if project is None:
            raise HTTPException(status_code=404, detail="Project not found")
        return project.created_by

    def _project_exists(self, project_id: int):
        return self.db.query(Project.id).filter(Project.id == project_id).first() is not None
