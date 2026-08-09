from app.services.site_suitability import analyze_site_suitability


def optimize_deployment(latitude: float, longitude: float):
    """
    Generate deployment recommendations based on
    site suitability analysis.
    """

    suitability = analyze_site_suitability(
        latitude,
        longitude
    )

    if "error" in suitability:
        return suitability

    score = suitability["overall_score"]
    deployment = suitability["recommended_deployment"]

    # Investment Risk
    if score >= 80:
        investment_risk = "Low"
    elif score >= 60:
        investment_risk = "Medium"
    else:
        investment_risk = "High"

    # Deployment Priority
    if score >= 80:
        priority = "High"
    elif score >= 60:
        priority = "Medium"
    else:
        priority = "Low"

    # Construction Complexity
    elevation = suitability["terrain"]["elevation"]

    if elevation <= 100:
        complexity = "Easy"
    elif elevation <= 500:
        complexity = "Moderate"
    else:
        complexity = "Difficult"

    # Estimated Project Size
    if score >= 85:
        project_size = "Utility Scale"
    elif score >= 65:
        project_size = "Commercial"
    else:
        project_size = "Pilot Project"

    return {
        "recommended_deployment": deployment,
        "investment_risk": investment_risk,
        "deployment_priority": priority,
        "construction_complexity": complexity,
        "project_size": project_size
    }