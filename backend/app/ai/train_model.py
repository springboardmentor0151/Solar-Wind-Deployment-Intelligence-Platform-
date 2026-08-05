import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Load dataset
df = pd.read_csv("app/ai/dataset.csv")

# Features
X = df[
    [
        "latitude",
        "longitude",
        "land_area",
        "elevation",
        "solar_radiation",
        "wind_speed",
        "temperature",
        "rainfall"
    ]
]

# Target
y = df["suitability"]

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Train model
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)

model.fit(X_train, y_train)

# Test accuracy
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print(f"Model Accuracy: {accuracy*100:.2f}%")

# Save model
joblib.dump(model, "app/ai/model.pkl")

print("Model trained successfully!")