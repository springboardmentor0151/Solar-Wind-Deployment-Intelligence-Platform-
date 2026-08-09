def calculate_solar_prediction(environmental_data):
    """
    Calculate solar energy potential from environmental data.
    """

    # Environmental data
    solar = environmental_data.get("solarIrradiance", 0) or 0
    temperature = environmental_data.get("temperature", 25) or 25

    # Annual Irradiance (kWh/m²/year)
    annual_irradiance = round(solar * 365, 2)

    # Peak Sun Hours (hours/day)
    peak_sun_hours = round(solar, 2)

    # Assumptions
    panel_efficiency = 18  # %
    system_capacity = 10   # kW reference system

    # Daily Energy Output (kWh/day)
    daily_energy = round(
        peak_sun_hours * system_capacity * (panel_efficiency / 100),
        2
    )

    # Annual Energy Output (kWh/year)
    annual_energy = round(
        daily_energy * 365,
        2
    )

    # Temperature loss (0.4% per °C above 25°C)
    temperature_loss = max(0, (temperature - 25) * 0.004)

    # Performance Ratio (%)
    performance_ratio = max(
        round((0.80 - temperature_loss) * 100, 2),
        0
    )

    # Capacity Factor (%)
    capacity_factor = round(
        (annual_energy / (system_capacity * 24 * 365)) * 100,
        2
    )

    # Solar Potential Classification
    if solar >= 6:
        potential = "Excellent"
    elif solar >= 5:
        potential = "High"
    elif solar >= 4:
        potential = "Moderate"
    else:
        potential = "Low"

    return {
        "annualIrradiance": annual_irradiance,
        "peakSunHours": peak_sun_hours,
        "dailyEnergyOutput": daily_energy,
        "annualEnergyOutput": annual_energy,
        "capacityFactor": capacity_factor,
        "performanceRatio": performance_ratio,
        "panelEfficiency": panel_efficiency,
        "solarPotential": potential
    }