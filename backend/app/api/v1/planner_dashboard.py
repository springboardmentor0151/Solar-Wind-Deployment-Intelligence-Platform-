from fastapi import APIRouter, Depends

from app.api.deps import (
    get_planner_dashboard_service,
)

from app.auth.permissions import require_roles

from app.schemas.planner_dashboard import (
    PlannerDashboardResponse,
)

from app.services.planner_dashboard_service import (
    PlannerDashboardService,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Planner Dashboard"],
)


@router.get(
    "/planner",
    response_model=PlannerDashboardResponse,
)
def get_planner_dashboard(

    service: PlannerDashboardService = Depends(
        get_planner_dashboard_service,
    ),

    current_user=Depends(
        require_roles(
            "Renewable Energy Planner",
            "Project Manager",
            "Admin",
        )
    ),

):

    return service.get_dashboard()