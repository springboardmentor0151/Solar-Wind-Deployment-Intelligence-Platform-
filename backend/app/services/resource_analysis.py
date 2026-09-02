from app.models.site import Site


def calculate_solar_score(site: Site) -> float:
    """
    Calculate a basic solar suitability score.

    For the MVP, if a solar score was already saved
    for the site, use it. Otherwise return 0.
    """

    if site.solar_score is None:
        return 0.0

    return round(float(site.solar_score), 2)


def calculate_wind_score(site: Site) -> float:
    """
    Calculate a basic wind suitability score.

    For the MVP, use the site's existing wind score.
    """

    if site.wind_score is None:
        return 0.0

    return round(float(site.wind_score), 2)


def calculate_overall_score(
    solar_score: float,
    wind_score: float
) -> float:

    return round(
        (solar_score + wind_score) / 2,
        2
    )


def get_solar_potential(score: float) -> str:

    if score >= 80:
        return "Excellent"

    if score >= 65:
        return "Good"

    if score >= 50:
        return "Moderate"

    return "Low"


def get_wind_potential(score: float) -> str:

    if score >= 80:
        return "Excellent"

    if score >= 65:
        return "Good"

    if score >= 50:
        return "Moderate"

    return "Low"


def generate_recommendation(
    solar_score: float,
    wind_score: float,
    overall_score: float
) -> str:

    if overall_score >= 80:

        if solar_score >= wind_score:
            return "Highly suitable for Solar deployment"

        return "Highly suitable for Wind deployment"

    if solar_score >= 65 and wind_score >= 65:
        return "Suitable for Hybrid Solar + Wind deployment"

    if solar_score >= 65:
        return "Suitable for Solar deployment"

    if wind_score >= 65:
        return "Suitable for Wind deployment"

    if overall_score >= 50:
        return "Moderate renewable energy potential"

    return "Low renewable energy suitability"


def analyze_site(site: Site) -> dict:

    solar_score = calculate_solar_score(site)

    wind_score = calculate_wind_score(site)

    overall_score = calculate_overall_score(
        solar_score,
        wind_score
    )

    return {
        "site_id": site.id,
        "project_name": site.project_name,
        "location_name": site.location_name,

        "latitude": site.latitude,
        "longitude": site.longitude,

        "solar_score": solar_score,
        "solar_potential": get_solar_potential(
            solar_score
        ),

        "wind_score": wind_score,
        "wind_potential": get_wind_potential(
            wind_score
        ),

        "overall_score": overall_score,

        "recommendation": generate_recommendation(
            solar_score,
            wind_score,
            overall_score
        )
    }