from pydantic import BaseModel

class ProjectCreate(BaseModel):
    project_name: str
    description: str


class ProjectResponse(ProjectCreate):
    id: int

    class Config:
        from_attributes = True