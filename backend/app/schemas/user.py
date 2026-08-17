from app.schemas.base import BaseSchema
from app.schemas.role import RoleResponse
from pydantic import EmailStr
from pydantic import Field


class UserBase(BaseSchema):
    full_name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(
        min_length=8,
        max_length=128,
    )
    # Public registration may select only an operational role.
    # Admin is intentionally excluded from self-registration.
    role_id: int


class UserResponse(UserBase):
    id: int
    is_active: bool
    role: RoleResponse
    

class UserProfileUpdate(BaseSchema):
    full_name: str


class UserProfileResponse(UserResponse):
    pass