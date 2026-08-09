from fastapi import APIRouter

from app.schemas.investment import (
    InvestmentRequest,
    InvestmentResponse
)

router = APIRouter(
    prefix="/investment",
    tags=["Investment Recommendation"]
)


@router.post("/", response_model=InvestmentResponse)
def investment_analysis(data: InvestmentRequest):

    annual_revenue = round(
        data.annual_energy_output * data.electricity_price,
        2
    )

    annual_profit = round(
        annual_revenue - data.maintenance_cost,
        2
    )

    if annual_profit > 0:
        payback_period = round(
            data.project_cost / annual_profit,
            2
        )
    else:
        payback_period = 0

    if payback_period == 0:
        recommendation = "Not Recommended"
    elif payback_period <= 5:
        recommendation = "Highly Recommended"
    elif payback_period <= 8:
        recommendation = "Recommended"
    else:
        recommendation = "Needs Further Analysis"

    return InvestmentResponse(
        annual_revenue=annual_revenue,
        annual_profit=annual_profit,
        payback_period=payback_period,
        recommendation=recommendation
    )