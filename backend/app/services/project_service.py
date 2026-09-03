from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.db.mongo import insert_document
from app.models.environment import EnvironmentalData
from app.models.forecast import Forecast
from app.models.location import Location
from app.models.prediction import Prediction
from app.models.project import Project, ProjectType
from app.models.report import Report

from app.schemas.project import (
    ProjectCreate,
    ProjectRead,
    ProjectSummary,
)

from app.schemas.prediction import (
    PredictionRead,
    ForecastPoint,
)


def create_project(db: Session, owner_id: int, payload: ProjectCreate) -> Project:
    project = Project(
        owner_id=owner_id,
        name=payload.name,
        project_type=payload.project_type,
        region=payload.region,
        capacity_mw=payload.capacity_mw,
        description=payload.description,
    )

    db.add(project)
    db.flush()

    db.add(
        Location(
            project_id=project.id,
            **payload.location.model_dump(),
        )
    )

    db.add(
        EnvironmentalData(
            project_id=project.id,
            **payload.environmental_data.model_dump(),
        )
    )

    prediction_values = payload.prediction.model_dump(exclude={"forecast"})

    db.add(
        Prediction(
            project_id=project.id,
            **prediction_values,
        )
    )

    for point in payload.prediction.forecast:
        db.add(
            Forecast(
                project_id=project.id,
                **point.model_dump(),
            )
        )

    db.add(
        Report(
            project_id=project.id,
            report_type="Project Summary",
            file_name=f"project-{project.id}.pdf",
        )
    )

    db.commit()

    insert_document(
        "project_audit",
        {
            "project_id": project.id,
            "name": project.name,
            "project_type": project.project_type.value,
            "region": project.region,
            "capacity_mw": project.capacity_mw,
            "suitability_score": payload.prediction.suitability_score,
        },
    )

    return get_project_or_none(db, project.id)


def list_projects(db: Session):
    stmt = (
        select(Project)
        .options(
            joinedload(Project.location),
            joinedload(Project.environmental_data),
            joinedload(Project.prediction),
            joinedload(Project.forecasts),
        )
        .order_by(desc(Project.created_at))
    )

    return list(db.scalars(stmt).unique())


def get_project_or_none(db: Session, project_id: int):
    stmt = (
        select(Project)
        .where(Project.id == project_id)
        .options(
            joinedload(Project.location),
            joinedload(Project.environmental_data),
            joinedload(Project.prediction),
            joinedload(Project.forecasts),
        )
    )

    return db.scalars(stmt).unique().first()


def delete_project(db: Session, project_id: int):
    project = db.get(Project, project_id)

    if not project:
        return False

    db.delete(project)
    db.commit()

    return True


def to_project_summary(project: Project) -> ProjectSummary:
    return ProjectSummary(
        id=project.id,
        name=project.name,
        project_type=project.project_type,
        region=project.region,
        capacity_mw=project.capacity_mw,
        suitability_score=(
            project.prediction.suitability_score
            if project.prediction
            else None
        ),
        created_at=project.created_at,
    )


def to_project_read(project: Project) -> ProjectRead:

    forecast = [
        ForecastPoint(
            month=f.month,
            solar_mwh=f.solar_mwh,
            wind_mwh=f.wind_mwh,
            hybrid_mwh=f.hybrid_mwh,
        )
        for f in sorted(project.forecasts, key=lambda x: x.id)
    ]

    prediction = PredictionRead(
        solar_potential=project.prediction.solar_potential,
        wind_potential=project.prediction.wind_potential,
        energy_generation_forecast=project.prediction.energy_generation_forecast,
        capacity_factor=project.prediction.capacity_factor,
        performance_ratio=project.prediction.performance_ratio,
        annual_energy_output=project.prediction.annual_energy_output,
        wind_power_density=project.prediction.wind_power_density,
        suitability_score=project.prediction.suitability_score,
        investment_score=project.prediction.investment_score,
        roi_estimate=project.prediction.roi_estimate,
        deployment_recommendation=project.prediction.deployment_recommendation,
        technology_recommendation=project.prediction.technology_recommendation,
        confidence_score=project.prediction.confidence_score,
        forecast=forecast,
    )

    return ProjectRead(
        id=project.id,
        name=project.name,
        project_type=project.project_type,
        region=project.region,
        capacity_mw=project.capacity_mw,
        description=project.description,
        suitability_score=prediction.suitability_score,
        created_at=project.created_at,
        location=project.location,
        environmental_data=project.environmental_data,
        prediction=prediction,
        forecasts=forecast,
    )


def dashboard_metrics(db: Session):

    projects = list_projects(db)

    total = len(projects)

    scores = [
        p.prediction.suitability_score
        for p in projects
        if p.prediction
    ]

    solar_capacity = sum(
        p.capacity_mw
        for p in projects
        if p.project_type in (ProjectType.solar, ProjectType.hybrid)
    )

    wind_capacity = sum(
        p.capacity_mw
        for p in projects
        if p.project_type in (ProjectType.wind, ProjectType.hybrid)
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

    return {
        "total_projects": total,
        "average_site_score": round(sum(scores) / len(scores), 2)
        if scores
        else 0,
        "solar_capacity": round(solar_capacity, 2),
        "wind_capacity": round(wind_capacity, 2),
        "latest_projects": [
            to_project_summary(p).model_dump(mode="json")
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
    }
