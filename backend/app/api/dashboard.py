from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Site, Analysis
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard & Analytics"])


def _owned_scored_sites(db: Session, current_user: User):
    sites = db.query(Site).filter(Site.owner_id == current_user.id).all()
    scored = []
    for site in sites:
        latest = db.query(Analysis).filter(Analysis.site_id == site.id).order_by(Analysis.created_at.desc()).first()
        if latest:
            scored.append((site, latest))
    return sites, scored


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Renewable Energy Planner dashboard — recommended sites, energy forecasts,
    suitability scores, investment recommendations."""
    sites, scored = _owned_scored_sites(db, current_user)

    total_sites = len(sites)
    avg_score = round(sum(a.suitability_result["overall_score"] for _, a in scored) / len(scored), 1) if scored else 0
    category_counts = Counter(a.suitability_result["category"] for _, a in scored)

    total_solar_mwh = sum(a.solar_result["expected_output_total_mwh_year"] for _, a in scored)
    total_wind_mwh = sum(a.wind_result["expected_output_total_mwh_year"] for _, a in scored)
    total_capex = sum(a.forecast_result["estimated_capex_usd"] for _, a in scored)
    total_net_revenue = sum(a.forecast_result["lifetime_net_revenue_usd"] for _, a in scored)

    top_sites = sorted(
        [{"id": s.id, "name": s.name, "score": a.suitability_result["overall_score"],
          "category": a.suitability_result["category"]} for s, a in scored],
        key=lambda x: x["score"], reverse=True,
    )[:5]

    return {
        "total_sites": total_sites,
        "average_suitability_score": avg_score,
        "category_distribution": dict(category_counts),
        "total_expected_solar_mwh_year": round(total_solar_mwh, 0),
        "total_expected_wind_mwh_year": round(total_wind_mwh, 0),
        "total_estimated_capex_usd": round(total_capex, 0),
        "total_lifetime_net_revenue_usd": round(total_net_revenue, 0),
        "top_sites": top_sites,
        "user": {"name": current_user.full_name, "role": current_user.role.value},
    }


@router.get("/gis-analyst")
def gis_analyst_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """GIS Analyst dashboard — terrain/environmental analytics, GIS visualization
    data, and site comparison reports across the portfolio."""
    sites, scored = _owned_scored_sites(db, current_user)

    terrain_rows = []
    for site, a in scored:
        geo = a.geographic_data
        infra = geo["infrastructure"]
        terrain_rows.append({
            "site_id": site.id,
            "name": site.name,
            "latitude": site.latitude,
            "longitude": site.longitude,
            "elevation_m": geo["elevation_m"],
            "land_slope_pct": geo["land_slope_pct"],
            "vegetation_index": geo["vegetation_index"],
            "distance_to_road_km": infra["distance_to_road_km"],
            "distance_to_substation_km": infra["distance_to_substation_km"],
            "distance_to_transmission_line_km": infra["distance_to_transmission_line_km"],
            "near_protected_zone": infra["near_protected_zone"],
            "near_agricultural_land": infra["near_agricultural_land"],
            "geographic_score": a.suitability_result["sub_scores"]["geographic"],
            "infrastructure_score": a.suitability_result["sub_scores"]["infrastructure"],
            "environmental_score": a.suitability_result["sub_scores"]["environmental"],
            "data_sources": a.data_sources,
        })

    n = len(terrain_rows) or 1
    avg_elevation = round(sum(r["elevation_m"] for r in terrain_rows) / n, 1)
    avg_slope = round(sum(r["land_slope_pct"] for r in terrain_rows) / n, 2)
    avg_ndvi = round(sum(r["vegetation_index"] for r in terrain_rows) / n, 2)
    protected_zone_flags = sum(1 for r in terrain_rows if r["near_protected_zone"])
    agri_land_flags = sum(1 for r in terrain_rows if r["near_agricultural_land"])

    # Which live data sources are actually being used across the portfolio (useful for a GIS analyst
    # auditing data provenance / freshness)
    source_usage = Counter()
    for r in terrain_rows:
        for s in (r["data_sources"] or []):
            source_usage[s] += 1

    return {
        "total_sites_mapped": len(terrain_rows),
        "avg_elevation_m": avg_elevation if terrain_rows else 0,
        "avg_land_slope_pct": avg_slope if terrain_rows else 0,
        "avg_vegetation_index": avg_ndvi if terrain_rows else 0,
        "protected_zone_flags": protected_zone_flags,
        "agricultural_land_flags": agri_land_flags,
        "data_source_usage": dict(source_usage),
        "sites": sorted(terrain_rows, key=lambda r: r["environmental_score"]),
        "user": {"name": current_user.full_name, "role": current_user.role.value},
    }


@router.get("/project-manager")
def project_manager_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Project Manager dashboard — project progress by status, feasibility summaries,
    cost-benefit analysis, and deployment timelines."""
    sites, scored = _owned_scored_sites(db, current_user)
    analysis_by_site = {s.id: a for s, a in scored}

    status_counts = Counter(site.status.value for site in sites)

    projects = []
    for site in sites:
        a = analysis_by_site.get(site.id)
        row = {
            "site_id": site.id,
            "name": site.name,
            "project_id": site.project_id,
            "status": site.status.value,
            "target_operational_date": site.target_operational_date.isoformat() if site.target_operational_date else None,
            "assigned_gis_analyst": site.assigned_gis_analyst,
            "assigned_project_manager": site.assigned_project_manager,
            "created_at": site.created_at.isoformat(),
        }
        if a:
            row.update({
                "overall_score": a.suitability_result["overall_score"],
                "category": a.suitability_result["category"],
                "estimated_capex_usd": a.forecast_result["estimated_capex_usd"],
                "estimated_annual_opex_usd": a.forecast_result["estimated_annual_opex_usd"],
                "simple_payback_years": a.forecast_result["simple_payback_years"],
                "lifetime_net_revenue_usd": a.forecast_result["lifetime_net_revenue_usd"],
                "feasible": a.suitability_result["overall_score"] >= 45,
            })
        else:
            row.update({
                "overall_score": None, "category": None, "estimated_capex_usd": None,
                "estimated_annual_opex_usd": None, "simple_payback_years": None,
                "lifetime_net_revenue_usd": None, "feasible": None,
            })
        projects.append(row)

    # Timeline: sites with a target date, soonest first
    timeline = sorted(
        [p for p in projects if p["target_operational_date"]],
        key=lambda p: p["target_operational_date"],
    )

    feasible_count = sum(1 for p in projects if p["feasible"] is True)
    infeasible_count = sum(1 for p in projects if p["feasible"] is False)
    total_capex = sum(p["estimated_capex_usd"] or 0 for p in projects)
    total_opex = sum(p["estimated_annual_opex_usd"] or 0 for p in projects)
    total_net_revenue = sum(p["lifetime_net_revenue_usd"] or 0 for p in projects)
    avg_payback = (
        round(sum(p["simple_payback_years"] for p in projects if p["simple_payback_years"]) /
              max(1, sum(1 for p in projects if p["simple_payback_years"])), 1)
    )

    return {
        "total_projects": len(projects),
        "status_distribution": dict(status_counts),
        "feasible_count": feasible_count,
        "infeasible_count": infeasible_count,
        "total_estimated_capex_usd": round(total_capex, 0),
        "total_estimated_annual_opex_usd": round(total_opex, 0),
        "total_lifetime_net_revenue_usd": round(total_net_revenue, 0),
        "avg_payback_years": avg_payback,
        "timeline": timeline,
        "projects": projects,
        "user": {"name": current_user.full_name, "role": current_user.role.value},
    }
