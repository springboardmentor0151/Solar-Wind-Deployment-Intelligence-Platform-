# 🌍 AI-Powered Solar & Wind Deployment Intelligence Platform

## 📌 Project Overview

The **AI-Powered Solar & Wind Deployment Intelligence Platform** is a web-based application designed to analyze the renewable energy potential of geographical locations.

Users can select a location using latitude and longitude or an interactive map. The system retrieves environmental information and provides preliminary solar and wind suitability analysis.

The platform is being developed through multiple milestones, with each milestone adding new functionality to the system.

---

# 🎯 Project Objectives

The main objectives of the platform are:

- Analyze renewable energy potential of geographical locations.
- Provide environmental and weather information.
- Calculate preliminary solar and wind suitability scores.
- Provide renewable energy deployment recommendations.
- Allow users to select locations using an interactive map.
- Provide secure user authentication.
- Manage renewable energy projects and sites.
- Visualize renewable resource information through dashboards and charts.
- Provide a foundation for future AI/ML-based renewable energy prediction.

---

# 🛠️ Technology Stack

## Frontend

- React.js
- JavaScript
- Vite
- CSS
- Axios
- React-Leaflet
- Leaflet
- OpenStreetMap
- Chart.js

## Backend

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic
- JWT Authentication

## Database

- PostgreSQL
- SQLAlchemy ORM

---

# 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │    React Frontend   │
                    │       + Vite        │
                    └──────────┬──────────┘
                               │
                         HTTP / JSON
                               │
                               ▼
                    ┌─────────────────────┐
                    │    FastAPI Backend  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
       │ PostgreSQL  │  │ Weather /    │  │ Renewable    │
       │ Database    │  │ Environment  │  │ Analysis     │
       └─────────────┘  │ Data         │  └──────────────┘
                        └──────────────┘

                        