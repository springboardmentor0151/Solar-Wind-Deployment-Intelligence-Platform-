from fastapi import APIRouter, Depends

from app.auth.permissions import require_roles

from app.api.deps import (
    get_prediction_service,
    get_renewable_intelligence_service,
)

from app.prediction.services.prediction_service import (
    PredictionService,
)

from app.services.renewable_intelligence_service import (
    RenewableIntelligenceService,
)

from app.schemas.ml_prediction import (
    SolarPredictionRequest,
    WindPredictionRequest,
    PredictionResponse,
)

from app.schemas.unified_prediction import (
    RenewablePredictionRequest,
    RenewablePredictionResponse,
)


router = APIRouter(
    prefix="/prediction",
    tags=["Prediction"],
)


# =========================================================
# DIRECT SOLAR ML PREDICTION
# =========================================================

@router.post(
    "/solar",
    response_model=PredictionResponse,
)
def predict_solar(
    data: SolarPredictionRequest,
    prediction_service: PredictionService = Depends(
        get_prediction_service,
    ),
    current_user=Depends(
        require_roles(
            "Renewable Energy Planner",
            "Project Manager",
        )
    ),
) -> PredictionResponse:

    return prediction_service.predict_solar(
        data,
    )


# =========================================================
# DIRECT WIND ML PREDICTION
# =========================================================

@router.post(
    "/wind",
    response_model=PredictionResponse,
)
def predict_wind(
    data: WindPredictionRequest,
    prediction_service: PredictionService = Depends(
        get_prediction_service,
    ),
    current_user=Depends(
        require_roles(
            "Renewable Energy Planner",
            "Project Manager",
        )
    ),
) -> PredictionResponse:

    return prediction_service.predict_wind(
        data,
    )


# =========================================================
# DIRECT UNIFIED ML PREDICTION
# =========================================================
#
# This endpoint is useful for:
# - testing
# - debugging
# - ML validation
# - automated tests
#
# It requires explicit feature values.
# =========================================================

@router.post(
    "/renewable",
    response_model=RenewablePredictionResponse,
)
def predict_renewable(
    data: RenewablePredictionRequest,
    prediction_service: PredictionService = Depends(
        get_prediction_service,
    ),
    current_user=Depends(
        require_roles(
            "Renewable Energy Planner",
            "Project Manager",
        )
    ),
) -> RenewablePredictionResponse:

    return prediction_service.predict_renewable(
        data,
    )


# =========================================================
# SITE-BASED RENEWABLE INTELLIGENCE
# =========================================================
#
# THIS is the endpoint your frontend should primarily use.
#
# Request:
#
#     POST /prediction/site/1
#
# The backend automatically:
#
#     Site
#       ↓
#     EnvironmentalService
#       ↓
#     Weather + NASA
#       ↓
#     GIS
#       ↓
#     FeatureBuilder
#       ↓
#     Solar ML + Wind ML
#       ↓
#     Hybrid prediction
#
# No ML parameters are required from the frontend.
# =========================================================

@router.post(
    "/site/{site_id}",
)
def predict_site(
    site_id: int,
    intelligence_service: RenewableIntelligenceService = Depends(
        get_renewable_intelligence_service,
    ),
    current_user=Depends(
        require_roles(
            "Renewable Energy Planner",
            "Project Manager",
        )
    ),
):
    return intelligence_service.analyze_site(
        site_id,
    )