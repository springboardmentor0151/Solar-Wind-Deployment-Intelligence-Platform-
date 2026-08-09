"""
Wind Potential Prediction Engine.

Uses the trained RandomForestRegressor to predict turbine capacity factor from
wind speed, wind power density, elevation (air density proxy) and terrain slope
(turbulence proxy). Derives turbine suitability, seasonal forecast, and expected
annual energy production (AEP).
"""
import os
import joblib
import numpy as np
import pandas as pd

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "ml", "models")
_model_bundle = joblib.load(os.path.join(MODELS_DIR, "wind_capacity_factor_model.joblib"))
_MODEL = _model_bundle["model"]
_FEATURES = _model_bundle["features"]

AIR_DENSITY_SEA_LEVEL = 1.225  # kg/m3


def predict_wind_potential(environmental: dict, land_slope_pct: float, elevation_m: float, capacity_mw: float = 1.0) -> dict:
    wind_monthly = environmental["wind_speed_monthly"]
    avg_wind_speed = float(np.mean(wind_monthly))

    air_density = AIR_DENSITY_SEA_LEVEL * np.exp(-elevation_m / 8500)
    wind_power_density = 0.5 * air_density * avg_wind_speed ** 3  # W/m2

    features = pd.DataFrame(
        [[avg_wind_speed, wind_power_density, elevation_m, land_slope_pct]],
        columns=_FEATURES,
    )
    capacity_factor = float(np.clip(_MODEL.predict(features)[0], 0.01, 0.55))

    hours_per_year = 8760
    expected_output_mwh_per_mw = round(capacity_factor * hours_per_year, 0)
    expected_output_total_mwh = round(expected_output_mwh_per_mw * capacity_mw, 0)

    # Turbulence intensity proxy (higher on steep/complex terrain)
    turbulence_intensity_pct = round(min(35.0, 8 + land_slope_pct * 0.9), 1)

    # Turbine suitability classification (IEC-like wind classes, simplified)
    if avg_wind_speed >= 8.5:
        turbine_class = "IEC Class I (high wind)"
    elif avg_wind_speed >= 7.0:
        turbine_class = "IEC Class II (medium wind)"
    elif avg_wind_speed >= 5.5:
        turbine_class = "IEC Class III (low wind)"
    else:
        turbine_class = "Below commercial threshold — low-wind specialty turbines only"

    total_wind = sum(wind_monthly)
    monthly_generation = [
        round(expected_output_total_mwh * (w / total_wind), 1) for w in wind_monthly
    ] if total_wind > 0 else [0] * 12

    return {
        "avg_wind_speed_ms": round(avg_wind_speed, 2),
        "wind_power_density_w_m2": round(wind_power_density, 1),
        "capacity_factor_pct": round(capacity_factor * 100, 1),
        "turbulence_intensity_pct": turbulence_intensity_pct,
        "turbine_suitability_class": turbine_class,
        "expected_output_mwh_per_mw_year": expected_output_mwh_per_mw,
        "expected_output_total_mwh_year": expected_output_total_mwh,
        "monthly_wind_speed": [round(v, 2) for v in wind_monthly],
        "monthly_generation_mwh": monthly_generation,
        "model": {"type": "RandomForestRegressor", "features": _FEATURES},
    }
