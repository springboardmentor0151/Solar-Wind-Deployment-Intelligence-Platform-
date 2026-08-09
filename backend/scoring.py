

from data_simulator import EnvironmentalProfile

PANEL_EFFICIENCY = 0.20          
PERFORMANCE_RATIO = 0.80         
TURBINE_RATED_POWER_KW = 2500    
TURBINE_CUT_IN_MS = 3.0
TURBINE_RATED_MS = 12.0


_WIND_CF_CURVE = [
    (0.0, 0.00), (3.0, 0.05), (4.0, 0.10), (5.0, 0.17), (6.0, 0.25),
    (7.0, 0.32), (8.0, 0.38), (9.0, 0.43), (10.0, 0.47), (11.0, 0.50),
    (12.0, 0.52), (30.0, 0.52),
]


def _wind_speed_to_capacity_factor(v: float) -> float:
    if v <= 0:
        return 0.0
    for (v0, cf0), (v1, cf1) in zip(_WIND_CF_CURVE, _WIND_CF_CURVE[1:]):
        if v0 <= v <= v1:
            frac = (v - v0) / (v1 - v0) if v1 > v0 else 0.0
            return cf0 + frac * (cf1 - cf0)
    return _WIND_CF_CURVE[-1][1]


def solar_potential(land_area_m2: float, profile: EnvironmentalProfile) -> dict:
    capacity_factor = min(
        0.95, (profile.peak_sun_hours / 24) * PERFORMANCE_RATIO * (1 - profile.cloud_cover_pct / 250)
    )
    expected_kwh_year = (
        land_area_m2 * PANEL_EFFICIENCY * profile.solar_irradiance_kwh_m2_day * 365 * PERFORMANCE_RATIO
    )
    shading_penalty = max(0.0, (profile.land_slope_deg - 10) * 0.01)
    expected_kwh_year *= (1 - shading_penalty)

    return {
        "annual_irradiance_kwh_m2": round(profile.solar_irradiance_kwh_m2_day * 365, 1),
        "peak_sun_hours": profile.peak_sun_hours,
        "expected_energy_output_kwh_year": round(expected_kwh_year, 0),
        "capacity_factor_pct": round(capacity_factor * 100, 1),
        "performance_ratio_pct": round(PERFORMANCE_RATIO * 100, 1),
        "shading_penalty_pct": round(shading_penalty * 100, 2),
    }


def wind_potential(num_turbines: int, profile: EnvironmentalProfile) -> dict:

    v = profile.avg_wind_speed_ms
    capacity_factor = _wind_speed_to_capacity_factor(v)

    expected_kwh_year = num_turbines * TURBINE_RATED_POWER_KW * 8760 * capacity_factor

    return {
        "average_wind_speed_ms": v,
        "wind_power_density_w_m2": profile.wind_power_density_w_m2,
        "turbulence_intensity_pct": profile.turbulence_intensity_pct,
        "capacity_factor_pct": round(capacity_factor * 100, 1),
        "expected_annual_energy_production_kwh": round(expected_kwh_year, 0),
        "turbines_recommended": num_turbines,
    }



def _resource_score(solar: dict, wind: dict) -> float:
    solar_score = min(100, solar["capacity_factor_pct"] * (100 / 30))  
    wind_score = min(100, wind["capacity_factor_pct"] * (100 / 45))     
    return max(solar_score, wind_score) * 0.6 + min(solar_score, wind_score) * 0.4


def _geographic_score(profile: EnvironmentalProfile) -> float:
    slope_score = max(0, 100 - profile.land_slope_deg * 6)
    elevation_penalty = max(0, (profile.elevation_m - 1200) / 20)
    return max(0, min(100, slope_score - elevation_penalty))


def _infrastructure_score(profile: EnvironmentalProfile, existing_infrastructure: str = "") -> float:
    def prox(dist_km, ideal=5, max_dist=30):
        if dist_km <= ideal:
            return 100
        return max(0, 100 - (dist_km - ideal) * (100 / (max_dist - ideal)))

    base = (
        prox(profile.distance_to_road_km) * 0.3
        + prox(profile.distance_to_transmission_km) * 0.4
        + prox(profile.distance_to_substation_km) * 0.3
    )
   
    bonus = 0
    if existing_infrastructure:
        bonus = 10 if "Road + Grid" in existing_infrastructure else 6
    return min(100, base + bonus)


LAND_COVER_IMPACT_PENALTY = {
    "Forest/Woodland": 20,       
    "Wetland/Water": 40,         
    "Farmland": 12,             
    "Grassland": 6,
    "Scrubland/Barren": 2,      
    "Urban/Developed": 15,
    "Unclassified/Open Land": 8,  
}


def _environmental_score(profile: EnvironmentalProfile) -> float:
    score = 100
    if profile.in_protected_zone:
        score -= 60
    if profile.in_urban_area:
        score -= 25
    score -= LAND_COVER_IMPACT_PENALTY.get(profile.land_cover_type, 8)
    return max(0, min(100, score))


def _economic_score(profile: EnvironmentalProfile, infra_score: float) -> float:
    ownership_bonus = {"Government": 15, "Community/Cooperative": 8, "Private": 0}
    score = 55 + infra_score * 0.35 + ownership_bonus.get(profile.land_ownership, 0)
    return max(0, min(100, score))


def suitability_category(score: float) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Highly Suitable"
    if score >= 50:
        return "Moderately Suitable"
    if score >= 30:
        return "Low Suitability"
    return "Unsuitable"


def investment_priority(overall_score: float, economic_score: float) -> str:

    if overall_score >= 80 and economic_score >= 70:
        return "High Priority"
    if overall_score >= 60:
        return "Medium Priority"
    if overall_score >= 35:
        return "Low Priority"
    return "Not Recommended"


def compute_site_score(
    profile: EnvironmentalProfile, solar: dict, wind: dict, existing_infrastructure: str = ""
) -> dict:
    resource = _resource_score(solar, wind)
    geographic = _geographic_score(profile)
    infrastructure = _infrastructure_score(profile, existing_infrastructure)
    environmental = _environmental_score(profile)
    economic = _economic_score(profile, infrastructure)

    weighted_total = (
        resource * 0.35
        + geographic * 0.25
        + infrastructure * 0.15
        + environmental * 0.15
        + economic * 0.10
    )

    recommended_tech = "Solar" if solar["capacity_factor_pct"] >= wind["capacity_factor_pct"] else "Wind"
    if abs(solar["capacity_factor_pct"] - wind["capacity_factor_pct"]) < 5:
        recommended_tech = "Hybrid Solar + Wind"

    return {
        "renewable_resource_score": round(resource, 1),
        "geographic_suitability_score": round(geographic, 1),
        "infrastructure_accessibility_score": round(infrastructure, 1),
        "environmental_impact_score": round(environmental, 1),
        "economic_feasibility_score": round(economic, 1),
        "overall_deployment_score": round(weighted_total, 1),
        "investment_priority": investment_priority(weighted_total, economic),
        "suitability_category": suitability_category(weighted_total),
        "recommended_technology": recommended_tech,
        "weights": {
            "renewable_resource_availability": 0.35,
            "geographic_suitability": 0.25,
            "infrastructure_accessibility": 0.15,
            "environmental_impact": 0.15,
            "economic_feasibility": 0.10,
        },
    }



AVG_HOUSEHOLD_KWH_YEAR = 3500     

_QUARTERS = {
    "Q1 (Jan-Mar)": (0, 1, 2),
    "Q2 (Apr-Jun)": (3, 4, 5),
    "Q3 (Jul-Sep)": (6, 7, 8),
    "Q4 (Oct-Dec)": (9, 10, 11),
}


def _monthly_weights(monthly_values: list) -> list:
  
    total = sum(v for v in monthly_values if v is not None)
    if not total:
        return [1 / 12] * 12
    return [(v if v is not None else total / 12) / total for v in monthly_values]


def energy_forecast(solar: dict, wind: dict, recommended_technology: str, profile: EnvironmentalProfile) -> dict:
    
    solar_weights = _monthly_weights(profile.monthly_solar_irradiance_kwh_m2_day)
    wind_monthly_cf = [
        _wind_speed_to_capacity_factor(v) if v is not None else None
        for v in profile.monthly_wind_speed_hub_ms
    ]
    wind_weights = _monthly_weights(wind_monthly_cf)

    def quarterly(annual_value, weights):
        return {q: round(annual_value * sum(weights[i] for i in idxs)) for q, idxs in _QUARTERS.items()}

    if recommended_technology == "Solar":
        annual_kwh = solar["expected_energy_output_kwh_year"]
        seasonal_kwh = quarterly(annual_kwh, solar_weights)
    elif recommended_technology == "Wind":
        annual_kwh = wind["expected_annual_energy_production_kwh"]
        seasonal_kwh = quarterly(annual_kwh, wind_weights)
    else:  
        solar_annual = solar["expected_energy_output_kwh_year"]
        wind_annual = wind["expected_annual_energy_production_kwh"]
        annual_kwh = solar_annual + wind_annual
        solar_seasonal = quarterly(solar_annual, solar_weights)
        wind_seasonal = quarterly(wind_annual, wind_weights)
        seasonal_kwh = {q: solar_seasonal[q] + wind_seasonal[q] for q in _QUARTERS}

    return {
        "recommended_technology": recommended_technology,
        "annual_output_kwh": round(annual_kwh, 0),
        "seasonal_output_kwh": seasonal_kwh,
        "homes_powered_equivalent": round(annual_kwh / AVG_HOUSEHOLD_KWH_YEAR, 1),
    }


SOLAR_KW_INSTALLED_PER_M2 = 0.15   


def deployment_plan(land_area_m2: float, recommended_technology: str, solar: dict, wind: dict) -> dict:
    """9. Deployment Optimization Engine — capacity planning + expansion guidance."""
    if recommended_technology == "Solar":
        capacity_kw = land_area_m2 * SOLAR_KW_INSTALLED_PER_M2
    elif recommended_technology == "Wind":
        capacity_kw = wind["turbines_recommended"] * TURBINE_RATED_POWER_KW
    else:  
        capacity_kw = (
            land_area_m2 * SOLAR_KW_INSTALLED_PER_M2 * 0.6
            + wind["turbines_recommended"] * TURBINE_RATED_POWER_KW * 0.6
        )

    return {
        "recommended_technology": recommended_technology,
        "estimated_installed_capacity_kw": round(capacity_kw, 0),
        "expanded_capacity_kw": round(capacity_kw * 2, 0),
    }