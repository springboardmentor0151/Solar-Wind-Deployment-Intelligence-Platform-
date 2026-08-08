from sqlalchemy.orm import Session

from app.auth.hashing import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate
from app.schemas.token import LoginRequest


class UserService:

    @staticmethod
    def register_user(db: Session, user_data: UserCreate):

        existing_user = UserRepository.get_by_email(
            db,
            user_data.email
        )

        if existing_user:
            raise ValueError("Email already registered.")

        user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            password=hash_password(user_data.password),
            role=user_data.role
        )

        return UserRepository.create(db, user)

    @staticmethod
    def login_user(db: Session, login_data: LoginRequest):

        user = UserRepository.get_by_email(
            db,
            login_data.email
        )

        if not user:
            raise ValueError("Invalid email or password.")

        if not verify_password(
            login_data.password,
            user.password
        ):
            raise ValueError("Invalid email or password.")

        access_token = create_access_token(
            {
                "sub": user.email,
                "user_id": user.id,
                "role": user.role
            }
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
            },
        }