from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_model import TimestampMixin

if TYPE_CHECKING:
    from app.models.project import Project


class Site(Base, TimestampMixin):
    __tablename__ = "sites"

    __table_args__ = (
        CheckConstraint(
            "latitude >= -90 AND latitude <= 90",
            name="check_latitude",
        ),
        CheckConstraint(
            "longitude >= -180 AND longitude <= 180",
            name="check_longitude",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    region: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    land_area: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    elevation: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    existing_infrastructure: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # GIS / Environmental features
    land_use: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    road_distance: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    nearest_substation_distance: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    nearest_transmission_line_distance: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    water_body_distance: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    protected_area_distance: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    land_slope: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    vegetation_index: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    project_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "projects.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    project: Mapped["Project | None"] = relationship(
        back_populates="sites",
    )