from sqlalchemy.orm import Session

from app.models.site import Site


class DeploymentOptimizationRepository:
    """
    Repository for deployment optimization.

    Existing GIS, site, suitability and prediction
    repositories remain responsible for their own data.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_site(self, site_id: int) -> Site | None:
        return (
            self.db.query(Site)
            .filter(Site.id == site_id)
            .first()
        )

    def get_candidate_sites(self) -> list[Site]:
        return (
            self.db.query(Site)
            .all()
        )