# Database Design

## Overview

The Solar & Wind Deployment Intelligence Platform uses PostgreSQL with the PostGIS extension to store project information, geographical data, environmental datasets, prediction results, user management, and reporting information.

The database is designed using normalization principles to minimize data redundancy and maintain data integrity.

---

# Database Entities

The major entities in the system are:

1. Users
2. Roles
3. Projects
4. Sites
5. Environmental Data
6. GIS Data
7. Solar Predictions
8. Wind Predictions
9. Suitability Analysis
10. Reports

---
# Entity 1: Users

## Purpose

Stores all registered users of the platform.

Users can log in, create projects, view reports, and access different modules based on their assigned role.

### Attributes

| Column | Data Type | Constraint | Description |
|---------|-----------|------------|-------------|
| user_id | SERIAL | Primary Key | Unique user identifier |
| full_name | VARCHAR(100) | NOT NULL | User's full name |
| email | VARCHAR(100) | UNIQUE | Login email |
| password_hash | VARCHAR(255) | NOT NULL | Encrypted password |
| role_id | INTEGER | Foreign Key | References Roles table |
| phone | VARCHAR(15) | NULL | Contact number |
| organization | VARCHAR(100) | NULL | Company/Organization |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | NULL | Last profile update |

---

## Relationships

One Role → Many Users

One User → Many Projects

---
# Entity 2: Roles

## Purpose

Defines user permissions and access levels within the platform.

### Roles

- Administrator
- Project Manager
- GIS Analyst
- Viewer

### Attributes

| Column | Data Type | Constraint | Description |
|---------|-----------|------------|-------------|
| role_id | SERIAL | Primary Key | Unique role ID |
| role_name | VARCHAR(50) | UNIQUE | Role name |
| description | TEXT | NULL | Role description |

---

## Relationships

One Role → Many Users

---
# Entity 3: Projects

## Purpose

Stores renewable energy planning projects created by users.

Each project represents an individual solar or wind deployment study.

### Attributes

| Column | Data Type | Constraint | Description |
|---------|-----------|------------|-------------|
| project_id | SERIAL | Primary Key | Unique project ID |
| user_id | INTEGER | Foreign Key | References Users table |
| project_name | VARCHAR(150) | NOT NULL | Name of the project |
| project_type | VARCHAR(20) | NOT NULL | Solar / Wind / Hybrid |
| description | TEXT | NULL | Project description |
| location | VARCHAR(200) | NOT NULL | Study area |
| status | VARCHAR(30) | DEFAULT 'Active' | Project status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | NULL | Last modification |

---

## Relationships

One User → Many Projects

One Project → Many Sites

One Project → Many Reports

---
# Entity 4: Sites

## Purpose

Stores geographical locations selected for renewable energy deployment.

Each site belongs to one project and contains GIS coordinates.

### Attributes

| Column | Data Type | Constraint | Description |
|---------|-----------|------------|-------------|
| site_id | SERIAL | Primary Key | Unique site ID |
| project_id | INTEGER | Foreign Key | References Projects table |
| site_name | VARCHAR(100) | NOT NULL | Site name |
| latitude | DECIMAL(10,7) | NOT NULL | Latitude coordinate |
| longitude | DECIMAL(10,7) | NOT NULL | Longitude coordinate |
| elevation | DECIMAL(8,2) | NULL | Elevation above sea level |
| area_sqkm | DECIMAL(10,2) | NULL | Site area |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |

---

## Relationships

One Project → Many Sites

One Site → One Environmental Data Record

One Site → One GIS Data Record

One Site → One Solar Prediction

One Site → One Wind Prediction

One Site → One Suitability Analysis

---
# Entity 5: Environmental Data

## Purpose

Stores climate and environmental parameters collected from datasets such as NASA POWER and Copernicus.

These parameters are used for renewable energy prediction.

### Attributes

| Column | Data Type | Constraint | Description |
|---------|-----------|------------|-------------|
| environment_id | SERIAL | Primary Key | Unique environmental data ID |
| site_id | INTEGER | Foreign Key | References Sites table |
| solar_irradiance | DECIMAL(8,2) | NOT NULL | Average solar irradiance (kWh/m²/day) |
| wind_speed | DECIMAL(6,2) | NOT NULL | Average wind speed (m/s) |
| temperature | DECIMAL(5,2) | NULL | Average temperature (°C) |
| rainfall | DECIMAL(8,2) | NULL | Annual rainfall (mm) |
| humidity | DECIMAL(5,2) | NULL | Relative humidity (%) |
| collected_date | DATE | NOT NULL | Date of data collection |

---

## Relationships

One Site → One Environmental Data Record

---
# Entity 6: GIS Data

## Purpose

Stores geographical information used for site suitability analysis.

The GIS layer contains terrain and land information required for renewable energy planning.

### Attributes

| Column | Data Type | Constraint | Description |
|---------|-----------|------------|-------------|
| gis_id | SERIAL | Primary Key | Unique GIS record ID |
| site_id | INTEGER | Foreign Key | References Sites table |
| land_cover | VARCHAR(100) | NOT NULL | Land cover classification |
| slope | DECIMAL(6,2) | NULL | Terrain slope (degrees) |
| elevation | DECIMAL(8,2) | NULL | Elevation above sea level |
| road_distance | DECIMAL(8,2) | NULL | Distance to nearest road (km) |
| transmission_distance | DECIMAL(8,2) | NULL | Distance to transmission line (km) |
| protected_area | BOOLEAN | DEFAULT FALSE | Protected area status |

---

## Relationships

One Site → One GIS Data Record

---
# Entity 7: Solar Predictions

## Purpose

Stores the predicted solar energy generation and performance metrics for each site.

### Attributes

| Column | Data Type | Constraint | Description |
|---------|-----------|------------|-------------|
| solar_prediction_id | SERIAL | Primary Key | Unique solar prediction ID |
| site_id | INTEGER | Foreign Key | References Sites table |
| annual_irradiance | DECIMAL(10,2) | NOT NULL | Annual solar irradiance |
| peak_sun_hours | DECIMAL(5,2) | NOT NULL | Average peak sun hours |
| expected_energy_output | DECIMAL(12,2) | NOT NULL | Expected annual energy output (kWh) |
| capacity_factor | DECIMAL(5,2) | NULL | Capacity factor (%) |
| performance_ratio | DECIMAL(5,2) | NULL | Performance ratio (%) |
| prediction_date | DATE | NOT NULL | Prediction date |

---

## Relationships

One Site → One Solar Prediction

---
# Entity 8: Wind Predictions

## Purpose

Stores predicted wind energy potential for each deployment site.

### Attributes

| Column | Data Type | Constraint | Description |
|---------|-----------|------------|-------------|
| wind_prediction_id | SERIAL | Primary Key | Unique wind prediction ID |
| site_id | INTEGER | Foreign Key | References Sites table |
| average_wind_speed | DECIMAL(6,2) | NOT NULL | Average wind speed (m/s) |
| wind_power_density | DECIMAL(10,2) | NULL | Wind power density |
| turbulence_intensity | DECIMAL(5,2) | NULL | Turbulence intensity (%) |
| expected_annual_energy | DECIMAL(12,2) | NOT NULL | Expected annual energy production |
| capacity_factor | DECIMAL(5,2) | NULL | Capacity factor (%) |
| prediction_date | DATE | NOT NULL | Prediction date |

---

## Relationships

One Site → One Wind Prediction

---
# Entity 9: Suitability Analysis

## Purpose

Stores the suitability assessment and ranking of each site based on environmental, GIS, and prediction results.

### Attributes

| Column | Data Type | Constraint | Description |
|---------|-----------|------------|-------------|
| suitability_id | SERIAL | Primary Key | Unique suitability record |
| site_id | INTEGER | Foreign Key | References Sites table |
| solar_score | DECIMAL(5,2) | NOT NULL | Solar suitability score |
| wind_score | DECIMAL(5,2) | NOT NULL | Wind suitability score |
| infrastructure_score | DECIMAL(5,2) | NULL | Infrastructure score |
| environmental_score | DECIMAL(5,2) | NULL | Environmental score |
| overall_score | DECIMAL(5,2) | NOT NULL | Overall deployment score |
| suitability_category | VARCHAR(50) | NOT NULL | Excellent / Highly Suitable / Moderately Suitable / Low Suitable / Unsuitable |

---

## Relationships

One Site → One Suitability Analysis

---
# Entity 10: Reports

## Purpose

Stores generated reports for renewable energy planning and analysis.

### Attributes

| Column | Data Type | Constraint | Description |
|---------|-----------|------------|-------------|
| report_id | SERIAL | Primary Key | Unique report ID |
| project_id | INTEGER | Foreign Key | References Projects table |
| report_type | VARCHAR(50) | NOT NULL | Site Assessment / Solar / Wind / Feasibility / Investment |
| generated_by | INTEGER | Foreign Key | References Users table |
| generated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Report generation date |
| file_format | VARCHAR(20) | NOT NULL | PDF / Excel |
| report_status | VARCHAR(20) | DEFAULT 'Generated' | Report status |

---

## Relationships

One Project → Many Reports

One User → Many Reports

---
# Entity Relationship Summary

The database follows a hierarchical relationship model.

Users (1)
    │
    ├──< Projects (Many)
    │          │
    │          ├──< Sites (Many)
    │                     │
    │                     ├── Environmental Data (1)
    │                     ├── GIS Data (1)
    │                     ├── Solar Prediction (1)
    │                     ├── Wind Prediction (1)
    │                     └── Suitability Analysis (1)
    │
    └──< Reports (Many)

Roles (1)
    │
    └──< Users (Many)

# Database Normalization

The database schema follows Third Normal Form (3NF) to ensure data integrity and reduce redundancy.

## First Normal Form (1NF)

- Each table has a primary key.
- Each column stores atomic values.
- No repeating groups exist.

## Second Normal Form (2NF)

- Every non-key attribute is fully dependent on the primary key.
- Partial dependencies are eliminated.

## Third Normal Form (3NF)

- No transitive dependencies exist.
- Lookup information such as user roles is maintained in separate tables.
- Foreign keys are used to establish relationships between entities.

Benefits:

- Reduced data redundancy
- Improved consistency
- Easier maintenance
- Better scalability

# Database Design Principles

The database has been designed according to the following principles:

- Modular architecture
- Normalized relational schema
- Primary and foreign key relationships
- Data integrity using constraints
- Scalability for future modules
- Separation of authentication, project management, GIS, prediction, and reporting data
- Compatibility with PostgreSQL and PostGIS
- Support for AI and GIS analytics

The schema is designed to support renewable energy planning workflows and future enhancements such as forecasting, deployment optimization, and dashboard analytics.

# Conclusion

The database design provides a scalable and normalized foundation for the Solar & Wind Deployment Intelligence Platform. It supports secure user management, renewable energy project management, GIS data integration, environmental analytics, prediction engines, suitability analysis, and reporting.

This schema serves as the backbone of the application and enables efficient implementation of backend APIs, machine learning models, and frontend dashboards in subsequent project milestones.