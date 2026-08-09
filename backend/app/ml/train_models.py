"""
Trains the platform's prediction models:

1. solar_capacity_factor_model  (RandomForestRegressor)
2. wind_capacity_factor_model   (RandomForestRegressor)
3. suitability_category_model   (RandomForestClassifier) — learns the mapping from
   the five weighted sub-scores to a human suitability label, trained on the same
   weighted formula defined in the spec (35/25/15/15/10) plus noise, so the model
   generalizes rather than hard-coding thresholds.

Training data is generated from physically-informed synthetic distributions
(not real measurements — there's no licensed ground-truth generation dataset
available offline) so the *pipeline* — feature engineering, training,
serialization, versioned inference — is fully real and reproducible.
Swap `generate_solar_dataset` / `generate_wind_dataset` for a real NREL/PVGIS
CSV export to retrain on measured data without touching any other code.

Run:  python -m app.ml.train_models
"""
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score
import joblib

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

RNG = np.random.default_rng(42)
N = 6000


def generate_solar_dataset(n=N) -> pd.DataFrame:
    annual_irradiance = RNG.uniform(1.5, 7.8, n)          # kWh/m2/day
    avg_temperature = RNG.uniform(-10, 42, n)              # deg C
    cloud_cover = RNG.uniform(5, 95, n)                    # %
    elevation = RNG.uniform(-50, 4500, n)                  # m
    land_slope = RNG.uniform(0, 30, n)                     # %

    # Physically-informed capacity factor:
    # more irradiance -> higher CF; more cloud -> lower; extreme heat reduces panel efficiency;
    # steep slope adds a small penalty for tracking/mounting losses.
    temp_derate = 1 - np.clip((avg_temperature - 25) * 0.004, -0.05, 0.15)
    cloud_derate = 1 - (cloud_cover / 100) * 0.35
    slope_derate = 1 - np.clip(land_slope / 100, 0, 0.08)
    cf = (annual_irradiance / 7.8) * 0.85 * temp_derate * cloud_derate * slope_derate
    cf += RNG.normal(0, 0.015, n)
    cf = np.clip(cf, 0.05, 0.34)

    return pd.DataFrame({
        "annual_irradiance": annual_irradiance,
        "avg_temperature": avg_temperature,
        "cloud_cover": cloud_cover,
        "elevation": elevation,
        "land_slope": land_slope,
        "capacity_factor": cf,
    })


def generate_wind_dataset(n=N) -> pd.DataFrame:
    avg_wind_speed = RNG.uniform(1.5, 11.5, n)      # m/s at 10m
    elevation = RNG.uniform(-50, 4500, n)
    land_slope = RNG.uniform(0, 30, n)
    air_density = 1.225 * np.exp(-elevation / 8500)  # simple barometric approximation
    wind_power_density = 0.5 * air_density * avg_wind_speed ** 3  # W/m2

    # Wind turbine power curve approximation -> capacity factor via cube law with cut-in/rated/cut-out
    cut_in, rated, cut_out = 3.0, 12.0, 25.0
    cf = np.where(
        avg_wind_speed < cut_in, 0.01,
        np.where(
            avg_wind_speed < rated,
            0.45 * ((avg_wind_speed - cut_in) / (rated - cut_in)) ** 2.2,
            np.where(avg_wind_speed < cut_out, 0.45, 0.02)
        )
    )
    turbulence_penalty = 1 - np.clip(land_slope / 100, 0, 0.10)
    cf = cf * turbulence_penalty
    cf += RNG.normal(0, 0.02, n)
    cf = np.clip(cf, 0.01, 0.55)

    return pd.DataFrame({
        "avg_wind_speed": avg_wind_speed,
        "wind_power_density": wind_power_density,
        "elevation": elevation,
        "land_slope": land_slope,
        "capacity_factor": cf,
    })


def generate_suitability_dataset(n=N) -> pd.DataFrame:
    resource = RNG.uniform(0, 100, n)
    geographic = RNG.uniform(0, 100, n)
    infra = RNG.uniform(0, 100, n)
    environmental = RNG.uniform(0, 100, n)
    economic = RNG.uniform(0, 100, n)

    score = (
        resource * 0.35 + geographic * 0.25 + infra * 0.15 +
        environmental * 0.15 + economic * 0.10
    )
    score += RNG.normal(0, 2.5, n)
    score = np.clip(score, 0, 100)

    def bucket(s):
        if s >= 80:
            return "Excellent"
        if s >= 65:
            return "Highly Suitable"
        if s >= 45:
            return "Moderately Suitable"
        if s >= 25:
            return "Low Suitability"
        return "Unsuitable"

    labels = [bucket(s) for s in score]

    return pd.DataFrame({
        "resource": resource, "geographic": geographic, "infra": infra,
        "environmental": environmental, "economic": economic,
        "overall_score": score, "category": labels,
    })


def train_and_save():
    report = {}

    # --- Solar ---
    df = generate_solar_dataset()
    X = df.drop(columns=["capacity_factor"])
    y = df["capacity_factor"]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
    solar_model = RandomForestRegressor(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    solar_model.fit(Xtr, ytr)
    pred = solar_model.predict(Xte)
    report["solar"] = {"mae": float(mean_absolute_error(yte, pred)), "r2": float(r2_score(yte, pred))}
    joblib.dump({"model": solar_model, "features": list(X.columns)}, os.path.join(MODELS_DIR, "solar_capacity_factor_model.joblib"))

    # --- Wind ---
    df = generate_wind_dataset()
    X = df.drop(columns=["capacity_factor"])
    y = df["capacity_factor"]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
    wind_model = RandomForestRegressor(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    wind_model.fit(Xtr, ytr)
    pred = wind_model.predict(Xte)
    report["wind"] = {"mae": float(mean_absolute_error(yte, pred)), "r2": float(r2_score(yte, pred))}
    joblib.dump({"model": wind_model, "features": list(X.columns)}, os.path.join(MODELS_DIR, "wind_capacity_factor_model.joblib"))

    # --- Suitability classifier ---
    df = generate_suitability_dataset()
    X = df[["resource", "geographic", "infra", "environmental", "economic"]]
    y = df["category"]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    clf = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42, n_jobs=-1)
    clf.fit(Xtr, ytr)
    pred = clf.predict(Xte)
    report["suitability"] = {"accuracy": float(accuracy_score(yte, pred))}
    joblib.dump({"model": clf, "features": list(X.columns)}, os.path.join(MODELS_DIR, "suitability_category_model.joblib"))

    return report


if __name__ == "__main__":
    r = train_and_save()
    print("Training complete.")
    for k, v in r.items():
        print(f"  {k}: {v}")
