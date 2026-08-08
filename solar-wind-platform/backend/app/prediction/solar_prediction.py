import math

def calculate_solar_potential(env_data: dict, land_area: float = 10.0) -> dict:
    """
    Module 6 - Predictions:
    - Solar Suitability Score
    - Peak Sun Hours
    - Daily Energy, Monthly Energy, Annual Energy
    - Performance Ratio, Capacity Factor
    - Panel Efficiency, Recommended Plant Size
    """
    env = env_data.get("environmental", {})
    infra = env_data.get("infrastructure", {})
    
    # Extract values
    solar_irradiance = env.get("solar_irradiance", 5.0)
    temp = env.get("temperature", 25.0)
    slope = env.get("land_slope", 2.0)
    cloud_cover = env.get("cloud_cover", 30.0)
    aspect = env.get("aspect", 180.0)
    
    # 1. Optimal Panel Tilt
    lat = env_data.get("latitude", 27.5)
    tilt_angle = round(abs(lat) * 0.76 + 3.1, 1)
    
    # 2. Orientation (Azimuth)
    orientation = "South Facing" if lat >= 0 else "North Facing"
    
    # 3. Dynamic Row Spacing shadows model
    solstice_elevation_deg = max(10.0, 90.0 - abs(lat) - 23.44)
    alpha_rad = math.radians(solstice_elevation_deg)
    panel_height = 2.2 # meters (2 portrait modules)
    row_spacing = round(panel_height * (math.cos(math.radians(tilt_angle)) + math.sin(math.radians(tilt_angle)) / math.tan(alpha_rad)), 2)
    
    # 4. Usable Land Area (80% default due to setbacks)
    setback_pct = 0.20
    usable_area_hectares = round(land_area * (1.0 - setback_pct), 2)
    usable_area_m2 = usable_area_hectares * 10000.0
    
    # 5. Estimated modules count
    panel_width = 1.1 # meters
    corridor_spacing = panel_height * panel_width + row_spacing * panel_width
    estimated_number_of_panels = int(math.floor(usable_area_m2 / corridor_spacing))
    
    # 6. Panel specifications
    panel_efficiency = 21.3 # % monocrystalline silicon
    panel_watts = 550 # Watts
    installed_capacity_kw = round((estimated_number_of_panels * panel_watts) / 1000.0, 1)
    
    # 7. Temperature and dust losses
    noct = 45.0 # Nominal Operating Cell Temperature
    cell_temp = temp + solar_irradiance * ((noct - 20) / 0.8)
    temp_coefficient = 0.0038 # 0.38% loss per deg C above 25C
    temp_loss = round(max(0.0, (cell_temp - 25.0) * temp_coefficient * 100.0), 2)
    
    dust_loss = 7.5 if temp > 35.0 else 3.5 # Soiling factor
    shading_loss = 2.5 if slope > 10.0 else 1.0
    inverter_loss = 2.0
    wiring_loss = 3.0
    
    # 8. Performance Ratio (PR)
    performance_ratio = round(100.0 - (temp_loss + dust_loss + shading_loss + inverter_loss + wiring_loss), 1)
    
    # 9. Peak Sun Hours and expected energy
    peak_sun_hours = round(solar_irradiance * 1.0, 1)
    # E = P_DC * PSH * 365 * PR
    expected_daily_energy_kwh = round(installed_capacity_kw * peak_sun_hours * (performance_ratio / 100.0), 1)
    expected_annual_energy_kwh = round(expected_daily_energy_kwh * 365.0, 1)
    expected_monthly_energy_kwh = round(expected_annual_energy_kwh / 12.0, 1)
    
    # 10. Capacity Factor
    # CF = Annual_Energy / (Installed_Capacity * 8760)
    capacity_factor = round((expected_annual_energy_kwh / (installed_capacity_kw * 8760.0)) * 100.0, 2)
    
    # Recommended Plant Size Category
    if installed_capacity_kw < 1000:
        recommended_size = "Micro / Rooftop Utility"
    elif installed_capacity_kw < 10000:
        recommended_size = "Commercial Distributed Grid"
    else:
        recommended_size = "Utility-scale Power Station"
        
    # Formulas dictionary (for display in LaTeX on the frontend)
    formulas = {
        "tilt_angle": "\\theta_{opt} = \\phi \\times 0.76 + 3.1^\\circ",
        "row_spacing": "S = H \\left( \\cos(\\theta) + \\frac{\\sin(\\theta)}{\\tan(\\alpha_s)} \\right)",
        "usable_area": "A_{usable} = A_{total} \\times (1 - \\text{Setback})",
        "panels_count": "N_{panels} = \\lfloor A_{usable} / \\text{Corridor} \\rfloor",
        "installed_capacity": "P_{solar} = N_{panels} \\times P_{rating}",
        "cell_temperature": "T_{cell} = T_{amb} + GHI \\times \\left( \\frac{\\text{NOCT} - 20}{800} \\right)",
        "temp_loss": "\\text{Loss}_T = \\max(0, T_{cell} - 25) \\times 0.38\\%",
        "performance_ratio": "\\text{PR} = 100\\% - \\sum \\text{Losses}",
        "annual_energy": "E_{annual} = P_{solar} \\times \\text{PSH} \\times 365 \\times \\text{PR}"
    }

    # Solar suitability score (0-100)
    irr_score = min(100.0, (solar_irradiance / 7.0) * 100.0)
    slope_score = max(0.0, 100.0 - slope * 4.0)
    cloud_score = max(0.0, 100.0 - cloud_cover)
    solar_suitability_score = round(irr_score * 0.60 + slope_score * 0.25 + cloud_score * 0.15, 1)

    return {
        "tilt_angle": tilt_angle,
        "orientation": orientation,
        "row_spacing": row_spacing,
        "usable_area_hectares": usable_area_hectares,
        "estimated_number_of_panels": estimated_number_of_panels,
        "panel_efficiency": panel_efficiency,
        "installed_capacity_kw": installed_capacity_kw,
        "temp_loss": temp_loss,
        "dust_loss": dust_loss,
        "shading_loss": shading_loss,
        "performance_ratio": performance_ratio,
        "peak_sun_hours": peak_sun_hours,
        "expected_daily_energy_kwh": expected_daily_energy_kwh,
        "expected_monthly_energy_kwh": expected_monthly_energy_kwh,
        "expected_annual_energy_kwh": expected_annual_energy_kwh,
        "capacity_factor": capacity_factor,
        "recommended_size": recommended_size,
        "solar_suitability_score": solar_suitability_score,
        "formulas": formulas
    }
