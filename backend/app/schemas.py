from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ==========================
# USER
# ==========================

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_new_password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str


# ==========================
# PROJECT
# ==========================

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    region: str


class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    region: str
    owner_id: int

    class Config:
        from_attributes = True


# ==========================
# SITE
# ==========================

class SiteCreate(BaseModel):
    site_name: str
    latitude: float
    longitude: float

    land_area: Optional[float] = None
    elevation: Optional[float] = None

    infrastructure: Optional[str] = None
    land_ownership: Optional[str] = None

    # AI Prediction
    prediction: Optional[str] = None
    score: Optional[float] = None
    rating: Optional[str] = None

    project_id: int


class SiteOut(BaseModel):
    id: int
    site_name: str

    latitude: float
    longitude: float

    land_area: Optional[float]
    elevation: Optional[float]

    infrastructure: Optional[str]
    land_ownership: Optional[str]

    # AI Prediction
    prediction: Optional[str]
    score: Optional[float]
    rating: Optional[str]

    project_id: int

    class Config:
        from_attributes = True