from __future__ import annotations

from pydantic import BaseModel, Field


class SiteReportSummary(BaseModel):
    site_id: int
    site_name: str
    latitude: float
    longitude: float
    region: str | None = None
    land_area: float | None = None
    elevation: float | None = None


class SiteReportResponse(BaseModel):
    """
    Combined site intelligence report.

    This schema only aggregates outputs from existing
    backend services. It does not implement business logic.
    """

    site: SiteReportSummary

    gis: dict

    environmental: dict | None = None

    solar_prediction: dict | None = None

    wind_prediction: dict | None = None

    suitability: dict | None = None

    renewable_recommendation: dict | None = None

    deployment_optimization: dict | None = None

    energy_forecast: dict | None = None

    investment_recommendation: dict | None = None

class SiteComparisonItem(BaseModel):
    site_id: int
    site_name: str
    region: str | None = None
    latitude: float
    longitude: float
    land_area: float | None = None
    elevation: float | None = None
    land_use: str | None = None
    land_slope: float | None = None
    road_distance: float | None = None
    nearest_substation_distance: float | None = None
    suitability_score: float | None = None
    solar_score: float | None = None
    wind_score: float | None = None
    hybrid_score: float | None = None
    recommended_technology: str | None = None
    deployment_feasible: bool | None = None


class SiteComparisonResponse(BaseModel):
    sites: list[SiteComparisonItem]
