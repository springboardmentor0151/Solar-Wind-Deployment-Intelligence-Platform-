from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ForecastTechnology(str, Enum):
    SOLAR = "Solar"
    WIND = "Wind"
    HYBRID = "Hybrid Solar-Wind"


class ForecastPeriod(str, Enum):
    MONTHLY = "Monthly"
    SEASONAL = "Seasonal"
    ANNUAL = "Annual"
    LONG_TERM = "Long Term"


class MonthlyForecast(BaseModel):
    month: int = Field(..., ge=1, le=12)

    month_name: str

    solar_generation_mwh: float = Field(
        ...,
        ge=0,
    )

    wind_generation_mwh: float = Field(
        ...,
        ge=0,
    )

    total_generation_mwh: float = Field(
        ...,
        ge=0,
    )


class SeasonalForecast(BaseModel):
    season: str

    generation_mwh: float = Field(
        ...,
        ge=0,
    )

    percentage_of_annual_generation: float = Field(
        ...,
        ge=0,
        le=100,
    )


class RevenueForecast(BaseModel):
    annual_generation_mwh: float = Field(
        ...,
        ge=0,
    )

    electricity_price_per_mwh: float = Field(
        ...,
        ge=0,
    )

    estimated_annual_revenue: float = Field(
        ...,
        ge=0,
    )

    currency: str = "INR"


class LongTermForecast(BaseModel):
    year: int

    estimated_generation_mwh: float = Field(
        ...,
        ge=0,
    )

    estimated_revenue: float = Field(
        ...,
        ge=0,
    )


class GridContributionForecast(BaseModel):
    annual_generation_mwh: float = Field(
        ...,
        ge=0,
    )

    estimated_grid_contribution_mwh: float = Field(
        ...,
        ge=0,
    )

    grid_contribution_percentage: float = Field(
        ...,
        ge=0,
        le=100,
    )


class EnergyForecastResponse(BaseModel):
    site_id: int

    technology: ForecastTechnology

    forecast_period: ForecastPeriod

    annual_generation_mwh: float = Field(
        ...,
        ge=0,
    )

    monthly_forecast: list[MonthlyForecast]

    seasonal_forecast: list[SeasonalForecast]

    long_term_forecast: list[LongTermForecast]

    grid_contribution: GridContributionForecast

    revenue_forecast: RevenueForecast

    capacity_mw: float = Field(
        ...,
        ge=0,
    )

    capacity_factor: float = Field(
        ...,
        ge=0,
        le=1,
    )

    forecasting_assumptions: list[str]