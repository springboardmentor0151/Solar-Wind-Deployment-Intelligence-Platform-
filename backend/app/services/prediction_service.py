from app.schemas.environment import EnvironmentalDataRead
from app.schemas.prediction import ForecastPoint, PredictionRead


MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
SOLAR_SEASON = [0.82, 0.9, 1.02, 1.1, 1.16, 1.18, 1.12, 1.05, 1.0, 0.94, 0.86, 0.8]
WIND_SEASON = [1.12, 1.08, 1.0, 0.94, 0.88, 0.9, 1.02, 1.08, 1.14, 1.16, 1.12, 1.08]


def _score(value: float, minimum: float, maximum: float) -> float:
    return max(0, min(100, (value - minimum) / (maximum - minimum) * 100))


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return round(max(minimum, min(maximum, value)), 2)


def generate_forecast(capacity_mw: float, env: EnvironmentalDataRead) -> list[ForecastPoint]:
    solar_base = capacity_mw * env.solar_irradiance * 24.5
    wind_base = capacity_mw * (env.wind_speed**3) * 0.42
    points = []
    for month, solar_factor, wind_factor in zip(MONTHS, SOLAR_SEASON, WIND_SEASON, strict=True):
        solar_mwh = _clamp(solar_base * solar_factor, 0, 999999)
        wind_mwh = _clamp(wind_base * wind_factor, 0, 999999)
        points.append(
            ForecastPoint(
                month=month,
                solar_mwh=solar_mwh,
                wind_mwh=wind_mwh,
                hybrid_mwh=_clamp(solar_mwh * 0.55 + wind_mwh * 0.45, 0, 999999),
            )
        )
    return points


def predict_all(project_type: str, capacity_mw: float, env: EnvironmentalDataRead) -> PredictionRead:
    solar_resource = _score(env.solar_irradiance, 2.2, 7.8)
    wind_resource = _score(env.wind_speed, 2.0, 11.5)
    slope_penalty = _score(28 - env.land_slope, 0, 28)
    access_score = 100 - min(60, env.nearby_roads_km * 2.1 + env.nearby_substations_km * 0.9)
    grid_score = 100 - min(55, env.nearby_transmission_lines_km * 1.5)
    cloud_penalty = 100 - env.cloud_cover
    rainfall_penalty = 100 - _score(env.rainfall, 10, 420) * 0.35
    vegetation_penalty = 100 - env.vegetation_index * 35

    solar_potential = _clamp(solar_resource * 0.55 + cloud_penalty * 0.2 + slope_penalty * 0.15 + access_score * 0.1, 0, 100)
    wind_potential = _clamp(wind_resource * 0.65 + slope_penalty * 0.1 + grid_score * 0.15 + access_score * 0.1, 0, 100)

    if project_type == "Solar":
        suitability = solar_potential * 0.72 + access_score * 0.14 + rainfall_penalty * 0.08 + vegetation_penalty * 0.06
        technology = "Utility-scale photovoltaic with single-axis tracking"
        annual = capacity_mw * 8760 * (solar_potential / 100) * 0.24
    elif project_type == "Wind":
        suitability = wind_potential * 0.74 + grid_score * 0.14 + access_score * 0.12
        technology = "Onshore horizontal-axis wind turbines"
        annual = capacity_mw * 8760 * (wind_potential / 100) * 0.34
    else:
        suitability = solar_potential * 0.42 + wind_potential * 0.42 + grid_score * 0.08 + access_score * 0.08
        technology = "Hybrid PV plus wind with shared grid interconnection"
        annual = capacity_mw * 8760 * ((solar_potential + wind_potential) / 200) * 0.3

    suitability = _clamp(suitability, 0, 100)
    capacity_factor = _clamp(annual / (capacity_mw * 8760) * 100, 5, 58)
    performance_ratio = _clamp(74 + solar_potential * 0.11 - env.cloud_cover * 0.05 - env.land_slope * 0.08, 60, 92)
    wind_power_density = _clamp(0.5 * 1.225 * env.wind_speed**3, 5, 1200)
    investment_score = _clamp(suitability * 0.55 + grid_score * 0.25 + access_score * 0.2, 0, 100)
    roi = _clamp(6 + investment_score * 0.18 + capacity_factor * 0.08, 4, 28)
    confidence = _clamp(78 + min(solar_potential, wind_potential) * 0.08 - env.land_slope * 0.12, 65, 96)

    if suitability >= 80:
        recommendation = "Proceed to detailed engineering and interconnection studies."
    elif suitability >= 62:
        recommendation = "Proceed with targeted field validation before final investment approval."
    elif suitability >= 45:
        recommendation = "Consider only after grid, terrain, or access constraints are mitigated."
    else:
        recommendation = "Do not prioritize this site for near-term deployment."

    forecast = generate_forecast(capacity_mw, env)
    return PredictionRead(
        solar_potential=solar_potential,
        wind_potential=wind_potential,
        energy_generation_forecast=_clamp(sum(point.hybrid_mwh for point in forecast), 0, 9999999),
        capacity_factor=capacity_factor,
        performance_ratio=performance_ratio,
        annual_energy_output=_clamp(annual, 0, 99999999),
        wind_power_density=wind_power_density,
        suitability_score=suitability,
        investment_score=investment_score,
        roi_estimate=roi,
        deployment_recommendation=recommendation,
        technology_recommendation=technology,
        confidence_score=confidence,
        forecast=forecast,
    )
