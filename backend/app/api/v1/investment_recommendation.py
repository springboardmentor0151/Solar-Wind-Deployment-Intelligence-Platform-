from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.api.deps import (
    get_investment_recommendation_service,
)

from app.auth.permissions import require_roles

from app.schemas.investment_recommendation import (
    InvestmentRecommendationResponse,
)

from app.services.investment_recommendation_service import (
    InvestmentRecommendationService,
)


router = APIRouter(
    prefix="/investment-recommendation",
    tags=["Investment Recommendation"],
)


@router.post(
    "/sites/{site_id}",
    response_model=InvestmentRecommendationResponse,
)
def evaluate_site_investment(
    site_id: int,

    service: InvestmentRecommendationService = Depends(
        get_investment_recommendation_service,
    ),

    current_user=Depends(
        require_roles(
            "Renewable Energy Planner",
            "Project Manager",
            "Admin",
        )
    ),
):

    try:

        return service.evaluate_investment(
            site_id=site_id,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )