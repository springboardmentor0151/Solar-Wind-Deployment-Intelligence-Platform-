from __future__ import annotations

from app.schemas.ml_prediction import (
    PredictionResponse,
)

from app.schemas.unified_prediction import (
    RenewablePredictionResponse,
)


class HybridPredictor:
    """
    Combines independent Solar and Wind ML predictions.

    This class performs no ML inference and no heuristics.
    """

    def predict(
        self,
        solar_prediction: PredictionResponse,
        wind_prediction: PredictionResponse,
        latitude: float,
        longitude: float,
    ) -> RenewablePredictionResponse:

        if solar_prediction.domain != "solar":
            raise ValueError(
                "HybridPredictor expected a solar prediction."
            )

        if wind_prediction.domain != "wind":
            raise ValueError(
                "HybridPredictor expected a wind prediction."
            )

        solar_generation_mw = float(
            solar_prediction.prediction_mw
        )

        wind_generation_mw = float(
            wind_prediction.prediction_mw
        )

        total_generation_mw = (
            solar_generation_mw
            + wind_generation_mw
        )

        return RenewablePredictionResponse(
            latitude=latitude,
            longitude=longitude,
            solar_generation_mw=solar_generation_mw,
            wind_generation_mw=wind_generation_mw,
            total_generation_mw=total_generation_mw,
            model_version=(
                f"solar:{solar_prediction.model_version};"
                f"wind:{wind_prediction.model_version}"
            ),
            data_source=(
                f"solar:{solar_prediction.data_source};"
                f"wind:{wind_prediction.data_source}"
            ),
        )