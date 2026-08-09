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
    "Solar",
    "Final Dataset.xlsx",
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "solar_model.pkl",
)

# ============================================================
# Load Dataset
# ============================================================

print("=" * 60)
print("Loading Solar Dataset...")
print("=" * 60)

df = pd.read_excel(DATASET_PATH)

print("\nDataset Loaded Successfully!")
print("Original Shape :", df.shape)
print("\nOriginal Columns:")
print(df.columns.tolist())

# ============================================================
# Remove Extra Column
# ============================================================

if "Unnamed: 0" in df.columns:
    df = df.drop(columns=["Unnamed: 0"])
    print("\nRemoved extra column: Unnamed: 0")

print("\nShape After Cleaning :", df.shape)

# ============================================================
# Rename Columns
# ============================================================

df.columns = [
    "YEAR",
    "LAT",
    "LON",
    "ALLSKY_SW",
    "CLEARSKY_SW",
    "ALBEDO",
    "CLOUD_AMOUNT",
    "TEMP",
    "DEWPOINT",
    "GHI",
]

print("\nRenamed Columns:")
print(df.columns.tolist())

# ============================================================
# Remove Missing Values
# ============================================================

df = df.dropna()

print("\nDataset Shape After Removing Missing Values:")
print(df.shape)

# ============================================================
# Features & Target
# ============================================================

X = df[
    [
        "YEAR",
        "LAT",
        "LON",
        "ALLSKY_SW",
        "CLEARSKY_SW",
        "ALBEDO",
        "CLOUD_AMOUNT",
        "TEMP",
        "DEWPOINT",
    ]
]

y = df["GHI"]

# ============================================================
# Train Test Split
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
# Model
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

print("\nSolar Model Training Completed Successfully!")
print("=" * 60)