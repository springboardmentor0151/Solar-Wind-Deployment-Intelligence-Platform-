from sqlalchemy.orm import Session

from app.models.project import Project
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:

    @staticmethod
    def create_project(
        db: Session,
        project_data: ProjectCreate,
        user_id: int
    ):

        project = Project(
            name=project_data.name,
            description=project_data.description,
            location=project_data.location,
            created_by=user_id
        )

        return ProjectRepository.create(db, project)

    @staticmethod
    def get_all_projects(db: Session):
        return ProjectRepository.get_all(db)

    @staticmethod
    def get_project_by_id(
        db: Session,
        project_id: int
    ):

        project = ProjectRepository.get_by_id(
            db,
            project_id
        )

        if not project:
            raise ValueError("Project not found.")

        return project

    @staticmethod
    def update_project(
        db: Session,
        project_id: int,
        project_data: ProjectUpdate
    ):

        project = ProjectRepository.get_by_id(
            db,
            project_id
        )

        if not project:
            raise ValueError("Project not found.")

        update_data = project_data.model_dump(
            exclude_unset=True
        )

        for key, value in update_data.items():
            setattr(project, key, value)

        return ProjectRepository.update(db, project)

    @staticmethod
    def delete_project(
        db: Session,
        project_id: int
    ):

        project = ProjectRepository.get_by_id(
            db,
            project_id
        )

        if not project:
            raise ValueError("Project not found.")

        ProjectRepository.delete(db, project)

        return {
            "message": "Project deleted successfully."
        }