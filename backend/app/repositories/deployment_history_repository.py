from sqlalchemy.orm import Session

from app.models.deployment_history import DeploymentHistory


class DeploymentHistoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_project(self, project_id: int):
        return (
            self.db.query(DeploymentHistory)
            .filter(DeploymentHistory.project_id == project_id)
            .order_by(DeploymentHistory.created_at.desc())
            .all()
        )

    def get_by_id(self, deployment_id: int):
        return (
            self.db.query(DeploymentHistory)
            .filter(DeploymentHistory.id == deployment_id)
            .first()
        )

    def create(self, deployment: DeploymentHistory):
        self.db.add(deployment)
        self.db.commit()
        self.db.refresh(deployment)
        return deployment

    def update(self, deployment: DeploymentHistory):
        self.db.commit()
        self.db.refresh(deployment)
        return deployment
