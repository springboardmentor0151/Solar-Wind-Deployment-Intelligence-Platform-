from pydantic import BaseModel


class ProjectMini(BaseModel):
    id: int
    project_name: str

    model_config = {
        "from_attributes": True
    }


class SiteCreate(BaseModel):
    site_name: str
    latitude: float
    longitude: float
    area: float
    project_id: int


class SiteResponse(SiteCreate):
    id: int

    project: ProjectMini | None = None

    model_config = {
        "from_attributes": True
    }