from app.models.role import Role
from app.repositories.role_repository import RoleRepository
from app.services.base_service import BaseService


class RoleService(BaseService[RoleRepository]):
    def get_all_roles(self):
        return self.repository.get_all()

    def get_role_by_name(self, name: str):
        return self.repository.get_by_name(name)

    def create_role(self, role: Role):
        return self.repository.create(role)