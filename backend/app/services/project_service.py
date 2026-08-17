from fastapi import HTTPException, status

from app.models.project import Project
from app.models.user import User
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.base_service import BaseService
from app.services.notification_trigger_service import (
    NotificationTriggerService,
)


class ProjectService(BaseService[ProjectRepository]):
    def __init__(
        self,
        repository: ProjectRepository,
        notification_trigger_service: NotificationTriggerService,
    ):
        super().__init__(repository)

        self.notification_trigger_service = (
            notification_trigger_service
        )

    def get_all_projects(self, current_user: User):
        if current_user.role.name == "Admin":
            return self.repository.get_all()

        return self.repository.get_by_owner(
            current_user.id
        )

    def get_project_by_id(
        self,
        project_id: int,
        current_user: User,
    ):
        project = self.repository.get_by_id(project_id)

        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        self._check_access(project, current_user)

        return project

    def create_project(
        self,
        project_data: ProjectCreate,
        current_user: User,
    ):
        existing_project = self.repository.get_by_name(
            project_data.name
        )

        if existing_project:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Project name already exists",
            )

        project = Project(
            name=project_data.name,
            description=project_data.description,
            region=project_data.region,
            created_by=current_user.id,
        )

        project = self.repository.create(project)

        self.notification_trigger_service.project_created(
            project=project,
            user_id=current_user.id,
        )

        return project

    def update_project(
        self,
        project_id: int,
        project_data: ProjectUpdate,
        current_user: User,
    ):
        project = self.get_project_by_id(
            project_id,
            current_user,
        )

        if (
            project_data.name
            and project_data.name != project.name
        ):
            existing_project = self.repository.get_by_name(
                project_data.name
            )

            if existing_project:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Project name already exists",
                )

            project.name = project_data.name

        if project_data.description is not None:
            project.description = project_data.description

        if project_data.region is not None:
            project.region = project_data.region

        project = self.repository.update(project)

        self.notification_trigger_service.project_updated(
            project=project,
            user_id=project.created_by,
        )

        return project

    def delete_project(
        self,
        project_id: int,
        current_user: User,
    ):
        project = self.get_project_by_id(
            project_id,
            current_user,
        )

        self.repository.delete(project)

        self.notification_trigger_service.project_deleted(
            project=project,
            user_id=project.created_by,
        )

        return {
            "message": "Project deleted successfully"
        }

    @staticmethod
    def _check_access(
        project: Project,
        current_user: User,
    ):
        if current_user.role.name == "Admin":
            return

        if project.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this project",
            )