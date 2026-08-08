# Technology Stack Documentation - GeoEnergy AI Platform

This document describes the technologies, libraries, and frameworks utilized to build the **GeoEnergy AI – Smart Renewable Energy Intelligence Platform**, justifying their purpose, advantages, and usage.

---

## 1. Frontend & Client-Side Presentation

### React
- **Purpose**: Dynamic user interface component layout.
- **Advantages**: Declared components state tracking ensures instant rendering of complex GIS comparison widgets.
- **Usage**: Manages all dashboard panels (Planner, Analyst, PM, Admin), interactive forms, and notifications feeds.

### Leaflet (Leaflet Map)
- **Purpose**: Geospatial map renderings.
- **Advantages**: Lightweight footprint, compatible with OpenStreetMap layers.
- **Usage**: Powers the coordinate picker map in the location selector page.

---

## 2. API Gateway & Logic Engine

### FastAPI (Python)
- **Purpose**: Asynchronous REST API routing.
- **Advantages**: Native async execution, automated Swagger documentation, input validation using Pydantic.
- **Usage**: Direct API endpoints for project submissions, GIS reviews, downloads, and user registrations.

### SQLAlchemy
- **Purpose**: Database Object-Relational Mapper (ORM).
- **Advantages**: Abstract queries, connection pooling, protection against SQL Injection.
- **Usage**: Maps database schemas (Users, Projects, Sites, Audit Logs, Notifications) to SQLite/PostgreSQL engines.

---

## 3. Data Telemetry & GIS Integrations

### NASA POWER Point Climatology API
- **Purpose**: Provides meteorological coordinates data.
- **Advantages**: 30-year average solar radiation and wind speed measurements.
- **Usage**: Used in `engine_environmental.py` to calculate capacity factors and energy harvests.

### Open-Meteo API
- **Purpose**: Active weather and rainfall telemetry.
- **Advantages**: No API keys required, fast response latency.
- **Usage**: Fetches immediate ambient temperature and rainfall coordinates.

### Nominatim Reverse Geocoder
- **Purpose**: Convert coordinates to address metadata.
- **Advantages**: Standard addresses output (country, state, city).
- **Usage**: Populates country and region names on map clicks automatically.

---

## 4. Machine Learning & Predictive Modeling

### Scikit-Learn
- **Purpose**: Resource suitability scoring model.
- **Advantages**: Lightweight binary classification models.
- **Usage**: Uses trained estimator models inside `engine_ml.py` to output site suitability category grades.

---

## 5. Session & Security Layers

### JWT (JSON Web Tokens)
- **Purpose**: Stateless bearer authentication.
- **Advantages**: Secure session validation without server database overhead.
- **Usage**: Signatures verifying client identity on every request.

### Google OAuth 2.0
- **Purpose**: Decentralized federated identity authentication.
- **Advantages**: Bypasses local password registry, cryptographic token validation.
- **Usage**: Logs users in using Google accounts and handles onboarding configurations.
