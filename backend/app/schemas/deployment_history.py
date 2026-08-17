from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class DeploymentCreate(BaseSchema):
    site_id: int
    technology: str = Field(min_length=2, max_length=50)
    capacity_mw: Optional[float] = Field(default=None, gt=0)
    planned_start: Optional[datetime] = None
    notes: Optional[str] = None


class DeploymentStatusUpdate(BaseSchema):
    status: str = Field(pattern="^(DEPLOYMENT_PLANNED|ACTIVE|COMPLETE)$")
    actual_start: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None


class DeploymentHistoryResponse(BaseSchema):
    id: int
    project_id: int
    site_id: int
    technology: str
    capacity_mw: Optional[float] = None
    status: str
    planned_start: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    changed_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
