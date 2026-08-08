from fastapi import APIRouter

from app.schemas.wind import WindRequest, WindResponse
from app.services.wind_service import WindService

router = APIRouter(
    prefix="/wind",
    tags=["Wind Prediction"]
)


@router.post(
    "/predict",
    response_model=WindResponse
)
def predict(data: WindRequest):
    print("Wind API called")
    return WindService.predict(
   data.latitude,
   data.longitude

    
)
    