# System Architecture

## Overview

The Solar & Wind Deployment Intelligence Platform follows a modular three-tier architecture consisting of the Presentation Layer, Application Layer, and Data Layer.

---

## Architecture Components

### 1. Presentation Layer (Frontend)

Technologies:
- React.js
- Vite
- HTML5
- CSS3
- JavaScript

Responsibilities:
- User Authentication
- Dashboard
- Solar Prediction Interface
- Wind Prediction Interface
- Site Suitability Maps
- Reports
- User Management

---

### 2. Application Layer (Backend)

Technology:
- FastAPI

Modules:
- Authentication Service
- Solar Prediction Service
- Wind Prediction Service
- GIS Processing
- Site Suitability Engine
- Report Generator
- REST APIs

Responsibilities:
- Business Logic
- API Handling
- Machine Learning Integration
- Data Processing
- Authentication & Authorization

---

### 3. Data Layer

Database:
- PostgreSQL
- PostGIS Extension

Datasets:
- NASA POWER
- Global Wind Atlas
- NASA SRTM
- OpenStreetMap
- Copernicus Sentinel

Responsibilities:
- Store User Data
- Store Prediction Results
- Store GIS Layers
- Manage Project Information

---

## System Workflow

User
   ↓
Frontend (React + Vite)
   ↓
FastAPI Backend
   ↓
Prediction Services
   ↓
PostgreSQL + PostGIS
   ↓
Results Returned to Dashboard

---

## Technologies Used

| Component | Technology |
|-----------|------------|
| Frontend | React + Vite |
| Backend | FastAPI |
| Database | PostgreSQL + PostGIS |
| GIS | OpenStreetMap, Sentinel, SRTM |
| Machine Learning | Python, Scikit-Learn |
| APIs | REST API |