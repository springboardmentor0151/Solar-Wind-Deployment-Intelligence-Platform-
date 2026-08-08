from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)

    site_name = Column(String(150), nullable=False)

    latitude = Column(Float)

    longitude = Column(Float)

    area = Column(Float)

    project_id = Column(Integer, ForeignKey("projects.id"))

    project = relationship(
        "Project",
        back_populates="sites"
    )

    environmental_records = relationship(
        "EnvironmentalData",
        back_populates="site",
        cascade="all, delete"
    )