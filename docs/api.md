# API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

### Users

#### Get Current User
```http
GET /users/me
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name"
}
```

### Projects

#### List Projects
```http
GET /projects
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Solar Project Rajasthan",
    "project_type": "Solar",
    "region": "Rajasthan",
    "capacity_mw": 50.0,
    "description": "Large-scale solar deployment",
    "suitability_score": 85.0,
    "created_at": "2024-01-01T00:00:00"
  }
]
```

#### Create Project
```http
POST /projects
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Solar Project Rajasthan",
  "project_type": "Solar",
  "region": "Rajasthan",
  "capacity_mw": 50.0,
  "description": "Large-scale solar deployment"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Solar Project Rajasthan",
    "project_type": "Solar",
    "region": "Rajasthan",
    "capacity_mw": 50.0,
    "description": "Large-scale solar deployment",
    "created_at": "2024-01-01T00:00:00"
  }
}
```

#### Get Project
```http
GET /project/{project_id}
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "name": "Solar Project Rajasthan",
  "project_type": "Solar",
  "region": "Rajasthan",
  "capacity_mw": 50.0,
  "description": "Large-scale solar deployment",
  "location": {
    "latitude": 26.9124,
    "longitude": 75.7873,
    "address": "Jaipur, Rajasthan, India"
  },
  "environmental_data": {
    "solar_irradiance": 5.5,
    "wind_speed": 3.0,
    "temperature": 25.0
  },
  "prediction": {
    "solar_potential": 85.0,
    "suitability_score": 82.0
  },
  "created_at": "2024-01-01T00:00:00"
}
```

#### Delete Project
```http
DELETE /project/{project_id}
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** 204 No Content

### Environment

#### Fetch Environmental Data
```http
POST /environment/fetch
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "latitude": 26.9124,
  "longitude": 75.7873
}
```

**Response:**
```json
{
  "latitude": 26.9124,
  "longitude": 75.7873,
  "solar_irradiance": 5.5,
  "wind_speed": 3.0,
  "wind_direction": 180.0,
  "temperature": 25.0,
  "humidity": 60.0,
  "rainfall": 800.0,
  "cloud_cover": 30.0,
  "elevation": 200.0,
  "land_slope": 5.0,
  "vegetation_index": 0.6,
  "nearby_roads_km": 10.0,
  "nearby_substations_km": 15.0,
  "nearby_transmission_lines_km": 20.0
}
```

#### Reverse Geocode
```http
POST /environment/reverse-geocode
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "latitude": 26.9124,
  "longitude": 75.7873
}
```

**Response:**
```json
{
  "address": "Jaipur, Rajasthan, India",
  "latitude": 26.9124,
  "longitude": 75.7873
}
```

### Predictions

#### Solar Prediction
```http
POST /prediction/solar
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "project_type": "Solar",
  "capacity_mw": 50.0,
  "environmental_data": {
    "solar_irradiance": 5.5,
    "wind_speed": 3.0,
    "wind_direction": 180.0,
    "temperature": 25.0,
    "humidity": 60.0,
    "rainfall": 800.0,
    "cloud_cover": 30.0,
    "elevation": 200.0,
    "land_slope": 5.0,
    "vegetation_index": 0.6,
    "nearby_roads_km": 10.0,
    "nearby_substations_km": 15.0,
    "nearby_transmission_lines_km": 20.0
  }
}
```

**Response:**
```json
{
  "solar_potential": 85.0,
  "energy_generation_forecast": 450000.0,
  "capacity_factor": 28.5,
  "performance_ratio": 78.0
}
```

#### Wind Prediction
```http
POST /prediction/wind
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** (same as solar)

**Response:**
```json
{
  "wind_potential": 72.0,
  "energy_generation_forecast": 380000.0,
  "capacity_factor": 32.0,
  "performance_ratio": 75.0
}
```

#### Site Score Prediction
```http
POST /prediction/site-score
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** (same as solar)

**Response:**
```json
{
  "suitability_score": 82.0,
  "investment_score": 75.0,
  "roi_estimate": 12.5,
  "deployment_recommendation": "Proceed to detailed engineering and interconnection studies.",
  "technology_recommendation": "Utility-scale photovoltaic with single-axis tracking",
  "confidence_score": 88.0
}
```

#### Forecast Prediction
```http
POST /prediction/forecast
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** (same as solar)

**Response:**
```json
{
  "forecast": [
    {
      "month": "Jan",
      "solar_mwh": 3500.0,
      "wind_mwh": 1200.0,
      "hybrid_mwh": 2800.0
    },
    {
      "month": "Feb",
      "solar_mwh": 3800.0,
      "wind_mwh": 1100.0,
      "hybrid_mwh": 3000.0
    }
    // ... 12 months total
  ]
}
```

### Analytics

#### Dashboard
```http
GET /analytics/dashboard
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_projects": 10,
  "total_analyzed_sites": 10,
  "suitable_sites": 7,
  "highly_suitable_sites": 3,
  "average_site_score": 75.5,
  "solar_potential": 78.2,
  "wind_potential": 65.4,
  "estimated_capacity_mw": 500.0,
  "estimated_energy_generation_mwh": 900000.0,
  "estimated_roi": 12.5,
  "recommended_technology": "Solar",
  "project_kpis": {
    "total_projects": 10,
    "active_projects": 10,
    "completed_assessments": 10,
    "recommended_sites": 7,
    "high_potential_sites": 3,
    "average_site_suitability_score": 75.5
  },
  "renewable_kpis": {
    "solar_potential": 78.2,
    "wind_potential": 65.4,
    "estimated_annual_energy_generation": 900000.0,
    "capacity_factor": 28.5,
    "renewable_resource_score": 75.5
  },
  "environmental_kpis": {
    "average_solar_irradiance": 5.5,
    "average_wind_speed": 4.2,
    "average_temperature": 25.0,
    "average_elevation": 200.0,
    "average_rainfall": 750.0,
    "average_humidity": 58.0
  },
  "investment_kpis": {
    "estimated_project_cost": 600000.0,
    "estimated_annual_revenue": 72000.0,
    "roi": 12.5,
    "payback_period": 8.3,
    "investment_rating": "Solar"
  },
  "latest_projects": [],
  "recent_reports": []
}
```

#### Projects Analytics
```http
GET /analytics/projects
```

**Response:**
```json
{
  "projects": [
    {
      "id": 1,
      "name": "Project 1",
      "project_type": "Solar",
      "region": "Rajasthan",
      "capacity_mw": 50.0,
      "status": "Suitable",
      "suitability_score": 75.0,
      "created_at": "2024-01-01T00:00:00"
    }
  ],
  "count": 1
}
```

#### Resources Analytics
```http
GET /analytics/resources
```

**Response:**
```json
{
  "solar_potential": 78.2,
  "wind_potential": 65.4,
  "estimated_generation": 900000.0,
  "capacity_factor": 28.5,
  "resource_score": 75.5,
  "technology_mix": {
    "Solar": 6,
    "Wind": 2,
    "Hybrid": 2
  }
}
```

#### Investment Analytics
```http
GET /analytics/investment
```

**Response:**
```json
{
  "total_capacity_mw": 500.0,
  "total_cost_estimate": 600000000.0,
  "estimated_annual_revenue": 72000000.0,
  "average_roi": 12.5,
  "average_investment_score": 72.0,
  "payback_period_years": 8.3
}
```

#### Suitability Analytics
```http
GET /analytics/suitability
```

**Response:**
```json
{
  "distribution": {
    "Highly Suitable": 3,
    "Suitable": 4,
    "Moderately Suitable": 2,
    "Low Suitability": 1,
    "Not Suitable": 0
  },
  "average_score": 75.5,
  "site_count": 10
}
```

#### Trends Analytics
```http
GET /analytics/trends
```

**Response:**
```json
{
  "trend_points": [
    {
      "project": "Project 1",
      "suitability_score": 85.0,
      "annual_energy_output": 450000.0,
      "roi_estimate": 12.5,
      "project_type": "Solar"
    }
  ],
  "count": 1
}
```

### Reports

#### List Reports
```http
GET /reports
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "project_id": 1,
    "project_name": "Solar Project Rajasthan",
    "report_type": "Project Summary",
    "file_name": "project-1-report.pdf",
    "created_at": "2024-01-01T00:00:00"
  }
]
```

#### Get Report Detail
```http
GET /reports/{project_id}
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "project_information": {
    "id": 1,
    "name": "Solar Project Rajasthan",
    "project_type": "Solar",
    "region": "Rajasthan",
    "capacity_mw": 50.0,
    "latitude": 26.9124,
    "longitude": 75.7873,
    "address": "Jaipur, Rajasthan, India"
  },
  "environmental_assessment": {
    "solar_irradiance": 5.5,
    "wind_speed": 3.0,
    "temperature": 25.0,
    "humidity": 60.0,
    "rainfall": 800.0,
    "elevation": 200.0
  },
  "renewable_assessment": {
    "solar_potential": 85.0,
    "wind_potential": 45.0,
    "suitability_score": 82.0,
    "recommended_technology": "Utility-scale photovoltaic"
  },
  "deployment_recommendation": {
    "recommended_site": "Jaipur, Rajasthan, India",
    "estimated_capacity_mw": 50.0,
    "expected_generation_mwh": 450000.0,
    "roi_estimate": 12.5
  },
  "forecast": [],
  "final_recommendation": "Suitable"
}
```

#### Download PDF Report
```http
POST /reports/pdf?project_id={project_id}
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** PDF file download

#### Download Excel Report
```http
POST /reports/excel?project_id={project_id}
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** Excel file download

### GIS

#### Get GIS Sites
```http
GET /gis/sites
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "sites": [
    {
      "project_id": 1,
      "name": "Solar Project Rajasthan",
      "project_type": "Solar",
      "region": "Rajasthan",
      "latitude": 26.9124,
      "longitude": 75.7873,
      "address": "Jaipur, Rajasthan, India",
      "capacity_mw": 50.0,
      "suitability_score": 82.0,
      "suitability_level": "High",
      "solar_score": 85.0,
      "wind_score": 45.0,
      "recommended_technology": "Utility-scale photovoltaic",
      "annual_energy_output": 450000.0,
      "roi_estimate": 12.5,
      "environmental_information": {
        "solar_irradiance": 5.5,
        "wind_speed": 3.0,
        "temperature": 25.0
      }
    }
  ],
  "total_sites": 1
}
```

### Health

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "healthy": true,
  "service": "renewable-platform"
}
```

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error_code": "ERROR_CODE"
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid input data
- `UNAUTHORIZED` - Missing or invalid authentication
- `NOT_FOUND` - Resource not found
- `SERVER_ERROR` - Internal server error
- `HTTP_ERROR` - General HTTP error

### Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success (no content)
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Resource not found
- `422 Validation Error` - Invalid input
- `500 Internal Server Error` - Server error