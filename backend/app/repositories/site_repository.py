from sqlalchemy.orm import Session

from app.models.site import Site
from app.repositories.base_repository import BaseRepository


class SiteRepository(BaseRepository[Site]):

    def __init__(
        self,
        db: Session,
    ):
        super().__init__(db)

    # =========================================================
    # GET ALL
    # =========================================================

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
    ):
        return (
            self.db.query(Site)
            .order_by(
                Site.created_at.desc()
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    # =========================================================
    # GET BY ID
    # =========================================================

    def get_by_id(
        self,
        site_id: int,
    ):
        return (
            self.db.query(Site)
            .filter(
                Site.id == site_id
            )
            .first()
        )

    # =========================================================
    # GET BY PROJECT
    # =========================================================

    def get_by_project(
        self,
        project_id: int,
    ):
        return (
            self.db.query(Site)
            .filter(
                Site.project_id == project_id
            )
            .order_by(
                Site.created_at.desc()
            )
            .all()
        )

    # =========================================================
    # CREATE
    # =========================================================

    def create(
        self,
        site: Site,
    ):
        self.db.add(site)

        self.db.commit()

        self.db.refresh(site)

        return site

    # =========================================================
    # UPDATE
    # =========================================================

    def update(
        self,
        site: Site,
    ):
        self.db.commit()

        self.db.refresh(site)

        return site

    # =========================================================
    # DELETE
    # =========================================================

    def delete(
        self,
        site: Site,
    ):
        self.db.delete(site)

        self.db.commit()