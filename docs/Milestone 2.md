# 🌍 AI-Powered Solar & Wind Deployment Intelligence Platform
## Milestone 2 – Renewable Resource Analysis Dashboard

## 📌 Overview

Milestone 2 focuses on developing the Renewable Resource Analysis Dashboard that allows users to analyze any geographical location for solar and wind energy potential.

Users can click on the interactive map to retrieve environmental data, renewable energy scores, weather information, and deployment recommendations.

---

## 🎯 Objectives

- Develop an interactive dashboard.
- Integrate React frontend with FastAPI backend.
- Display renewable energy analysis in real-time.
- Visualize data using charts.
- Show location-based recommendations.

---

## 🚀 Features

### ✅ Interactive Dashboard
- Clean and responsive UI
- Dashboard cards
- Renewable analytics

### ✅ Interactive Map
- Click any location
- Capture Latitude & Longitude
- Send coordinates to backend API

### ✅ Environmental Analysis
- Temperature
- Humidity
- Wind Speed
- Solar Irradiance
- Elevation

### ✅ Renewable Energy Analysis
- Solar Score
- Wind Score
- Wind Potential
- AI Recommendation

### ✅ Data Visualization
- Bar Chart
- Doughnut Chart
- Line Chart

---

## 🛠 Tech Stack

### Frontend
- React.js
- JavaScript
- CSS
- Axios
- React-Leaflet
- Chart.js
- React ChartJS 2

### Backend
- FastAPI
- Python
- SQLAlchemy
- PostgreSQL
- Uvicorn

---

## 📂 Project Structure

```
frontend/
│
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Layout.jsx
│   │   ├── MapView.jsx
│   │   ├── ResultCard.jsx
│   │   ├── ResourceChart.jsx
│   │   ├── SolarCard.jsx
│   │   ├── WindCard.jsx
│   │   ├── WeatherCard.jsx
│   │   └── RecommendationCard.jsx
│   │
│   └── pages/
│       └── Dashboard.jsx
│
backend/
│
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── routers/
│       └── location_router.py
```

---

## ⚙️ Workflow

1. User opens Dashboard.
2. User clicks any location on the map.
3. Latitude and Longitude are sent to FastAPI.
4. Backend analyzes environmental parameters.
5. Renewable scores are calculated.
6. Results are returned as JSON.
7. Dashboard displays:
   - Weather
   - Solar Score
   - Wind Score
   - Recommendation
8. Charts visualize the analysis.

---

## 📊 Dashboard Components

### Solar Card
Displays solar resource information.

### Wind Card
Displays wind resource information.

### Weather Card
Displays temperature and weather details.

### Recommendation Card
Displays deployment recommendation.

### Result Card
Shows:
- Latitude
- Longitude
- Temperature
- Humidity
- Wind Speed
- Solar Irradiance
- Elevation
- Solar Score
- Wind Score
- Wind Potential
- Recommendation

### Resource Charts

- Bar Chart
- Doughnut Chart
- Line Chart

---

## 🔌 API Endpoint

### Analyze Location

```
POST /analyze
```

### Sample Request

```json
{
  "latitude": 23.1815,
  "longitude": 79.9864
}
```

### Sample Response

```json
{
  "latitude": 23.1815,
  "longitude": 79.9864,
  "temperature": 31,
  "humidity": 82,
  "wind_speed": 7,
  "solar_irradiance": 6,
  "elevation": 520,
  "solar_score": 88,
  "wind_score": 76,
  "wind_potential": "High",
  "recommendation": "Suitable for Solar and Wind Energy"
}
```

---

## ▶️ Run the Project

### Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend URL

```
http://127.0.0.1:8000
```

Swagger Documentation

```
http://127.0.0.1:8000/docs
```

---

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## 📈 Milestone 2 Achievements

- Dashboard UI Developed
- FastAPI Integration
- Interactive Map
- Renewable Analysis
- Environmental Data Display
- Chart Visualization
- Recommendation System
- Responsive Design

---

## 👩‍💻 Future Enhancements

- Real-time Weather API
- Satellite Image Integration
- Machine Learning Prediction
- Site Comparison
- Report Generation
- User Authentication
- Deployment on Cloud

---

## 👨‍💻 Developed By

**AI-Powered Solar & Wind Deployment Intelligence Platform**

Milestone 2 – Renewable Resource Analysis Dashboard