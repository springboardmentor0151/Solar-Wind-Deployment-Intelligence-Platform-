from fastapi import (
    APIRouter,
    Depends,
)

from app.auth.permissions import require_roles

from app.api.deps import (
    get_gis_analyst_dashboard_service,
)

from app.schemas.gis_analyst_dashboard import (
    GISAnalystDashboardResponse,
)

from app.services.gis_analyst_dashboard_service import (
    GISAnalystDashboardService,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["GIS Analyst Dashboard"],
)


@router.get(
    "/gis-analyst",
    response_model=GISAnalystDashboardResponse,
)
def get_gis_analyst_dashboard(

    service: GISAnalystDashboardService = Depends(
        get_gis_analyst_dashboard_service,
    ),

    current_user=Depends(
        require_roles(
            "GIS Analyst",
            "Project Manager",
            "Admin",
        )
    ),

):

    return service.get_dashboard()