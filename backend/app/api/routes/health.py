from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.analytics_service import database_health


router = APIRouter(tags=["Health"])


@router.get("/health", summary="Check API and database availability")
def health_check(db: Session = Depends(get_db)) -> dict[str, str | bool]:
    try:
        database_health(db)
        database_status = "connected"
        status = "healthy"
    except Exception:
        database_status = "unavailable"
        status = "degraded"
    return {"status": status, "healthy": status == "healthy", "database": database_status}
