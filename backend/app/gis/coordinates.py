from math import radians, sin, cos, sqrt, atan2
from typing import Tuple

from app.gis.constants import (
    EARTH_RADIUS_KM,
    MAX_LATITUDE,
    MAX_LONGITUDE,
    MIN_LATITUDE,
    MIN_LONGITUDE,
)


def validate_latitude(latitude: float) -> bool:
    """
    Validate latitude value.

    Valid range:
    -90 <= latitude <= 90
    """
    return MIN_LATITUDE <= latitude <= MAX_LATITUDE


def validate_longitude(longitude: float) -> bool:
    """
    Validate longitude value.

    Valid range:
    -180 <= longitude <= 180
    """
    return MIN_LONGITUDE <= longitude <= MAX_LONGITUDE


def validate_coordinates(latitude: float, longitude: float) -> bool:
    """
    Validate latitude and longitude together.
    """
    return (
        validate_latitude(latitude)
        and validate_longitude(longitude)
    )


def distance_between_points(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    """
    Calculate distance between two geographic coordinates
    using the Haversine formula.

    Returns:
        Distance in kilometers.
    """

    lat1_rad = radians(lat1)
    lon1_rad = radians(lon1)

    lat2_rad = radians(lat2)
    lon2_rad = radians(lon2)

    delta_lat = lat2_rad - lat1_rad
    delta_lon = lon2_rad - lon1_rad

    a = (
        sin(delta_lat / 2) ** 2
        + cos(lat1_rad)
        * cos(lat2_rad)
        * sin(delta_lon / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return EARTH_RADIUS_KM * c


def bounding_box(
    coordinates: list[tuple[float, float]]
) -> Tuple[float, float, float, float]:
    """
    Compute bounding box for a list of coordinates.

    Args:
        coordinates:
            List of tuples:
            [
                (latitude, longitude),
                ...
            ]

    Returns:
        (
            min_lat,
            min_lon,
            max_lat,
            max_lon
        )
    """

    if not coordinates:
        raise ValueError("Coordinate list cannot be empty.")

    latitudes = [lat for lat, _ in coordinates]
    longitudes = [lon for _, lon in coordinates]

    return (
        min(latitudes),
        min(longitudes),
        max(latitudes),
        max(longitudes),
    )


def center_point(
    coordinates: list[tuple[float, float]]
) -> tuple[float, float]:
    """
    Compute geographic center of coordinates.

    Returns:
        (
            latitude,
            longitude
        )
    """

    if not coordinates:
        raise ValueError("Coordinate list cannot be empty.")

    avg_lat = sum(lat for lat, _ in coordinates) / len(coordinates)
    avg_lon = sum(lon for _, lon in coordinates) / len(coordinates)

    return avg_lat, avg_lon