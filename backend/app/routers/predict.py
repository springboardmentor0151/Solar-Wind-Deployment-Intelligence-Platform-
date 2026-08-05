from fastapi import APIRouter
from pydantic import BaseModel
import joblib
import os
import pandas as pd

router = APIRouter(
    prefix="/predict",
    tags=["AI Prediction"]
)

model_path = os.path.join(
    os.path.dirname(__file__),
    "..",
    "ai",
    "model.pkl"
)

model = joblib.load(model_path)


class PredictionInput(BaseModel):
    latitude: float
    longitude: float
    land_area: float
    elevation: float
    solar_radiation: float
    wind_speed: float
    temperature: float
    rainfall: float


@router.post("/")
def predict(data: PredictionInput):

    X = pd.DataFrame([{
        "latitude": data.latitude,
        "longitude": data.longitude,
        "land_area": data.land_area,
        "elevation": data.elevation,
        "solar_radiation": data.solar_radiation,
        "wind_speed": data.wind_speed,
        "temperature": data.temperature,
        "rainfall": data.rainfall
    }])

    prediction = model.predict(X)[0]

    # -----------------------------
    # Suitability Score
    # -----------------------------
    score = 0

    # Solar Radiation (35)
    if data.solar_radiation >= 700:
        score += 35
    elif data.solar_radiation >= 500:
        score += 25
    else:
        score += 10

    # Wind Speed (25)
    if data.wind_speed >= 8:
        score += 25
    elif data.wind_speed >= 5:
        score += 15
    else:
        score += 5

    # Elevation (15)
    if data.elevation >= 500:
        score += 15
    elif data.elevation >= 200:
        score += 10
    else:
        score += 5

    # Land Area (15)
    if data.land_area >= 100:
        score += 15
    elif data.land_area >= 50:
        score += 10
    else:
        score += 5

    # Rainfall (10)
    if data.rainfall <= 100:
        score += 10
    elif data.rainfall <= 300:
        score += 7
    else:
        score += 3

    # -----------------------------
    # Rating
    # -----------------------------
    if score >= 85:
        rating = "★★★★★ Excellent"
    elif score >= 70:
        rating = "★★★★ Very Good"
    elif score >= 55:
        rating = "★★★ Good"
    elif score >= 40:
        rating = "★★ Fair"
    else:
        rating = "★ Poor"

    # -----------------------------
    # Recommendations
    # -----------------------------
    recommendations = []

    if data.solar_radiation >= 700:
        recommendations.append(
            "Excellent solar radiation for solar power generation."
        )
    elif data.solar_radiation >= 500:
        recommendations.append(
            "Good solar radiation available."
        )
    else:
        recommendations.append(
            "Low solar radiation. Solar efficiency may decrease."
        )

    if data.wind_speed >= 8:
        recommendations.append(
            "High wind speed suitable for wind turbines."
        )
    elif data.wind_speed >= 5:
        recommendations.append(
            "Moderate wind speed available."
        )
    else:
        recommendations.append(
            "Wind speed is relatively low."
        )

    if data.land_area >= 100:
        recommendations.append(
            "Large land area suitable for utility-scale renewable projects."
        )
    elif data.land_area >= 50:
        recommendations.append(
            "Land area is adequate for medium-sized projects."
        )
    else:
        recommendations.append(
            "Limited land area available."
        )

    if data.rainfall <= 100:
        recommendations.append(
            "Low rainfall minimizes maintenance issues."
        )
    else:
        recommendations.append(
            "High rainfall should be considered during planning."
        )

    if prediction == 1:
        recommendations.append(
            "Overall site is suitable for renewable energy development."
        )
    else:
        recommendations.append(
            "Site needs further evaluation before investment."
        )

    # -----------------------------
    # Return Response
    # -----------------------------
    return {
        "prediction": "Suitable" if prediction == 1 else "Not Suitable",
        "score": score,
        "rating": rating,
        "recommendations": recommendations
    }