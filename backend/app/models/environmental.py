from sqlalchemy import Column, Integer, Float, String, ForeignKey
from app.database.database import Base


class EnvironmentalData(Base):
    __tablename__ = "environmental_data"

    id = Column(Integer, primary_key=True, index=True)

    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)

    solar_irradiance = Column(Float, nullable=False)

    wind_speed = Column(Float, nullable=False)

    temperature = Column(Float, nullable=False)

    rainfall = Column(Float, nullable=False)

    cloud_cover = Column(Float, nullable=False)

    created_by = Column(Integer, ForeignKey("users.id"))