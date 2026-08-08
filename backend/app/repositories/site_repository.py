from sqlalchemy.orm import Session

from app.models.site import Site


class SiteRepository:

    @staticmethod
    def create(db: Session, site: Site):
        db.add(site)
        db.commit()
        db.refresh(site)
        return site

    @staticmethod
    def get_all(db: Session):
        return db.query(Site).all()

    @staticmethod
    def get_by_id(db: Session, site_id: int):
        return db.query(Site).filter(
            Site.id == site_id
        ).first()
    @staticmethod
    def get_by_project(db: Session, project_id: int):
        return (
            db.query(Site)
            .filter(Site.project_id == project_id)
            .all()
        )

    @staticmethod
    def update(db: Session, site: Site):
        db.commit()
        db.refresh(site)
        return site

    @staticmethod
    def delete(db: Session, site: Site):
        db.delete(site)
        db.commit()
    