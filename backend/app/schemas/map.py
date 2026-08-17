from pydantic import (
    BaseModel,
    ConfigDict,
)


class MapConfigResponse(BaseModel):
    """
    Configuration for GIS frontends.
    """

    model_config = ConfigDict(
        from_attributes=True
    )

    default_center: list[float]
    default_zoom: int

    min_zoom: int
    max_zoom: int

    tile_provider: str

    crs: str