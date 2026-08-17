from __future__ import annotations

from typing import Any

from ml_core.preprocessing.feature_preparation import (
    prepare_prediction_record,
)

from app.ml.inference.model_loader import MLModelLoader

from app.schemas.ml_prediction import (
    WindPredictionRequest,
    PredictionResponse,
)


class WindPredictor:
    """
    Production Wind ML inference adapter.

    Uses only the trained observed-data wind model.

    No:
        - turbine power curve
        - capacity-factor formula
        - heuristic prediction
        - synthetic fallback
    """

    domain = "wind"

    def __init__(
        self,
        model_loader: type[MLModelLoader],
    ) -> None:
        self.model_loader = model_loader

    def predict(
        self,
        data: WindPredictionRequest,
    ) -> PredictionResponse:

        record: dict[str, Any] = {
            "latitude": data.latitude,
            "longitude": data.longitude,
            "wind_speed_m_s": data.wind_speed_m_s,
            "air_density_kg_m3": data.air_density_kg_m3,
            "temperature_c": data.temperature_c,
            "humidity_pct": data.humidity_pct,
            "pressure_hpa": data.pressure_hpa,
            "elevation_m": data.elevation_m,
        }

        features = prepare_prediction_record(
            record,
            self.domain,
        )

        result = self.model_loader.predict(
            features,
            self.domain,
        )

        return PredictionResponse(
            domain=self.domain,
            prediction_mw=float(
                result["prediction"]
            ),
            model_version=str(
                result["model_version"]
            ),
            data_source=str(
                result["data_source"]
            ),
        )