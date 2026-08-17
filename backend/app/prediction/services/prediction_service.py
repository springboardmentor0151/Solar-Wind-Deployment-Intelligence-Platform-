from __future__ import annotations

from app.prediction.predictors.solar_predictor import (
    SolarPredictor,
)

from app.prediction.predictors.wind_predictor import (
    WindPredictor,
)

from app.prediction.predictors.hybrid_predictor import (
    HybridPredictor,
)

from app.schemas.ml_prediction import (
    SolarPredictionRequest,
    WindPredictionRequest,
    PredictionResponse,
)

from app.schemas.unified_prediction import (
    RenewablePredictionRequest,
    RenewablePredictionResponse,
)


class PredictionService:
    """
    Orchestrates production ML prediction.

    Architecture:

        Environmental/GIS
              ↓
        PredictionRequest
              ↓
        PredictionService
          ↙          ↘
      Solar ML      Wind ML
          ↘          ↙
         Hybrid
    """

    def __init__(
        self,
        solar_predictor: SolarPredictor,
        wind_predictor: WindPredictor,
        hybrid_predictor: HybridPredictor,
    ) -> None:

        self.solar_predictor = solar_predictor
        self.wind_predictor = wind_predictor
        self.hybrid_predictor = hybrid_predictor

    def predict_solar(
        self,
        data: SolarPredictionRequest,
    ) -> PredictionResponse:

        return self.solar_predictor.predict(
            data
        )

    def predict_wind(
        self,
        data: WindPredictionRequest,
    ) -> PredictionResponse:

        return self.wind_predictor.predict(
            data
        )

    def predict_renewable(
        self,
        solar_request: SolarPredictionRequest,
        wind_request: WindPredictionRequest,
    ) -> RenewablePredictionResponse:

        solar = self.solar_predictor.predict(
            solar_request
        )

        wind = self.wind_predictor.predict(
            wind_request
        )

        return self.hybrid_predictor.predict(
            solar_prediction=solar,
            wind_prediction=wind,
            latitude=solar_request.latitude,
            longitude=solar_request.longitude,
        )

    def predict(
        self,
        data: RenewablePredictionRequest,
    ) -> RenewablePredictionResponse:

        solar_request = SolarPredictionRequest(
            latitude=data.latitude,
            longitude=data.longitude,
            ghi=data.ghi,
            dni=data.dni,
            dhi=data.dhi,
            temperature_c=data.temperature_c,
            humidity_pct=data.humidity_pct,
            cloud_cover_pct=data.cloud_cover_pct,
            pressure_hpa=data.pressure_hpa,
            wind_speed_m_s=data.wind_speed_m_s,
            elevation_m=data.elevation_m,
        )

        wind_request = WindPredictionRequest(
            latitude=data.latitude,
            longitude=data.longitude,
            wind_speed_m_s=data.wind_speed_m_s,
            air_density_kg_m3=data.air_density_kg_m3,
            temperature_c=data.temperature_c,
            humidity_pct=data.humidity_pct,
            pressure_hpa=data.pressure_hpa,
            elevation_m=data.elevation_m,
        )

        return self.predict_renewable(
            solar_request=solar_request,
            wind_request=wind_request,
        )