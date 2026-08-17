from sqlalchemy.orm import Session

from app.models.site import Site


class EnergyForecastingRepository:
    """
    Repository for Energy Forecasting.

    Existing prediction/resource repositories remain the
    source of solar and wind intelligence.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_site(self, site_id: int) -> Site | None:
        return (
            self.db.query(Site)
            .filter(Site.id == site_id)
            .first()
        )