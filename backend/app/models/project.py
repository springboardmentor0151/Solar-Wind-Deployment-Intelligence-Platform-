import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.environment import EnvironmentalData
    from app.models.location import Location
    from app.models.prediction import Prediction
    from app.models.forecast import Forecast
    from app.models.report import Report


class ProjectType(str, enum.Enum):
    solar = "Solar"
    wind = "Wind"
    hybrid = "Hybrid"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(180), nullable=False, index=True)

    project_type: Mapped[ProjectType] = mapped_column(
        Enum(
            ProjectType,
            values_callable=lambda types: [item.value for item in types],
            native_enum=False,
        ),
        nullable=False,
    )

    region: Mapped[str] = mapped_column(String(160), nullable=False)

    capacity_mw: Mapped[float] = mapped_column(Float, nullable=False)

    description: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    owner: Mapped["User"] = relationship(
        "User",
        back_populates="projects",
    )

    environmental_data: Mapped["EnvironmentalData"] = relationship(
        "EnvironmentalData",
        back_populates="project",
        uselist=False,
        cascade="all, delete-orphan",
    )

    location: Mapped["Location"] = relationship(
        "Location",
        back_populates="project",
        uselist=False,
        cascade="all, delete-orphan",
    )

    prediction: Mapped["Prediction"] = relationship(
        "Prediction",
        back_populates="project",
        uselist=False,
        cascade="all, delete-orphan",
    )

    forecasts: Mapped[list["Forecast"]] = relationship(
        "Forecast",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    reports: Mapped[list["Report"]] = relationship(
        "Report",
        back_populates="project",
        cascade="all, delete-orphan",
    )