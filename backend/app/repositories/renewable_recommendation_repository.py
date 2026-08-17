from sqlalchemy.orm import Session

from app.models.site import Site


class RenewableRecommendationRepository:
    """
    Repository for renewable technology recommendations.

    This repository intentionally does not duplicate:
    - Solar prediction data
    - Wind prediction data
    - GIS data
    - Environmental data
    - Resource assessment data

    Those are already implemented elsewhere.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_site(self, site_id: int) -> Site | None:
        return (
            self.db.query(Site)
            .filter(Site.id == site_id)
            .first()
        )