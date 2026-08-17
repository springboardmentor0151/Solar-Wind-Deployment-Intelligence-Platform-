"""
GIS-related constants used throughout the application.
"""

# Coordinate Reference System
DEFAULT_CRS = "EPSG:4326"

# GeoJSON specification version
GEOJSON_VERSION = "RFC7946"

# Earth's average radius in kilometers
EARTH_RADIUS_KM = 6371.0088

# Coordinate precision (decimal places)
COORDINATE_PRECISION = 6

# Latitude and Longitude bounds
MIN_LATITUDE = -90.0
MAX_LATITUDE = 90.0

MIN_LONGITUDE = -180.0
MAX_LONGITUDE = 180.0

MARKER_CONFIG = {
    "default": {
        "color": "green",
        "icon": "solar-panel",
    }
}

# --------------------------------------------------
# GIS Providers
# --------------------------------------------------

OVERPASS_API_URL = "https://overpass-api.de/api/interpreter"

OPEN_ELEVATION_API_URL = "https://api.open-elevation.com"

REQUEST_TIMEOUT = 30

DEFAULT_SEARCH_RADIUS = 5000