import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# ============================================================
# Paths
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATASET_PATH = os.path.join(
    BASE_DIR,
    "Datasets",
    "Suitability",
    "Final Dataset.xlsx"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "suitability.pkl"
)

# ============================================================
# Load Dataset
# ============================================================

print("=" * 60)
print("Loading Suitability Dataset...")
print("=" * 60)

df = pd.read_excel(DATASET_PATH)

print("\nOriginal Shape :", df.shape)
print("\nOriginal Columns:")
print(df.columns.tolist())

# ============================================================
# Remove unnecessary first column
# ============================================================

if "Unnamed: 0" in df.columns:
    df.drop(columns=["Unnamed: 0"], inplace=True)

# ============================================================
# Rename Columns
# ============================================================

df.columns = [
    "LAT",
    "LON",
    "ALLSKY_SW",
    "CLEARSKY_SW",
    "ALBEDO",
    "CLOUD_AMOUNT",
    "TEMP",
    "DEWPOINT",
    "PRECIPITATION"
]

print("\nColumns Renamed:")
print(df.columns.tolist())

# ============================================================
# Handle Missing Values
# ============================================================

# Remove completely empty rows
df.dropna(how="all", inplace=True)

# Fill missing values
df = df.ffill()

print("\nShape After Cleaning :", df.shape)

# ============================================================
# Create Suitability Labels
# ============================================================

def get_label(row):

    if (
        row["ALLSKY_SW"] >= 5.0
        and row["CLOUD_AMOUNT"] <= 45
        and row["PRECIPITATION"] <= 1500
    ):
        return "High"

    elif (
        row["ALLSKY_SW"] >= 4.7
        and row["CLOUD_AMOUNT"] <= 52
    ):
        return "Medium"

    else:
        return "Low"

df["Suitability"] = df.apply(get_label, axis=1)

print("\nSuitability Distribution:")
print(df["Suitability"].value_counts())

# ============================================================
# Features
# ============================================================

X = df[
    [
        "LAT",
        "LON",
        "ALLSKY_SW",
        "CLEARSKY_SW",
        "ALBEDO",
        "CLOUD_AMOUNT",
        "TEMP",
        "DEWPOINT",
        "PRECIPITATION"
    ]
]

# ============================================================
# Target
# ============================================================

y = df["Suitability"]

# ============================================================
# Train/Test Split
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

print("\nTraining Samples :", len(X_train))
print("Testing Samples  :", len(X_test))

# ============================================================
# Train Model
# ============================================================

print("\nTraining Random Forest Classifier...")

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
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

accuracy = accuracy_score(y_test, predictions)

print("\n" + "=" * 60)
print("MODEL PERFORMANCE")
print("=" * 60)

print(f"Accuracy : {accuracy:.4f}")

print("\nClassification Report:\n")
print(classification_report(y_test, predictions))

# ============================================================
# Save Model
# ============================================================

os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

joblib.dump(model, MODEL_PATH)

print("\nModel Saved Successfully!")
print(MODEL_PATH)

print("\nSuitability Model Training Completed Successfully!")
print("=" * 60)