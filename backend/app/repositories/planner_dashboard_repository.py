from sqlalchemy.orm import Session, joinedload
from app.models.candidate_site import CandidateSite

class PlannerDashboardRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_candidate_sites(self) -> list[CandidateSite]:
        return (
            self.db.query(CandidateSite)
            .options(joinedload(CandidateSite.site))
            .order_by(CandidateSite.created_at.desc())
            .all()
        )
