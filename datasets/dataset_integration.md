# GIS & Environmental Dataset Integration Plan

The intelligence platform relies on core geospatial APIs to assess localized energy performance.

### 1. Solar Data Processing: NASA POWER API
* **Objective:** Pull Direct Normal Irradiance (DNI) and Global Horizontal Irradiance (GHI).
* **Execution:** Periodic batch workers fetch historic 10-year climatic factors based on target site coordinate pairs.

### 2. Wind Estimation: Global Wind Atlas
* **Objective:** Extract wind power densities, turbulence intervals, and average velocities across varying altitudes (50m to 150m).
* **Execution:** Used to build site metrics mapping structural layout demands against terrain variations.

### 3. Terrain Analysis: NASA SRTM (Shuttle Radar Topography Mission)
* **Objective:** Supply elevation profiles and slope gradients to evaluate whether a location is too steep for equipment installation.
* **Execution:** Ingested via GeoPandas/Rasterio layers to discard unsuitable locations automatically.