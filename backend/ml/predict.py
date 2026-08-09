import os
import joblib
import pandas as pd

# ============================================================
# Paths
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_DIR = os.path.join(BASE_DIR, "models")

# ============================================================
# Load Models
# ============================================================

SOLAR_MODEL = joblib.load(
    os.path.join(MODEL_DIR, "solar_model.pkl")
)

ENERGY_MODEL = joblib.load(
    os.path.join(MODEL_DIR, "energy_model.pkl")
)

SUITABILITY_MODEL = joblib.load(
    os.path.join(MODEL_DIR, "suitability.pkl")
)

print("✅ All Models Loaded Successfully")

# ============================================================
# Solar Prediction
# ============================================================

def predict_solar(
    year,
    lat,
    lon,
    allsky_sw,
    clearsky_sw,
    albedo,
    cloud_amount,
    temp,
    dewpoint,
):

    data = pd.DataFrame(
        [[
            year,
            lat,
            lon,
            allsky_sw,
            clearsky_sw,
            albedo,
            cloud_amount,
            temp,
            dewpoint,
        ]],
        columns=[
            "YEAR",
            "LAT",
            "LON",
            "ALLSKY_SW",
            "CLEARSKY_SW",
            "ALBEDO",
            "CLOUD_AMOUNT",
            "TEMP",
            "DEWPOINT",
        ],
    )

    prediction = SOLAR_MODEL.predict(data)

    return float(prediction[0])

# ============================================================
# Energy Prediction
# ============================================================

def predict_energy(
    day,
    month,
    year,
    temp,
    temp_max,
    temp_min,
    temp_avg,
    surface_pressure,
    wind_max,
    wind_min,
    wind_avg,
    precipitation,
):

    data = pd.DataFrame(
        [[
            day,
            month,
            year,
            temp,
            temp_max,
            temp_min,
            temp_avg,
            surface_pressure,
            wind_max,
            wind_min,
            wind_avg,
            precipitation,
        ]],
        columns=[
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
        ],
    )

    prediction = ENERGY_MODEL.predict(data)

    return float(prediction[0])

# ============================================================
# Suitability Prediction
# ============================================================

def predict_suitability(
    lat,
    lon,
    allsky_sw,
    clearsky_sw,
    albedo,
    cloud_amount,
    temp,
    dewpoint,
    precipitation,
):

    data = pd.DataFrame(
        [[
            lat,
            lon,
            allsky_sw,
            clearsky_sw,
            albedo,
            cloud_amount,
            temp,
            dewpoint,
            precipitation,
        ]],
        columns=[
            "LAT",
            "LON",
            "ALLSKY_SW",
            "CLEARSKY_SW",
            "ALBEDO",
            "CLOUD_AMOUNT",
            "TEMP",
            "DEWPOINT",
            "PRECIPITATION",
        ],
    )

    prediction = SUITABILITY_MODEL.predict(data)

    return prediction[0]

# ============================================================
# Testing
# ============================================================

if __name__ == "__main__":

    print("\n========== TESTING MODE ==========\n")

    solar = predict_solar(
        2025,
        20.5,
        78.5,
        5.0,
        6.0,
        0.12,
        40,
        28,
        14,
    )

    print("Solar Prediction :", solar)

    energy = predict_energy(
        15,
        6,
        2025,
        30,
        34,
        26,
        30,
        1012,
        6,
        2,
        4,
        0.3,
    )

    print("Energy Prediction :", energy)

    suitability = predict_suitability(
        20.5,
        78.5,
        5.0,
        6.0,
        0.12,
        40,
        28,
        14,
        1200,
    )

    print("Suitability :", suitability)

    print("\n✅ All Predictions Completed Successfully!")