from app.services.solar_engine import predict_solar
from app.services.wind_engine import predict_wind
from app.services.srtm import get_elevation_data


def calculate_suitability_category(score: float):
    """
    Categorize overall site suitability.
    """

    if score >= 90:
        return "Excellent"

    elif score >= 75:
        return "Highly Suitable"

    elif score >= 60:
        return "Suitable"

    elif score >= 45:
        return "Moderately Suitable"

    else:
        return "Poor"


def recommend_deployment(solar_score: float, wind_score: float):
    """
    Recommend the best deployment type.
    """

    if solar_score >= 70 and wind_score >= 70:
        return "Hybrid"

    elif solar_score > wind_score:
        return "Solar Farm"

    elif wind_score > solar_score:
        return "Wind Farm"

    else:
        return "Hybrid"


def analyze_site_suitability(latitude: float, longitude: float):
    """
    Generate complete site suitability analysis.
    """

    solar = predict_solar(latitude, longitude)
    wind = predict_wind(latitude, longitude)
    terrain = get_elevation_data(latitude, longitude)

    if "error" in solar:
        return solar

    if "error" in wind:
        return wind

    if "error" in terrain:
        return terrain

    solar_score = solar["score"]
    wind_score = wind["score"]
    elevation = terrain["terrain"]["elevation"]

    overall_score = round(
        (solar_score + wind_score) / 2
    )

    category = calculate_suitability_category(
        overall_score
    )

    deployment = recommend_deployment(
        solar_score,
        wind_score
    )

    return {
        "overall_score": overall_score,
        "category": category,
        "recommended_deployment": deployment,
        "solar_score": solar_score,
        "wind_score": wind_score,
        "terrain": {
            "elevation": elevation
        }
    }