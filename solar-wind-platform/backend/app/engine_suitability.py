from typing import Dict, Any

def get_category_for_score(score: float) -> str:
    if score >= 85.0:
        return "Excellent"
    elif score >= 70.0:
        return "Very Good"
    elif score >= 55.0:
        return "Good"
    elif score >= 40.0:
        return "Moderate"
    elif score >= 20.0:
        return "Poor"
    else:
        return "Unsuitable"

def run_suitability_analysis(env_data: Dict[str, Any], solar_data: Dict[str, Any], wind_data: Dict[str, Any], project_type: str = "solar") -> Dict[str, Any]:
    """
    Site Suitability & Scoring Engine.
    Executes the multi-factor weighted scoring model and classifies the site.
    Also calculates a confidence score and generates reasoning.
    """
    env = env_data["environmental"]
    infra = env_data["infrastructure"]
    
    # Extract environmental factors
    slope = env["land_slope"]
    elevation = env["elevation"]
    rocky_area_pct = env.get("rocky_area_pct", 5.0)
    forest_area_pct = env.get("forest_area_pct", 5.0)
    temp = env["temperature"]
    cloud_cover = env["cloud_cover"]
    rainfall = env["rainfall"]
    ndvi = env["vegetation_index"]
    
    # Extract infrastructure factors
    distance_to_road = infra["distance_to_road"]
    distance_to_transmission = infra["distance_to_transmission"]
    distance_to_substation = infra["distance_to_substation"]
    in_protected_zone = infra["in_protected_zone"]
    on_agricultural_land = infra["on_agricultural_land"]
    near_water_bodies = infra["near_water_bodies"]
    
    # 1. Solar Suitability Score (0-100)
    solar_score = solar_data["solar_suitability_score"]
    
    # 2. Wind Suitability Score (0-100)
    wind_score = wind_data["wind_suitability_score"]
    
    # 3. Land Suitability Score (0-100)
    slope_score = max(0.0, 100.0 - (slope * 5.0))
    elevation_score = max(0.0, 100.0 - (max(0.0, elevation - 1000.0) * 0.04))
    roughness_score = max(0.0, 100.0 - rocky_area_pct - forest_area_pct)
    
    risk_penalty = 0.0
    if env.get("flood_risk") == "High" or env.get("earthquake_risk") == "High":
        risk_penalty += 35.0
    elif env.get("flood_risk") == "Medium" or env.get("earthquake_risk") == "Medium":
        risk_penalty += 15.0
    land_score = max(10.0, (slope_score * 0.4 + elevation_score * 0.3 + roughness_score * 0.3) - risk_penalty)
    
    # 4. Weather Score (0-100)
    cloud_factor = max(0.0, 100.0 - cloud_cover * 1.1)
    temp_factor = max(0.0, 100.0 - (abs(temp - 22.0) * 2.0))
    rain_factor = max(0.0, 100.0 - min(100.0, rainfall * 0.04))
    weather_score = round((cloud_factor * 0.4 + temp_factor * 0.3 + rain_factor * 0.3), 1)
    
    # 5. Infrastructure Score (0-100)
    road_factor = max(0.0, 100.0 - distance_to_road * 15.0)
    grid_factor = max(0.0, 100.0 - distance_to_transmission * 8.0)
    substation_factor = max(0.0, 100.0 - distance_to_substation * 6.0)
    infra_score = round((road_factor * 0.3 + grid_factor * 0.4 + substation_factor * 0.3), 1)
    
    # 6. Environmental Score (0-100)
    if in_protected_zone:
        env_score = 0.0
    else:
        env_score = 100.0
        if on_agricultural_land:
            env_score -= 25.0
        if near_water_bodies:
            env_score -= 15.0
        veg_penalty = ndvi * 20.0
        env_score = max(10.0, env_score - veg_penalty)
        
    # 7. Economic Score (0-100)
    grid_cost_penalty = (distance_to_substation * 3.2) + (distance_to_road * 1.8)
    land_ownership = env_data.get("land_ownership", "Lease").lower()
    
    if "public" in land_ownership or "blm" in land_ownership:
        land_cost_score = 95.0
    elif "agricultural" in land_ownership or "lease" in land_ownership:
        land_cost_score = 75.0
    else:
        land_cost_score = 55.0
        
    econ_score = max(10.0, land_cost_score - grid_cost_penalty)
    
    # 8. Overall Suitability Score (0-100)
    if project_type == "solar":
        resource_score = solar_score
    elif project_type == "wind":
        resource_score = wind_score
    else: # hybrid
        resource_score = (solar_score + wind_score) / 2.0
        
    overall_score = (
        (resource_score * 0.35) +
        (land_score * 0.15) +
        (weather_score * 0.15) +
        (infra_score * 0.15) +
        (env_score * 0.10) +
        (econ_score * 0.10)
    )
    
    # Absolute veto: protected zone drops score to 0
    if in_protected_zone:
        overall_score = 0.0
        
    overall_score = round(overall_score, 1)
    category = get_category_for_score(overall_score)

    # 9. Dynamic Confidence Score (0-100)
    # Influenced by: cloud cover variability, weather stability, terrain ruggedness, and grid proximity
    weather_variance = (cloud_cover * 0.05) + (abs(temp - 20) * 0.1)
    proximity_gap = (distance_to_transmission * 0.3) + (distance_to_road * 0.5)
    confidence = 100.0 - weather_variance - proximity_gap
    confidence_score = round(max(60.0, min(99.0, confidence)), 1)

    # 10. Natural Language Reasoning & Factor attributions
    reasons = []
    if in_protected_zone:
        reasoning = "Site is completely unsuitable as it lies within an environmentally protected zone."
    else:
        # Solar specific rationales
        if project_type in ["solar", "hybrid"]:
            if solar_score >= 80.0:
                reasons.append(f"Excellent GHI irradiance of {env['solar_irradiance']} kWh/m²/day enhances solar score.")
            elif solar_score < 50.0:
                reasons.append(f"Low GHI irradiance of {env['solar_irradiance']} limits solar generation potential.")
        
        # Wind specific rationales
        if project_type in ["wind", "hybrid"]:
            if wind_score >= 80.0:
                reasons.append(f"Strong hub wind speeds of {wind_data['average_wind_speed']} m/s are ideal for wind power.")
            elif wind_score < 50.0:
                reasons.append(f"Insufficient hub wind speed ({wind_data['average_wind_speed']} m/s) limits wind turbine output.")

        # Terrain & Infrastructure
        if slope < 3.0:
            reasons.append("Very flat terrain minimizes civil construction risk and mounting costs.")
        elif slope > 10.0:
            reasons.append(f"Significant slope of {slope}° increases grading and structural design expenses.")

        if distance_to_transmission < 2.0:
            reasons.append("Close proximity to the high-voltage transmission lines reduces grid connection costs.")
        elif distance_to_transmission > 8.0:
            reasons.append(f"Remote distance from transmission grid ({round(distance_to_transmission, 1)} km) adds grid connection burden.")

        if on_agricultural_land:
            reasons.append("Location sits on agricultural parcels, requiring conversion permits.")

        if reasons:
            reasoning = " ".join(reasons)
        else:
            reasoning = "Optimal average conditions. Site presents a balanced opportunity for development."

    return {
        "scores": {
            "solar": round(solar_score, 1),
            "wind": round(wind_score, 1),
            "land": round(land_score, 1),
            "weather": round(weather_score, 1),
            "infrastructure": round(infra_score, 1),
            "environmental": round(env_score, 1),
            "economic": round(econ_score, 1),
            "overall": overall_score
        },
        "category": category,
        "solar_category": get_category_for_score(solar_score),
        "wind_category": get_category_for_score(wind_score),
        "land_category": get_category_for_score(land_score),
        "weather_category": get_category_for_score(weather_score),
        "infrastructure_category": get_category_for_score(infra_score),
        "environmental_category": get_category_for_score(env_score),
        "economic_category": get_category_for_score(econ_score),
        
        # New items
        "confidence_score": confidence_score,
        "reasoning": reasoning
    }
