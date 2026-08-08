from collections import Counter
from app.models.site import Site

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.project import Project
from app.models.site import Site
from app.models.prediction_history import PredictionHistory

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def dashboard_statistics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    total_projects = db.query(Project).count()

    total_sites = db.query(Site).count()

    total_predictions = db.query(PredictionHistory).count()

    history = db.query(PredictionHistory).all()

    if history:

        average_prediction = round(
            sum(item.predicted_power for item in history) / len(history),
            2
        )

        average_solar_score = round(
            sum(item.solar_score for item in history) / len(history)
        )

        average_wind_score = round(
            sum(item.wind_score for item in history) / len(history)
        )

        average_overall_score = round(
            sum(item.overall_score for item in history) / len(history)
        )

    else:

        average_prediction = 0
        average_solar_score = 0
        average_wind_score = 0
        average_overall_score = 0

    return {

        "total_projects": total_projects,

        "total_sites": total_sites,

        "total_predictions": total_predictions,

        "average_prediction": average_prediction,

        "average_solar_score": average_solar_score,

        "average_wind_score": average_wind_score,

        "average_overall_score": average_overall_score

    }

@router.get("/top-site")
def top_site(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    prediction = (
        db.query(PredictionHistory)
        .order_by(PredictionHistory.overall_score.desc())
        .first()
    )

    if not prediction:
        return {
            "message": "No prediction history found."
        }

    site = (
        db.query(Site)
        .filter(Site.id == prediction.site_id)
        .first()
    )

    return {

        "site_id": prediction.site_id,

        "site_name": site.site_name if site else "Unknown",

        "overall_score": prediction.overall_score,

        "predicted_power": prediction.predicted_power,

        "best_energy_source": prediction.best_energy_source,

        "recommendation": prediction.recommendation

    }


@router.get("/overview")
def dashboard_overview(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # -----------------------------
    # Statistics
    # -----------------------------
    total_projects = db.query(Project).count()
    total_sites = db.query(Site).count()
    total_predictions = db.query(PredictionHistory).count()

    history = db.query(PredictionHistory).all()

    if history:

        average_prediction = round(
            sum(item.predicted_power for item in history) / len(history), 2
        )

        average_solar_score = round(
            sum(item.solar_score for item in history) / len(history)
        )

        average_wind_score = round(
            sum(item.wind_score for item in history) / len(history)
        )

        average_overall_score = round(
            sum(item.overall_score for item in history) / len(history)
        )

    else:

        average_prediction = 0
        average_solar_score = 0
        average_wind_score = 0
        average_overall_score = 0

    # -----------------------------
    # Top Site
    # -----------------------------
    top_prediction = (
        db.query(PredictionHistory)
        .order_by(PredictionHistory.overall_score.desc())
        .first()
    )

    top_site = None

    if top_prediction:

        site = (
            db.query(Site)
            .filter(Site.id == top_prediction.site_id)
            .first()
        )

        top_site = {
            "site_id": top_prediction.site_id,
            "site_name": site.site_name if site else "Unknown",
            "overall_score": top_prediction.overall_score,
            "predicted_power": top_prediction.predicted_power,
            "best_energy_source": top_prediction.best_energy_source,
            "recommendation": top_prediction.recommendation
        }

    # -----------------------------
    # Recent Predictions
    # -----------------------------
    recent_predictions = (
        db.query(PredictionHistory)
        .order_by(PredictionHistory.created_at.desc())
        .limit(5)
        .all()
    )

    recent = []

    for item in recent_predictions:
        recent.append({
            "site_id": item.site_id,
            "predicted_power": item.predicted_power,
            "overall_score": item.overall_score,
            "recommendation": item.recommendation,
            "created_at": item.created_at
        })

    # -----------------------------
    # Energy Distribution
    # -----------------------------
    energy_counter = Counter(
        item.best_energy_source for item in history
    )

    return {

        "statistics": {

            "total_projects": total_projects,

            "total_sites": total_sites,

            "total_predictions": total_predictions,

            "average_prediction": average_prediction,

            "average_solar_score": average_solar_score,

            "average_wind_score": average_wind_score,

            "average_overall_score": average_overall_score

        },

        "top_site": top_site,

        "recent_predictions": recent,

        "energy_distribution": energy_counter

    }


@router.get("/home")
def dashboard_home(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # -------------------------
    # Basic Counts
    # -------------------------
    total_projects = db.query(Project).count()
    total_sites = db.query(Site).count()
    total_predictions = db.query(PredictionHistory).count()

    history = db.query(PredictionHistory).all()

    # -------------------------
    # Average Statistics
    # -------------------------
    if history:
        avg_prediction = round(
            sum(x.predicted_power for x in history) / len(history), 2
        )

        avg_solar = round(
            sum(x.solar_score for x in history) / len(history)
        )

        avg_wind = round(
            sum(x.wind_score for x in history) / len(history)
        )

        avg_overall = round(
            sum(x.overall_score for x in history) / len(history)
        )
    else:
        avg_prediction = 0
        avg_solar = 0
        avg_wind = 0
        avg_overall = 0

    # -------------------------
    # Top Site
    # -------------------------
    top_prediction = (
        db.query(PredictionHistory)
        .order_by(PredictionHistory.overall_score.desc())
        .first()
    )

    top_site = None

    if top_prediction:

        site = db.query(Site).filter(
            Site.id == top_prediction.site_id
        ).first()

        top_site = {
            "site_name": site.site_name if site else "Unknown",
            "overall_score": top_prediction.overall_score,
            "predicted_power": top_prediction.predicted_power,
            "recommendation": top_prediction.recommendation,
            "best_energy_source": top_prediction.best_energy_source
        }

    # -------------------------
    # Recent Predictions
    # -------------------------
    recent = (
        db.query(PredictionHistory)
        .order_by(PredictionHistory.created_at.desc())
        .limit(5)
        .all()
    )

    recent_predictions = [
        {
            "site_id": item.site_id,
            "predicted_power": item.predicted_power,
            "overall_score": item.overall_score,
            "recommendation": item.recommendation,
            "created_at": item.created_at
        }
        for item in recent
    ]

    # -------------------------
    # Energy Distribution
    # -------------------------
    solar = len(
        [x for x in history if x.best_energy_source == "Solar"]
    )

    wind = len(
        [x for x in history if x.best_energy_source == "Wind"]
    )

    return {

        "statistics": {

            "total_projects": total_projects,
            "total_sites": total_sites,
            "total_predictions": total_predictions,
            "average_prediction": avg_prediction,
            "average_solar_score": avg_solar,
            "average_wind_score": avg_wind,
            "average_overall_score": avg_overall

        },

        "top_site": top_site,

        "energy_distribution": {

            "Solar": solar,
            "Wind": wind

        },

        "recent_predictions": recent_predictions

    }