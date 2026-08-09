from app.services.environmental_engine import get_environmental_profile
from app.services.solar_engine import predict_solar
from app.services.wind_engine import predict_wind
from app.services.site_suitability import analyze_site_suitability
from app.services.deployment_optimizer import optimize_deployment
from app.services.forecast_engine import generate_forecast
from app.services.investment_engine import generate_investment_recommendation


def generate_resource_report(latitude: float, longitude: float):
    """
    Generate a complete renewable energy
    resource assessment report.
    """

    environmental = get_environmental_profile(
        latitude,
        longitude
    )

    if "error" in environmental:
        return environmental

    solar = predict_solar(
        latitude,
        longitude
    )

    if "error" in solar:
        return solar

    wind = predict_wind(
        latitude,
        longitude
    )

    if "error" in wind:
        return wind

    suitability = analyze_site_suitability(
        latitude,
        longitude
    )

    if "error" in suitability:
        return suitability

    deployment = optimize_deployment(
        latitude,
        longitude
    )

    if "error" in deployment:
        return deployment

    overall_score = suitability["overall_score"]

    forecast = generate_forecast(
        overall_score
    )

    investment = generate_investment_recommendation(
        overall_score
    )

    if overall_score >= 90:
        recommendation = "Excellent for Renewable Energy Deployment"

    elif overall_score >= 75:
        recommendation = "Highly Suitable for Solar & Wind Deployment"

    elif overall_score >= 60:
        recommendation = "Suitable for Renewable Energy Deployment"

    elif overall_score >= 45:
        recommendation = "Moderately Suitable"

    else:
        recommendation = "Not Recommended"

    return {

        "location": environmental["location"],

        "terrain": environmental["terrain"],

        "solar": solar,

        "wind": wind,

        "site_suitability": suitability,

        "deployment": deployment,

        "forecast": forecast,

        "investment": investment,

        "overall_score": overall_score,

        "recommendation": recommendation
    }