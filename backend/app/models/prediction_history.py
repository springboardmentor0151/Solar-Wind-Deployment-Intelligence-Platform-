from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)

    site_id = Column(Integer, ForeignKey("sites.id"))

    predicted_power = Column(Float)

    solar_score = Column(Integer)

    wind_score = Column(Integer)

    overall_score = Column(Integer)

    best_energy_source = Column(String)

    recommendation = Column(String)

    model_name = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())