import math
from typing import Dict, Any, List

# Standard Modern Wind Turbine Models and Specifications
TURBINE_MODELS = {
    "Vestas V150-4.2 MW (IEC Class I - High Wind)": {
        "capacity_kw": 4200.0,
        "rotor_diameter": 150.0,
        "cut_in_speed": 3.0,
        "rated_speed": 11.5,
        "cut_out_speed": 25.0,
    },
    "Siemens Gamesa SG 3.4-132 (IEC Class II - Medium Wind)": {
        "capacity_kw": 3400.0,
        "rotor_diameter": 132.0,
        "cut_in_speed": 3.0,
        "rated_speed": 11.0,
        "cut_out_speed": 25.0,
    },
    "Goldwind GW155-2.5 MW (IEC Class III - Low Wind)": {
        "capacity_kw": 2500.0,
        "rotor_diameter": 155.0,
        "cut_in_speed": 3.0,
        "rated_speed": 10.5,
        "cut_out_speed": 22.0,
    },
    "GE 1.7-100 (Low Speed Custom Micro-Grid Turbine)": {
        "capacity_kw": 1700.0,
        "rotor_diameter": 100.0,
        "cut_in_speed": 3.0,
        "rated_speed": 10.0,
        "cut_out_speed": 20.0,
    }
}

def calculate_wind_potential(env_data: Dict[str, Any], land_area: float = 10.0) -> Dict[str, Any]:
    """
    Wind Potential Prediction Engine.
    Estimates wind energy metrics and turbine suitability based on environmental factors,
    using mechanical and aerodynamic formulas.
    """
    env = env_data["environmental"]
    infra = env_data.get("infrastructure", {})
    
    # Extract factors
    wind_10m = env["wind_speed"]  # m/s measured at 10m
    elevation = env["elevation"]  # meters
    slope = env["land_slope"]
    wind_dir = env["wind_direction"]
    temp = env["temperature"]
    in_protected_zone = infra.get("in_protected_zone", False)

    # 1. Usable Area & Turbine Layout Sizing
    if in_protected_zone:
        setback_ratio = 1.0
    else:
        # Base setback 15% for wind safety buffers, scaling with slope
        setback_ratio = 0.15 + (slope * 0.02)
        setback_ratio = min(0.6, setback_ratio)

    usable_area_hectares = round(land_area * (1.0 - setback_ratio), 2)
    usable_area_m2 = usable_area_hectares * 10000.0

    # 2. Wind Shear scaling to Hub Height
    # Shear exponent alpha: higher in complex hilly terrains
    alpha = 0.14 if slope < 4.0 else 0.20
    
    # Hub Height selection
    if slope > 12.0:
        hub_height = 120.0
    elif slope > 6.0:
        hub_height = 100.0
    else:
        hub_height = 80.0
        
    wind_speed_hub = round(wind_10m * ((hub_height / 10.0) ** alpha), 2)
    max_wind_speed = round(wind_speed_hub * 1.45, 2)
    
    # 3. Air Density Calculation (Ideal gas law, scaling with elevation and temperature)
    air_density = round(1.225 * math.exp(-0.000115 * elevation) * (288.15 / (273.15 + temp)), 3)

    # 4. Turbulence Intensity
    turbulence_intensity = round(9.0 + (slope * 0.6) + (elevation / 1000.0) * 1.5, 2)

    # 5. Turbine Selection & Sizing specs
    if wind_speed_hub >= 8.5:
        recommended_model = "Vestas V150-4.2 MW (IEC Class I - High Wind)"
    elif wind_speed_hub >= 7.0:
        recommended_model = "Siemens Gamesa SG 3.4-132 (IEC Class II - Medium Wind)"
    elif wind_speed_hub >= 5.0:
        recommended_model = "Goldwind GW155-2.5 MW (IEC Class III - Low Wind)"
    else:
        recommended_model = "GE 1.7-100 (Low Speed Custom Micro-Grid Turbine)"

    specs = TURBINE_MODELS[recommended_model]
    turbine_capacity_kw = specs["capacity_kw"]
    rotor_diameter = specs["rotor_diameter"]
    cut_in_speed = specs["cut_in_speed"]
    rated_speed = specs["rated_speed"]
    cut_out_speed = specs["cut_out_speed"]

    # Rotor Area: A = pi * (D/2)^2
    rotor_area = round(math.pi * ((rotor_diameter / 2.0) ** 2), 1)

    # 6. Spacing and Turbine Count
    # Safety Spacing: 5D downwind, 3D crosswind (equivalent to 15 * D^2 area footprint per turbine)
    spacing_area_m2 = 15.0 * (rotor_diameter ** 2)
    
    if spacing_area_m2 > 0 and usable_area_m2 > 0:
        number_of_turbines = math.floor(usable_area_m2 / spacing_area_m2)
        if number_of_turbines < 1 and usable_area_hectares > 0.5:
            # Fallback to single turbine for small parcels
            number_of_turbines = 1
    else:
        number_of_turbines = 0

    installed_capacity_kw = number_of_turbines * turbine_capacity_kw

    # 7. Wind Power Density (WPD) = 0.5 * rho * V^3
    wpd = round(0.5 * air_density * (wind_speed_hub ** 3), 1)

    # 8. Capacity Factor (CF) Calculation based on power curve approximation
    if wind_speed_hub < cut_in_speed or wind_speed_hub >= cut_out_speed:
        cf = 0.0
    elif wind_speed_hub >= rated_speed:
        cf = 42.0  # Max rated capacity factor limit
    else:
        # Quadratic power curve interpolation
        cf = round(((wind_speed_hub - cut_in_speed) / (rated_speed - cut_in_speed)) ** 2 * 42.0, 2)

    # Apply penalties for high turbulence or high slopes
    if turbulence_intensity > 15.0:
        cf = round(cf * 0.95, 2)
    if slope > 15.0:
        cf = round(cf * 0.90, 2)

    capacity_factor = cf

    # 9. Expected Annual Energy Output (kWh)
    # E = Installed_Capacity * 8760 * CF / 100
    expected_annual_energy = round(installed_capacity_kw * 8760.0 * (capacity_factor / 100.0), 0)

    # 10. Wind Suitability Score (0-100)
    speed_factor = min(100.0, (wind_speed_hub / 8.5) * 100.0)
    turb_factor = max(0.0, 100.0 - (max(0.0, turbulence_intensity - 10.0) * 5.0))
    slope_factor = max(0.0, 100.0 - slope * 4.0)
    wind_suitability_score = round(speed_factor * 0.70 + turb_factor * 0.15 + slope_factor * 0.15, 1)

    # 11. Seasonal Wind Forecast
    seasonal_wind_factors = [
        0.105, 0.100, 0.095, 0.080, 0.070, 0.060,  # Jan - Jun
        0.055, 0.065, 0.075, 0.090, 0.100, 0.105   # Jul - Dec
    ]
    monthly_forecasts = []
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for i, frac in enumerate(seasonal_wind_factors):
        monthly_forecasts.append({
            "month": months[i],
            "energy": round(expected_annual_energy * frac, 0)
        })

    # Formulas dictionary (for display in LaTeX on the frontend)
    formulas = {
        "wind_shear": "V_{hub} = V_{10m} \\times \\left( \\frac{H_{hub}}{H_{10m}} \\right)^\\alpha",
        "air_density": "\\rho = \\rho_0 e^{-0.000115 z} \\frac{288.15}{273.15 + T}",
        "wind_power_density": "\\text{WPD} = \\frac{1}{2} \\rho V^3",
        "rotor_area": "A_{rotor} = \\pi \\left(\\frac{D}{2}\\right)^2",
        "turbine_spacing": "\\text{Area}_{turb} = 15 \\times D^2",
        "number_of_turbines": "N = \\lfloor A_{usable} / \\text{Area}_{turb} \\rfloor",
        "installed_capacity": "P_{wind} = N \\times P_{rated}",
        "annual_energy": "E_{annual} = P_{wind} \\times 8760 \\times CF"
    }

    return {
        "average_wind_speed": wind_speed_hub,
        "max_wind_speed": max_wind_speed,
        "wind_direction": wind_dir,
        "wind_power_density": wpd,
        "turbulence_intensity": turbulence_intensity,
        "air_density": air_density,
        "recommended_turbine_height": hub_height,
        "recommended_turbine_model": recommended_model,
        "expected_annual_energy": expected_annual_energy,
        "capacity_factor": capacity_factor,
        "wind_suitability_score": wind_suitability_score,
        "seasonal_forecast": monthly_forecasts,
        
        # New dynamic items
        "installed_capacity_kw": installed_capacity_kw,
        "usable_area_hectares": usable_area_hectares,
        "usable_area_m2": usable_area_m2,
        "spacing_area_m2": spacing_area_m2,
        "rotor_diameter": rotor_diameter,
        "rotor_area": rotor_area,
        "cut_in_speed": cut_in_speed,
        "rated_speed": rated_speed,
        "cut_out_speed": cut_out_speed,
        "number_of_turbines": number_of_turbines,
        "formulas": formulas
    }
