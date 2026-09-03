# System Architecture

## Overview

The Solar & Wind Deployment Intelligence Platform is a full-stack application designed for renewable energy site analysis, prediction, and deployment planning.

## Architecture Diagram

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
│   Port: 5173    │
└────────┬────────┘
         │
         │ HTTP/REST API
         │
┌────────▼────────────────────────┐
│   Backend (FastAPI)             │
│   Port: 8000                    │
│   ┌──────────────────────────┐  │
│   │  API Routes              │  │
│   │  - Auth                  │  │
│   │  - Projects              │  │
│   │  - Environment           │  │
│   │  - Prediction            │  │
│   │  - Analytics             │  │
│   │  - Reports               │  │
│   │  - GIS                   │  │
│   └──────────────────────────┘  │
│   ┌──────────────────────────┐  │
│   │  Services                │  │
│   │  - Auth Service          │  │
│   │  - Project Service       │  │
│   │  - Environment Service   │  │
│   │  - Prediction Service    │  │
│   │  - Analytics Service     │  │
│   │  - Geocoding Service     │  │
│   └──────────────────────────┘  │
│   ┌──────────────────────────┐  │
│   │  Data Layer              │  │
│   │  - SQLAlchemy ORM        │  │
│   │  - PostgreSQL/PostGIS    │  │
│   │  - MongoDB (optional)    │  │
│   └──────────────────────────┘  │
└─────────────────────────────────┘
         │
         │
    ┌────┴────┐
    │         │
┌───▼───┐  ┌─▼──────────┐
│PostgreSQL│ │  External  │
│PostGIS  │ │  APIs      │
│Port:5432│ │ - NASA     │
└─────────┘ │ - Weather  │
            │ - GIS Data │
            └───────────┘
```

## Technology Stack

### Frontend
- **React 18.3** - UI framework
- **Vite 6.0** - Build tool
- **React Router 6.28** - Routing
- **Axios 1.7** - HTTP client
- **Chart.js 4.4** - Data visualization
- **React-ChartJS-2 5.2** - Chart components
- **Leaflet 1.9** - Interactive maps
- **React Hook Form 7.54** - Form management
- **React Icons 5.4** - Icon library
- **Tailwind CSS 3.4** - Styling

### Backend
- **FastAPI 0.115** - Web framework
- **Uvicorn 0.32** - ASGI server
- **SQLAlchemy 2.0** - ORM
- **Pydantic 2.x** - Data validation
- **Python-JOSE 3.3** - JWT authentication
- **Passlib 1.7** - Password hashing
- **Geopy 2.4** - Geocoding
- **ReportLab 4.2** - PDF generation
- **OpenPyXL 3.1** - Excel generation

### Database
- **PostgreSQL 16** - Primary database
- **PostGIS 3.4** - Geospatial extensions
- **SQLAlchemy** - Database ORM

### ML/Analytics
- **Scikit-learn 1.6** - ML utilities
- **XGBoost 2.1** - Gradient boosting
- **LightGBM 4.5** - Light gradient boosting
- **Pandas 2.2** - Data manipulation
- **NumPy 1.26** - Numerical computing

### GIS
- **GeoPandas 1.0** - Geospatial data
- **Rasterio 1.4** - Raster data processing
- **Shapely 2.0** - Geometric operations

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **pytest 8.3** - Testing framework

## Project Structure

```
solar_wind_farm/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py           # Dependencies (auth, DB)
│   │   │   ├── router.py         # API router aggregation
│   │   │   └── routes/
│   │   │       ├── auth.py       # Authentication endpoints
│   │   │       ├── users.py      # User management
│   │   │       ├── projects.py   # Project CRUD
│   │   │       ├── environment.py # Environmental data
│   │   │       ├── prediction.py # ML predictions
│   │   │       ├── analytics.py  # Analytics endpoints
│   │   │       ├── reports.py    # Report generation
│   │   │       ├── gis.py        # GIS endpoints
│   │   │       ├── dashboard.py  # Dashboard data
│   │   │       └── health.py     # Health check
│   │   ├── core/
│   │   │   ├── config.py         # Settings management
│   │   │   └── security.py       # JWT & password hashing
│   │   ├── db/
│   │   │   ├── session.py        # Database session
│   │   │   ├── init_db.py        # DB initialization
│   │   │   └── mongo.py          # MongoDB connection
│   │   ├── models/
│   │   │   ├── user.py           # User model
│   │   │   ├── project.py        # Project model
│   │   │   ├── location.py       # Location model
│   │   │   ├── environment.py    # Environmental data model
│   │   │   ├── prediction.py     # Prediction model
│   │   │   ├── forecast.py       # Forecast model
│   │   │   └── report.py         # Report model
│   │   ├── schemas/
│   │   │   ├── auth.py           # Auth schemas
│   │   │   ├── project.py        # Project schemas
│   │   │   ├── environment.py    # Environment schemas
│   │   │   ├── prediction.py     # Prediction schemas
│   │   │   ├── report.py         # Report schemas
│   │   │   └── validation.py     # Validation schemas
│   │   └── services/
│   │       ├── auth_service.py
│   │       ├── project_service.py
│   │       ├── environment_service.py
│   │       ├── prediction_service.py
│   │       ├── analytics_service.py
│   │       ├── geocoding_service.py
│   │       └── report_service.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_api_auth.py
│   │   ├── test_api_projects.py
│   │   ├── test_api_predictions.py
│   │   ├── test_api_analytics.py
│   │   ├── test_api_reports.py
│   │   ├── test_analytics_service.py
│   │   ├── test_prediction_service.py
│   │   └── test_geocoding_service.py
│   ├── main.py                   # FastAPI app entry
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── __tests__/            # Frontend tests
│   │   │   ├── Login.test.jsx
│   │   │   ├── Dashboard.test.jsx
│   │   │   ├── Projects.test.jsx
│   │   │   └── GisMap.test.jsx
│   │   ├── api/
│   │   │   ├── client.js         # Axios instance
│   │   │   └── projects.js       # API functions
│   │   ├── components/
│   │   │   ├── AuthCard.jsx
│   │   │   ├── ChartsPanel.jsx
│   │   │   ├── LeafletPicker.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth state management
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx     # Main layout
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Dashboard
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Projects.jsx      # Project creation
│   │   │   ├── GisMap.jsx        # GIS visualization
│   │   │   ├── Reports.jsx       # Reports page
│   │   │   └── Settings.jsx
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── App.jsx               # Main app component
│   │   └── main.jsx              # Entry point
│   ├── package.json
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
├── database/
│   └── init.sql                  # Database initialization
├── docs/
│   ├── architecture.md           # This file
│   ├── api.md                    # API documentation
│   ├── deployment.md             # Deployment guide
│   ├── testing.md                # Testing guide
│   ├── user-guide.md             # User documentation
│   └── milestone-4.md            # Milestone 4 details
├── docker-compose.yml
├── README.md
└── .gitignore
```

## Data Models

### User
- id, email, name, hashed_password
- relationships: projects

### Project
- id, owner_id, name, project_type, region, capacity_mw, description, created_at
- relationships: location, environmental_data, prediction, forecasts, reports

### Location
- id, project_id, latitude, longitude, address
- relationships: project

### EnvironmentalData
- id, project_id, latitude, longitude
- solar_irradiance, wind_speed, wind_direction
- temperature, humidity, rainfall, cloud_cover
- elevation, land_slope, vegetation_index
- nearby_roads_km, nearby_substations_km, nearby_transmission_lines_km
- fetched_at

### Prediction
- id, project_id
- solar_potential, wind_potential
- energy_generation_forecast, capacity_factor, performance_ratio
- annual_energy_output, wind_power_density
- suitability_score, investment_score, roi_estimate
- deployment_recommendation, technology_recommendation
- confidence_score, created_at

### Forecast
- id, project_id, month
- solar_mwh, wind_mwh, hybrid_mwh

### Report
- id, project_id, report_type, file_name, created_at

## API Design

### Authentication
- POST /api/auth/register - User registration
- POST /api/auth/login - User login (returns JWT)
- GET /api/users/me - Get current user

### Projects
- GET /api/projects - List all projects
- POST /api/projects - Create project
- GET /api/project/{id} - Get project details
- DELETE /api/project/{id} - Delete project

### Environment
- POST /api/environment/fetch - Fetch environmental data
- POST /api/environment/reverse-geocode - Get address from coordinates

### Predictions
- POST /api/prediction/solar - Solar potential analysis
- POST /api/prediction/wind - Wind potential analysis
- POST /api/prediction/site-score - Overall site suitability
- POST /api/prediction/forecast - Energy generation forecast

### Analytics
- GET /api/analytics/dashboard - Executive dashboard KPIs
- GET /api/analytics/projects - Project analytics
- GET /api/analytics/resources - Resource analytics
- GET /api/analytics/investment - Investment analytics
- GET /api/analytics/suitability - Suitability distribution
- GET /api/analytics/trends - Trend analytics

### Reports
- GET /api/reports - List reports
- GET /api/reports/{project_id} - Get report details
- POST /api/reports/pdf - Download PDF report
- POST /api/reports/excel - Download Excel report

### GIS
- GET /api/gis/sites - Get all analyzed sites

### Health
- GET /api/health - Health check

## Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Request validation with Pydantic
- SQL injection prevention via ORM
- Environment variable configuration

## Deployment

- Docker containerization
- Docker Compose for orchestration
- PostgreSQL with PostGIS
- Nginx for frontend serving
- Health checks for all services