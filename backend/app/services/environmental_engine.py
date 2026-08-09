from app.services.nasa_power import get_nasa_power_data
from app.services.global_wind_atlas import get_global_wind_data
from app.services.srtm import get_elevation_data
from app.services.osm import get_location_details


def get_environmental_profile(latitude: float, longitude: float):
    """
    Combines all environmental services into one unified profile.
    """

    nasa_data = get_nasa_power_data(latitude, longitude)
    wind_data = get_global_wind_data(latitude, longitude)
    terrain_data = get_elevation_data(latitude, longitude)
    location_data = get_location_details(latitude, longitude)

    return {
        "location": location_data.get("location", {}),
        "solar": nasa_data.get("solar", {}),
        "wind": {
            **nasa_data.get("wind", {}),
            **wind_data.get("wind", {})
        },
        "terrain": terrain_data.get("terrain", {})
    }