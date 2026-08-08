import math

def calculate_wind_potential(env_data: dict, land_area: float = 10.0) -> dict:
    """
    Module 7 - Wind resource predictions:
    - Wind Suitability
    - Wind Power Density
    - Average Wind Speed
    - Capacity Factor
    - Annual Wind Energy
    - Turbine Efficiency
    """
    env = env_data.get("environmental", {})
    infra = env_data.get("infrastructure", {})
    
    wind_speed_10m = env.get("wind_speed", 4.0)
    wind_dir = env.get("wind_direction", 180)
    slope = env.get("land_slope", 2.0)
    temp = env.get("temperature", 25.0)
    elevation = env.get("elevation", 100.0)
    
    # 1. Hub height wind speed using logarithmic wind shear law
    hub_height = 110.0 # meters (Standard utility height)
    alpha = 0.143 # power law exponent for open terrains
    wind_speed_hub = round(wind_speed_10m * ((hub_height / 10.0) ** alpha), 2)
    max_wind_speed = round(wind_speed_hub * 1.5, 1)
    
    # 2. Turbine parameters selection based on resource class
    # Class I: High Wind (>8.5m/s), Class II: Medium (7.5-8.5), Class III: Low (<7.5)
    if wind_speed_hub >= 8.5:
        recommended_model = "Vestas V150 (3.45 MW)"
        rotor_diameter = 150.0
        rated_capacity_kw = 3450.0
        cut_in_speed = 3.0
        rated_speed = 12.0
        cut_out_speed = 25.0
    elif wind_speed_hub >= 7.0:
        recommended_model = "Siemens SG 3.4-132 (3.4 MW)"
        rotor_diameter = 132.0
        rated_capacity_kw = 3400.0
        cut_in_speed = 3.0
        rated_speed = 11.5
        cut_out_speed = 25.0
    elif wind_speed_hub >= 5.0:
        recommended_model = "Goldwind GW155 (3.0 MW)"
        rotor_diameter = 155.0
        rated_capacity_kw = 3000.0
        cut_in_speed = 3.0
        rated_speed = 11.0
        cut_out_speed = 22.0
    else:
        recommended_model = "GE 1.7-100 (1.7 MW)"
        rotor_diameter = 100.0
        rated_capacity_kw = 1700.0
        cut_in_speed = 3.0
        rated_speed = 10.5
        cut_out_speed = 25.0
        
    # 3. Air Density
    p_sea = 101325.0 # Pascals
    g = 9.80665
    M = 0.0289644
    R = 8.31447
    temp_k = temp + 273.15
    air_density = round((p_sea * math.exp(-g * M * elevation / (R * temp_k))) / (R * temp_k) * 1000.0, 3) # kg/m3
    
    # 4. Wind Power Density (WPD = 0.5 * rho * V^3)
    wpd = round(0.5 * air_density * (wind_speed_hub ** 3), 1)
    
    # 5. Rotor area
    rotor_area = round(math.pi * ((rotor_diameter / 2.0) ** 2), 1)
    
    # 6. Spacing area footprint per turbine (15 * D^2 area footprint)
    spacing_area_m2 = 15.0 * (rotor_diameter ** 2)
    usable_area_hectares = land_area * 0.85 # 85% default due to setbacks
    usable_area_m2 = usable_area_hectares * 10000.0
    
    number_of_turbines = max(1, int(math.floor(usable_area_m2 / spacing_area_m2)))
    installed_capacity_kw = number_of_turbines * rated_capacity_kw
    
    # 7. Turbine Efficiency (Betz limit multiplier approx 40%)
    turbine_efficiency = 42.5
    
    # 8. Capacity Factor (CF) based on wind speed
    # Cubic scaling between cut-in and rated speeds
    if wind_speed_hub < cut_in_speed:
        cf = 0.0
    elif wind_speed_hub >= rated_speed:
        cf = 45.0
    else:
        cf = 45.0 * ((wind_speed_hub - cut_in_speed) / (rated_speed - cut_in_speed)) ** 3
        
    cf = round(max(5.0, min(48.0, cf)), 2)
    
    # 9. Expected Annual Energy (kWh)
    expected_annual_energy_kwh = round(installed_capacity_kw * 8760.0 * (cf / 100.0), 0)
    expected_daily_energy_kwh = round(expected_annual_energy_kwh / 365.0, 1)
    expected_monthly_energy_kwh = round(expected_annual_energy_kwh / 12.0, 1)
    
    # Wind Rose simulation data (16 direction distribution vectors)
    wind_rose_sectors = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    wind_rose = []
    # Concentrates frequencies around the deterministic wind_dir
    target_idx = int(round((wind_dir % 360) / 22.5)) % 16
    for idx, sector in enumerate(wind_rose_sectors):
        dist = abs(idx - target_idx)
        if dist > 8:
            dist = 16 - dist
        freq = max(1.0, 25.0 - dist * 3.5)
        wind_rose.append({"sector": sector, "frequency": round(freq, 1), "speed": round(wind_speed_hub * (1.0 - dist * 0.08), 2)})

    # Wind suitability score (0-100)
    speed_score = min(100.0, (wind_speed_hub / 8.5) * 100.0)
    slope_score = max(0.0, 100.0 - slope * 4.0)
    turbulence_intensity = 12.0
    turb_score = max(0.0, 100.0 - (max(0.0, turbulence_intensity - 10.0) * 5.0))
    wind_suitability_score = round(speed_score * 0.70 + turb_score * 0.15 + slope_score * 0.15, 1)

    formulas = {
        "wind_shear": "V_{hub} = V_{10m} \\times \\left( \\frac{H_{hub}}{H_{10m}} \\right)^\\alpha",
        "air_density": "\\rho = \\rho_0 e^{-0.000115 z} \\frac{288.15}{273.15 + T}",
        "wind_power_density": "\\text{WPD} = \\frac{1}{2} \\rho V_{hub}^3",
        "rotor_area": "A_{rotor} = \\pi \\left(\\frac{D}{2}\\right)^2",
        "turbine_spacing": "\\text{Area}_{turb} = 15 \\times D^2",
        "number_of_turbines": "N = \\lfloor A_{usable} / \\text{Area}_{turb} \\rfloor",
        "annual_energy": "E_{annual} = P_{wind} \\times 8760 \\times CF"
    }

    return {
        "average_wind_speed": wind_speed_hub,
        "max_wind_speed": max_wind_speed,
        "wind_direction": wind_dir,
        "wind_power_density": wpd,
        "recommended_turbine_height": hub_height,
        "recommended_turbine_model": recommended_model,
        "capacity_factor": cf,
        "expected_annual_energy_kwh": expected_annual_energy_kwh,
        "expected_daily_energy_kwh": expected_daily_energy_kwh,
        "expected_monthly_energy_kwh": expected_monthly_energy_kwh,
        "turbine_efficiency": turbine_efficiency,
        "rotor_diameter": rotor_diameter,
        "rotor_area": rotor_area,
        "spacing_area_m2": spacing_area_m2,
        "number_of_turbines": number_of_turbines,
        "installed_capacity_kw": installed_capacity_kw,
        "cut_in_speed": cut_in_speed,
        "rated_speed": rated_speed,
        "cut_out_speed": cut_out_speed,
        "wind_rose": wind_rose,
        "wind_suitability_score": wind_suitability_score,
        "formulas": formulas
    }
