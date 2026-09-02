from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.site import Site


router = APIRouter(
    prefix="/analytics",
    tags=["Executive Analytics"],
)


@router.get("/executive")
def executive_dashboard(db: Session = Depends(get_db)):
    sites = db.query(Site).order_by(Site.id.asc()).all()

    if not sites:
        return {
            "total_sites": 0,
            "average_solar_score": 0,
            "average_wind_score": 0,
            "average_renewable_score": 0,
            "top_site": None,
            "technology_mix": {},
        }

    def value(site, field):
        return float(getattr(site, field) or 0)

    ranked = sorted(
        sites,
        key=lambda site: (
            value(site, "solar_score") + value(site, "wind_score")
        ) / 2,
        reverse=True,
    )

    technology_mix = Counter()
    for site in sites:
        solar = value(site, "solar_score")
        wind = value(site, "wind_score")
        if solar >= 70 and wind >= 70:
            technology = "Hybrid"
        elif solar >= wind:
            technology = "Solar"
        else:
            technology = "Wind"
        technology_mix[technology] += 1

    avg_solar = sum(value(s, "solar_score") for s in sites) / len(sites)
    avg_wind = sum(value(s, "wind_score") for s in sites) / len(sites)

    top = ranked[0]
    top_score = (value(top, "solar_score") + value(top, "wind_score")) / 2

    return {
        "total_sites": len(sites),
        "average_solar_score": round(avg_solar, 2),
        "average_wind_score": round(avg_wind, 2),
        "average_renewable_score": round((avg_solar + avg_wind) / 2, 2),
        "top_site": {
            "site_id": top.id,
            "location_name": top.location_name or f"Site #{top.id}",
            "score": round(top_score, 2),
            "solar_score": round(value(top, "solar_score"), 2),
            "wind_score": round(value(top, "wind_score"), 2),
        },
        "technology_mix": dict(technology_mix),
    }
