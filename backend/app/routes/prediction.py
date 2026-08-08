from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from sqlalchemy import func

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.environmental_data import EnvironmentalData
from app.models.prediction_history import PredictionHistory

from app.services.prediction_service import (
    calculate_solar_score,
    calculate_wind_score
)

from app.services.ml_prediction import predict_solar_power

router = APIRouter(
    prefix="/prediction",
    tags=["Prediction"]
)

# --------------------------------------------------
# Rule-Based Solar Prediction
# --------------------------------------------------

@router.get("/solar/{site_id}")
def predict_solar(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    environment = (
        db.query(EnvironmentalData)
        .filter(EnvironmentalData.site_id == site_id)
        .order_by(EnvironmentalData.recorded_at.desc())
        .first()
    )

    if not environment:
        raise HTTPException(
            status_code=404,
            detail="Environmental data not found"
        )

    score = calculate_solar_score(environment)

    if score >= 85:
        recommendation = "Excellent"
    elif score >= 70:
        recommendation = "Good"
    elif score >= 50:
        recommendation = "Moderate"
    else:
        recommendation = "Poor"

    return {
        "site_id": site_id,
        "solar_score": score,
        "recommendation": recommendation
    }


# --------------------------------------------------
# Rule-Based Wind Prediction
# --------------------------------------------------

@router.get("/wind/{site_id}")
def predict_wind(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    environment = (
        db.query(EnvironmentalData)
        .filter(EnvironmentalData.site_id == site_id)
        .order_by(EnvironmentalData.recorded_at.desc())
        .first()
    )

    if not environment:
        raise HTTPException(
            status_code=404,
            detail="Environmental data not found"
        )

    score = calculate_wind_score(environment)

    if score >= 85:
        recommendation = "Excellent"
    elif score >= 70:
        recommendation = "Good"
    elif score >= 50:
        recommendation = "Moderate"
    else:
        recommendation = "Poor"

    return {
        "site_id": site_id,
        "wind_score": score,
        "recommendation": recommendation
    }


# --------------------------------------------------
# Machine Learning Solar Prediction
# --------------------------------------------------

@router.get("/ml/solar/{site_id}")
def predict_ml_solar(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    environment = (
        db.query(EnvironmentalData)
        .filter(EnvironmentalData.site_id == site_id)
        .order_by(EnvironmentalData.recorded_at.desc())
        .first()
    )

    if not environment:
        raise HTTPException(
            status_code=404,
            detail="Environmental data not found"
        )

    predicted_power = predict_solar_power(
        temperature=environment.temperature,
        rainfall=environment.rainfall,
        rhoa=environment.air_pressure,
        irradiance_g=environment.solar_irradiance,
        irradiance_a=environment.solar_irradiance * 1.2,
        cloud=0.1
    )

    solar_score = calculate_solar_score(environment)
    wind_score = calculate_wind_score(environment)

    overall_score = round((solar_score + wind_score) / 2)

    if solar_score >= wind_score:
        best_energy_source = "Solar"
    else:
        best_energy_source = "Wind"

    if overall_score >= 85:
        recommendation = "Excellent"
    elif overall_score >= 70:
        recommendation = "Good"
    elif overall_score >= 50:
        recommendation = "Moderate"
    else:
        recommendation = "Poor"

    history = PredictionHistory(
        site_id=site_id,
        predicted_power=round(predicted_power, 2),
        solar_score=solar_score,
        wind_score=wind_score,
        overall_score=overall_score,
        best_energy_source=best_energy_source,
        recommendation=recommendation,
        model_name="Random Forest"
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    return {
        "site_id": site_id,
        "model": "Random Forest",
        "predicted_power": round(predicted_power, 2),
        "solar_score": solar_score,
        "wind_score": wind_score,
        "overall_score": overall_score,
        "best_energy_source": best_energy_source,
        "recommendation": recommendation
    }


# --------------------------------------------------
# Prediction History
# --------------------------------------------------

@router.get("/history/{site_id}")
def get_prediction_history(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    history = (
        db.query(PredictionHistory)
        .filter(PredictionHistory.site_id == site_id)
        .order_by(PredictionHistory.created_at.desc())
        .all()
    )

    if not history:
        raise HTTPException(
            status_code=404,
            detail="No prediction history found for this site."
        )

    return [
        {
            "id": record.id,
            "site_id": record.site_id,
            "predicted_power": record.predicted_power,
            "solar_score": record.solar_score,
            "wind_score": record.wind_score,
            "overall_score": record.overall_score,
            "best_energy_source": record.best_energy_source,
            "recommendation": record.recommendation,
            "model_name": record.model_name,
            "created_at": record.created_at
        }
        for record in history
    ]


# --------------------------------------------------
# Prediction Analytics
# --------------------------------------------------

@router.get("/analytics/{site_id}")
def prediction_analytics(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    history = (
        db.query(PredictionHistory)
        .filter(PredictionHistory.site_id == site_id)
        .all()
    )

    if not history:
        raise HTTPException(
            status_code=404,
            detail="No prediction history found."
        )

    total_predictions = len(history)

    avg_power = round(
        sum(item.predicted_power for item in history) / total_predictions,
        2
    )

    avg_solar = round(
        sum(item.solar_score for item in history) / total_predictions
    )

    avg_wind = round(
        sum(item.wind_score for item in history) / total_predictions
    )

    avg_overall = round(
        sum(item.overall_score for item in history) / total_predictions
    )

    latest = (
        db.query(PredictionHistory)
        .filter(PredictionHistory.site_id == site_id)
        .order_by(PredictionHistory.created_at.desc())
        .first()
    )

    solar_count = len(
        [x for x in history if x.best_energy_source == "Solar"]
    )

    wind_count = len(
        [x for x in history if x.best_energy_source == "Wind"]
    )

    best_source = "Solar" if solar_count >= wind_count else "Wind"

    return {
        "site_id": site_id,
        "total_predictions": total_predictions,
        "average_predicted_power": avg_power,
        "average_solar_score": avg_solar,
        "average_wind_score": avg_wind,
        "average_overall_score": avg_overall,
        "best_energy_source": best_source,
        "latest_prediction": {
            "predicted_power": latest.predicted_power,
            "recommendation": latest.recommendation,
            "created_at": latest.created_at
        }
    }


# --------------------------------------------------
# Recommendation Engine
# --------------------------------------------------

@router.get("/recommendation/{site_id}")
def get_site_recommendation(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    environment = (
        db.query(EnvironmentalData)
        .filter(EnvironmentalData.site_id == site_id)
        .order_by(EnvironmentalData.recorded_at.desc())
        .first()
    )

    if not environment:
        raise HTTPException(
            status_code=404,
            detail="Environmental data not found."
        )

    strengths = []
    weaknesses = []

    # -----------------------------
    # Solar Irradiance
    # -----------------------------
    if environment.solar_irradiance >= 7:
        strengths.append("High solar irradiance")
    elif environment.solar_irradiance >= 5:
        strengths.append("Moderate solar irradiance")
    else:
        weaknesses.append("Low solar irradiance")

    # -----------------------------
    # Temperature
    # -----------------------------
    if 20 <= environment.temperature <= 35:
        strengths.append("Optimal temperature")
    else:
        weaknesses.append("Temperature not ideal")

    # -----------------------------
    # Humidity
    # -----------------------------
    if environment.humidity <= 60:
        strengths.append("Low humidity")
    else:
        weaknesses.append("High humidity")

    # -----------------------------
    # Rainfall
    # -----------------------------
    if environment.rainfall == 0:
        strengths.append("No rainfall")
    elif environment.rainfall < 5:
        strengths.append("Low rainfall")
    else:
        weaknesses.append("Heavy rainfall")

    # -----------------------------
    # Wind Speed
    # -----------------------------
    if 12 <= environment.wind_speed <= 25:
        strengths.append("Excellent wind speed")
    elif environment.wind_speed >= 8:
        strengths.append("Suitable wind speed")
    else:
        weaknesses.append("Low wind speed")

    # -----------------------------
    # Scores
    # -----------------------------
    solar_score = calculate_solar_score(environment)
    wind_score = calculate_wind_score(environment)

    overall_score = round((solar_score + wind_score) / 2)

    if solar_score >= wind_score:
        best_source = "Solar"
    else:
        best_source = "Wind"

    # -----------------------------
    # Recommendation
    # -----------------------------
    if overall_score >= 85:
        recommendation = "Excellent"
        suggestion = (
            f"This site is highly suitable for {best_source} energy deployment."
        )

    elif overall_score >= 70:
        recommendation = "Good"
        suggestion = (
            f"This site is suitable for {best_source} energy with minor improvements."
        )

    elif overall_score >= 50:
        recommendation = "Moderate"
        suggestion = (
            "Site can be used, but environmental conditions should be improved."
        )

    else:
        recommendation = "Poor"
        suggestion = (
            "This site is currently not recommended for renewable energy deployment."
        )

    return {
        "site_id": site_id,
        "solar_score": solar_score,
        "wind_score": wind_score,
        "overall_score": overall_score,
        "best_energy_source": best_source,
        "recommendation": recommendation,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestion": suggestion
    }