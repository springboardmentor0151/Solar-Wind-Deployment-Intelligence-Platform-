from pydantic import BaseModel, ConfigDict, Field


class GISResult(BaseModel):
    """
    GIS enrichment result.

    Contains provider-derived and directly derived
    geographic/environmental features.

    No suitability or deployment score is calculated here.
    """

    model_config = ConfigDict(
        from_attributes=True
    )

    land_use: str | None = None

    elevation: float | None = None

    road_distance: float | None = None

    nearest_substation_distance: float | None = None

    nearest_transmission_line_distance: float | None = None

    existing_infrastructure: str | None = None

    water_body_distance: float | None = None

    protected_area_distance: float | None = None

    land_slope: float | None = Field(
        default=None,
        description="Terrain slope in degrees.",
    )

    vegetation_index: float | None = Field(
        default=None,
        description="NDVI vegetation index.",
    )