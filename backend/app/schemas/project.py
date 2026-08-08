from pydantic import BaseModel


class ProjectCreate(BaseModel):
    project_name: str
    description: str
    location: str
    status: str


class ProjectResponse(ProjectCreate):
    id: int

    model_config = {
        "from_attributes": True
    }