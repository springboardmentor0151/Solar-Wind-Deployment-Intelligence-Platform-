from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database.database import Base
from geoalchemy2 import Geometry

class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)

    latitude = Column(Float, nullable=False)

    longitude = Column(Float, nullable=False)

    geometry = Column(
        Geometry(
            geometry_type="POINT",
            srid=4326
        ),
        nullable=True
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )