from app.models.site import Site


def calculate_suitability(site: Site) -> dict:

    solar = float(site.solar_score or 0)
    wind = float(site.wind_score or 0)
    wind_potential = float(site.wind_potential or 0)

    overall_score = (
        solar * 0.45
        + wind * 0.35
        + min(wind_potential, 100) * 0.20
    )

    overall_score = round(
        min(overall_score, 100),
        2
    )

    if overall_score >= 80:
        classification = "Highly Suitable"

    elif overall_score >= 65:
        classification = "Suitable"

    elif overall_score >= 50:
        classification = "Moderately Suitable"

    elif overall_score >= 35:
        classification = "Low Suitability"

    else:
        classification = "Unsuitable"

    if solar >= 70 and wind >= 70:
        technology = "Hybrid Solar + Wind"

    elif solar >= wind:
        technology = "Solar"

    elif wind >= 60:
        technology = "Wind"

    else:
        technology = "Solar"

    return {
        "site_id": site.id,
        "location_name": site.location_name,

        "solar_score": round(solar, 2),
        "wind_score": round(wind, 2),
        "wind_potential": round(wind_potential, 2),

        "suitability_score": overall_score,

        "classification": classification,

        "recommended_technology": technology
    }