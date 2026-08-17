from pydantic import BaseModel, Field


class GISSummary(BaseModel):
    total_sites: int

    enriched_sites: int

    average_slope: float

    average_vegetation_index: float


class GISVisualizationSite(BaseModel):
    site_id: int

    site_name: str

    latitude: float

    longitude: float

    suitability_score: float

    land_use: str


class EnvironmentalAnalytics(BaseModel):
    average_vegetation_index: float

    average_water_body_distance: float

    average_protected_area_distance: float

    average_road_distance: float

    average_substation_distance: float

    average_transmission_line_distance: float


class TerrainMapSite(BaseModel):
    site_id: int

    site_name: str

    latitude: float

    longitude: float

    land_slope: float


class SiteComparisonItem(BaseModel):
    site_id: int

    site_name: str

    suitability_score: float

    land_use: str

    land_slope: float

    vegetation_index: float

    road_distance: float

    substation_distance: float

    transmission_line_distance: float

    water_body_distance: float

    protected_area_distance: float


class GISAnalystDashboardResponse(BaseModel):
    summary: GISSummary

    visualization_sites: list[
        GISVisualizationSite
    ]

    environmental_analytics: EnvironmentalAnalytics

    terrain_sites: list[
        TerrainMapSite
    ]

    site_comparison: list[
        SiteComparisonItem
    ]