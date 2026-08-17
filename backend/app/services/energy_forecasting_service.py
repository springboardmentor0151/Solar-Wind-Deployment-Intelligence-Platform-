from __future__ import annotations

from calendar import month_name

from sqlalchemy.orm import Session

from app.repositories.energy_forecasting_repository import (
    EnergyForecastingRepository,
)

from app.schemas.energy_forecasting import (
    EnergyForecastResponse,
    ForecastTechnology,
    ForecastPeriod,
    GridContributionForecast,
    LongTermForecast,
    MonthlyForecast,
    RevenueForecast,
    SeasonalForecast,
)

from app.services.deployment_optimization_service import (
    DeploymentOptimizationService,
)


class EnergyForecastingService:
    """
    Energy Forecasting Engine.

    Flow:

        Site
          ↓
        Site Suitability
          ↓
        Renewable Recommendation
          ↓
        Deployment Optimization
          ↓
        Energy Forecasting
          ↓
        Annual / Monthly / Seasonal /
        Long-Term / Grid / Revenue Forecast
    """

    DEFAULT_ELECTRICITY_PRICE = 5000.0

    DEFAULT_SOLAR_CAPACITY_FACTOR = 0.20
    DEFAULT_WIND_CAPACITY_FACTOR = 0.35

    DEFAULT_GRID_CONTRIBUTION = 0.90

    LONG_TERM_YEARS = 10

    MONTHLY_DISTRIBUTION = {
        1: 0.072,
        2: 0.071,
        3: 0.078,
        4: 0.082,
        5: 0.090,
        6: 0.092,
        7: 0.088,
        8: 0.086,
        9: 0.083,
        10: 0.084,
        11: 0.079,
        12: 0.095,
    }

    def __init__(
        self,
        db: Session,
        deployment_optimization_service:
            DeploymentOptimizationService,
    ):
        self.repository = (
            EnergyForecastingRepository(db)
        )

        self.deployment_optimization_service = (
            deployment_optimization_service
        )

    # =========================================================
    # MAIN
    # =========================================================

    def forecast(
        self,
        site_id: int,
    ) -> EnergyForecastResponse:

        # =====================================================
        # SITE VALIDATION
        # =====================================================

        site = self.repository.get_site(
            site_id
        )

        if site is None:
            raise ValueError(
                f"Site {site_id} not found."
            )

        # =====================================================
        # GET AUTHORITATIVE DEPLOYMENT PLAN
        # =====================================================

        deployment = (
            self.deployment_optimization_service.optimize_site(
                site_id=site_id,
            )
        )

        intelligence = deployment.model_dump()

        # =====================================================
        # TECHNOLOGY
        # =====================================================

        technology = self._get_technology(
            intelligence
        )

        # =====================================================
        # CAPACITY
        # =====================================================

        capacity_plan = intelligence.get(
            "capacity_plan",
            {},
        ) or {}

        capacity_mw = self._normalize(
            capacity_plan.get(
                "recommended_capacity_mw"
            )
        )

        solar_capacity_mw = self._normalize(
            capacity_plan.get(
                "solar_capacity_mw"
            )
        )

        wind_capacity_mw = self._normalize(
            capacity_plan.get(
                "wind_capacity_mw"
            )
        )

        # =====================================================
        # CAPACITY FACTORS
        # =====================================================

        solar_cf = (
            self.DEFAULT_SOLAR_CAPACITY_FACTOR
        )

        wind_cf = (
            self.DEFAULT_WIND_CAPACITY_FACTOR
        )

        # =====================================================
        # ANNUAL GENERATION
        # =====================================================

        annual_generation = (
            self._calculate_annual_generation(
                technology=technology,
                capacity_mw=capacity_mw,
                solar_capacity_mw=solar_capacity_mw,
                wind_capacity_mw=wind_capacity_mw,
                solar_capacity_factor=solar_cf,
                wind_capacity_factor=wind_cf,
            )
        )

        # =====================================================
        # MONTHLY
        # =====================================================

        monthly_forecast = (
            self._build_monthly_forecast(
                annual_generation=annual_generation,
                technology=technology,
                solar_capacity_mw=solar_capacity_mw,
                wind_capacity_mw=wind_capacity_mw,
                solar_capacity_factor=solar_cf,
                wind_capacity_factor=wind_cf,
            )
        )

        # =====================================================
        # SEASONAL
        # =====================================================

        seasonal_forecast = (
            self._build_seasonal_forecast(
                monthly_forecast
            )
        )

        # =====================================================
        # GRID CONTRIBUTION
        # =====================================================

        grid_contribution = (
            self._build_grid_contribution(
                annual_generation,
            )
        )

        # =====================================================
        # REVENUE
        # =====================================================

        revenue_forecast = (
            self._build_revenue_forecast(
                annual_generation,
            )
        )

        # =====================================================
        # LONG TERM
        # =====================================================

        long_term_forecast = (
            self._build_long_term_forecast(
                annual_generation,
                revenue_forecast.estimated_annual_revenue,
            )
        )

        # =====================================================
        # CAPACITY FACTOR
        # =====================================================

        capacity_factor = (
            self._calculate_combined_capacity_factor(
                annual_generation,
                capacity_mw,
            )
        )

        # =====================================================
        # ASSUMPTIONS
        # =====================================================

        assumptions = self._build_assumptions()


        # =====================================================
        # FINAL RESPONSE
        # =====================================================

        return EnergyForecastResponse(
            site_id=site_id,

            technology=technology,

            forecast_period=ForecastPeriod.ANNUAL,

            annual_generation_mwh=round(
                annual_generation,
                2,
            ),

            monthly_forecast=monthly_forecast,

            seasonal_forecast=seasonal_forecast,

            long_term_forecast=long_term_forecast,

            grid_contribution=grid_contribution,

            revenue_forecast=revenue_forecast,

            capacity_mw=capacity_mw,

            capacity_factor=capacity_factor,

            forecasting_assumptions=assumptions,
        )

    # =========================================================
    # TECHNOLOGY
    # =========================================================

    @staticmethod
    def _get_technology(
        intelligence: dict,
    ) -> ForecastTechnology:

        value = intelligence.get(
            "technology"
        )

        if value is None:
            return ForecastTechnology.SOLAR

        if hasattr(value, "value"):
            value = value.value

        try:
            return ForecastTechnology(value)

        except ValueError:
            return ForecastTechnology.SOLAR

    # =========================================================
    # ANNUAL GENERATION
    # =========================================================

    @staticmethod
    def _calculate_annual_generation(
        technology: ForecastTechnology,
        capacity_mw: float,
        solar_capacity_mw: float,
        wind_capacity_mw: float,
        solar_capacity_factor: float,
        wind_capacity_factor: float,
    ) -> float:

        hours = 8760

        if technology == ForecastTechnology.SOLAR:

            return (
                capacity_mw
                * hours
                * solar_capacity_factor
            )

        if technology == ForecastTechnology.WIND:

            return (
                capacity_mw
                * hours
                * wind_capacity_factor
            )

        if technology == ForecastTechnology.HYBRID:

            solar_generation = (
                solar_capacity_mw
                * hours
                * solar_capacity_factor
            )

            wind_generation = (
                wind_capacity_mw
                * hours
                * wind_capacity_factor
            )

            return (
                solar_generation
                + wind_generation
            )

        return 0.0

    # =========================================================
    # MONTHLY
    # =========================================================

    def _build_monthly_forecast(
        self,
        annual_generation: float,
        technology: ForecastTechnology,
        solar_capacity_mw: float,
        wind_capacity_mw: float,
        solar_capacity_factor: float,
        wind_capacity_factor: float,
    ) -> list[MonthlyForecast]:

        forecasts = []

        solar_annual = (
            solar_capacity_mw
            * 8760
            * solar_capacity_factor
        )

        wind_annual = (
            wind_capacity_mw
            * 8760
            * wind_capacity_factor
        )

        combined_annual = (
            solar_annual
            + wind_annual
        )

        if combined_annual > 0:
            solar_ratio = (
                solar_annual
                / combined_annual
            )
        else:
            solar_ratio = 0.5

        for month, percentage in (
            self.MONTHLY_DISTRIBUTION.items()
        ):

            total = (
                annual_generation
                * percentage
            )

            if technology == ForecastTechnology.SOLAR:

                solar_generation = total
                wind_generation = 0.0

            elif technology == ForecastTechnology.WIND:

                solar_generation = 0.0
                wind_generation = total

            else:

                solar_generation = (
                    total * solar_ratio
                )

                wind_generation = (
                    total - solar_generation
                )

            forecasts.append(
                MonthlyForecast(
                    month=month,

                    month_name=month_name[month],

                    solar_generation_mwh=round(
                        solar_generation,
                        2,
                    ),

                    wind_generation_mwh=round(
                        wind_generation,
                        2,
                    ),

                    total_generation_mwh=round(
                        total,
                        2,
                    ),
                )
            )

        return forecasts

    # =========================================================
    # SEASONAL
    # =========================================================

    @staticmethod
    def _build_seasonal_forecast(
        monthly_forecast: list[
            MonthlyForecast
        ],
    ) -> list[SeasonalForecast]:

        seasons = {
            "Winter": [12, 1, 2],
            "Spring": [3, 4, 5],
            "Summer": [6, 7, 8],
            "Autumn": [9, 10, 11],
        }

        annual_total = sum(
            item.total_generation_mwh
            for item in monthly_forecast
        )

        results = []

        for season, months in seasons.items():

            generation = sum(
                item.total_generation_mwh
                for item in monthly_forecast
                if item.month in months
            )

            percentage = (
                generation / annual_total * 100
                if annual_total > 0
                else 0
            )

            results.append(
                SeasonalForecast(
                    season=season,

                    generation_mwh=round(
                        generation,
                        2,
                    ),

                    percentage_of_annual_generation=round(
                        percentage,
                        2,
                    ),
                )
            )

        return results

    # =========================================================
    # LONG TERM
    # =========================================================

    def _build_long_term_forecast(
        self,
        annual_generation: float,
        annual_revenue: float,
    ) -> list[LongTermForecast]:

        degradation_rate = 0.0
        escalation_rate = 0.0

        forecasts = []

        generation = annual_generation

        for year in range(
            1,
            self.LONG_TERM_YEARS + 1,
        ):

            if year > 1:
                generation *= (
                    1 - degradation_rate
                )

            revenue = (
                annual_revenue
                * (
                    (1 + escalation_rate)
                    ** (year - 1)
                )
            )

            forecasts.append(
                LongTermForecast(
                    year=year,

                    estimated_generation_mwh=round(
                        generation,
                        2,
                    ),

                    estimated_revenue=round(
                        revenue,
                        2,
                    ),
                )
            )

        return forecasts

    # =========================================================
    # GRID
    # =========================================================

    def _build_grid_contribution(
        self,
        annual_generation: float,
    ) -> GridContributionForecast:

        percentage = (
            self.DEFAULT_GRID_CONTRIBUTION
            * 100
        )

        grid_generation = (
            annual_generation
            * percentage
            / 100
        )

        return GridContributionForecast(
            annual_generation_mwh=round(
                annual_generation,
                2,
            ),

            estimated_grid_contribution_mwh=round(
                grid_generation,
                2,
            ),

            grid_contribution_percentage=round(
                percentage,
                2,
            ),
        )

    # =========================================================
    # REVENUE
    # =========================================================

    def _build_revenue_forecast(
        self,
        annual_generation: float,
    ) -> RevenueForecast:

        price = (
            self.DEFAULT_ELECTRICITY_PRICE
        )

        revenue = (
            annual_generation
            * price
        )

        return RevenueForecast(
            annual_generation_mwh=round(
                annual_generation,
                2,
            ),

            electricity_price_per_mwh=round(
                price,
                2,
            ),

            estimated_annual_revenue=round(
                revenue,
                2,
            ),

            currency="INR",
        )

    # =========================================================
    # CAPACITY FACTOR
    # =========================================================

    @staticmethod
    def _calculate_combined_capacity_factor(
        annual_generation: float,
        capacity_mw: float,
    ) -> float:

        if capacity_mw <= 0:
            return 0.0

        factor = (
            annual_generation
            / (capacity_mw * 8760)
        )

        return round(
            max(
                0.0,
                min(1.0, factor),
            ),
            4,
        )

    # =========================================================
    # ASSUMPTIONS
    # =========================================================

    def _build_assumptions(self) -> list[str]:

        return [
            "Capacity and technology were obtained from the deployment optimization engine.",
            "Default solar capacity factor of 20% was used.",
            "Default wind capacity factor of 35% was used.",
            "Default electricity price of INR 5000/MWh was used.",
            "Zero annual generation degradation was assumed.",
            "Zero annual revenue escalation was assumed.",
            "Grid contribution was assumed to be 90%.",
        ]

    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _normalize(
        value,
    ) -> float:

        if value is None:
            return 0.0

        try:
            value = float(value)

        except (
            TypeError,
            ValueError,
        ):
            return 0.0

        return round(
            max(0.0, value),
            4,
        )