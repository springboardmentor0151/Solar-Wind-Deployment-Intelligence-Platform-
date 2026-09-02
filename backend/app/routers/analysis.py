from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.site import Site

router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"]
)


# =========================================================
# SITE ANALYSIS
# =========================================================

@router.get("/site/{site_id}")
def analyze_site(
    site_id: int,
    db: Session = Depends(get_db)
):

    site = (
        db.query(Site)
        .filter(Site.id == site_id)
        .first()
    )

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Site not found"
        )

    solar = float(site.solar_score or 0)
    wind = float(site.wind_score or 0)
    wind_potential = float(
        site.wind_potential or 0
    )

    # Approximate intelligence values
    solar_irradiance = round(
        3 + (solar / 100) * 4,
        2
    )

    wind_speed = round(
        2 + (wind / 100) * 8,
        2
    )

    temperature = round(
        25 + (solar / 100) * 10,
        2
    )

    humidity = round(
        80 - (solar / 100) * 30,
        2
    )

    # Technology recommendation
    if solar >= 70 and wind >= 70:
        technology = "Hybrid"
    elif solar >= wind:
        technology = "Solar"
    else:
        technology = "Wind"

    combined_score = round(
        solar * 0.5 +
        wind * 0.5,
        2
    )

    if combined_score >= 75:
        recommendation = "Excellent Renewable Potential"
    elif combined_score >= 60:
        recommendation = "Good Renewable Potential"
    elif combined_score >= 40:
        recommendation = "Moderate Renewable Potential"
    else:
        recommendation = "Low Renewable Potential"

    return {
        "site_id": site.id,
        "project_name": site.project_name,
        "location_name": site.location_name,

        "latitude": site.latitude,
        "longitude": site.longitude,

        "solar_score": solar,
        "wind_score": wind,
        "wind_potential": wind_potential,

        "solar_irradiance": solar_irradiance,
        "wind_speed": wind_speed,
        "temperature": temperature,
        "humidity": humidity,

        "combined_score": combined_score,

        "recommended_technology": technology,

        "recommendation": recommendation,
    }


# =========================================================
# DEPLOYMENT OPTIMIZATION
# =========================================================

@router.get("/optimize")
def optimize_sites(
    db: Session = Depends(get_db)
):

    sites = db.query(Site).all()

    if not sites:
        return {
            "total_sites": 0,
            "recommended_site": None,
            "sites": []
        }

    results = []

    for site in sites:

        solar = float(
            site.solar_score or 0
        )

        wind = float(
            site.wind_score or 0
        )

        wind_potential = float(
            site.wind_potential or 0
        )

        optimization_score = round(
            solar * 0.45 +
            wind * 0.35 +
            min(wind_potential, 100) * 0.20,
            2
        )

        if solar >= 70 and wind >= 70:
            technology = "Hybrid"

        elif solar >= wind:
            technology = "Solar"

        else:
            technology = "Wind"

        results.append({
            "site_id": site.id,
            "location_name": (
                site.location_name
                or "Selected Location"
            ),

            "solar_score": solar,
            "wind_score": wind,

            "wind_potential":
                wind_potential,

            "optimization_score":
                optimization_score,

            "recommended_technology":
                technology,
        })

    results.sort(
        key=lambda x:
        x["optimization_score"],
        reverse=True
    )

    for index, site in enumerate(
        results,
        start=1
    ):
        site["rank"] = index

    return {
        "total_sites": len(results),

        "recommended_site":
            results[0] if results else None,

        "sites": results
    }


# =========================================================
# INVESTMENT RECOMMENDATION
# =========================================================

@router.get("/investment/{site_id}")
def investment_recommendation(
    site_id: int,
    db: Session = Depends(get_db)
):

    site = (
        db.query(Site)
        .filter(Site.id == site_id)
        .first()
    )

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Site not found"
        )

    solar = float(
        site.solar_score or 0
    )

    wind = float(
        site.wind_score or 0
    )

    wind_potential = float(
        site.wind_potential or 0
    )

    score = round(
        solar * 0.45 +
        wind * 0.35 +
        min(wind_potential, 100) * 0.20,
        2
    )

    # -----------------------------------------
    # TECHNOLOGY
    # -----------------------------------------

    if solar >= 70 and wind >= 70:

        technology = "Hybrid Solar + Wind"

    elif solar >= wind:

        technology = "Solar Power"

    else:

        technology = "Wind Power"


    # -----------------------------------------
    # INVESTMENT LEVEL
    # -----------------------------------------

    if score >= 80:

        investment_level = "High Priority"

        risk = "Low"

        expected_return = "High"

    elif score >= 65:

        investment_level = "Recommended"

        risk = "Moderate"

        expected_return = "Good"

    elif score >= 50:

        investment_level = "Moderate Priority"

        risk = "Moderate"

        expected_return = "Moderate"

    else:

        investment_level = "Low Priority"

        risk = "High"

        expected_return = "Low"


    # -----------------------------------------
    # ESTIMATED CAPACITY
    # -----------------------------------------

    if technology == "Hybrid Solar + Wind":

        estimated_capacity = "5-10 MW"

    elif technology == "Solar Power":

        estimated_capacity = "3-8 MW"

    else:

        estimated_capacity = "2-6 MW"


    # -----------------------------------------
    # RECOMMENDATION
    # -----------------------------------------

    if score >= 80:

        recommendation = (
            "Proceed with detailed feasibility "
            "and financial assessment."
        )

    elif score >= 65:

        recommendation = (
            "Suitable for investment. "
            "Conduct land, grid and financial "
            "due diligence."
        )

    elif score >= 50:

        recommendation = (
            "Consider investment after additional "
            "technical and financial evaluation."
        )

    else:

        recommendation = (
            "Investment is currently not recommended. "
            "Consider alternative locations."
        )


    return {

        "site_id": site.id,

        "location_name":
            site.location_name,

        "solar_score": solar,

        "wind_score": wind,

        "wind_potential":
            wind_potential,

        "investment_score": score,

        "investment_level":
            investment_level,

        "recommended_technology":
            technology,

        "estimated_capacity":
            estimated_capacity,

        "risk_level":
            risk,

        "expected_return":
            expected_return,

        "recommendation":
            recommendation
    }
# ========================================
# INVESTMENT RECOMMENDATION
# ========================================

@router.get("/investment")
def investment_recommendation(
    db: Session = Depends(get_db)
):
    sites = db.query(Site).all()

    if not sites:
        raise HTTPException(
            status_code=404,
            detail="No sites available. Add a site first."
        )

    # ----------------------------------------
    # Find best site
    # ----------------------------------------

    best_site = None
    best_score = -1

    for site in sites:

        solar = float(site.solar_score or 0)
        wind = float(site.wind_score or 0)

        # Combined renewable score
        investment_score = (
            solar * 0.55 +
            wind * 0.45
        )

        if investment_score > best_score:
            best_score = investment_score
            best_site = site

    # ----------------------------------------
    # Technology recommendation
    # ----------------------------------------

    solar = float(best_site.solar_score or 0)
    wind = float(best_site.wind_score or 0)

    if solar >= 70 and wind >= 70:
        technology = "Hybrid"

    elif solar >= wind:
        technology = "Solar"

    else:
        technology = "Wind"

    # ----------------------------------------
    # Capacity estimate
    # ----------------------------------------

    if technology == "Solar":
        capacity = 10
        annual_generation = capacity * 1.6

    elif technology == "Wind":
        capacity = 10
        annual_generation = capacity * 2.4

    else:
        capacity = 15
        annual_generation = (
            7.5 * 1.6 +
            7.5 * 2.4
        )

    # ----------------------------------------
    # Investment estimate
    # ----------------------------------------

    if technology == "Solar":
        investment = capacity * 0.75

    elif technology == "Wind":
        investment = capacity * 1.20

    else:
        investment = (
            7.5 * 0.75 +
            7.5 * 1.20
        )

    # ----------------------------------------
    # Payback estimate
    # ----------------------------------------

    estimated_revenue = annual_generation * 0.10

    if estimated_revenue > 0:
        payback = investment / estimated_revenue
    else:
        payback = 0

    # ----------------------------------------
    # Recommendation
    # ----------------------------------------

    if best_score >= 80:
        recommendation = "Strong Investment Opportunity"

    elif best_score >= 65:
        recommendation = "Recommended Investment"

    elif best_score >= 50:
        recommendation = "Moderate Investment Potential"

    else:
        recommendation = "Low Investment Potential"

    # ----------------------------------------
    # Advice
    # ----------------------------------------

    advice = (
        f"{technology} deployment is recommended for "
        f"{best_site.location_name or 'the selected site'}. "
        f"The site has an investment score of "
        f"{round(best_score, 2)}/100."
    )

    return {
        "site_id": best_site.id,

        "location_name":
            best_site.location_name or "Selected Site",

        "investment_score":
            round(best_score, 2),

        "solar_score":
            round(solar, 2),

        "wind_score":
            round(wind, 2),

        "recommended_technology":
            technology,

        "recommendation":
            recommendation,

        "estimated_capacity":
            round(capacity, 2),

        "capacity_unit":
            "MW",

        "estimated_investment":
            f"₹{round(investment, 2)} Crore",

        "annual_generation":
            f"{round(annual_generation, 2)} GWh/year",

        "payback_period":
            f"{round(payback, 1)} years",

        "investment_advice":
            advice,

        "message":
            "Investment recommendation generated from site intelligence."
    }
# ==========================================
# INVESTMENT RECOMMENDATIONS
# ==========================================

@router.get("/investment")
def investment_recommendations(
    db: Session = Depends(get_db)
):

    sites = (
        db.query(Site)
        .order_by(Site.id.asc())
        .all()
    )

    if not sites:
        return {
            "total_sites": 0,
            "recommended_site": None,
            "sites": []
        }

    results = []

    for site in sites:

        solar = float(site.solar_score or 0)
        wind = float(site.wind_score or 0)

        optimization_score = (
            solar * 0.5 +
            wind * 0.5
        )

        technology = "Hybrid"

        if solar >= 70 and solar > wind + 10:
            technology = "Solar"

        elif wind >= 70 and wind > solar + 10:
            technology = "Wind"

        investment_score = (
            optimization_score * 0.7 +
            max(solar, wind) * 0.3
        )

        if investment_score >= 80:
            rating = "Excellent"

        elif investment_score >= 65:
            rating = "Good"

        elif investment_score >= 50:
            rating = "Moderate"

        else:
            rating = "Low"

        if investment_score >= 80:
            recommendation = (
                "High-priority investment opportunity "
                "for renewable energy deployment."
            )

        elif investment_score >= 65:
            recommendation = (
                "Suitable for investment with "
                "further technical and financial evaluation."
            )

        elif investment_score >= 50:
            recommendation = (
                "Moderate investment potential. "
                "Additional feasibility analysis recommended."
            )

        else:
            recommendation = (
                "Low investment priority based on "
                "current renewable resource scores."
            )

        results.append({
            "site_id": site.id,
            "location_name": (
                site.location_name
                or f"Site #{site.id}"
            ),
            "solar_score": round(solar, 2),
            "wind_score": round(wind, 2),
            "optimization_score": round(
                optimization_score,
                2
            ),
            "investment_score": round(
                investment_score,
                2
            ),
            "recommended_technology": technology,
            "investment_rating": rating,
            "investment_recommendation":
                recommendation
        })


    # Highest investment score first

    results.sort(
        key=lambda x: x["investment_score"],
        reverse=True
    )


    # Assign ranks

    for index, site in enumerate(
        results,
        start=1
    ):

        site["rank"] = index


    best_site = results[0]


    return {
        "total_sites": len(results),
        "recommended_site": best_site,
        "sites": results
    }