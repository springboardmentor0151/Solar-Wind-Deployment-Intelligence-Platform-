from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.site import Site


router = APIRouter(
    prefix="/investment",
    tags=["Investment Recommendations"]
)


@router.get("/")
def investment_recommendations(
    db: Session = Depends(get_db)
):
    sites = db.query(Site).all()

    recommendations = []

    for site in sites:

        solar = float(site.solar_score or 0)
        wind = float(site.wind_score or 0)

        # Combined investment score
        investment_score = round(
            (solar * 0.55) + (wind * 0.45),
            2
        )

        # Technology recommendation
        if solar >= 70 and wind >= 70:
            technology = "Hybrid Solar + Wind"

        elif solar >= wind and solar >= 50:
            technology = "Solar"

        elif wind > solar and wind >= 50:
            technology = "Wind"

        else:
            technology = "Low Priority"

        # Investment category
        if investment_score >= 80:
            category = "High Investment Priority"
            risk = "Low"
        elif investment_score >= 60:
            category = "Medium Investment Priority"
            risk = "Moderate"
        elif investment_score >= 40:
            category = "Selective Investment"
            risk = "High"
        else:
            category = "Not Recommended"
            risk = "Very High"

        recommendations.append({
            "site_id": site.id,
            "location_name": site.location_name,
            "latitude": site.latitude,
            "longitude": site.longitude,
            "solar_score": round(solar, 2),
            "wind_score": round(wind, 2),
            "investment_score": investment_score,
            "technology": technology,
            "investment_category": category,
            "risk_level": risk,
        })

    # Highest investment score first
    recommendations.sort(
        key=lambda x: x["investment_score"],
        reverse=True
    )

    for index, item in enumerate(
        recommendations,
        start=1
    ):
        item["rank"] = index

    recommended_site = (
        recommendations[0]
        if recommendations
        else None
    )

    return {
        "total_sites": len(recommendations),
        "recommended_site": recommended_site,
        "sites": recommendations,
    }