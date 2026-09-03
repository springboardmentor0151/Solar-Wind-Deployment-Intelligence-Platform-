from statistics import mean
from typing import Any

from sqlalchemy import desc, select, text
from sqlalchemy.orm import Session, joinedload

from app.models.project import Project, ProjectType
from app.models.report import Report


def classify_suitability(score: float | None) -> str:
    if score is None:
        return "No data available"
    if score >= 80:
        return "Highly Suitable"
    if score >= 62:
        return "Suitable"
    if score >= 45:
        return "Moderately Suitable"
    if score >= 30:
        return "Low Suitability"
    return "Not Suitable"


def suitability_bucket(score: float | None) -> str:
    if score is None:
        return "No data"
    if score >= 75:
        return "High"
    if score >= 55:
        return "Medium"
    if score >= 35:
        return "Low"
    return "Unsuitable"


def _project_query():
    return (
        select(Project)
        .options(
            joinedload(Project.location),
            joinedload(Project.environmental_data),
            joinedload(Project.prediction),
            joinedload(Project.forecasts),
        )
        .order_by(desc(Project.created_at))
    )


def analytics_projects(db: Session) -> list[Project]:
    return list(db.scalars(_project_query()).unique())


def _safe_avg(values: list[float]) -> float | None:
    return round(mean(values), 2) if values else None


def _estimate_project_cost(capacity_mw: float, project_type: ProjectType) -> float:
    cost_per_mw = {
        ProjectType.solar: 950_000,
        ProjectType.wind: 1_300_000,
        ProjectType.hybrid: 1_550_000,
    }
    return round(capacity_mw * cost_per_mw.get(project_type, 1_200_000), 2)


def _format_usd(value: float | None) -> str:
    if value is None:
        return "N/A"
    return f"USD {value:,.2f}"


def _payback_from_roi(roi: float | None) -> float | None:
    if not roi or roi <= 0:
        return None
    return round(100 / roi, 2)


def build_dashboard(db: Session) -> dict[str, Any]:
    return build_analytics_dashboard(db)


def build_analytics_dashboard(db: Session) -> dict[str, Any]:
    projects = analytics_projects(db)
    scores = [p.prediction.suitability_score for p in projects if p.prediction]
    predictions = [p.prediction for p in projects if p.prediction]
    env_rows = [p.environmental_data for p in projects if p.environmental_data]

    suitable = [score for score in scores if score >= 62]
    highly_suitable = [score for score in scores if score >= 80]
    estimated_capacity = sum(p.capacity_mw for p in projects)
    estimated_generation = sum(p.prediction.annual_energy_output for p in projects if p.prediction)
    estimated_investment = sum(_estimate_project_cost(p.capacity_mw, p.project_type) for p in projects)
    estimated_roi = _safe_avg([p.prediction.roi_estimate for p in projects if p.prediction])
    avg_score = _safe_avg(scores) or 0

    technology_counts: dict[str, int] = {"Solar": 0, "Wind": 0, "Hybrid": 0}
    for project in projects:
        technology_counts[project.project_type.value] = technology_counts.get(project.project_type.value, 0) + 1

    recommendation_counts: dict[str, int] = {}
    for prediction in predictions:
        recommendation_counts[prediction.technology_recommendation] = (
            recommendation_counts.get(prediction.technology_recommendation, 0) + 1
        )

    recommended_technology = (
        max(recommendation_counts, key=recommendation_counts.get)
        if recommendation_counts
        else "N/A"
    )

    reports = (
        db.execute(
            select(Report, Project.name)
            .join(Project)
            .order_by(desc(Report.created_at))
            .limit(6)
        )
        .all()
    )

    distribution = {"High": 0, "Medium": 0, "Low": 0, "Unsuitable": 0, "No data": 0}
    for project in projects:
        distribution[suitability_bucket(project.prediction.suitability_score if project.prediction else None)] += 1

    return {
        "total_projects": len(projects),
        "total_analyzed_sites": len(scores),
        "suitable_sites": len(suitable),
        "highly_suitable_sites": len(highly_suitable),
        "average_site_score": avg_score,
        "solar_potential": _safe_avg([p.solar_potential for p in predictions]),
        "wind_potential": _safe_avg([p.wind_potential for p in predictions]),
        "estimated_capacity_mw": round(estimated_capacity, 2),
        "estimated_energy_generation_mwh": round(estimated_generation, 2),
        "estimated_investment": _format_usd(estimated_investment) if estimated_investment else "N/A",
        "estimated_roi": estimated_roi,
        "recommended_technology": recommended_technology,
        "solar_capacity": round(
            sum(p.capacity_mw for p in projects if p.project_type in (ProjectType.solar, ProjectType.hybrid)),
            2,
        ),
        "wind_capacity": round(
            sum(p.capacity_mw for p in projects if p.project_type in (ProjectType.wind, ProjectType.hybrid)),
            2,
        ),
        "suitability_distribution": distribution,
        "technology_comparison": technology_counts,
        "environmental_averages": {
            "solar_irradiance": _safe_avg([e.solar_irradiance for e in env_rows]),
            "wind_speed": _safe_avg([e.wind_speed for e in env_rows]),
            "temperature": _safe_avg([e.temperature for e in env_rows]),
            "rainfall": _safe_avg([e.rainfall for e in env_rows]),
            "elevation": _safe_avg([e.elevation for e in env_rows]),
            "land_slope": _safe_avg([e.land_slope for e in env_rows]),
        },
        "investment_analytics": {
            "average_roi": estimated_roi,
            "average_investment_score": _safe_avg([p.investment_score for p in predictions]),
            "average_capacity_factor": _safe_avg([p.capacity_factor for p in predictions]),
            "estimated_annual_generation_mwh": round(estimated_generation, 2),
        },
        "latest_projects": [
            {
                "id": p.id,
                "name": p.name,
                "project_type": p.project_type.value,
                "region": p.region,
                "capacity_mw": p.capacity_mw,
                "suitability_score": p.prediction.suitability_score if p.prediction else None,
                "created_at": p.created_at.isoformat(),
            }
            for p in projects[:6]
        ],
        "recent_reports": [
            {
                "id": r.id,
                "project_id": r.project_id,
                "project_name": name,
                "report_type": r.report_type,
                "file_name": r.file_name,
                "created_at": r.created_at.isoformat(),
            }
            for r, name in reports
        ],
        "project_kpis": {
            "total_projects": len(projects),
            "active_projects": len(projects),
            "completed_assessments": len(scores),
            "recommended_sites": len(suitable),
            "high_potential_sites": len(highly_suitable),
            "average_site_suitability_score": avg_score,
        },
        "renewable_kpis": {
            "solar_potential": _safe_avg([p.solar_potential for p in predictions]),
            "wind_potential": _safe_avg([p.wind_potential for p in predictions]),
            "estimated_annual_energy_generation": round(estimated_generation, 2),
            "capacity_factor": _safe_avg([p.capacity_factor for p in predictions]),
            "renewable_resource_score": avg_score,
        },
        "environmental_kpis": {
            "average_solar_irradiance": _safe_avg([e.solar_irradiance for e in env_rows]),
            "average_wind_speed": _safe_avg([e.wind_speed for e in env_rows]),
            "average_temperature": _safe_avg([e.temperature for e in env_rows]),
            "average_elevation": _safe_avg([e.elevation for e in env_rows]),
            "average_rainfall": _safe_avg([e.rainfall for e in env_rows]),
            "average_humidity": _safe_avg([e.humidity for e in env_rows]),
            "land_suitability": avg_score,
        },
        "investment_kpis": {
            "estimated_project_cost": round(estimated_investment, 2) if estimated_investment else 0,
            "estimated_annual_revenue": round(estimated_generation * 1000 * 0.08, 2) if estimated_generation else 0,
            "roi": estimated_roi,
            "payback_period": _payback_from_roi(estimated_roi) or 0,
            "investment_rating": recommended_technology,
        },
        "gis_kpis": {
            "analyzed_locations": len(scores),
            "suitable_areas": len(suitable),
            "restricted_areas": max(0, len(projects) - len(suitable)),
            "infrastructure_proximity": _safe_avg([e.nearby_roads_km for e in env_rows]),
        },
    }


def build_analytics_projects(db: Session) -> dict[str, Any]:
    projects = analytics_projects(db)
    rows = []
    for project in projects:
        prediction = project.prediction
        rows.append(
            {
                "id": project.id,
                "name": project.name,
                "project_type": project.project_type.value,
                "region": project.region,
                "capacity_mw": project.capacity_mw,
                "status": classify_suitability(prediction.suitability_score if prediction else None),
                "suitability_score": prediction.suitability_score if prediction else None,
                "technology_recommendation": prediction.technology_recommendation if prediction else "N/A",
                "created_at": project.created_at.isoformat(),
            }
        )
    return {"projects": rows, "count": len(rows)}


def build_analytics_resources(db: Session) -> dict[str, Any]:
    projects = analytics_projects(db)
    predictions = [project.prediction for project in projects if project.prediction]
    return {
        "solar_potential": _safe_avg([p.solar_potential for p in predictions]),
        "wind_potential": _safe_avg([p.wind_potential for p in predictions]),
        "estimated_generation": round(sum(p.annual_energy_output for p in predictions), 2),
        "capacity_factor": _safe_avg([p.capacity_factor for p in predictions]),
        "resource_score": _safe_avg([p.suitability_score for p in predictions]),
        "technology_mix": {"Solar": sum(1 for p in projects if p.project_type == ProjectType.solar), "Wind": sum(1 for p in projects if p.project_type == ProjectType.wind), "Hybrid": sum(1 for p in projects if p.project_type == ProjectType.hybrid)},
    }


def build_analytics_investment(db: Session) -> dict[str, Any]:
    projects = analytics_projects(db)
    predictions = [project.prediction for project in projects if project.prediction]
    total_capacity = sum(project.capacity_mw for project in projects)
    total_generation = sum(p.annual_energy_output for p in predictions)
    total_cost = round(sum(_estimate_project_cost(project.capacity_mw, project.project_type) for project in projects), 2)
    yearly_revenue = round(total_generation * 1000 * 0.08, 2) if total_generation else 0
    roi = _safe_avg([p.roi_estimate for p in predictions])
    return {"total_capacity_mw": round(total_capacity, 2), "total_cost_estimate": total_cost, "estimated_annual_revenue": yearly_revenue, "average_roi": roi, "average_investment_score": _safe_avg([p.investment_score for p in predictions]), "payback_period_years": _payback_from_roi(roi) or (round(total_cost / max(yearly_revenue, 1), 2) if total_cost else 0)}


def build_analytics_suitability(db: Session) -> dict[str, Any]:
    projects = analytics_projects(db)
    scores = [project.prediction.suitability_score for project in projects if project.prediction]
    buckets = {"Highly Suitable": 0, "Suitable": 0, "Moderately Suitable": 0, "Low Suitability": 0, "Not Suitable": 0}
    for score in scores:
        buckets[classify_suitability(score)] = buckets.get(classify_suitability(score), 0) + 1
    return {"distribution": buckets, "average_score": _safe_avg(scores) or 0, "site_count": len(scores)}


def build_analytics_trends(db: Session) -> dict[str, Any]:
    projects = analytics_projects(db)
    series = []
    for project in projects:
        if not project.prediction:
            continue
        series.append({
            "project": project.name,
            "suitability_score": project.prediction.suitability_score,
            "annual_energy_output": project.prediction.annual_energy_output,
            "roi_estimate": project.prediction.roi_estimate,
            "project_type": project.project_type.value,
        })
    return {"trend_points": series, "count": len(series)}


def build_gis_sites(db: Session) -> dict[str, Any]:
    sites = []
    for project in analytics_projects(db):
        if not project.location:
            continue
        prediction = project.prediction
        env = project.environmental_data
        sites.append(
            {
                "project_id": project.id,
                "name": project.name,
                "project_type": project.project_type.value,
                "region": project.region,
                "latitude": project.location.latitude,
                "longitude": project.location.longitude,
                "address": project.location.address,
                "capacity_mw": project.capacity_mw,
                "suitability_score": prediction.suitability_score if prediction else None,
                "suitability_level": suitability_bucket(prediction.suitability_score if prediction else None),
                "solar_score": prediction.solar_potential if prediction else None,
                "wind_score": prediction.wind_potential if prediction else None,
                "recommended_technology": prediction.technology_recommendation if prediction else "N/A",
                "annual_energy_output": prediction.annual_energy_output if prediction else None,
                "roi_estimate": prediction.roi_estimate if prediction else None,
                "investment_score": prediction.investment_score if prediction else None,
                "environmental_information": {
                    "solar_irradiance": env.solar_irradiance if env else None,
                    "wind_speed": env.wind_speed if env else None,
                    "temperature": env.temperature if env else None,
                    "rainfall": env.rainfall if env else None,
                    "elevation": env.elevation if env else None,
                    "land_slope": env.land_slope if env else None,
                },
            }
        )
    return {"sites": sites, "total_sites": len(sites)}


def build_project_report(db: Session, project_id: int) -> dict[str, Any] | None:
    project = db.scalars(_project_query().where(Project.id == project_id)).unique().first()
    if not project:
        return None

    prediction = project.prediction
    env = project.environmental_data
    location = project.location
    score = prediction.suitability_score if prediction else None
    investment_estimate = _estimate_project_cost(project.capacity_mw, project.project_type)
    payback_period = _payback_from_roi(prediction.roi_estimate if prediction else None)

    return {
        "project_information": {
            "id": project.id,
            "name": project.name,
            "project_type": project.project_type.value,
            "region": project.region,
            "capacity_mw": project.capacity_mw,
            "description": project.description,
            "latitude": location.latitude if location else None,
            "longitude": location.longitude if location else None,
            "address": location.address if location else "N/A",
            "created_at": project.created_at.isoformat(),
        },
        "environmental_assessment": {
            "solar_irradiance": env.solar_irradiance if env else None,
            "wind_speed": env.wind_speed if env else None,
            "wind_direction": env.wind_direction if env else None,
            "temperature": env.temperature if env else None,
            "humidity": env.humidity if env else None,
            "rainfall": env.rainfall if env else None,
            "cloud_cover": env.cloud_cover if env else None,
            "elevation": env.elevation if env else None,
            "land_slope": env.land_slope if env else None,
            "vegetation_index": env.vegetation_index if env else None,
            "nearby_roads_km": env.nearby_roads_km if env else None,
            "nearby_substations_km": env.nearby_substations_km if env else None,
            "nearby_transmission_lines_km": env.nearby_transmission_lines_km if env else None,
        },
        "renewable_assessment": {
            "solar_potential": prediction.solar_potential if prediction else None,
            "wind_potential": prediction.wind_potential if prediction else None,
            "suitability_score": score,
            "investment_score": prediction.investment_score if prediction else None,
            "confidence_score": prediction.confidence_score if prediction else None,
            "recommended_technology": prediction.technology_recommendation if prediction else "N/A",
        },
        "deployment_recommendation": {
            "recommended_site": location.address if location else project.region,
            "recommended_technology": prediction.technology_recommendation if prediction else "N/A",
            "estimated_capacity_mw": project.capacity_mw,
            "expected_generation_mwh": prediction.annual_energy_output if prediction else None,
            "investment_estimate": _format_usd(investment_estimate),
            "roi_estimate": prediction.roi_estimate if prediction else None,
            "payback_period": f"{payback_period} years" if payback_period else "N/A",
            "recommendation": prediction.deployment_recommendation if prediction else "No data available",
        },
        "forecast": [
            {
                "month": point.month,
                "solar_mwh": point.solar_mwh,
                "wind_mwh": point.wind_mwh,
                "hybrid_mwh": point.hybrid_mwh,
            }
            for point in sorted(project.forecasts, key=lambda item: item.id)
        ],
        "final_recommendation": classify_suitability(score),
    }


def database_health(db: Session) -> str:
    db.execute(text("SELECT 1"))
    return "ok"
