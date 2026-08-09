"""
Solar Potential Prediction Engine.

Uses the trained RandomForestRegressor (app/ml/train_models.py) to predict
panel-performance-adjusted capacity factor from environmental features, then
derives all downstream solar metrics (peak sun hours, expected energy output,
performance ratio, monthly generation curve, shading proxy).
"""
import os
import joblib
import numpy as np
import pandas as pd

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "ml", "models")
_model_bundle = joblib.load(os.path.join(MODELS_DIR, "solar_capacity_factor_model.joblib"))
_MODEL = _model_bundle["model"]
_FEATURES = _model_bundle["features"]

STANDARD_TEST_IRRADIANCE = 1.0  # kW/m2 (STC)
DEFAULT_SYSTEM_LOSSES = 0.14    # inverter, wiring, soiling, mismatch


def predict_solar_potential(environmental: dict, land_slope_pct: float, elevation_m: float, capacity_mw: float = 1.0) -> dict:
    irr_monthly = environmental["solar_irradiance_monthly"]
    temp_monthly = environmental["temperature_monthly"]
    cloud_monthly = environmental["cloud_cover_monthly"]

    annual_irradiance = float(np.mean(irr_monthly))
    avg_temperature = float(np.mean(temp_monthly))
    cloud_cover = float(np.mean(cloud_monthly))

    features = pd.DataFrame(
        [[annual_irradiance, avg_temperature, cloud_cover, elevation_m, land_slope_pct]],
        columns=_FEATURES,
    )
    capacity_factor = float(np.clip(_MODEL.predict(features)[0], 0.03, 0.35))

    peak_sun_hours = round(annual_irradiance / STANDARD_TEST_IRRADIANCE, 2)  # hrs/day equivalent
    performance_ratio = round(1 - DEFAULT_SYSTEM_LOSSES - max(0, (avg_temperature - 25) * 0.002), 3)

    hours_per_year = 8760
    expected_output_mwh_per_mw = round(capacity_factor * hours_per_year, 0)
    expected_output_total_mwh = round(expected_output_mwh_per_mw * capacity_mw, 0)

    # Monthly generation curve (MWh) scaled by each month's irradiance share
    total_irr = sum(irr_monthly)
    monthly_generation = [
        round(expected_output_total_mwh * (irr / total_irr), 1) for irr in irr_monthly
    ]

    # Shading analysis proxy: derived from cloud cover + terrain slope (steeper terrain -> more self/terrain shading risk)
    shading_loss_pct = round(min(25.0, cloud_cover * 0.08 + land_slope_pct * 0.3), 1)

    return {
        "annual_irradiance_kwh_m2_day": round(annual_irradiance, 2),
        "peak_sun_hours": peak_sun_hours,
        "capacity_factor_pct": round(capacity_factor * 100, 1),
        "performance_ratio": performance_ratio,
        "expected_output_mwh_per_mw_year": expected_output_mwh_per_mw,
        "expected_output_total_mwh_year": expected_output_total_mwh,
        "monthly_irradiance": [round(v, 2) for v in irr_monthly],
        "monthly_generation_mwh": monthly_generation,
        "shading_loss_pct": shading_loss_pct,
        "panel_efficiency_estimate_pct": round(18.5 - max(0, avg_temperature - 25) * 0.04, 2),
        "model": {"type": "RandomForestRegressor", "features": _FEATURES},
    }
