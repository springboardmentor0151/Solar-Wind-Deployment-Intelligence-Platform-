from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class SiteBase(BaseSchema):
    name: str = Field(
        min_length=3,
        max_length=150,
    )

    description: Optional[str] = None

    latitude: float = Field(
        ge=-90,
        le=90,
    )

    longitude: float = Field(
        ge=-180,
        le=180,
    )

    region: Optional[str] = None

    land_area: Optional[float] = None

    existing_infrastructure: Optional[str] = None

    project_id: Optional[int] = None


class SiteCreate(SiteBase):
    pass


class SiteUpdate(BaseSchema):
    name: Optional[str] = Field(
        default=None,
        min_length=3,
        max_length=150,
    )

    description: Optional[str] = None

    latitude: Optional[float] = Field(
        default=None,
        ge=-90,
        le=90,
    )

    longitude: Optional[float] = Field(
        default=None,
        ge=-180,
        le=180,
    )

    region: Optional[str] = None

    land_area: Optional[float] = None

    existing_infrastructure: Optional[str] = None

    project_id: Optional[int] = None


class SiteResponse(SiteBase):
    id: int

    elevation: Optional[float] = None

    land_use: Optional[str] = None

    road_distance: Optional[float] = None

    nearest_substation_distance: Optional[float] = None

    nearest_transmission_line_distance: Optional[float] = None

    water_body_distance: Optional[float] = None

    protected_area_distance: Optional[float] = None

    land_slope: Optional[float] = None

    vegetation_index: Optional[float] = None

    created_at: object