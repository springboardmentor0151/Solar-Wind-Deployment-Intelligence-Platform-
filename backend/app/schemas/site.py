from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SiteCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    project_id: int


class SiteUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class SiteResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    project_id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }