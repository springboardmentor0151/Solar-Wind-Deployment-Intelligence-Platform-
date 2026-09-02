from sqlalchemy import Column, Integer, Float, String
from app.database.database import Base


class Site(Base):
    __tablename__ = "sites"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    project_name = Column(
        String,
        nullable=True
    )

    location_name = Column(
        String,
        nullable=True
    )

    latitude = Column(
        Float,
        nullable=False
    )

    longitude = Column(
        Float,
        nullable=False
    )

    solar_score = Column(
        Float,
        default=0
    )

    wind_score = Column(
        Float,
        default=0
    )

    wind_potential = Column(
        Float,
        default=0
    )

    recommendation = Column(
        String,
        default="Not specified"
    )