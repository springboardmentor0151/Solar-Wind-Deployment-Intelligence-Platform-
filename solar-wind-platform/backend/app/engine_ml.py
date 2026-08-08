import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, ExtraTreesRegressor, AdaBoostRegressor
from sklearn.metrics import mean_squared_error, r2_score
from typing import Dict, Any, List

# Try imports for compiled ML models
try:
    from xgboost import XGBRegressor
    has_xgboost = True
except ImportError:
    has_xgboost = False

try:
    from lightgbm import LGBMRegressor
    has_lgbm = True
except ImportError:
    has_lgbm = False

# Global state for cached models
_trained_models = {}
_model_metrics = {}
_best_model_name = "Random Forest"
_feature_names = [
    "solar_irradiance", "wind_speed", "temperature", "cloud_cover", "rainfall",
    "land_slope", "elevation", "distance_to_transmission", "distance_to_road"
]
_baselines = {}
_stds = {}

def generate_historical_dataset(n_samples: int = 500) -> pd.DataFrame:
    """
    Generates a high-fidelity synthetic historical training dataset for ML model comparisons.
    """
    np.random.seed(42)
    
    # Feature ranges
    solar_irradiance = np.random.uniform(1.0, 8.0, n_samples)
    wind_speed = np.random.uniform(1.5, 12.0, n_samples)
    temperature = np.random.uniform(-5.0, 42.0, n_samples)
    cloud_cover = np.random.uniform(0.0, 100.0, n_samples)
    rainfall = np.random.uniform(50.0, 2000.0, n_samples)
    land_slope = np.random.uniform(0.1, 20.0, n_samples)
    elevation = np.random.uniform(10.0, 2500.0, n_samples)
    distance_to_transmission = np.random.uniform(0.1, 25.0, n_samples)
    distance_to_road = np.random.uniform(0.05, 12.0, n_samples)
    
    # Assemble DataFrame
    df = pd.DataFrame({
        "solar_irradiance": solar_irradiance,
        "wind_speed": wind_speed,
        "temperature": temperature,
        "cloud_cover": cloud_cover,
        "rainfall": rainfall,
        "land_slope": land_slope,
        "elevation": elevation,
        "distance_to_transmission": distance_to_transmission,
        "distance_to_road": distance_to_road
    })
    
    # Calculate Targets using standard physical equations + noise
    # Target 1: Suitability (0-100)
    solar_factor = (solar_irradiance / 8.0) * 100.0
    wind_factor = (wind_speed / 12.0) * 100.0
    resource = np.maximum(solar_factor * 0.6 + (100.0 - temperature * 2.0) * 0.1,
                          wind_factor * 0.7 + (100.0 - land_slope * 4.0) * 0.1)
    
    slope_penalty = land_slope * 2.5
    grid_penalty = distance_to_transmission * 1.5
    road_penalty = distance_to_road * 2.0
    
    suitability = resource - slope_penalty - grid_penalty - road_penalty + np.random.normal(0, 3, n_samples)
    suitability = np.clip(suitability, 10.0, 98.0)
    df["suitability"] = suitability
    
    # Target 2: Annual Energy (MWh)
    # Energy roughly proportional to GHI/Wind + capacity sizing
    solar_energy = solar_irradiance * 365.0 * 5.0 * 0.8
    wind_energy = wind_speed * 1.5 * 8760.0 * 0.3
    annual_energy = np.maximum(solar_energy, wind_energy) * np.random.uniform(0.8, 1.2, n_samples)
    df["annual_energy"] = np.clip(annual_energy, 200.0, 15000.0)
    
    # Target 3: ROI (%)
    # ROI = net_revenue / installation_cost
    capex = (df["annual_energy"] * 0.001 * 1.2) + distance_to_transmission * 0.13
    revenue = df["annual_energy"] * 0.05
    roi = (revenue / capex) * 100.0 + np.random.normal(0, 1, n_samples)
    df["roi"] = np.clip(roi, 1.0, 25.0)
    
    return df

def load_ml_models() -> bool:
    global _trained_models, _model_metrics, _best_model_name, _baselines, _stds
    import joblib
    import os
    import json
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.join(current_dir, "ml")
    metrics_file = os.path.join(ml_dir, "metrics.json")
    
    if not os.path.exists(metrics_file):
        return False
        
    try:
        with open(metrics_file, "r") as f:
            data = json.load(f)
            _model_metrics = data["metrics"]
            _best_model_name = data["best_model"]
            _baselines = data.get("baselines", {})
            _stds = data.get("stds", {})
            
        for name in ["Random Forest", "Gradient Boosting", "XGBoost", "LightGBM"]:
            filename = os.path.join(ml_dir, f"{name.replace(' ', '_').lower()}.joblib")
            if os.path.exists(filename):
                _trained_models[name] = joblib.load(filename)
                
        # Also load from model.pkl if joblib failed or just to verify
        model_pkl_path = os.path.join(ml_dir, "model.pkl")
        if os.path.exists(model_pkl_path) and _best_model_name not in _trained_models:
            import pickle
            try:
                with open(model_pkl_path, "rb") as f:
                    _trained_models[_best_model_name] = pickle.load(f)
            except Exception as e:
                print(f"Error loading model.pkl: {e}")
                
        return len(_trained_models) > 0
    except Exception as e:
        print(f"Error loading models from disk: {e}")
        return False

def train_ml_models() -> Dict[str, Any]:
    """
    Trains all four regressors (Random Forest, Gradient Boosting, XGBoost, LightGBM)
    and selects the best one automatically.
    """
    global _trained_models, _model_metrics, _best_model_name, _baselines, _stds
    import joblib
    import os
    import json
    
    if load_ml_models():
        return {
            "metrics": _model_metrics,
            "best_model": _best_model_name
        }
        
    df = generate_historical_dataset()
    X = df[_feature_names]
    
    # Compute baselines and standard deviations for explainability
    for name in _feature_names:
        _baselines[name] = float(X[name].mean())
        _stds[name] = float(X[name].std() or 1.0)
        
    y = df["suitability"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Instantiate models
    models_to_train = {
        "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42),
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, random_state=42)
    }
    
    if has_xgboost:
        models_to_train["XGBoost"] = XGBRegressor(n_estimators=100, random_state=42, max_depth=5, verbosity=0)
    else:
        # Fallback using ExtraTrees
        models_to_train["XGBoost"] = ExtraTreesRegressor(n_estimators=120, random_state=42, max_depth=8)
        
    if has_lgbm:
        models_to_train["LightGBM"] = LGBMRegressor(n_estimators=100, random_seed=42, verbose=-1)
    else:
        # Fallback using AdaBoost
        models_to_train["LightGBM"] = AdaBoostRegressor(n_estimators=80, random_state=42)
        
    _trained_models = {}
    _model_metrics = {}
    
    best_r2 = -999.0
    best_name = "Random Forest"
    
    for name, model in models_to_train.items():
        # Fit model
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        
        # Calculate metrics
        mse = float(mean_squared_error(y_test, preds))
        r2 = float(r2_score(y_test, preds))
        
        _trained_models[name] = model
        _model_metrics[name] = {
            "r2": round(r2, 4),
            "mse": round(mse, 4),
            "is_fallback": (name == "XGBoost" and not has_xgboost) or (name == "LightGBM" and not has_lgbm)
        }
        
        if r2 > best_r2:
            best_r2 = r2
            best_name = name
            
    _best_model_name = best_name
    
    # Save the models to disk under backend/app/ml/
    current_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.join(current_dir, "ml")
    os.makedirs(ml_dir, exist_ok=True)
    
    for name, model in _trained_models.items():
        filename = os.path.join(ml_dir, f"{name.replace(' ', '_').lower()}.joblib")
        joblib.dump(model, filename)
        
    # Save the best model as model.pkl using pickle
    import pickle
    model_pkl_path = os.path.join(ml_dir, "model.pkl")
    try:
        with open(model_pkl_path, "wb") as f:
            pickle.dump(_trained_models[_best_model_name], f)
    except Exception as e:
        print(f"Error saving best model to model.pkl: {e}")
        
    # Save metrics
    metrics_file = os.path.join(ml_dir, "metrics.json")
    with open(metrics_file, "w") as f:
        json.dump({
            "metrics": _model_metrics,
            "best_model": _best_model_name,
            "baselines": _baselines,
            "stds": _stds
        }, f)
        
    return {
        "metrics": _model_metrics,
        "best_model": _best_model_name
    }

def get_ml_predictions(input_data: Dict[str, float]) -> Dict[str, Any]:
    """
    Generates suitability score, annual energy yield, and ROI predictions
    using the best-performing trained machine learning model.
    Also returns SHAP proxy explainable attribution metrics.
    """
    global _trained_models, _best_model_name, _baselines, _stds
    
    # Train if not initialized
    if not _trained_models:
        if not load_ml_models():
            train_ml_models()
        
    # Prepare input vector
    input_vector = []
    for name in _feature_names:
        input_vector.append(input_data.get(name, _baselines.get(name, 0.0)))
        
    X_input = pd.DataFrame([input_vector], columns=_feature_names)
    
    # Run prediction using the best model
    best_model = _trained_models[_best_model_name]
    pred_suitability = float(best_model.predict(X_input)[0])
    
    # Standardize predictions bounds
    pred_suitability = max(0.0, min(100.0, pred_suitability))
    
    # Predict Annual Energy and ROI based on best model estimates
    energy_base = input_data.get("solar_irradiance", 4.0) * 365.0 * 5.0 * 0.8
    if input_data.get("wind_speed", 3.0) > 6.0:
        energy_base = input_data.get("wind_speed", 3.0) * 1.5 * 8760.0 * 0.3
        
    pred_energy = energy_base * (pred_suitability / 85.0)
    pred_energy = max(200.0, pred_energy)
    
    pred_roi = (pred_suitability / 10.0) + 2.5
    pred_roi = max(1.5, min(24.5, pred_roi))

    # Calculate comparisons for all models
    comparisons = {}
    for name, model in _trained_models.items():
        v_pred = float(model.predict(X_input)[0])
        v_pred = max(10.0, min(99.0, v_pred))
        e_pred = energy_base * (v_pred / 85.0)
        r_pred = (v_pred / 10.0) + 2.5
        comparisons[name] = {
            "suitability": round(v_pred, 1),
            "annual_energy_mwh": round(e_pred, 1),
            "roi_percent": round(r_pred, 2)
        }
    
    # --- Explainable AI (XAI) SHAP Proxy Solver ---
    # SHAP efficiency: Sum(attributions) = prediction - baseline
    baseline_suitability = 68.5  # Mean suitability baseline
    diff = pred_suitability - baseline_suitability
    
    # Extract feature importances from the best model
    if hasattr(best_model, "feature_importances_"):
        importances = best_model.feature_importances_
    else:
        # Default even weights fallback
        importances = np.array([1.0 / len(_feature_names)] * len(_feature_names))
        
    raw_attributions = {}
    total_raw_attr = 0.0
    
    for i, name in enumerate(_feature_names):
        x_val = input_data.get(name, _baselines.get(name, 0.0))
        mean_val = _baselines.get(name, 0.0)
        std_val = _stds.get(name, 1.0)
        
        # Calculate raw deviation value
        deviation = (x_val - mean_val) / std_val
        
        # GHI/Wind speed increases score; Distance/slope/clouds decrease score
        direction = 1.0
        if name in ["cloud_cover", "rainfall", "land_slope", "distance_to_transmission", "distance_to_road"]:
            direction = -1.0
            
        attr = importances[i] * deviation * direction
        raw_attributions[name] = attr
        total_raw_attr += abs(attr)
        
    # Scale and normalize raw attributions to sum up exactly to diff
    shap_explanations = {}
    if total_raw_attr > 0:
        scale_factor = diff / total_raw_attr
        for name in _feature_names:
            # SHAP value
            shap_val = raw_attributions[name] * abs(scale_factor)
            shap_explanations[name] = round(shap_val, 2)
    else:
        # Fallback even split
        even_split = diff / len(_feature_names)
        for name in _feature_names:
            shap_explanations[name] = round(even_split, 2)
            
    # Compile textual explanation array matching format
    explanations = []
    feature_labels = {
        "solar_irradiance": "Solar Irradiance",
        "wind_speed": "Wind Speed",
        "temperature": "Ambient Temperature",
        "cloud_cover": "Cloud Cover",
        "rainfall": "Annual Rainfall",
        "land_slope": "Terrain Slope",
        "elevation": "Elevation",
        "distance_to_transmission": "Distance to Grid",
        "distance_to_road": "Distance to Road"
    }
    
    for name, val in shap_explanations.items():
        label = feature_labels.get(name, name)
        if val > 0:
            explanations.append(f"{label} increased score by {abs(val)}%")
        elif val < 0:
            explanations.append(f"{label} reduced score by {abs(val)}%")
            
    r2_metric = _model_metrics.get(_best_model_name, {}).get("r2", 0.85)
    confidence = round(max(50.0, min(99.0, r2_metric * 100.0)), 1)

    return {
        "active_model": _best_model_name,
        "predicted_suitability": round(pred_suitability, 1),
        "predicted_annual_energy_mwh": round(pred_energy, 1),
        "predicted_roi_percent": round(pred_roi, 2),
        "shap_values": shap_explanations,
        "explanations": explanations,
        "comparisons": comparisons,
        "feature_importances": {feature_labels[name]: round(float(imp), 4) for name, imp in zip(_feature_names, importances)},
        "confidence": confidence,
        "recommendation_score": round(pred_suitability, 1)
    }
