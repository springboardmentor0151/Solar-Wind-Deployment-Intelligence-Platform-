from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, JSON, Float, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_model import TimestampMixin

if TYPE_CHECKING:
    from app.models.site import Site
    from app.models.user import User
    from app.models.project import Project


class CandidateSite(Base, TimestampMixin):
    """Planner-created renewable candidate awaiting PM review."""

    __tablename__ = "candidate_sites"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    site_id: Mapped[int] = mapped_column(
        ForeignKey("sites.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="PENDING_REVIEW", index=True
    )
    recommended_technology: Mapped[str] = mapped_column(String(50), nullable=False)
    suitability_score: Mapped[float] = mapped_column(Float, nullable=False)
    solar_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    wind_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    hybrid_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence: Mapped[str] = mapped_column(String(20), nullable=False)
    recommendation_reason: Mapped[str] = mapped_column(Text, nullable=False)
    analysis_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)

    reviewed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    reviewed_at: Mapped[object | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    project_id: Mapped[int | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )

    site: Mapped["Site"] = relationship()
    creator: Mapped["User"] = relationship(foreign_keys=[created_by])
    reviewer: Mapped["User | None"] = relationship(foreign_keys=[reviewed_by])
    project: Mapped["Project | None"] = relationship()
