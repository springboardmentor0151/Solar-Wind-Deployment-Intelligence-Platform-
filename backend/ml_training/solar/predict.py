"""
Solar ML inference.

Uses trained artifacts produced exclusively
from observed data.
"""

from __future__ import annotations

import joblib

from ml_core.preprocessing.feature_preparation import (
    prepare_prediction_record,
)

from ml_training.solar.config import (
    MODEL_PATH,
    PREPROCESSOR_PATH,
)


def load_artifacts():
    """
    Load the trained Solar ML artifacts.
    """

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Solar model not found: {MODEL_PATH}"
        )

    if not PREPROCESSOR_PATH.exists():
        raise FileNotFoundError(
            "Solar preprocessor not found: "
            f"{PREPROCESSOR_PATH}"
        )

    model = joblib.load(
        MODEL_PATH
    )

    preprocessor = joblib.load(
        PREPROCESSOR_PATH
    )

    return model, preprocessor


def predict_solar(
    record: dict,
) -> float:
    """
    Generate Solar prediction using
    the trained observed-data model.

    No heuristic calculation.
    No synthetic fallback.
    """

    model, preprocessor = load_artifacts()

    features = prepare_prediction_record(
        record,
        "solar",
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
        "ghi": 650.0,
        "dni": 500.0,
        "dhi": 150.0,
        "temperature_c": 27.0,
        "humidity_pct": 55.0,
        "cloud_cover_pct": 20.0,
        "pressure_hpa": 950.0,
        "wind_speed_m_s": 4.0,
        "elevation_m": 400.0,
    }

    prediction = predict_solar(
        sample
    )

    print(
        "Predicted Solar Generation: "
        f"{prediction:.4f} MW"
    )