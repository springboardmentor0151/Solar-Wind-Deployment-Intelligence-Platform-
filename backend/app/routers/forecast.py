from fastapi import APIRouter, HTTPException
from app.database.database import SessionLocal
from app.models.site import Site

router = APIRouter(
    prefix="/forecast",
    tags=["Forecasting"]
)


@router.get("/site/{site_id}")
def forecast_site(site_id: int):

    db = SessionLocal()

    try:
        site = db.query(Site).filter(
            Site.id == site_id
        ).first()

        if not site:
            raise HTTPException(
                status_code=404,
                detail="Site not found"
            )

        solar_score = float(
            site.solar_score or 0
        )

        wind_score = float(
            site.wind_score or 0
        )

        wind_potential = float(
            site.wind_potential or 0
        )

        # --------------------------------
        # SIMPLE FORECAST MODEL
        # --------------------------------

        solar_forecast = round(
            solar_score * 1.05,
            2
        )

        wind_forecast = round(
            wind_score * 1.03,
            2
        )

        renewable_forecast = round(
            (solar_forecast + wind_forecast) / 2,
            2
        )

        # --------------------------------
        # 12 MONTH FORECAST
        # --------------------------------

        monthly_forecast = []

        seasonal_factors = [
            0.82,
            0.86,
            0.94,
            1.02,
            1.10,
            1.15,
            1.08,
            1.02,
            0.98,
            0.93,
            0.87,
            0.82,
        ]

        for month, factor in enumerate(
            seasonal_factors,
            start=1
        ):

            solar = round(
                solar_forecast * factor,
                2
            )

            wind = round(
                wind_forecast * factor,
                2
            )

            total = round(
                (solar + wind) / 2,
                2
            )

            monthly_forecast.append({
                "month": month,
                "solar": solar,
                "wind": wind,
                "renewable": total
            })

        # --------------------------------
        # TREND
        # --------------------------------

        if renewable_forecast >= 70:
            trend = "Excellent"
        elif renewable_forecast >= 55:
            trend = "Good"
        elif renewable_forecast >= 40:
            trend = "Moderate"
        else:
            trend = "Low"

        return {
            "site_id": site.id,
            "location_name": site.location_name,
            "solar_forecast": solar_forecast,
            "wind_forecast": wind_forecast,
            "renewable_forecast": renewable_forecast,
            "wind_potential": wind_potential,
            "forecast_trend": trend,
            "monthly_forecast": monthly_forecast
        }

    finally:
        db.close()