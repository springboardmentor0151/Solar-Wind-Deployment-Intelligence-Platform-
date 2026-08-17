from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.api.deps import (
    get_db,
    get_environmental_service,
    get_prediction_service,
)

from app.auth.permissions import (
    require_roles,
)

from app.prediction.services.prediction_service import (
    PredictionService,
)

from app.schemas.suitability import (
    SiteSuitabilityResponse,
)

from app.services.environmental_service import (
    EnvironmentalService,
)

from app.services.site_suitability_service import (
    SiteSuitabilityService,
)


router = APIRouter(
    prefix="/suitability",
    tags=["Site Suitability"],
)


@router.post(
    "/sites/{site_id}/evaluate",
    response_model=SiteSuitabilityResponse,
)
def evaluate_site_suitability(
    site_id: int,

    db: Session = Depends(
        get_db,
    ),

    environmental_service: EnvironmentalService = Depends(
        get_environmental_service,
    ),

    prediction_service: PredictionService = Depends(
        get_prediction_service,
    ),

    current_user=Depends(
        require_roles(
            "Renewable Energy Planner",
            "Project Manager",
        )
    ),
):

    service = SiteSuitabilityService(
        db=db,
        environmental_service=environmental_service,
        prediction_service=prediction_service,
    )

    try:

        return service.evaluate_site(
            site_id=site_id,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )