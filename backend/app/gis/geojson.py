"""
GeoJSON utilities.

Implemented in Phase 11B.
"""

from app.gis.constants import (
    COORDINATE_PRECISION,
    MARKER_CONFIG,
)
from app.gis.coordinates import validate_coordinates
from app.gis.exceptions import InvalidCoordinatesError
from app.models.site import Site
from app.schemas.geojson import (
    Feature,
    FeatureCollection,
    Geometry,
)


def site_to_feature(
    site: Site,
) -> Feature:
    """
    Convert a Site model into a GeoJSON Feature.
    """

    if not validate_coordinates(
        site.latitude,
        site.longitude,
    ):
        raise InvalidCoordinatesError(
            f"Invalid coordinates for site '{site.name}'."
        )

    marker = MARKER_CONFIG["default"]

    geometry = Geometry(
        type="Point",
        coordinates=[
            round(
                site.longitude,
                COORDINATE_PRECISION,
            ),
            round(
                site.latitude,
                COORDINATE_PRECISION,
            ),
        ],
    )

    properties = {
        "id": site.id,
        "name": site.name,
        "project_id": site.project_id,

        # Frontend metadata
        "markerColor": marker["color"],
        "markerIcon": marker["icon"],
        "layer": "sites",

        # Popup
        "popup": {
            "title": site.name,
            "project_id": site.project_id,
            "latitude": round(
                site.latitude,
                COORDINATE_PRECISION,
            ),
            "longitude": round(
                site.longitude,
                COORDINATE_PRECISION,
            ),
        },

        # Tooltip
        "tooltip": site.name,
    }

    return Feature(
        id=site.id,
        geometry=geometry,
        properties=properties,
    )


def sites_to_feature_collection(
    sites: list[Site],
) -> FeatureCollection:
    """
    Convert a list of Site objects into a
    GeoJSON FeatureCollection.
    """

    return FeatureCollection(
        features=[
            site_to_feature(site)
            for site in sites
        ],
    )


def project_sites_to_feature_collection(
    project,
) -> FeatureCollection:
    """
    Convert all project sites into a
    GeoJSON FeatureCollection.
    """

    return FeatureCollection(
        features=[
            site_to_feature(site)
            for site in project.sites
        ],
    )