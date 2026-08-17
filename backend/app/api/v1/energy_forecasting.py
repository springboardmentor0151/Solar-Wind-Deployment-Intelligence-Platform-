from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.api.deps import (
    get_energy_forecasting_service,
)

from app.auth.permissions import require_roles

from app.schemas.energy_forecasting import (
    EnergyForecastResponse,
)

from app.services.energy_forecasting_service import (
    EnergyForecastingService,
)


router = APIRouter(
    prefix="/energy-forecasting",
    tags=["Energy Forecasting"],
)


@router.post(
    "/sites/{site_id}",
    response_model=EnergyForecastResponse,
)
def forecast_site_energy(
    site_id: int,

    service: EnergyForecastingService = Depends(
        get_energy_forecasting_service,
    ),

    current_user=Depends(
        require_roles(
            "Renewable Energy Planner",
            "Project Manager",
        )
    ),
):

    try:

        return service.forecast(
            site_id=site_id,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )