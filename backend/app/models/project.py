from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)

    project_name = Column(String(200), nullable=False)

    description = Column(Text)

    location = Column(String(200))

    created_by = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User")