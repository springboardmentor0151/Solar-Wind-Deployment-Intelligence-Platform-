from pydantic import BaseModel


class ProjectCreate(BaseModel):
    project_name: str
    description: str
    location: str
class ProjectUpdate(BaseModel):
    project_name: str
    description: str
    location: str

class ProjectResponse(BaseModel):
    id: int
    project_name: str
    description: str
    location: str
    created_by: int


    class Config:
        from_attributes = True