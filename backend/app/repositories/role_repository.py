from sqlalchemy.orm import Session

from app.models.role import Role
from app.repositories.base_repository import BaseRepository


class RoleRepository(BaseRepository[Role]):
    def __init__(self, db: Session):
        super().__init__(db)

    def get_all(self):
        return self.db.query(Role).all()

    def get_by_name(self, name: str):
        return (
            self.db.query(Role)
            .filter(Role.name == name)
            .first()
        )
    
    def get_by_id(self, role_id: int):
        return (
            self.db.query(Role)
            .filter(Role.id == role_id)
            .first()
        )

    def create(self, role: Role):
        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)
        return role