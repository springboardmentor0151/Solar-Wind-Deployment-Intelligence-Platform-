from fastapi import HTTPException, status

from app.auth.hashing import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserProfileUpdate
from app.services.base_service import BaseService

# Roles that may be explicitly selected during public registration.
# Admin is deliberately excluded; administrative provisioning is out of
# scope for the current target architecture phase.
REGISTERABLE_ROLE_NAMES = {
    "GIS Analyst",
    "Renewable Energy Planner",
    "Project Manager",
}


class UserService(BaseService[UserRepository]):
    def __init__(
        self,
        user_repository: UserRepository,
        role_repository: RoleRepository,
    ):
        super().__init__(user_repository)
        self.role_repository = role_repository

    def get_all_users(self):
        return self.repository.get_all()

    def get_user_by_email(self, email: str):
        return self.repository.get_by_email(email)

    def create_user(self, user: User):
        return self.repository.create(user)

    def register_user(self, user_data: UserCreate):
        if self.repository.get_by_email(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            )

        role = self.role_repository.get_by_id(user_data.role_id)

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found",
            )

        if role.name not in REGISTERABLE_ROLE_NAMES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "This role cannot be selected during public registration. "
                    "Choose GIS Analyst, Renewable Energy Planner, or "
                    "Project Manager."
                ),
            )

        user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            hashed_password=hash_password(user_data.password),
            role_id=user_data.role_id,
        )

        return self.repository.create(user)

    def authenticate_user(
        self,
        email: str,
        password: str,
    ):
        user = self.repository.get_by_email(email)

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not verify_password(
            password,
            user.hashed_password,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        access_token = create_access_token(
            {
                "sub": str(user.id),
                "email": user.email,
                "role": user.role.name,
            }
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    def update_profile(
        self,
        current_user: User,
        profile_data: UserProfileUpdate,
    ):
        current_user.full_name = profile_data.full_name

        return self.repository.update(current_user)