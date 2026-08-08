def run_hybrid_recommendation(solar_results: dict, wind_results: dict, env_data: dict) -> dict:
    """
    Module 8 - Hybrid Recommendation:
    Compares solar, wind, and environmental features to recommend the optimal tech choice.
    """
    solar_score = solar_results.get("solar_suitability_score", 50.0)
    wind_score = wind_results.get("wind_suitability_score", 50.0)
    
    # Environmental score (Module 9)
    env = env_data.get("environmental", {})
    temp = env.get("temperature", 25.0)
    humidity = env.get("humidity", 50.0)
    cloud_cover = env.get("cloud_cover", 30.0)
    slope = env.get("land_slope", 2.0)
    elevation = env.get("elevation", 100.0)
    
    # High temp, high humidity, cloud cover, and high slope reduce env suitability
    env_suitability = 100.0 - (
        max(0.0, temp - 30.0) * 1.5 +
        max(0.0, humidity - 70.0) * 0.5 +
        (cloud_cover * 0.2) +
        (slope * 1.2) +
        min(15.0, (elevation / 1000.0) * 5.0)
    )
    env_suitability_score = round(max(10.0, min(99.0, env_suitability)), 1)
    
    # Siting Recommendation logic
    if solar_score < 40.0 and wind_score < 40.0:
        recommendation = "Not Suitable"
        confidence_score = round(99.0 - (solar_score + wind_score) / 2.0, 1)
    elif abs(solar_score - wind_score) <= 15.0 and solar_score >= 60.0 and wind_score >= 60.0:
        recommendation = "Hybrid Plant"
        confidence_score = round(max(65.0, min(98.0, (solar_score + wind_score) / 2.0 + 5.0)), 1)
    elif solar_score >= wind_score:
        recommendation = "Solar Plant"
        confidence_score = round(max(60.0, min(98.0, solar_score)), 1)
    else:
        recommendation = "Wind Farm"
        confidence_score = round(max(60.0, min(98.0, wind_score)), 1)
        
    return {
        "solar_score": solar_score,
        "wind_score": wind_score,
        "environmental_score": env_suitability_score,
        "recommended_technology": recommendation,
        "confidence_score": confidence_score
    }
