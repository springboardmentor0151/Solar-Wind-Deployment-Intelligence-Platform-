from fastapi import APIRouter

from app.schemas.optimization import (
    OptimizationRequest,
    OptimizationResponse,
)
from app.services.optimization_service import OptimizationService

router = APIRouter(
    prefix="/optimization",
    tags=["Deployment Optimization"],
)


@router.post(
    "",
    response_model=OptimizationResponse,
)
def optimize_site(request: OptimizationRequest):
    return OptimizationService.optimize(
        request.latitude,
        request.longitude,
    )