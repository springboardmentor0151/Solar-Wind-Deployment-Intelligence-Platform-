import math
from typing import Dict, Any, List

def calculate_solar_potential(env_data: Dict[str, Any], land_area: float = 10.0) -> Dict[str, Any]:
    """
    Solar Potential Prediction Engine.
    Estimates solar generation capacity and efficiency based on environmental factors,
    using physics-based engineering formulas.
    """
    env = env_data["environmental"]
    infra = env_data.get("infrastructure", {})
    
    # Extract factors
    ghi = env["solar_irradiance"]  # kWh/m2/day
    temp = env["temperature"]      # °C
    slope = env["land_slope"]      # degrees
    cloud_cover = env["cloud_cover"]
    rainfall = env["rainfall"]
    lat = env_data.get("location", {}).get("latitude", 20.0)
    in_protected_zone = infra.get("in_protected_zone", False)
    near_water_bodies = infra.get("near_water_bodies", False)

    # 1. Usable Area Calculation (avoiding protected zone, hazards, and setbacks)
    if in_protected_zone:
        setback_ratio = 1.0
    else:
        # Base setback: 10%, increases with slope and near water bodies
        setback_ratio = 0.10 + (slope * 0.015)
        if near_water_bodies:
            setback_ratio += 0.05
        setback_ratio = min(0.6, setback_ratio)

    usable_area_hectares = round(land_area * (1.0 - setback_ratio), 2)
    usable_area_m2 = usable_area_hectares * 10000.0

    # 2. Optimal Tilt Angle (Lave & Kleissl standard formulation)
    abs_lat = abs(lat)
    if abs_lat < 25.0:
        tilt_angle = round(abs_lat * 0.87, 1)
    elif abs_lat < 50.0:
        tilt_angle = round(abs_lat * 0.76 + 3.1, 1)
    else:
        tilt_angle = round(abs_lat * 0.8, 1)

    # 3. Orientation (Azimuth)
    if lat >= 0:
        orientation = "South (180° Azimuth)"
    else:
        orientation = "North (0° Azimuth)"

    # 4. Spacing Calculation (Row shading avoidance during Winter Solstice)
    # solar_altitude at winter solstice: 90 - latitude - 23.45
    solar_altitude = max(10.0, 90.0 - abs_lat - 23.45)
    
    # Standard 550W panel dimensions: height H = 2.2m, width W = 1.1m (oriented portrait)
    H = 2.2
    W = 1.1
    tilt_rad = math.radians(tilt_angle)
    alt_rad = math.radians(solar_altitude)
    
    # Row-to-row spacing formula: S = H * (cos(tilt) + sin(tilt) / tan(altitude))
    row_spacing = round(H * (math.cos(tilt_rad) + math.sin(tilt_rad) / math.tan(alt_rad)), 2)
    
    # Area footprint per panel (including row spacing corridor)
    panel_footprint = H * W + row_spacing * W
    
    estimated_number_of_panels = int(usable_area_m2 / panel_footprint) if panel_footprint > 0 else 0
    installed_capacity_kw = round(estimated_number_of_panels * 0.55, 1) # 550W = 0.55 kW
    
    # 5. Technical Loss Calculations
    # Nominal Operating Cell Temperature (NOCT) is 45°C. GHI / 8 is peak sun proxy.
    T_cell = temp + (ghi / 8.0) * (45.0 - 20.0)
    
    # Temperature Coefficient for standard Monocrystalline is -0.38% / °C above 25°C
    if T_cell > 25.0:
        temp_loss = round((T_cell - 25.0) * 0.38, 2)
    else:
        temp_loss = 0.0
        
    # Dust Loss: higher in arid regions (low rain), lower in rainy regions
    dust_loss = round(max(1.0, 7.5 - (rainfall / 120.0)), 2)
    
    # Shading Loss: derived from land slope and cloud cover
    shading_loss = round(0.8 + (slope * 0.45) + (cloud_cover * 0.03), 2)
    
    inverter_loss = 2.0  # 2.0% (98% efficient)
    wiring_loss = 3.0    # 3.0% (97% efficient)

    # 6. Performance Ratio (PR)
    performance_ratio = round(
        (1.0 - temp_loss / 100.0) *
        (1.0 - dust_loss / 100.0) *
        (1.0 - shading_loss / 100.0) *
        (1.0 - inverter_loss / 100.0) *
        (1.0 - wiring_loss / 100.0) * 100.0, 1
    )
    
    # 7. Energy generation calculations
    # Annual solar irradiance
    annual_irradiance_flat = ghi * 365.0
    optimal_tilt_factor = 1.15 if ghi > 4.5 else 1.10
    annual_irradiance = round(annual_irradiance_flat * optimal_tilt_factor, 1)

    # Expected Annual Energy output (kWh)
    # E = installed_capacity_kw * Peak_Sun_Hours * 365 * PR
    peak_sun_hours = ghi # Peak sun hours matches GHI numerically (kWh/m2/day)
    expected_energy_output = round(installed_capacity_kw * peak_sun_hours * 365.0 * (performance_ratio / 100.0), 0)
    daily_energy_kwh = round(expected_energy_output / 365.0, 1)

    # 8. Capacity Factor (%)
    # capacity_factor = Expected_Annual / (Capacity * 8760)
    if installed_capacity_kw > 0:
        capacity_factor = round((expected_energy_output / (installed_capacity_kw * 8760.0)) * 100.0, 2)
    else:
        capacity_factor = 0.0

    # 9. Dynamic Panel Type Recommendation
    base_eff = 20.5  # Base panel efficiency at STC
    panel_efficiency = round(max(14.0, base_eff - (temp_loss if temp_loss > 0 else 0.0)), 2)

    if temp > 30.0:
        recommended_solar_panel_type = "Bifacial Double-Glass Monocrystalline (High Temperature Tolerant)"
    elif temp < 15.0:
        recommended_solar_panel_type = "High-Efficiency Monocrystalline PERC (Optimal Cold Weather Yield)"
    else:
        recommended_solar_panel_type = "N-Type Monocrystalline Silicon (Standard High-Yield)"

    # 10. Lifetime Generation (25 years with 0.5% annual degradation)
    # Sum_(t=1..25) (1 - 0.005)^t = ~22.65
    expected_lifetime_energy_generation = round(expected_energy_output * 22.65, 0)
    
    # Carbon reduction (0.82 kg CO2 per kWh)
    carbon_emission_reduction = round(expected_energy_output * 0.82 / 1000.0, 1)

    # 11. Resource Quality
    if ghi >= 5.5:
        solar_resource_quality = "Excellent"
    elif ghi >= 4.5:
        solar_resource_quality = "Good"
    elif ghi >= 3.5:
        solar_resource_quality = "Moderate"
    else:
        solar_resource_quality = "Poor"

    # 12. Solar Suitability Score (0-100)
    slope_factor = max(0.0, 100.0 - slope * 7.5)
    temp_factor = max(0.0, 100.0 - (max(0.0, temp - 25.0) * 2.5))
    ghi_factor = min(100.0, (ghi / 6.0) * 100.0)
    solar_suitability_score = round(ghi_factor * 0.60 + slope_factor * 0.20 + temp_factor * 0.20, 1)

    # 13. Seasonal Energy Forecast
    monthly_fractions = [
        0.055, 0.065, 0.085, 0.095, 0.110, 0.115,  # Jan - Jun
        0.112, 0.100, 0.088, 0.075, 0.055, 0.045   # Jul - Dec
    ]
    monthly_forecasts = []
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for i, frac in enumerate(monthly_fractions):
        monthly_forecasts.append({
            "month": months[i],
            "energy": round(expected_energy_output * frac, 0)
        })

    # Formulas dictionary (for display in LaTeX on the frontend)
    formulas = {
        "usable_area": "A_{usable} = A_{total} \\times (1 - \\text{Setback})",
        "tilt_angle": "\\theta = \\text{Latitude} \\times 0.87 \\text{ (for Lat } < 25^\\circ)",
        "row_spacing": "S = H \\times \\left( \\cos(\\theta) + \\frac{\\sin(\\theta)}{\\tan(\\alpha_s)} \\right)",
        "number_of_panels": "N = \\frac{A_{usable}}{H \\times W + S \\times W}",
        "installed_capacity": "P_{DC} = N \\times 550\\text{W} / 1000",
        "cell_temperature": "T_{cell} = T_{ambient} + GHI \\times \\frac{\\text{NOCT} - 20}{800}",
        "temperature_loss": "L_T = (T_{cell} - 25) \\times 0.38\\%",
        "performance_ratio": "PR = (1 - L_T) \\times (1 - L_{dust}) \\times (1 - L_{wiring}) \\times \\eta_{inverter}",
        "annual_energy": "E_{annual} = P_{DC} \\times \\text{GHI} \\times 365 \\times PR"
    }

    return {
        "annual_irradiance": annual_irradiance,
        "solar_resource_quality": solar_resource_quality,
        "peak_sun_hours": round(peak_sun_hours, 2),
        "expected_energy_output": expected_energy_output,
        "panel_efficiency": panel_efficiency,
        "capacity_factor": capacity_factor,
        "shading_loss": shading_loss,
        "performance_ratio": performance_ratio,
        "recommended_solar_panel_type": recommended_solar_panel_type,
        "estimated_number_of_panels": estimated_number_of_panels,
        "expected_lifetime_energy_generation": expected_lifetime_energy_generation,
        "carbon_emission_reduction": carbon_emission_reduction,
        "solar_suitability_score": solar_suitability_score,
        "seasonal_forecast": monthly_forecasts,
        
        # New dynamic items
        "installed_capacity_kw": installed_capacity_kw,
        "usable_area_hectares": usable_area_hectares,
        "usable_area_m2": usable_area_m2,
        "tilt_angle": tilt_angle,
        "orientation": orientation,
        "row_spacing": row_spacing,
        "temp_loss": temp_loss,
        "dust_loss": dust_loss,
        "inverter_loss": inverter_loss,
        "wiring_loss": wiring_loss,
        "daily_energy_kwh": daily_energy_kwh,
        "formulas": formulas
    }
