from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.auth.dependencies import get_current_user

from app.repositories.dashboard_repository import (
    DashboardRepository,
)

from app.services.dashboard_service import (
    DashboardService,
)

from app.schemas.dashboard import (
    DashboardSummaryResponse,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


# =========================================================
# DASHBOARD SUMMARY
# =========================================================

@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user,
    ),
):

    repository = DashboardRepository(
        db
    )

    service = DashboardService(
        repository
    )

    return service.get_summary()