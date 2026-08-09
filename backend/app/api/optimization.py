from fastapi import APIRouter

from app.schemas.optimization import (
    OptimizationRequest,
    OptimizationResponse
)

router = APIRouter(
    prefix="/optimization",
    tags=["Deployment Optimization"]
)


@router.post("/", response_model=OptimizationResponse)
def optimize_deployment(data: OptimizationRequest):

    # Simple optimization logic
    solar_capacity = round(
        data.available_land * data.solar_efficiency * 0.6,
        2
    )

    wind_capacity = round(
        data.available_land * data.wind_efficiency * 0.4,
        2
    )

    estimated_cost = round(
        (solar_capacity * 50000) +
        (wind_capacity * 75000),
        2
    )

    if estimated_cost > data.budget:
        scale = data.budget / estimated_cost

        solar_capacity = round(solar_capacity * scale, 2)
        wind_capacity = round(wind_capacity * scale, 2)
        estimated_cost = round(data.budget, 2)

    return OptimizationResponse(
        recommended_solar_capacity=solar_capacity,
        recommended_wind_capacity=wind_capacity,
        estimated_cost=estimated_cost
    )