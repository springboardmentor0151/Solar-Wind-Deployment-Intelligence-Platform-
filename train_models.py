import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor

# Create models directory
os.makedirs('instance/models', exist_ok=True)

print("Generating synthetic datasets...")

# 1. SITE SUITABILITY MODEL DATASET
np.random.seed(42)
n_samples = 3000

solar_irradiance = np.random.uniform(2.5, 8.0, n_samples)
wind_speed = np.random.uniform(1.5, 15.0, n_samples)
elevation = np.random.uniform(0, 3000, n_samples)
land_slope = np.random.uniform(0, 40, n_samples)
distance_road = np.random.uniform(0.05, 30.0, n_samples)
distance_transmission = np.random.uniform(0.1, 40.0, n_samples)
distance_substation = np.random.uniform(0.1, 50.0, n_samples)
vegetation_index = np.random.uniform(0.1, 0.9, n_samples)
land_ownership = np.random.randint(0, 3, n_samples) # 0: Public, 1: Private, 2: Federal

# Score calculations
res_score = 0.5 * (np.clip(solar_irradiance / 7.0, 0, 1) * 100) + 0.5 * (np.clip(wind_speed / 12.0, 0, 1) * 100)
geo_score = (1.0 - np.clip(land_slope / 25.0, 0, 1)) * 100 - 0.05 * (np.clip(elevation / 2000.0, 0, 1) * 100)
geo_score = np.clip(geo_score, 0, 100)

infra_score = (
    0.4 * (1.0 - np.clip(distance_road / 5.0, 0, 1)) * 100 +
    0.3 * (1.0 - np.clip(distance_transmission / 10.0, 0, 1)) * 100 +
    0.3 * (1.0 - np.clip(distance_substation / 15.0, 0, 1)) * 100
)
infra_score = np.clip(infra_score, 0, 100)

env_score = (1.0 - vegetation_index) * 100
env_score = np.clip(env_score, 0, 100)

econ_score = np.where(land_ownership == 0, 100.0, np.where(land_ownership == 1, 70.0, 40.0))

overall_score = 0.35 * res_score + 0.25 * geo_score + 0.15 * infra_score + 0.15 * env_score + 0.10 * econ_score

# Classify categories
# >= 85: Excellent (4), 70-84: Highly Suitable (3), 50-69: Moderately Suitable (2), 30-49: Low Suitability (1), < 30: Unsuitable (0)
categories = np.zeros(n_samples, dtype=int)
categories[overall_score >= 85] = 4
categories[(overall_score >= 70) & (overall_score < 85)] = 3
categories[(overall_score >= 50) & (overall_score < 70)] = 2
categories[(overall_score >= 30) & (overall_score < 50)] = 1
categories[overall_score < 30] = 0

df_suitability = pd.DataFrame({
    'solar_irradiance': solar_irradiance,
    'wind_speed': wind_speed,
    'elevation': elevation,
    'land_slope': land_slope,
    'distance_road': distance_road,
    'distance_transmission': distance_transmission,
    'distance_substation': distance_substation,
    'vegetation_index': vegetation_index,
    'land_ownership': land_ownership
})

X_suit = df_suitability.values
y_suit = categories

# Train suitability classifier
X_train_s, X_test_s, y_train_s, y_test_s = train_test_split(X_suit, y_suit, test_size=0.2, random_state=42)
scaler_suit = StandardScaler()
X_train_s_scaled = scaler_suit.fit_transform(X_train_s)
X_test_s_scaled = scaler_suit.transform(X_test_s)

clf_suit = RandomForestClassifier(n_estimators=100, random_state=42)
clf_suit.fit(X_train_s_scaled, y_train_s)
print(f"Suitability Classifier Acc: {clf_suit.score(X_test_s_scaled, y_test_s):.4f}")

with open('instance/models/suitability_model.pkl', 'wb') as f:
    pickle.dump(clf_suit, f)
with open('instance/models/suitability_scaler.pkl', 'wb') as f:
    pickle.dump(scaler_suit, f)


# 2. SOLAR CAPACITY FACTOR MODEL DATASET
n_samples_solar = 1500
solar_irr = np.random.uniform(2.0, 9.0, n_samples_solar)
temp = np.random.uniform(-10.0, 45.0, n_samples_solar)
cloud = np.random.uniform(0.0, 100.0, n_samples_solar)
slope = np.random.uniform(0.0, 35.0, n_samples_solar)

# Solar physical capacity factor model
cf_base = solar_irr * 4.2 # e.g. 6.0 * 4.2 = 25.2%
temp_factor = 1.0 - 0.004 * np.maximum(0, temp - 25.0)
cloud_factor = 1.0 - 0.18 * (cloud / 100.0)
slope_factor = np.cos(np.radians(slope))
cf_solar = cf_base * temp_factor * cloud_factor * slope_factor
cf_solar = np.clip(cf_solar, 5.0, 35.0)

df_solar = pd.DataFrame({
    'solar_irradiance': solar_irr,
    'temperature': temp,
    'cloud_cover': cloud,
    'land_slope': slope
})
X_solar = df_solar.values
y_solar = cf_solar

X_train_sol, X_test_sol, y_train_sol, y_test_sol = train_test_split(X_solar, y_solar, test_size=0.2, random_state=42)
scaler_solar = StandardScaler()
X_train_sol_scaled = scaler_solar.fit_transform(X_train_sol)
X_test_sol_scaled = scaler_solar.transform(X_test_sol)

reg_solar = RandomForestRegressor(n_estimators=100, random_state=42)
reg_solar.fit(X_train_sol_scaled, y_train_sol)
print(f"Solar Regressor R2: {reg_solar.score(X_test_sol_scaled, y_test_sol):.4f}")

with open('instance/models/solar_model.pkl', 'wb') as f:
    pickle.dump(reg_solar, f)
with open('instance/models/solar_scaler.pkl', 'wb') as f:
    pickle.dump(scaler_solar, f)


# 3. WIND CAPACITY FACTOR MODEL DATASET
n_samples_wind = 1500
w_speed = np.random.uniform(1.0, 20.0, n_samples_wind)
elev = np.random.uniform(0, 3000, n_samples_wind)
w_slope = np.random.uniform(0.0, 35.0, n_samples_wind)

# Wind power curve approximation
# cut-in at 3 m/s, rated at 12 m/s, cut-out at 25 m/s
cf_wind_raw = np.zeros(n_samples_wind)
cf_wind_raw[w_speed >= 3] = 12.0 + 38.0 * ((w_speed[w_speed >= 3] - 3.0) / 9.0)
cf_wind_raw[w_speed > 12] = 50.0
cf_wind_raw[w_speed > 25] = 0.0

elev_factor = np.exp(-elev / 8400.0)
slope_factor = 1.0 - 0.007 * w_slope
cf_wind = cf_wind_raw * elev_factor * slope_factor
cf_wind = np.clip(cf_wind, 0.0, 55.0)

df_wind = pd.DataFrame({
    'wind_speed': w_speed,
    'elevation': elev,
    'land_slope': w_slope
})
X_wind = df_wind.values
y_wind = cf_wind

X_train_wind, X_test_wind, y_train_wind, y_test_wind = train_test_split(X_wind, y_wind, test_size=0.2, random_state=42)
scaler_wind = StandardScaler()
X_train_wind_scaled = scaler_wind.fit_transform(X_train_wind)
X_test_wind_scaled = scaler_wind.transform(X_test_wind)

reg_wind = RandomForestRegressor(n_estimators=100, random_state=42)
reg_wind.fit(X_train_wind_scaled, y_train_wind)
print(f"Wind Regressor R2: {reg_wind.score(X_test_wind_scaled, y_test_wind):.4f}")

with open('instance/models/wind_model.pkl', 'wb') as f:
    pickle.dump(reg_wind, f)
with open('instance/models/wind_scaler.pkl', 'wb') as f:
    pickle.dump(scaler_wind, f)

print("All models trained and saved to instance/models/")
