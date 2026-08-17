from sqlalchemy.orm import Session

from app.models.site import Site
from app.models.candidate_site import CandidateSite


class GISAnalystDashboardRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_sites(self) -> list[Site]:

        return (
            self.db
            .query(Site)
            .all()
        )

    def get_site(
        self,
        site_id: int,
    ) -> Site | None:

        return (
            self.db
            .query(Site)
            .filter(
                Site.id == site_id
            )
            .first()
        )

    def get_candidate_map(self) -> dict[int, CandidateSite]:
        """Return persisted candidate intelligence keyed by site id.

        Dashboard reads this snapshot instead of recalculating suitability
        for every site on every request.
        """
        candidates = (
            self.db
            .query(CandidateSite)
            .all()
        )
        return {
            int(candidate.site_id): candidate
            for candidate in candidates
        }
