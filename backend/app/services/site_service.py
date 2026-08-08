from sqlalchemy.orm import Session

from app.models.site import Site
from app.repositories.site_repository import SiteRepository
from app.repositories.project_repository import ProjectRepository
from app.schemas.site import SiteCreate, SiteUpdate


class SiteService:

    @staticmethod
    def create_site(
        db: Session,
        site_data: SiteCreate
    ):

        project = ProjectRepository.get_by_id(
            db,
            site_data.project_id
        )

        if not project:
            raise ValueError("Project not found.")

        site = Site(
            name=site_data.name,
            latitude=site_data.latitude,
            longitude=site_data.longitude,
            project_id=site_data.project_id
        )

        return SiteRepository.create(db, site)

    @staticmethod
    def get_all_sites(db: Session):
        return SiteRepository.get_all(db)

    @staticmethod
    def get_sites_by_project(
        db: Session,
        project_id: int
    ):
        return SiteRepository.get_by_project(
            db,
            project_id
        )

    @staticmethod
    def get_site_by_id(
        db: Session,
        site_id: int
    ):

        site = SiteRepository.get_by_id(
            db,
            site_id
        )

        if not site:
            raise ValueError("Site not found.")

        return site

    @staticmethod
    def update_site(
        db: Session,
        site_id: int,
        site_data: SiteUpdate
    ):

        site = SiteRepository.get_by_id(
            db,
            site_id
        )

        if not site:
            raise ValueError("Site not found.")

        update_data = site_data.model_dump(
            exclude_unset=True
        )

        for key, value in update_data.items():
            setattr(site, key, value)

        return SiteRepository.update(db, site)

    @staticmethod
    def delete_site(
        db: Session,
        site_id: int
    ):

        site = SiteRepository.get_by_id(
            db,
            site_id
        )

        if not site:
            raise ValueError("Site not found.")

        SiteRepository.delete(db, site)

        return {
            "message": "Site deleted successfully."
        }