import joblib
import pandas as pd
from pathlib import Path

# Locate project root
BASE_DIR = Path(__file__).resolve().parents[3]

MODEL_PATH = BASE_DIR / "ml" / "models" / "solar_random_forest.pkl"

# Load model only once
model = joblib.load(MODEL_PATH)


def predict_solar_power(
    temperature,
    rainfall,
    rhoa,
    irradiance_g,
    irradiance_a,
    cloud,
):
    """
    Predict solar power using trained Random Forest model.
    """

    data = pd.DataFrame(
        [{
            "Temperature": temperature,
            "Prectotland": rainfall,
            "Rhoa": rhoa,
            "Irradiance (G)": irradiance_g,
            "Irradiance (A)": irradiance_a,
            "Cloud": cloud,
        }]
    )

    prediction = model.predict(data)[0]

    return round(float(prediction), 2)