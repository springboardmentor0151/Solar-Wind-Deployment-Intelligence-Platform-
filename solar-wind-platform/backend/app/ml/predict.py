import os
import joblib
import numpy as np

# Define directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ML_DIR = os.path.join(BASE_DIR, 'ml')
MODEL_PATH = os.path.join(ML_DIR, "model.pkl")

# Load model lazily
_model = None

def get_loaded_model():
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
        else:
            # Fallback RF model if not trained yet
            from sklearn.ensemble import RandomForestRegressor
            _model = RandomForestRegressor(n_estimators=10, random_state=42)
            # Create a simple dummy train
            dummy_X = np.random.uniform(0.0, 10.0, (10, 9))
            dummy_y = np.random.uniform(10.0, 99.0, 10)
            _model.fit(dummy_X, dummy_y)
    return _model

def predict_suitability(features_dict):
    """
    Features order:
    [solar_irradiance, wind_speed, temperature, cloud_cover, rainfall, land_slope, elevation, distance_to_transmission, distance_to_road]
    """
    try:
        model = get_loaded_model()
        
        # Map dictionary to features list
        feature_names = [
            "solar_irradiance", "wind_speed", "temperature", "cloud_cover", 
            "rainfall", "land_slope", "elevation", "distance_to_transmission", "distance_to_road"
        ]
        
        # Fill in defaults if any are missing
        defaults = {
            "solar_irradiance": 5.0,
            "wind_speed": 4.5,
            "temperature": 25.0,
            "cloud_cover": 30.0,
            "rainfall": 800.0,
            "land_slope": 2.0,
            "elevation": 100.0,
            "distance_to_transmission": 2.0,
            "distance_to_road": 0.5
        }
        
        X_list = []
        for name in feature_names:
            val = features_dict.get(name)
            if val is None:
                val = defaults[name]
            X_list.append(float(val))
            
        X_arr = np.array([X_list])
        pred = float(model.predict(X_arr)[0])
        return round(max(0.0, min(100.0, pred)), 1)
    except Exception as e:
        print("ML prediction failed, falling back to rule-based: ", e)
        solar = float(features_dict.get("solar_irradiance", 5.0))
        wind = float(features_dict.get("wind_speed", 4.5))
        clouds = float(features_dict.get("cloud_cover", 30.0))
        slope = float(features_dict.get("land_slope", 2.0))
        dist = float(features_dict.get("distance_to_transmission", 2.0))
        
        score = (solar / 7.5) * 35.0 + (wind / 12.0) * 25.0 + (1.0 - clouds / 100.0) * 15.0 - (slope / 25.0) * 10.0 - (dist / 20.0) * 15.0
        return round(max(10.0, min(99.0, score)), 1)
