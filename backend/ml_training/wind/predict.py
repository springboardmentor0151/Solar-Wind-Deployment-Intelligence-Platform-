"""
Wind ML inference.

Uses trained artifacts produced exclusively
from observed data.
"""

from __future__ import annotations

import joblib

from ml_core.preprocessing.feature_preparation import (
    prepare_prediction_record,
)

from ml_training.wind.config import (
    MODEL_PATH,
    PREPROCESSOR_PATH,
)


def load_artifacts():
    """
    Load the trained Wind ML artifacts.
    """

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Wind model not found: {MODEL_PATH}"
        )

    if not PREPROCESSOR_PATH.exists():
        raise FileNotFoundError(
            "Wind preprocessor not found: "
            f"{PREPROCESSOR_PATH}"
        )

    model = joblib.load(
        MODEL_PATH
    )

    preprocessor = joblib.load(
        PREPROCESSOR_PATH
    )

    return model, preprocessor


def predict_wind(
    record: dict,
) -> float:
    """
    Generate Wind prediction using
    the trained observed-data model.

    No heuristic calculation.
    No synthetic fallback.
    """

    model, preprocessor = load_artifacts()

    features = prepare_prediction_record(
        record,
        "wind",
    )

    processed = preprocessor.transform(
        features
    )

    prediction = model.predict(
        processed
    )[0]

    return float(prediction)


if __name__ == "__main__":

    sample = {
        "latitude": 23.25,
        "longitude": 79.95,
        "wind_speed_m_s": 7.5,
        "air_density_kg_m3": 1.18,
        "temperature_c": 26.0,
        "humidity_pct": 55.0,
        "pressure_hpa": 950.0,
        "elevation_m": 400.0,
    }

    prediction = predict_wind(
        sample
    )

    print(
        "Predicted Wind Generation: "
        f"{prediction:.4f} MW"
    )