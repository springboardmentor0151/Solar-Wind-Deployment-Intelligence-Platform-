"""
Site Suitability Intelligence Engine + Site Scoring Engine.

Implements the weighted Deployment Suitability Score defined in the product
spec:

    Score = Resource(35%) + Geographic(25%) + Infrastructure(15%)
          + Environmental(15%) + Economic(10%)

Each sub-score is engineered from the environmental/geographic/solar/wind data
on a 0-100 scale. The final category label is produced by the trained
RandomForestClassifier (suitability_category_model), which learned the
score->category mapping (with noise) rather than a hard-coded if/else ladder.
"""
import os
import joblib
import numpy as np
import pandas as pd

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "ml", "models")
_clf_bundle = joblib.load(os.path.join(MODELS_DIR, "suitability_category_model.joblib"))
_CLF = _clf_bundle["model"]

WEIGHTS = {
    "resource": 0.35,
    "geographic": 0.25,
    "infrastructure": 0.15,
    "environmental": 0.15,
    "economic": 0.10,
}

CATEGORY_COLOR = {
    "Excellent": "#16a34a",
    "Highly Suitable": "#22c55e",
    "Moderately Suitable": "#eab308",
    "Low Suitability": "#f97316",
    "Unsuitable": "#ef4444",
}


def _clamp(x, lo=0.0, hi=100.0):
    return max(lo, min(hi, x))


def compute_resource_score(solar: dict, wind: dict) -> float:
    solar_norm = _clamp(solar["capacity_factor_pct"] / 30.0 * 100)
    wind_norm = _clamp(wind["capacity_factor_pct"] / 45.0 * 100)
    hi, lo = max(solar_norm, wind_norm), min(solar_norm, wind_norm)
    # Reward hybrid sites (both resources decent) while still driven by the best resource
    return round(_clamp(hi * 0.7 + lo * 0.3), 1)


def compute_geographic_score(environmental: dict) -> float:
    slope = environmental["land_slope_pct"]
    elevation = environmental["elevation_m"]
    slope_penalty = _clamp(slope * 2.2, 0, 55)
    elevation_penalty = _clamp(max(0, elevation - 2500) / 30, 0, 25)
    score = 100 - slope_penalty - elevation_penalty
    return round(_clamp(score), 1)


def compute_infrastructure_score(infra: dict) -> float:
    def prox(distance_km, ideal_km, max_km):
        if distance_km <= ideal_km:
            return 100.0
        if distance_km >= max_km:
            return 0.0
        return 100.0 * (1 - (distance_km - ideal_km) / (max_km - ideal_km))

    road = prox(infra["distance_to_road_km"], 2, 30)
    sub = prox(infra["distance_to_substation_km"], 5, 60)
    trans = prox(infra["distance_to_transmission_line_km"], 5, 50)
    urban = prox(infra["distance_to_urban_center_km"], 10, 80)  # not too remote

    score = road * 0.30 + sub * 0.30 + trans * 0.25 + urban * 0.15
    return round(_clamp(score), 1)


def compute_environmental_score(environmental: dict, infra: dict) -> float:
    ndvi = environmental["vegetation_index"]
    veg_penalty = _clamp(ndvi * 45, 0, 45)  # denser vegetation = more clearing impact
    protected_penalty = 60 if infra.get("near_protected_zone") else 0
    agri_penalty = 15 if infra.get("near_agricultural_land") else 0
    score = 100 - veg_penalty - protected_penalty - agri_penalty
    return round(_clamp(score), 1)


def compute_economic_score(infra: dict, solar: dict, wind: dict, land_area_hectares: float) -> float:
    grid_distance = min(infra["distance_to_substation_km"], infra["distance_to_transmission_line_km"])
    connection_cost_penalty = _clamp(grid_distance * 1.4, 0, 45)
    resource_bonus = _clamp(max(solar["capacity_factor_pct"], wind["capacity_factor_pct"]) * 1.1, 0, 55)
    land_bonus = _clamp((land_area_hectares / 500) * 10, 0, 15)
    score = 45 + resource_bonus * 0.5 - connection_cost_penalty * 0.6 + land_bonus * 0.3
    return round(_clamp(score), 1)


def score_site(environmental: dict, solar: dict, wind: dict, land_area_hectares: float = 100.0) -> dict:
    infra = environmental["infrastructure"]

    resource = compute_resource_score(solar, wind)
    geographic = compute_geographic_score(environmental)
    infrastructure = compute_infrastructure_score(infra)
    environmental_score = compute_environmental_score(environmental, infra)
    economic = compute_economic_score(infra, solar, wind, land_area_hectares)

    overall = round(
        resource * WEIGHTS["resource"]
        + geographic * WEIGHTS["geographic"]
        + infrastructure * WEIGHTS["infrastructure"]
        + environmental_score * WEIGHTS["environmental"]
        + economic * WEIGHTS["economic"],
        1,
    )

    features = pd.DataFrame(
        [[resource, geographic, infrastructure, environmental_score, economic]],
        columns=["resource", "geographic", "infra", "environmental", "economic"],
    )
    category = str(_CLF.predict(features)[0])
    category_probabilities = {
        cls: round(float(p), 3)
        for cls, p in zip(_CLF.classes_, _CLF.predict_proba(features)[0])
    }

    recommended_technology = _recommend_technology(solar, wind)

    return {
        "overall_score": overall,
        "category": category,
        "category_color": CATEGORY_COLOR.get(category, "#6b7280"),
        "category_probabilities": category_probabilities,
        "sub_scores": {
            "resource": resource,
            "geographic": geographic,
            "infrastructure": infrastructure,
            "environmental": environmental_score,
            "economic": economic,
        },
        "weights": WEIGHTS,
        "recommended_technology": recommended_technology,
        "model": {"type": "RandomForestClassifier", "classes": list(_CLF.classes_)},
    }


def _recommend_technology(solar: dict, wind: dict) -> dict:
    s_cf = solar["capacity_factor_pct"]
    w_cf = wind["capacity_factor_pct"]
    diff = s_cf - w_cf
    if abs(diff) <= 4:
        choice = "Hybrid Solar-Wind"
        rationale = "Solar and wind capacity factors are comparable — a hybrid plant improves land-use efficiency and smooths generation across day/season."
    elif diff > 4:
        choice = "Solar PV"
        rationale = f"Solar capacity factor ({s_cf}%) notably exceeds wind ({w_cf}%) at this location."
    else:
        choice = "Wind"
        rationale = f"Wind capacity factor ({w_cf}%) notably exceeds solar ({s_cf}%) at this location."
    return {"recommendation": choice, "rationale": rationale}
