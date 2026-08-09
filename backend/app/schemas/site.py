from pydantic import BaseModel


class SiteCreate(BaseModel):
    site_name: str
    latitude: float
    longitude: float
    capacity_mw: float
    site_type: str
    project_id: int


class SiteUpdate(BaseModel):
    site_name: str
    latitude: float
    longitude: float
    capacity_mw: float
    site_type: str
    status: str


class SiteResponse(BaseModel):
    id: int
    site_name: str
    latitude: float
    longitude: float
    capacity_mw: float
    site_type: str
    status: str
    project_id: int
    created_by: int

    class Config:
        from_attributes = True