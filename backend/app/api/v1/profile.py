from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    UserProfileResponse,
    UserProfileUpdate,
)
from app.services.user_service import UserService

router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
)

@router.get(
    "",
    response_model=UserProfileResponse,
)
def get_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user

@router.put(
    "",
    response_model=UserProfileResponse,
)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_repository = UserRepository(db)
    role_repository = RoleRepository(db)

    service = UserService(
        user_repository=user_repository,
        role_repository=role_repository,
    )

    return service.update_profile(
        current_user,
        profile_data,
    )