from sqlalchemy.orm import Session, joinedload

from app.models.candidate_site import CandidateSite
from app.models.project import Project
from app.models.site import Site


class ProjectManagerDashboardRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_projects(self) -> list[Project]:
        return self.db.query(Project).all()

    def get_sites(self) -> list[Site]:
        return self.db.query(Site).all()

    def get_approved_candidates(self) -> list[CandidateSite]:
        """
        Return approved candidate sites with their site/project loaded.

        This is the authoritative persisted-intelligence set for the
        Project Manager dashboard. The dashboard must aggregate these
        snapshots instead of recalculating site intelligence.
        """
        return (
            self.db.query(CandidateSite)
            .options(
                joinedload(CandidateSite.site),
                joinedload(CandidateSite.project),
            )
            .filter(CandidateSite.status == "APPROVED")
            .order_by(CandidateSite.created_at.desc())
            .all()
        )
