from pydantic import BaseModel
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    location: str
    energy_type: str


class ProjectUpdate(BaseModel):
    name: str
    description: str | None = None
    location: str
    energy_type: str
    status: str


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    location: str
    energy_type: str
    status: str
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True