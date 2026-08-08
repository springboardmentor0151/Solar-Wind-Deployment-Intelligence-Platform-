import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error

# Define directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, 'datasets')
ML_DIR = os.path.join(BASE_DIR, 'ml')

os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(ML_DIR, exist_ok=True)

# Generate synthetic dataset for training
def generate_training_data(n_samples=500):
    np.random.seed(42)
    
    solar_irradiance = np.random.uniform(2.5, 7.5, n_samples)
    wind_speed = np.random.uniform(1.5, 12.0, n_samples)
    temperature = np.random.uniform(5.0, 45.0, n_samples)
    cloud_cover = np.random.uniform(5.0, 90.0, n_samples)
    rainfall = np.random.uniform(100.0, 2500.0, n_samples)
    land_slope = np.random.uniform(0.0, 25.0, n_samples)
    elevation = np.random.uniform(10.0, 3000.0, n_samples)
    distance_to_transmission = np.random.uniform(0.1, 20.0, n_samples)
    distance_to_road = np.random.uniform(0.05, 10.0, n_samples)
    
    # Target suitability score calculation logic
    # Higher solar irradiance & wind speed increases score
    # Higher slope, cloud cover, and distance decreases score
    suitability = (
        (solar_irradiance / 7.5) * 35.0 +
        (wind_speed / 12.0) * 25.0 +
        (1.0 - cloud_cover / 100.0) * 15.0 -
        (land_slope / 25.0) * 10.0 -
        (distance_to_transmission / 20.0) * 15.0
    )
    # Add random noise
    suitability += np.random.normal(0.0, 2.5, n_samples)
    suitability = np.clip(suitability, 10.0, 99.0)
    
    data = pd.DataFrame({
        "solar_irradiance": solar_irradiance,
        "wind_speed": wind_speed,
        "temperature": temperature,
        "cloud_cover": cloud_cover,
        "rainfall": rainfall,
        "land_slope": land_slope,
        "elevation": elevation,
        "distance_to_transmission": distance_to_transmission,
        "distance_to_road": distance_to_road,
        "suitability": suitability
    })
    
    # Save CSV files
    raw_path = os.path.join(DATASET_DIR, "raw_data.csv")
    processed_path = os.path.join(DATASET_DIR, "processed_data.csv")
    
    data.to_csv(raw_path, index=False)
    data.to_csv(processed_path, index=False)
    print(f"Generated raw and processed datasets at {DATASET_DIR}")
    return data

def train_and_save_model():
    raw_path = os.path.join(DATASET_DIR, "raw_data.csv")
    if not os.path.exists(raw_path):
        data = generate_training_data()
    else:
        data = pd.read_csv(raw_path)
        
    X = data.drop(columns=["suitability"])
    y = data["suitability"]
    
    # 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Random Forest
    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    
    y_pred = rf.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    print(f"Random Forest Trained. R2: {r2:.4f}, MSE: {mse:.4f}")
    
    # Save model.pkl using joblib
    model_path = os.path.join(ML_DIR, "model.pkl")
    joblib.dump(rf, model_path)
    print(f"Saved primary model to {model_path}")
    
    # Train alternative Gradient Boosting for comparison
    gb = GradientBoostingRegressor(n_estimators=100, random_state=42)
    gb.fit(X_train, y_train)
    gb_pred = gb.predict(X_test)
    gb_r2 = r2_score(y_test, gb_pred)
    gb_mse = mean_squared_error(y_test, gb_pred)
    
    metrics = {
        "Random Forest": {"r2": float(r2), "mse": float(mse)},
        "Gradient Boosting": {"r2": float(gb_r2), "mse": float(gb_mse)}
    }
    
    # Save metrics JSON file
    metrics_path = os.path.join(ML_DIR, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)
        
    return metrics

if __name__ == "__main__":
    train_and_save_model()
