from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.analytics_service import build_dashboard


router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard")
def read_dashboard(_: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return build_dashboard(db)
