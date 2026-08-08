import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# SQLAlchemy Models
class UserModel(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="planner")  # planner, analyst, manager, admin
    is_active = Column(Boolean, default=True)
    permissions = Column(String, nullable=True)
    
    organization = Column(String, nullable=True)
    department = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    country = Column(String, nullable=True)
    state = Column(String, nullable=True)
    city = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    google_picture = Column(String, nullable=True)
    skills = Column(String, nullable=True)
    education = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    github = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    is_onboarded = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)

class ProjectModel(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    region = Column(String, nullable=True)
    description = Column(String, nullable=True)
    country = Column(String, nullable=True)
    renewable_type = Column(String, default="solar")
    created_at = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    status = Column(String, default="Draft")  # Draft, Submitted, Under Review, Approved, Rejected, Completed
    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewer_name = Column(String, nullable=True)
    review_comments = Column(String, nullable=True)
    is_archived = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    assigned_analyst_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_administrator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    assigned_gis_analyst_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_project_manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assignment_date = Column(DateTime, nullable=True)
    
    gis_assigned_at = Column(DateTime, nullable=True)
    manager_assigned_at = Column(DateTime, nullable=True)
    admin_assigned_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    gis_comments = Column(String, nullable=True)
    manager_comments = Column(String, nullable=True)
    admin_comments = Column(String, nullable=True)
    
    gis_reviewed_at = Column(DateTime, nullable=True)
    manager_reviewed_at = Column(DateTime, nullable=True)
    admin_reviewed_at = Column(DateTime, nullable=True)
    
    gis_approved_at = Column(DateTime, nullable=True)
    manager_approved_at = Column(DateTime, nullable=True)
    admin_approved_at = Column(DateTime, nullable=True)
    
    gis_rejected_at = Column(DateTime, nullable=True)
    manager_rejected_at = Column(DateTime, nullable=True)
    admin_rejected_at = Column(DateTime, nullable=True)
    
    milestones = Column(String, default="[]")
    completion_percentage = Column(Integer, default=0)
    
    owner = relationship("UserModel", foreign_keys=[owner_id])
    sites = relationship("SiteModel", back_populates="project", cascade="all, delete-orphan")

    @property
    def owner_name(self):
        return self.owner.full_name if (self.owner and self.owner.full_name) else (self.owner.username if self.owner else f"User {self.owner_id}")

class SiteModel(Base):
    __tablename__ = "sites"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    region = Column(String, nullable=True)
    land_area = Column(Float, nullable=True)  # in hectares
    elevation = Column(Float, nullable=True)  # in meters
    existing_infrastructure = Column(String, nullable=True)  # JSON list
    land_ownership = Column(String, nullable=True)  # Public, Private, Lease
    
    # Suitability results
    suitability_score = Column(Float, nullable=True)
    suitability_category = Column(String, nullable=True)  # Excellent, Highly Suitable, etc.
    
    # Document storage fallback (MongoDB representation)
    details_json = Column(String, nullable=True)  # Stored as JSON string
    
    # New Columns
    country = Column(String, nullable=True)
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    solar_score = Column(Float, nullable=True)
    wind_score = Column(Float, nullable=True)
    recommended_plant = Column(String, nullable=True)
    analysis_date = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("ProjectModel", back_populates="sites")

    @property
    def project_name(self):
        return self.project.name if self.project else f"Project {self.project_id}"

class NotificationModel(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True, nullable=True)
    type = Column(String, nullable=False)  # weather, risk, suitability, system
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    recipient_role = Column(String, nullable=True)

class ReportModel(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    report_type = Column(String, nullable=False)  # solar, wind, suitability, investment
    content_json = Column(String, nullable=False)

class AuditLogModel(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    event = Column(String, nullable=False)
    user_email = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="success") # success, warning, error, info
    role = Column(String, nullable=True)
    action = Column(String, nullable=True)
    project_name = Column(String, nullable=True)


# Pydantic Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "planner"
    is_active: bool = True
    permissions: Optional[str] = None
    organization: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    experience: Optional[str] = None
    phone_number: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    profile_picture: Optional[str] = None
    google_picture: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    linkedin: Optional[str] = None
    linkedin_url: Optional[str] = None
    github: Optional[str] = None
    github_url: Optional[str] = None
    is_onboarded: Optional[bool] = True
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

class UserCreate(UserBase):
    password: str

    @field_validator('password')
    @classmethod
    def password_validation(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one number')
        special_chars = "!@#$%^&*()-_=+[]{}|;:',.<>?/~`\\\""
        if not any(char in special_chars for char in v):
            raise ValueError('Password must contain at least one special character')
        return v

    @field_validator('username')
    @classmethod
    def username_validation(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

class AssignableUserResponse(BaseModel):
    id: int
    full_name: Optional[str] = None
    role: str

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    organization: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    experience: Optional[str] = None
    phone_number: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    profile_picture: Optional[str] = None
    google_picture: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    linkedin: Optional[str] = None
    linkedin_url: Optional[str] = None
    github: Optional[str] = None
    github_url: Optional[str] = None
    is_onboarded: Optional[bool] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class GoogleLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: Optional[UserResponse] = None
    new_user: bool = False
    is_onboarded: bool = True

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class ProjectBase(BaseModel):
    name: str
    region: Optional[str] = None
    description: Optional[str] = None
    country: Optional[str] = None
    renewable_type: Optional[str] = "solar"
    status: Optional[str] = "Draft"
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewer_name: Optional[str] = None
    review_comments: Optional[str] = None
    is_archived: Optional[bool] = False
    updated_at: Optional[datetime] = None
    assigned_analyst_id: Optional[int] = None
    assigned_manager_id: Optional[int] = None
    assigned_administrator_id: Optional[int] = None
    assigned_gis_analyst_id: Optional[int] = None
    assigned_project_manager_id: Optional[int] = None
    assignment_date: Optional[datetime] = None
    gis_assigned_at: Optional[datetime] = None
    manager_assigned_at: Optional[datetime] = None
    admin_assigned_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    gis_comments: Optional[str] = None
    manager_comments: Optional[str] = None
    admin_comments: Optional[str] = None
    gis_reviewed_at: Optional[datetime] = None
    manager_reviewed_at: Optional[datetime] = None
    admin_reviewed_at: Optional[datetime] = None
    gis_approved_at: Optional[datetime] = None
    manager_approved_at: Optional[datetime] = None
    admin_approved_at: Optional[datetime] = None
    gis_rejected_at: Optional[datetime] = None
    manager_rejected_at: Optional[datetime] = None
    admin_rejected_at: Optional[datetime] = None
    milestones: Optional[str] = "[]"
    completion_percentage: Optional[int] = 0

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    region: Optional[str] = None
    description: Optional[str] = None
    country: Optional[str] = None
    renewable_type: Optional[str] = None
    status: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewer_name: Optional[str] = None
    review_comments: Optional[str] = None
    is_archived: Optional[bool] = None
    assigned_analyst_id: Optional[int] = None
    assigned_manager_id: Optional[int] = None
    assigned_administrator_id: Optional[int] = None
    assigned_gis_analyst_id: Optional[int] = None
    assigned_project_manager_id: Optional[int] = None
    assignment_date: Optional[datetime] = None
    gis_assigned_at: Optional[datetime] = None
    manager_assigned_at: Optional[datetime] = None
    admin_assigned_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    gis_comments: Optional[str] = None
    manager_comments: Optional[str] = None
    admin_comments: Optional[str] = None
    gis_reviewed_at: Optional[datetime] = None
    manager_reviewed_at: Optional[datetime] = None
    admin_reviewed_at: Optional[datetime] = None
    gis_approved_at: Optional[datetime] = None
    manager_approved_at: Optional[datetime] = None
    admin_approved_at: Optional[datetime] = None
    gis_rejected_at: Optional[datetime] = None
    manager_rejected_at: Optional[datetime] = None
    admin_rejected_at: Optional[datetime] = None
    milestones: Optional[str] = None
    completion_percentage: Optional[int] = None

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    owner_id: int
    owner_name: Optional[str] = None

    class Config:
        from_attributes = True

class SiteBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    region: Optional[str] = None
    land_area: Optional[float] = None
    elevation: Optional[float] = None
    existing_infrastructure: Optional[List[str]] = None
    land_ownership: Optional[str] = None

class SiteCreate(SiteBase):
    project_id: int

class SiteUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    region: Optional[str] = None
    land_area: Optional[float] = None
    elevation: Optional[float] = None
    existing_infrastructure: Optional[List[str]] = None
    land_ownership: Optional[str] = None

class SiteResponse(SiteBase):
    id: int
    project_id: int
    suitability_score: Optional[float] = None
    suitability_category: Optional[str] = None
    details_json: Optional[str] = None
    created_at: datetime
    existing_infrastructure: Optional[List[str]] = None
    
    # New fields
    country: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    solar_score: Optional[float] = None
    wind_score: Optional[float] = None
    recommended_plant: Optional[str] = None
    analysis_date: Optional[datetime] = None
    project_name: Optional[str] = None

    @field_validator('existing_infrastructure', mode='before')
    @classmethod
    def parse_infrastructure(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [v]
        return v

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    project_id: Optional[int] = None
    type: str
    message: str
    created_at: datetime
    is_read: bool
    user_id: Optional[int] = None
    recipient_role: Optional[str] = None

    class Config:
        from_attributes = True

class ReportResponse(BaseModel):
    id: int
    site_id: int
    name: str
    created_at: datetime
    report_type: str
    content_json: str

    class Config:
        from_attributes = True
