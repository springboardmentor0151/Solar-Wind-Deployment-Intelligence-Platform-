from pydantic import BaseModel, Field


class AdminUserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    is_active: bool
    role_id: int
    role_name: str


class AdminRoleResponse(BaseModel):
    id: int
    name: str
    description: str | None = None


class AdminUserRoleUpdate(BaseModel):
    role_id: int = Field(gt=0)


class AdminUserStatusUpdate(BaseModel):
    is_active: bool


class AdminOverviewResponse(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    total_projects: int
    total_sites: int
    roles: list[dict]
    system_status: str

class AdminDataSourceResponse(BaseModel):
    name: str
    category: str
    provider: str
    configured: bool
    status: str
    description: str


class AdminSystemHealthResponse(BaseModel):
    application: str
    database: str
    ml_prediction: str
    overall_status: str
    checks: list[dict]
