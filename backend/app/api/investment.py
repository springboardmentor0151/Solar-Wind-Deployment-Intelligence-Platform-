from fastapi import APIRouter

from app.schemas.investment import (
    InvestmentRequest,
    InvestmentResponse,
)

from app.services.investment_service import InvestmentService

router = APIRouter(
    prefix="/investment",
    tags=["Investment"],
)


@router.post(
    "/recommend",
    response_model=InvestmentResponse,
)
def recommend(data: InvestmentRequest):

    return InvestmentService.analyze(
        data.latitude,
        data.longitude,
    )