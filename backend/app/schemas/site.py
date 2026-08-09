from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.db.models import SiteStatus


class SiteCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    region: Optional[str] = None
    country: Optional[str] = None
    land_area_hectares: float = 100.0
    land_ownership: Optional[str] = "Unspecified"
    notes: Optional[str] = None
    status: SiteStatus = SiteStatus.PROSPECTING
    target_operational_date: Optional[datetime] = None
    assigned_gis_analyst: Optional[str] = None
    assigned_project_manager: Optional[str] = None


class SiteUpdate(BaseModel):
    name: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    land_area_hectares: Optional[float] = None
    land_ownership: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[SiteStatus] = None
    target_operational_date: Optional[datetime] = None
    assigned_gis_analyst: Optional[str] = None
    assigned_project_manager: Optional[str] = None


class SiteOut(BaseModel):
    id: str
    project_id: str
    name: str
    region: Optional[str]
    country: Optional[str]
    latitude: float
    longitude: float
    land_area_hectares: float
    land_ownership: Optional[str]
    notes: Optional[str]
    status: SiteStatus
    target_operational_date: Optional[datetime]
    assigned_gis_analyst: Optional[str]
    assigned_project_manager: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AnalyzeRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    land_area_hectares: float = 100.0
