from sqlalchemy import (
    Column,
    Integer,
    Float,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship

from datetime import datetime

from app.core.database import Base


class EnvironmentalData(Base):
    __tablename__ = "environmental_data"

    id = Column(Integer, primary_key=True, index=True)

    site_id = Column(
        Integer,
        ForeignKey("sites.id"),
        nullable=False
    )

    temperature = Column(Float)

    humidity = Column(Float)

    wind_speed = Column(Float)

    solar_irradiance = Column(Float)

    rainfall = Column(Float)

    air_pressure = Column(Float)

    recorded_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    site = relationship(
        "Site",
        back_populates="environmental_records"
    )