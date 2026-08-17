from __future__ import annotations

from typing import Any

from ml_core.preprocessing.feature_preparation import (
    prepare_prediction_record,
)

from app.ml.inference.model_loader import MLModelLoader

from app.schemas.ml_prediction import (
    SolarPredictionRequest,
    PredictionResponse,
)


class SolarPredictor:
    """
    Production Solar ML inference adapter.

    Input:
        Authoritative environmental + GIS data.

    Output:
        Solar generation prediction from the trained
        observed-data ML model.

    No heuristic fallback is allowed.
    """

    domain = "solar"

    def __init__(
        self,
        model_loader: type[MLModelLoader],
    ) -> None:
        self.model_loader = model_loader

    def predict(
        self,
        data: SolarPredictionRequest,
    ) -> PredictionResponse:

        record: dict[str, Any] = {
            "latitude": data.latitude,
            "longitude": data.longitude,
            "ghi": data.ghi,
            "dni": data.dni,
            "dhi": data.dhi,
            "temperature_c": data.temperature_c,
            "humidity_pct": data.humidity_pct,
            "cloud_cover_pct": data.cloud_cover_pct,
            "pressure_hpa": data.pressure_hpa,
            "wind_speed_m_s": data.wind_speed_m_s,
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