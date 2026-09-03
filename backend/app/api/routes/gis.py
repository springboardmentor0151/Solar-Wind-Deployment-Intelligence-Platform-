from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.analytics_service import build_gis_sites


router = APIRouter(prefix="/gis", tags=["GIS"])


@router.get("/sites", summary="List analyzed project locations for GIS visualization")
def read_gis_sites(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return build_gis_sites(db)
