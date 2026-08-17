from __future__ import annotations

from sqlalchemy.orm import Session

from app.prediction.services.prediction_service import PredictionService
from app.repositories.site_repository import SiteRepository
from app.schemas.resource_assessment import (
    ResourceAssessmentResponse,
    ResourceMetric,
    SolarResourceAssessment,
    WindResourceAssessment,
)
from app.schemas.unified_prediction import RenewablePredictionRequest
from app.services.deployment_optimization_service import DeploymentOptimizationService
from app.services.energy_forecasting_service import EnergyForecastingService
from app.services.environmental_service import EnvironmentalService


class ResourceAssessmentService:
    """Builds the resource-assessment report from authoritative services.

    This service does not train models or invent missing measurements. Metrics that
    cannot be computed from the currently available provider/model outputs are
    returned as unavailable with an explicit note.
    """

    def __init__(
        self,
        db: Session,
        environmental_service: EnvironmentalService,
        prediction_service: PredictionService,
        deployment_optimization_service: DeploymentOptimizationService,
        energy_forecasting_service: EnergyForecastingService,
    ) -> None:
        self.site_repository = SiteRepository(db)
        self.environmental_service = environmental_service
        self.prediction_service = prediction_service
        self.deployment_optimization_service = deployment_optimization_service
        self.energy_forecasting_service = energy_forecasting_service

    def assess(self, site_id: int) -> ResourceAssessmentResponse:
        site = self.site_repository.get_by_id(site_id)
        if site is None:
            raise ValueError(f"Site {site_id} not found.")

        environment = self.environmental_service.get_site_environment(site_id)
        env = environment.model_dump(mode="python")
        weather = env.get("weather") or {}
        solar = env.get("solar") or {}

        ghi = self._number(solar.get("ghi"))
        wind_speed = self._number(weather.get("wind_speed"))
        pressure = self._number(weather.get("pressure"))
        temperature = self._number(weather.get("temperature"))

        # PredictionService exposes prediction through the unified request
        # contract; it does not have a site-id based predict_site() method.
        # Build the request only when the environmental inputs required by the
        # ML models are actually available. Otherwise keep the metric explicitly
        # unavailable instead of inventing measurements.
        dni = self._number(solar.get("dni"))
        dhi = self._number(solar.get("dhi"))
        humidity = self._number(weather.get("humidity"))
        cloud_cover = self._number(weather.get("cloud_cover"))
        elevation = self._number(getattr(site, "elevation", None))

        prediction_data = {}
        required_prediction_values = (
            ghi,
            dni,
            dhi,
            temperature,
            humidity,
            cloud_cover,
            pressure,
            wind_speed,
            elevation,
        )

        if all(value is not None for value in required_prediction_values):
            prediction_request = RenewablePredictionRequest(
                latitude=float(site.latitude),
                longitude=float(site.longitude),
                ghi=ghi,
                dni=dni,
                dhi=dhi,
                temperature_c=temperature,
                humidity_pct=humidity,
                cloud_cover_pct=cloud_cover,
                pressure_hpa=pressure,
                wind_speed_m_s=wind_speed,
                elevation_m=elevation,
                air_density_kg_m3=(
                    self._air_density(pressure, temperature)
                ),
            )

            prediction = self.prediction_service.predict(
                prediction_request
            )
            prediction_data = prediction.model_dump(
                mode="python"
            )

        deployment = self.deployment_optimization_service.optimize_site(site_id)
        capacity_plan = deployment.capacity_plan

        forecast = self.energy_forecasting_service.forecast(site_id)
        monthly = forecast.monthly_forecast
        solar_annual_mwh = sum(self._number(m.solar_generation_mwh) for m in monthly)
        wind_annual_mwh = sum(self._number(m.wind_generation_mwh) for m in monthly)

        # NASA POWER GHI is exposed by the current provider as kWh/m²/day.
        # Annual irradiance is therefore a transparent 365-day normalization.
        annual_irradiance = None if ghi is None else ghi * 365.0

        solar_expected = prediction_data.get("solar_generation_mw")
        solar_cf = self._capacity_factor_from_generation(
            solar_annual_mwh, capacity_plan.solar_capacity_mw
        )
        wind_cf = self._capacity_factor_from_generation(
            wind_annual_mwh, capacity_plan.wind_capacity_mw
        )

        air_density = None
        if pressure is not None and temperature is not None:
            air_density = self._air_density(pressure, temperature)

        wind_power_density = None
        if air_density is not None and wind_speed is not None:
            wind_power_density = 0.5 * air_density * (wind_speed ** 3)

        notes = [
            "Performance ratio is not reported because the current pipeline does not provide PV module efficiency or measured AC output.",
            "Turbulence intensity is not reported because the current weather provider response contains a single wind-speed observation rather than a time series.",
            "GTI is not reported because the current environmental provider/model contract exposes GHI, DNI and DHI but no tilted-plane GTI feature.",
        ]

        return ResourceAssessmentResponse(
            site_id=site.id,
            site_name=site.name,
            latitude=site.latitude,
            longitude=site.longitude,
            solar=SolarResourceAssessment(
                annual_irradiance=ResourceMetric(
                    value=annual_irradiance,
                    unit="kWh/m²/year",
                    source="NASA POWER GHI",
                    note="Computed as daily GHI × 365 days." if annual_irradiance is not None else "GHI unavailable.",
                ),
                peak_sun_hours=ResourceMetric(
                    value=ghi,
                    unit="h/day",
                    source="NASA POWER GHI",
                    note="Using daily GHI as peak-sun-hours equivalent for resource screening.",
                ),
                expected_energy_output=ResourceMetric(
                    value=solar_expected,
                    unit="MW",
                    source=f"Solar ML ({prediction_data.get('model_version', 'unknown')})",
                    note="ML site prediction output.",
                ),
                capacity_factor=ResourceMetric(
                    value=solar_cf,
                    unit="fraction",
                    source="Energy forecast monthly solar generation",
                    note="Derived from forecasted solar generation and optimized solar capacity.",
                ),
                performance_ratio=ResourceMetric(
                    value=None,
                    unit="fraction",
                    source="Unavailable from current provider/model contract",
                    status="unavailable",
                ),
            ),
            wind=WindResourceAssessment(
                average_wind_speed=ResourceMetric(
                    value=wind_speed,
                    unit="m/s",
                    source="OpenWeather current observation",
                ),
                wind_power_density=ResourceMetric(
                    value=wind_power_density,
                    unit="W/m²",
                    source="OpenWeather + ideal-gas air density",
                    note="Computed as 0.5 × air density × wind speed³." if wind_power_density is not None else "Wind speed/pressure/temperature unavailable.",
                ),
                turbulence_intensity=ResourceMetric(
                    value=None,
                    unit="fraction",
                    source="Unavailable from current provider contract",
                    status="unavailable",
                ),
                capacity_factor=ResourceMetric(
                    value=wind_cf,
                    unit="fraction",
                    source="Energy forecast monthly wind generation",
                    note="Derived from forecasted wind generation and optimized wind capacity.",
                ),
                expected_annual_energy_production=ResourceMetric(
                    value=wind_annual_mwh,
                    unit="MWh/year",
                    source="Energy forecast",
                ),
            ),
            assessment_notes=notes,
        )

    @staticmethod
    def _number(value):
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _capacity_factor_from_generation(annual_mwh, capacity_mw):
        if annual_mwh is None or capacity_mw is None or capacity_mw <= 0:
            return None
        return max(0.0, min(1.0, annual_mwh / (capacity_mw * 8760.0)))

    @staticmethod
    def _air_density(pressure_hpa, temperature_c):
        temperature_k = temperature_c + 273.15
        pressure_pa = pressure_hpa * 100.0
        if temperature_k <= 0 or pressure_pa <= 0:
            return None
        return pressure_pa / (287.05 * temperature_k)
