from app.services.global_wind_atlas import get_global_wind_data
from app.services.nasa_power import get_nasa_power_data


def calculate_wind_score(speed: float):
    """
    Calculate wind suitability score
    based on average wind speed.
    """

    if speed >= 8:
        return 95, "Excellent"

    elif speed >= 6:
        return 85, "Very Good"

    elif speed >= 5:
        return 70, "Good"

    elif speed >= 4:
        return 55, "Moderate"

    else:
        return 35, "Poor"


def predict_wind(latitude: float, longitude: float):

    nasa = get_nasa_power_data(latitude, longitude)
    atlas = get_global_wind_data(latitude, longitude)

    if "error" in nasa:
        return nasa

    speed = atlas["wind"]["speed"]
    power_density = atlas["wind"]["power_density"]

    score, category = calculate_wind_score(speed)

    return {
        "speed": speed,
        "power_density": power_density,
        "score": score,
        "category": category
    }