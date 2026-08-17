from datetime import datetime
from typing import Optional

from app.schemas.base import BaseSchema


class ProjectBase(BaseSchema):
    """
    Common fields shared by all project schemas.
    """

    name: str
    description: Optional[str] = None
    region: str


class ProjectCreate(ProjectBase):
    """
    Schema used when creating a new project.
    """
    pass


class ProjectUpdate(BaseSchema):
    """
    Schema used when updating a project.
    """

    name: Optional[str] = None
    description: Optional[str] = None
    region: Optional[str] = None


class ProjectResponse(ProjectBase):
    """
    Schema returned to the client.
    """

    id: int
    created_by: int
    created_at: datetime