from fastapi import APIRouter

from app.schemas.dashboard import DashboardResponse

router = APIRouter(
    prefix="/dashboard",
    tags=["Renewable Energy Dashboard"]
)


@router.get("/", response_model=DashboardResponse)
def get_dashboard():

    return DashboardResponse(
        total_projects=12,
        total_sites=25,
        total_assets=80,
        total_forecast_energy=15840.75,
        average_suitability_score=84.6,
        total_investment=245000000.00
    )