from fastapi import APIRouter, Depends

from app.api.deps import get_db, get_environmental_service, get_energy_forecasting_service, get_notification_service
from app.auth.dependencies import get_current_user
from app.auth.permissions import require_roles
from app.models.user import User
from app.repositories.notification_repository import NotificationRepository
from app.schemas.alert import AlertEvaluationResponse
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.post("/sites/{site_id}/evaluate", response_model=AlertEvaluationResponse)
def evaluate_site_alerts(
    site_id: int,
    db=Depends(get_db),
    environmental_service=Depends(get_environmental_service),
    energy_forecasting_service=Depends(get_energy_forecasting_service),
    current_user: User = Depends(
        require_roles("GIS Analyst", "Renewable Energy Planner", "Project Manager", "Admin")
    ),
):
    service = AlertService(
        db=db,
        environmental_service=environmental_service,
        energy_forecasting_service=energy_forecasting_service,
        notification_repository=NotificationRepository(db),
    )
    return service.evaluate_site(site_id, current_user)
