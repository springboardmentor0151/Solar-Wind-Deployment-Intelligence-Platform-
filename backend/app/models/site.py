from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.database import Base


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)

    site_name = Column(String, nullable=False)

    latitude = Column(Float, nullable=False)

    longitude = Column(Float, nullable=False)

    state = Column(String, nullable=False)

    district = Column(String, nullable=False)

    energy_type = Column(String, nullable=False)

    status = Column(String, default="Pending")

    project_id = Column(
        Integer,
        ForeignKey("projects.id")
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )