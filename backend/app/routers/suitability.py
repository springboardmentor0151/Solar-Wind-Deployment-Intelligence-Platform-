from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.site import Site
from app.services.site_suitability import calculate_suitability


router = APIRouter(
    prefix="/suitability",
    tags=["Site Intelligence"]
)


# ==========================================
# SINGLE SITE ANALYSIS
# ==========================================

@router.get("/site/{site_id}")
def get_site_suitability(
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

    return calculate_suitability(site)


# ==========================================
# ALL SITES
# ==========================================

@router.get("/all")
def get_all_site_suitability(
    db: Session = Depends(get_db)
):

    sites = db.query(Site).all()

    results = [
        calculate_suitability(site)
        for site in sites
    ]

    results.sort(
        key=lambda x: x["suitability_score"],
        reverse=True
    )

    return {
        "total_sites": len(results),
        "sites": results
    }


# ==========================================
# DEPLOYMENT OPTIMIZATION
# ==========================================

@router.get("/optimize")
def optimize_deployment(
    db: Session = Depends(get_db)
):

    sites = db.query(Site).all()

    if not sites:
        return {
            "message": "No sites available for optimization",
            "total_sites": 0,
            "recommended_site": None,
            "ranking": []
        }

    ranking = [
        calculate_suitability(site)
        for site in sites
    ]

    ranking.sort(
        key=lambda x: x["suitability_score"],
        reverse=True
    )

    # Add deployment priority
    for index, site in enumerate(ranking, start=1):

        site["deployment_rank"] = index

        if index == 1:
            site["deployment_priority"] = "HIGH"

        elif index <= 3:
            site["deployment_priority"] = "MEDIUM"

        else:
            site["deployment_priority"] = "LOW"

    best_site = ranking[0]

    return {
        "total_sites": len(ranking),

        "recommended_site": best_site,

        "ranking": ranking
    }
# ==========================================
# INVESTMENT RECOMMENDATION
# ==========================================

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

    # --------------------------------------
    # Calculate suitability
    # --------------------------------------

    suitability = calculate_suitability(site)

    suitability_score = suitability["suitability_score"]

    solar_score = float(site.solar_score or 0)
    wind_score = float(site.wind_score or 0)
    wind_potential = float(site.wind_potential or 0)

    # --------------------------------------
    # Determine technology
    # --------------------------------------

    if solar_score >= 70 and wind_score >= 60:

        technology = "Hybrid Solar + Wind"

        reason = (
            "The site has strong solar and wind potential. "
            "A hybrid renewable energy deployment is recommended."
        )

    elif solar_score >= wind_score:

        technology = "Solar"

        reason = (
            "Solar performance is stronger than wind performance "
            "at this location."
        )

    else:

        technology = "Wind"

        reason = (
            "Wind performance is stronger than solar performance "
            "at this location."
        )

    # --------------------------------------
    # Investment category
    # --------------------------------------

    if suitability_score >= 75:

        investment_category = "Highly Recommended"
        investment_priority = "HIGH"
        risk_level = "LOW"

    elif suitability_score >= 55:

        investment_category = "Recommended"
        investment_priority = "MEDIUM"
        risk_level = "MODERATE"

    elif suitability_score >= 40:

        investment_category = "Moderate Opportunity"
        investment_priority = "MEDIUM"
        risk_level = "MODERATE-HIGH"

    else:

        investment_category = "Low Priority"
        investment_priority = "LOW"
        risk_level = "HIGH"

    # --------------------------------------
    # Deployment recommendation
    # --------------------------------------

    if technology == "Solar":

        deployment = (
            "Prioritize solar infrastructure and evaluate "
            "solar generation capacity before investment."
        )

    elif technology == "Wind":

        deployment = (
            "Prioritize wind infrastructure and perform "
            "detailed wind resource assessment."
        )

    else:

        deployment = (
            "Consider a hybrid renewable energy system "
            "combining solar and wind generation."
        )

    # --------------------------------------
    # Return recommendation
    # --------------------------------------

    return {
        "site_id": site.id,
        "location_name": site.location_name,

        "solar_score": solar_score,
        "wind_score": wind_score,
        "wind_potential": wind_potential,

        "suitability_score": suitability_score,

        "recommended_technology": technology,

        "investment_category": investment_category,
        "investment_priority": investment_priority,
        "risk_level": risk_level,

        "reason": reason,
        "deployment_recommendation": deployment
    }