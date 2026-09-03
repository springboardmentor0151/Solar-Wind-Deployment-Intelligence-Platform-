from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), unique=True)
    solar_potential: Mapped[float] = mapped_column(Float, nullable=False)
    wind_potential: Mapped[float] = mapped_column(Float, nullable=False)
    energy_generation_forecast: Mapped[float] = mapped_column(Float, nullable=False)
    capacity_factor: Mapped[float] = mapped_column(Float, nullable=False)
    performance_ratio: Mapped[float] = mapped_column(Float, nullable=False)
    annual_energy_output: Mapped[float] = mapped_column(Float, nullable=False)
    wind_power_density: Mapped[float] = mapped_column(Float, nullable=False)
    suitability_score: Mapped[float] = mapped_column(Float, nullable=False)
    investment_score: Mapped[float] = mapped_column(Float, nullable=False)
    roi_estimate: Mapped[float] = mapped_column(Float, nullable=False)
    deployment_recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    technology_recommendation: Mapped[str] = mapped_column(String(220), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="prediction")
