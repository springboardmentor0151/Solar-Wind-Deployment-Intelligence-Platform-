from pydantic import BaseModel
from datetime import datetime


class SiteCreate(BaseModel):
    site_name: str
    latitude: float
    longitude: float
    state: str
    district: str
    energy_type: str
    project_id: int


class SiteUpdate(BaseModel):
    site_name: str
    latitude: float
    longitude: float
    state: str
    district: str
    energy_type: str
    project_id: int
    status: str


class SiteResponse(BaseModel):
    id: int
    site_name: str
    latitude: float
    longitude: float
    state: str
    district: str
    energy_type: str
    status: str
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True