from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Forecast(Base):
    __tablename__ = "forecasts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    month: Mapped[str] = mapped_column(String(12), nullable=False)
    solar_mwh: Mapped[float] = mapped_column(Float, nullable=False)
    wind_mwh: Mapped[float] = mapped_column(Float, nullable=False)
    hybrid_mwh: Mapped[float] = mapped_column(Float, nullable=False)

    project = relationship("Project", back_populates="forecasts")
