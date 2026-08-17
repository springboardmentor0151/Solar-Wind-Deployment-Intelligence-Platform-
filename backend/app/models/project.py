from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_model import TimestampMixin

if TYPE_CHECKING:
    from app.models.site import Site
    from app.models.user import User


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    __table_args__ = (
        UniqueConstraint(
            "name",
            name="uq_project_name",
        ),
        Index(
            "idx_project_region",
            "region",
        ),
        Index(
            "idx_project_created_by",
            "created_by",
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

    region: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    owner: Mapped["User"] = relationship(
        back_populates="projects",
        lazy="select",
    )

    sites: Mapped[list["Site"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )