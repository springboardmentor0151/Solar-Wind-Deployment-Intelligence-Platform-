from sqlalchemy.orm import Session

from app.models.project import Project
from app.repositories.base_repository import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, db: Session):
        super().__init__(db)

    def get_all(self):
        return (
            self.db.query(Project)
            .order_by(Project.created_at.desc())
            .all()
        )

    def get_by_owner(self, user_id: int):
        return (
            self.db.query(Project)
            .filter(Project.created_by == user_id)
            .order_by(Project.created_at.desc())
            .all()
        )

    def get_by_id(self, project_id: int):
        return (
            self.db.query(Project)
            .filter(Project.id == project_id)
            .first()
        )

    def get_by_name(self, name: str):
        return (
            self.db.query(Project)
            .filter(Project.name == name)
            .first()
        )

    def create(self, project: Project):
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def update(self, project: Project):
        self.db.commit()
        self.db.refresh(project)
        return project

    def delete(self, project: Project):
        self.db.delete(project)
        self.db.commit()