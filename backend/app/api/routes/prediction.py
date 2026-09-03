from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.prediction import PredictionRead, PredictionRequest
from app.services.prediction_service import predict_all


router = APIRouter(prefix="/prediction", tags=["Prediction"])


@router.post("/solar", response_model=PredictionRead)
def predict_solar(payload: PredictionRequest, _: User = Depends(get_current_user)) -> PredictionRead:
    return predict_all("Solar", payload.capacity_mw, payload.environmental_data)


@router.post("/wind", response_model=PredictionRead)
def predict_wind(payload: PredictionRequest, _: User = Depends(get_current_user)) -> PredictionRead:
    return predict_all("Wind", payload.capacity_mw, payload.environmental_data)


@router.post("/site-score", response_model=PredictionRead)
def predict_site_score(payload: PredictionRequest, _: User = Depends(get_current_user)) -> PredictionRead:
    return predict_all(payload.project_type, payload.capacity_mw, payload.environmental_data)


@router.post("/forecast", response_model=PredictionRead)
def predict_forecast(payload: PredictionRequest, _: User = Depends(get_current_user)) -> PredictionRead:
    return predict_all(payload.project_type, payload.capacity_mw, payload.environmental_data)
