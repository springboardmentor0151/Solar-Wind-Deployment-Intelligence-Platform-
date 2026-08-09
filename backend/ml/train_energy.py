import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    r2_score,
    mean_absolute_error,
    root_mean_squared_error,
)

# ============================================================
# Paths
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATASET_PATH = os.path.join(
    BASE_DIR,
    "Datasets",
    "Energy",
    "final_dataset_v2.csv",
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "energy_model.pkl",
)

# ============================================================
# Load Dataset
# ============================================================

print("=" * 60)
print("Loading Energy Dataset...")
print("=" * 60)

df = pd.read_csv(DATASET_PATH)

print("\nDataset Loaded Successfully!")
print("Original Shape :", df.shape)

print("\nOriginal Columns:")
print(df.columns.tolist())

# ============================================================
# Fix Dataset Column Names
# ============================================================

df = df.rename(columns={
    "suface_pressure(pa)": "surface_pressure(pa)"
})

print("\nColumns After Renaming:")
print(df.columns.tolist())

# ============================================================
# Remove Missing Values
# ============================================================

df = df.dropna()

print("\nShape After Cleaning :", df.shape)

# ============================================================
# Features
# ============================================================

X = df[
    [
        "day",
        "month",
        "year",
        "temp2(c)",
        "temp2_max(c)",
        "temp2_min(c)",
        "temp2_ave(c)",
        "surface_pressure(pa)",
        "wind_speed50_max(m/s)",
        "wind_speed50_min(m/s)",
        "wind_speed50_ave(m/s)",
        "prectotcorr",
    ]
]

# ============================================================
# Target
# ============================================================

y = df["total_demand(mw)"]

# ============================================================
# Train/Test Split
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
)

print("\nTraining Samples :", len(X_train))
print("Testing Samples  :", len(X_test))

# ============================================================
# Train Model
# ============================================================

print("\nTraining Random Forest Model...")

model = RandomForestRegressor(
    n_estimators=200,
    random_state=42,
    n_jobs=-1,
)

model.fit(X_train, y_train)

print("Training Completed!")

# ============================================================
# Prediction
# ============================================================

predictions = model.predict(X_test)

# ============================================================
# Evaluation
# ============================================================

r2 = r2_score(y_test, predictions)
mae = mean_absolute_error(y_test, predictions)
rmse = root_mean_squared_error(y_test, predictions)

print("\n" + "=" * 60)
print("MODEL PERFORMANCE")
print("=" * 60)

print(f"R² Score : {r2:.4f}")
print(f"MAE      : {mae:.2f}")
print(f"RMSE     : {rmse:.2f}")

# ============================================================
# Save Model
# ============================================================

os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

joblib.dump(model, MODEL_PATH)

print("\nModel Saved Successfully!")
print(MODEL_PATH)

print("\nEnergy Model Training Completed Successfully!")
print("=" * 60)