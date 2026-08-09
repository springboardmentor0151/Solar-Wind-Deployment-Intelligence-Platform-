from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Site, Analysis
from app.schemas.site import SiteCreate, SiteUpdate, SiteOut, AnalyzeRequest
from app.api.deps import get_current_user
from app.services import environmental_service, solar_service, wind_service, suitability_service, forecast_service

router = APIRouter(prefix="/api/v1/sites", tags=["Sites & Site Intelligence"])


async def run_full_analysis(lat: float, lon: float, land_area_hectares: float = 100.0, capacity_mw: float = 50.0) -> dict:
    environmental = await environmental_service.get_environmental_profile(lat, lon)
    solar = solar_service.predict_solar_potential(
        environmental, environmental["land_slope_pct"], environmental["elevation_m"], capacity_mw
    )
    wind = wind_service.predict_wind_potential(
        environmental, environmental["land_slope_pct"], environmental["elevation_m"], capacity_mw
    )
    suitability = suitability_service.score_site(environmental, solar, wind, land_area_hectares)
    forecast = forecast_service.forecast_energy_and_revenue(
        solar, wind, capacity_mw, suitability["recommended_technology"]["recommendation"]
    )

    infra = environmental.pop("infrastructure")
    geographic = {
        "elevation_m": environmental["elevation_m"],
        "land_slope_pct": environmental["land_slope_pct"],
        "vegetation_index": environmental["vegetation_index"],
        "infrastructure": infra,
    }

    return {
        "environmental_data": environmental,
        "geographic_data": geographic,
        "solar_result": solar,
        "wind_result": wind,
        "suitability_result": suitability,
        "forecast_result": forecast,
        "data_sources": environmental.get("meta", {}).get("sources", []),
    }


@router.post("/analyze")
async def analyze_location(payload: AnalyzeRequest, current_user: User = Depends(get_current_user)):
    """Run the full intelligence pipeline for arbitrary coordinates without saving a site."""
    result = await run_full_analysis(payload.latitude, payload.longitude, payload.land_area_hectares)
    return result


@router.post("", response_model=dict, status_code=201)
async def create_site(payload: SiteCreate, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    site = Site(
        name=payload.name,
        region=payload.region,
        country=payload.country,
        latitude=payload.latitude,
        longitude=payload.longitude,
        land_area_hectares=payload.land_area_hectares,
        land_ownership=payload.land_ownership,
        notes=payload.notes,
        status=payload.status,
        target_operational_date=payload.target_operational_date,
        assigned_gis_analyst=payload.assigned_gis_analyst,
        assigned_project_manager=payload.assigned_project_manager,
        owner_id=current_user.id,
    )
    db.add(site)
    db.commit()
    db.refresh(site)

    result = await run_full_analysis(site.latitude, site.longitude, site.land_area_hectares)
    analysis = Analysis(site_id=site.id, **result)
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {"site": SiteOut.model_validate(site), "analysis": _serialize_analysis(analysis)}


@router.get("", response_model=list[dict])
def list_sites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sites = db.query(Site).filter(Site.owner_id == current_user.id).order_by(Site.created_at.desc()).all()
    out = []
    for site in sites:
        latest = (
            db.query(Analysis).filter(Analysis.site_id == site.id).order_by(Analysis.created_at.desc()).first()
        )
        out.append({
            "site": SiteOut.model_validate(site),
            "overall_score": latest.suitability_result["overall_score"] if latest else None,
            "category": latest.suitability_result["category"] if latest else None,
        })
    return out


@router.get("/{site_id}", response_model=dict)
def get_site(site_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site = _get_owned_site(db, site_id, current_user)
    return SiteOut.model_validate(site)


@router.patch("/{site_id}", response_model=dict)
def update_site(site_id: str, payload: SiteUpdate, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    site = _get_owned_site(db, site_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(site, field, value)
    db.commit()
    db.refresh(site)
    return SiteOut.model_validate(site)


@router.delete("/{site_id}", status_code=204)
def delete_site(site_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site = _get_owned_site(db, site_id, current_user)
    db.delete(site)
    db.commit()
    return None


@router.get("/{site_id}/analysis", response_model=dict)
def get_site_analysis(site_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site = _get_owned_site(db, site_id, current_user)
    latest = db.query(Analysis).filter(Analysis.site_id == site.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=404, detail="No analysis found for this site yet")
    return {"site": SiteOut.model_validate(site), "analysis": _serialize_analysis(latest)}


@router.post("/{site_id}/reanalyze", response_model=dict)
async def reanalyze_site(site_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site = _get_owned_site(db, site_id, current_user)
    result = await run_full_analysis(site.latitude, site.longitude, site.land_area_hectares)
    analysis = Analysis(site_id=site.id, **result)
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return {"site": SiteOut.model_validate(site), "analysis": _serialize_analysis(analysis)}


@router.get("/compare/table", response_model=dict)
def compare_sites(ids: str = Query(..., description="Comma-separated site IDs"),
                   db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site_ids = [s.strip() for s in ids.split(",") if s.strip()]
    rows = []
    for sid in site_ids:
        site = db.query(Site).filter(Site.id == sid, Site.owner_id == current_user.id).first()
        if not site:
            continue
        latest = db.query(Analysis).filter(Analysis.site_id == site.id).order_by(Analysis.created_at.desc()).first()
        if not latest:
            continue
        rows.append({
            "site_id": site.id,
            "name": site.name,
            "latitude": site.latitude,
            "longitude": site.longitude,
            "overall_score": latest.suitability_result["overall_score"],
            "category": latest.suitability_result["category"],
            "sub_scores": latest.suitability_result["sub_scores"],
        })
    rows.sort(key=lambda r: r["overall_score"], reverse=True)
    for i, r in enumerate(rows, start=1):
        r["rank"] = i
    return {"rows": rows}


@router.get("/rank/all", response_model=dict)
def rank_all_sites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sites = db.query(Site).filter(Site.owner_id == current_user.id).all()
    rows = []
    for site in sites:
        latest = db.query(Analysis).filter(Analysis.site_id == site.id).order_by(Analysis.created_at.desc()).first()
        if not latest:
            continue
        rows.append({
            "site_id": site.id,
            "name": site.name,
            "overall_score": latest.suitability_result["overall_score"],
            "category": latest.suitability_result["category"],
        })
    rows.sort(key=lambda r: r["overall_score"], reverse=True)
    for i, r in enumerate(rows, start=1):
        r["rank"] = i
    return {"rows": rows}


@router.post("/{site_id}/plan", response_model=dict)
def plan_capacity(site_id: str, capacity_mw: float = Query(50.0, gt=0, le=2000),
                   ppa_price: float = Query(forecast_service.DEFAULT_PPA_PRICE_USD_PER_MWH, gt=0),
                   technology: Optional[str] = Query(None),
                   db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Deployment Optimization Engine — re-run the financial forecast for a custom capacity,
    PPA price, and (optionally) technology choice, reusing the site's cached resource data."""
    site = _get_owned_site(db, site_id, current_user)
    latest = db.query(Analysis).filter(Analysis.site_id == site.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=404, detail="No analysis available for this site yet")

    tech = technology or latest.suitability_result["recommended_technology"]["recommendation"]

    # Scale expected output for the requested capacity (stored results are per the analysis capacity)
    solar = dict(latest.solar_result)
    wind = dict(latest.wind_result)
    solar["expected_output_total_mwh_year"] = solar["expected_output_mwh_per_mw_year"] * capacity_mw
    wind["expected_output_total_mwh_year"] = wind["expected_output_mwh_per_mw_year"] * capacity_mw

    forecast = forecast_service.forecast_energy_and_revenue(solar, wind, capacity_mw, tech, ppa_price)
    return {
        "site": SiteOut.model_validate(site),
        "technology": tech,
        "forecast": forecast,
        "suitability": latest.suitability_result,
    }


def _get_owned_site(db: Session, site_id: str, current_user: User) -> Site:
    site = db.query(Site).filter(Site.id == site_id, Site.owner_id == current_user.id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site


def _serialize_analysis(analysis: Analysis) -> dict:
    return {
        "id": analysis.id,
        "environmental_data": analysis.environmental_data,
        "geographic_data": analysis.geographic_data,
        "solar_result": analysis.solar_result,
        "wind_result": analysis.wind_result,
        "suitability_result": analysis.suitability_result,
        "forecast_result": analysis.forecast_result,
        "data_sources": analysis.data_sources,
        "created_at": analysis.created_at.isoformat(),
    }
