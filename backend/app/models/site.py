from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    site_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity_mw = Column(Float, nullable=False)
    site_type = Column(String, nullable=False)
    status = Column(String, default="Active")

    project_id = Column(Integer, ForeignKey("projects.id"))
    created_by = Column(Integer, ForeignKey("users.id"))

    project = relationship("Project")
    creator = relationship("User")