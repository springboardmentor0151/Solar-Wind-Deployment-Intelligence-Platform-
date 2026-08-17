from sqlalchemy.orm import Session

from app.models.site import Site


class SuitabilityRepository:
    """
    Repository for site suitability.

    This repository is responsible only for retrieving
    the Site entity.

    Environmental, GIS, and ML data are obtained through
    their respective service layers.
    """

    def __init__(
        self,
        db: Session,
    ) -> None:

        self.db = db

    def get_site(
        self,
        site_id: int,
    ) -> Site | None:

        return (
            self.db.query(Site)
            .filter(Site.id == site_id)
            .first()
        )