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

from app.auth.permissions import require_roles

from app.schemas.renewable_recommendation import (
    RenewableRecommendationResponse,
)

from app.services.renewable_recommendation_service import (
    RenewableRecommendationService,
)

from app.services.site_suitability_service import (
    SiteSuitabilityService,
)

from app.services.environmental_service import (
    EnvironmentalService,
)

from app.prediction.services.prediction_service import (
    PredictionService,
)


router = APIRouter(
    prefix="/renewable-recommendation",
    tags=["Renewable Recommendation"],
)


@router.post(
    "/sites/{site_id}",
    response_model=RenewableRecommendationResponse,
)
def recommend_site_technology(
    site_id: int,
    db: Session = Depends(get_db),

    environmental_service: EnvironmentalService = Depends(
        get_environmental_service
    ),

    prediction_service: PredictionService = Depends(
        get_prediction_service
    ),

    current_user=Depends(
        require_roles(
            "Renewable Energy Planner",
            "Project Manager",
        )
    ),
):
    """
    Generate renewable technology recommendation
    for a single site.

    Flow:

        Environmental + GIS
                ↓
        Solar/Wind ML Prediction
                ↓
        Site Suitability
                ↓
        Renewable Recommendation
                ↓
        Solar / Wind / Hybrid / Unsuitable
    """

    try:

        # =====================================================
        # STEP 1
        # Run the existing Site Suitability Engine
        # =====================================================

        suitability_service = SiteSuitabilityService(
            db=db,
            environmental_service=environmental_service,
            prediction_service=prediction_service,
        )

        suitability = (
            suitability_service.evaluate_site(
                site_id=site_id,
            )
        )

        # =====================================================
        # STEP 2
        # Convert suitability response into dictionary
        # =====================================================

        suitability_data = (
            suitability.model_dump()
        )

        # =====================================================
        # STEP 3
        # Generate renewable recommendation
        # =====================================================

        recommendation_service = (
            RenewableRecommendationService(db)
        )

        return recommendation_service.recommend(
            site_id=site_id,
            suitability_data=suitability_data,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Failed to generate renewable "
                f"recommendation: {exc}"
            ),
        )