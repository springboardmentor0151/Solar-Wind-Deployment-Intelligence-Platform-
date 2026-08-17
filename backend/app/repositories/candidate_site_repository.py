from sqlalchemy.orm import Session
from app.models.candidate_site import CandidateSite

class CandidateSiteRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, candidate_id: int):
        return self.db.query(CandidateSite).filter(CandidateSite.id == candidate_id).first()

    def get_by_site_id(self, site_id: int):
        return self.db.query(CandidateSite).filter(CandidateSite.site_id == site_id).first()

    def get_pending(self):
        return self.db.query(CandidateSite).filter(
            CandidateSite.status == "PENDING_REVIEW"
        ).order_by(CandidateSite.created_at.desc()).all()

    def get_approved(self):
        return self.db.query(CandidateSite).filter(
            CandidateSite.status == "APPROVED"
        ).order_by(CandidateSite.created_at.desc()).all()

    def create(self, candidate: CandidateSite):
        self.db.add(candidate)
        self.db.commit()
        self.db.refresh(candidate)
        return candidate

    def update(self, candidate: CandidateSite):
        self.db.commit()
        self.db.refresh(candidate)
        return candidate
