from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.project import Project
from app.models.site import Site

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db)):

    total_projects = db.query(Project).count()
    total_sites = db.query(Site).count()

    solar_sites = db.query(Site).filter(
        Site.energy_type == "Solar"
    ).count()

    wind_sites = db.query(Site).filter(
        Site.energy_type == "Wind"
    ).count()

    pending_sites = db.query(Site).filter(
        Site.status == "Pending"
    ).count()

    completed_sites = db.query(Site).filter(
        Site.status == "Completed"
    ).count()

    return {
        "projects": total_projects,
        "sites": total_sites,
        "solar": solar_sites,
        "wind": wind_sites,
        "pending": pending_sites,
        "completed": completed_sites
    }