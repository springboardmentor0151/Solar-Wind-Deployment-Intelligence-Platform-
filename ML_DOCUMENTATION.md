# Machine Learning Documentation - GeoEnergy AI Platform

This document describes the design, feature engineering, estimators, caching patterns, and training processes for the predictive engines in the **GeoEnergy AI – Smart Renewable Energy Intelligence Platform**.

---

## 1. Resource Suitability Scoring Engine

### Model Estimator
- **Model Framework**: Scikit-Learn Random Forest Classifier.
- **Goal**: Classify site suitability categories into one of four classes: `Excellent`, `Good`, `Marginal`, or `Unsuitable`.
- **Inputs (Features)**:
  - Latitude & Longitude (geospatial coordinates)
  - Solar Irradiance ($GHI$, in $\text{kWh/m}^2/\text{day}$)
  - Wind Speed (m/s at hub height)
  - Terrain Elevation (meters) & Terrain Slope (degrees)
  - Grid Distance (km) & Road Distance (km)
  - Environmental Protected Zone Buffer (boolean constraint)

### Feature Engineering
```python
# Feature matrix mapping
features = [
    site.latitude,
    site.longitude,
    env_details.get("solar_irradiance", 0.0),
    wind_details.get("average_wind_speed", 0.0),
    env_details.get("elevation", 0.0),
    env_details.get("land_slope", 0.0),
    infra_details.get("distance_to_grid", 10.0),
    infra_details.get("distance_to_road", 5.0),
    1.0 if infra_details.get("in_protected_zone", False) else 0.0
]
```

---

## 2. Performance Optimizations

### Lazy Loading Cache
- **Pickled Estimator**: The best estimator weights are saved to `backend/app/ml/model.pkl`.
- **Startup Loader**: During first prediction request, `get_ml_predictions` lazy-loads the serialized model from disk.
- **Speed Result**: Avoids initiating training on every request, reducing execution latency from ~8 seconds to less than `1ms`.

---

## 3. Solar & Wind Power Output Engines

### Solar Yield Prediction
- Uses point climatology solar GHI to model daily and annual electricity generation output:
  \[\text{Energy (MWh/year)} = \text{Capacity (MW)} \times \text{GHI} \times 365.25 \times \text{Performance Ratio} \times 0.22\]

### Wind Potential Sizing
- Evaluates average wind speed at 10m heights and project hub height (100m) using shear power laws:
  \[v = v_0 \times \left(\frac{h}{h_0}\right)^\alpha\]
  *(where $\alpha = 0.14$ represents standard wind shear roughness coefficients)*.
- Fits Weibull parameter shapes to compute expected turbine capacity factors.
