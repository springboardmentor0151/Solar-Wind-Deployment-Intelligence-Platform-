from sqlalchemy.orm import Session

from app.models.site import Site


class InvestmentRecommendationRepository:
    """
    Repository for investment recommendation.

    Site data remains owned by the existing Site module.
    Financial calculations remain in the Investment Service.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_site(self, site_id: int) -> Site | None:
        return (
            self.db.query(Site)
            .filter(Site.id == site_id)
            .first()
        )