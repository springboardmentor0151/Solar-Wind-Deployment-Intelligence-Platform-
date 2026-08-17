from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.auth.dependencies import get_current_user
from app.auth.permissions import require_roles
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import UserService


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


def get_user_service(db: Session) -> UserService:
    return UserService(
        user_repository=UserRepository(db),
        role_repository=RoleRepository(db),
    )


@router.post(
    "/register",
    response_model=UserResponse,
)
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    service = get_user_service(db)

    return service.register_user(user)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    service = get_user_service(db)

    return service.authenticate_user(
        email=login_data.email,
        password=login_data.password,
    )


@router.post(
    "/token",
    response_model=TokenResponse,
)
def token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    service = get_user_service(db)

    return service.authenticate_user(
        email=form_data.username,
        password=form_data.password,
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.get("/admin")
def admin_dashboard(
    current_user: User = Depends(
        require_roles("Admin")
    ),
):
    return {
        "message": "Welcome Admin!",
        "user": current_user.full_name,
        "role": current_user.role.name,
    }