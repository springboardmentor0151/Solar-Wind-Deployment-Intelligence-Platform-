# GIS Documentation - GeoEnergy AI Platform

This document describes the geospatial algorithms, reverse geocoding APIs, coordinates caching, and environmental checks implemented inside the **GeoEnergy AI – Smart Renewable Energy Intelligence Platform**.

---

## 1. Map Interaction & Geocoding

- **Map Coordinate Capture**: Leaflet registers clicks on the interactive map UI, capturing latitude and longitude decimals.
- **Address Resolution**: Queries the OpenStreetMap Nominatim reverse geocoding engine to retrieve district, city, state, and country.
- **Point Climatology**: Queries NASA POWER and Open-Meteo REST endpoints using the picked coordinate coordinates.

---

## 2. Terrain & Climatic Analytics

- **Elevation**: Resolves coordinates elevation contour meters.
- **Slope Calculations**: Computes terrain gradients. Slopes greater than 15 degrees are flagged as constraints for solar mount brackets and turbine foundations.
- **Weather Telemetry**: Fetches local temperature (Celsius) and annual rainfall averages (mm).

---

## 3. Infrastructure & Buffers

- **Protected Zone Detection**: Coordinates falling within national reserves, parks, or wildlife preservation zones are flagged as critical constraints.
- **Grid Connectivity**: Computes straight-line distances to the nearest transmission grid interconnection lines. Distance $>8.0\text{ km}$ increments CAPEX budgets automatically.
- **Road Logistics**: Determines road distance for shipping wind turbine blade assemblies.

---

## 4. Geospatial Caching

- **Cache Dictionary**: To bypass Nominatim or NASA rate-limiting blocks, coordinates are rounded to 3 decimal places (approx. 110m resolution) and checked against an in-memory dictionary-based coordinate cache `_gis_cache` in `engine_environmental.py`.
- **Fast Timeout Fail-safe**: API request timeouts are capped at 1.5 seconds. If rate limits or timeouts are reached, deterministic simulated telemetry values are returned immediately.
