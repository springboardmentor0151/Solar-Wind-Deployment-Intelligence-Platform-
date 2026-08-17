from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.site import Site
from app.models.user import User


class DashboardRepository:
    """
    Repository for platform-level dashboard statistics.

    This layer only reads database information.
    No business calculations are performed here.
    """

    def __init__(self, db: Session):
        self.db = db

    # =========================================================
    # BASIC COUNTS
    # =========================================================

    def count_projects(self) -> int:
        return (
            self.db
            .query(Project)
            .count()
        )

    def count_sites(self) -> int:
        return (
            self.db
            .query(Site)
            .count()
        )

    def count_users(self) -> int:
        return (
            self.db
            .query(User)
            .count()
        )

    # =========================================================
    # ENRICHED SITES
    # =========================================================

    def count_enriched_sites(self) -> int:
        """
        A site is considered enriched when GIS enrichment has
        populated at least its elevation.

        Elevation is used because it is currently available
        from the GIS enrichment pipeline even when optional
        Sentinel/NDVI data is unavailable.
        """

        return (
            self.db
            .query(Site)
            .filter(
                Site.elevation.isnot(None)
            )
            .count()
        )

    # =========================================================
    # TECHNOLOGY / SITE TYPE
    # =========================================================

    def get_sites(self) -> list[Site]:
        return (
            self.db
            .query(Site)
            .all()
        )