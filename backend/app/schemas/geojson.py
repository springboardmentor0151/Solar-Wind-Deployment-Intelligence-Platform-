from typing import Any

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class Geometry(BaseModel):
    """
    GeoJSON Point Geometry.
    """

    model_config = ConfigDict(
        from_attributes=True
    )

    type: str = "Point"

    coordinates: list[float] = Field(
        ...,
        min_length=2,
        max_length=2,
        description="[longitude, latitude]",
    )


class Feature(BaseModel):
    """
    GeoJSON Feature.
    """

    model_config = ConfigDict(
        from_attributes=True
    )

    type: str = "Feature"

    id: int | None = Field(
        default=None,
        description="Unique feature identifier.",
    )

    geometry: Geometry

    properties: dict[str, Any]


class FeatureCollection(BaseModel):
    """
    GeoJSON FeatureCollection.
    """

    model_config = ConfigDict(
        from_attributes=True
    )

    type: str = "FeatureCollection"

    features: list[Feature]