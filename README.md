# Solar & Wind Deployment Intelligence Platform

A full-stack renewable energy planning platform for solar, wind, and hybrid deployment intelligence. This platform enables comprehensive site analysis, AI-powered predictions, GIS visualization, and investment analytics for renewable energy projects.

![Python](https://img.shields.io/badge/Python-3.11+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![React](https://img.shields.io/badge/React-18.3-cyan)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## Features

### Core Functionality
- **User Authentication** - Secure JWT-based authentication with registration and login
- **Project Management** - Create, view, and manage renewable energy projects
- **Interactive Map** - Select deployment sites using Leaflet maps
- **Environmental Data** - Automatic fetching of solar, wind, and environmental parameters
- **AI Predictions** - Solar potential, wind potential, and site suitability scoring
- **Energy Forecast** - 12-month energy generation forecasts
- **GIS Visualization** - Map-based visualization of all analyzed sites
- **Executive Dashboard** - Real-time KPIs and analytics
- **Reports** - Generate PDF and Excel reports
- **Investment Analysis** - ROI, payback period, and investment scoring

### Analytics & Insights
- Project KPIs and metrics
- Renewable resource analytics
- Environmental impact assessment
- Investment analytics and ROI calculations
- Suitability distribution analysis
- Trend analytics

## Technology Stack

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **SQLAlchemy 2.0** - SQL toolkit and ORM
- **PostgreSQL + PostGIS** - Primary database with geospatial support
- **Pydantic** - Data validation and settings management
- **JWT** - Secure authentication
- **ReportLab & OpenPyXL** - PDF and Excel report generation
- **Python-JOSE** - JWT token handling
- **Passlib** - Password hashing

### Frontend
- **React 18** - User interface library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Chart.js** - Data visualization
- **Leaflet** - Interactive maps
- **React Hook Form** - Form management
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Icon library

### DevOps
- **Docker & Docker Compose** - Containerization
- **pytest** - Backend testing
- **Vitest** - Frontend testing
- **GitHub Actions** - CI/CD (configured)

## Project Structure

```
solar_wind_farm/
├── backend/
│   ├── app/
│   │   ├── api/              # API routes and endpoints
│   │   ├── core/             # Configuration and security
│   │   ├── db/               # Database configuration
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic
│   ├── tests/                # Backend tests
│   ├── main.py               # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/              # API client functions
│   │   ├── components/       # Reusable components
│   │   ├── context/          # React context (auth)
│   │   ├── layouts/          # Layout components
│   │   ├── pages/            # Page components
│   │   └── __tests__/        # Frontend tests
│   ├── package.json
│   └── Dockerfile
├── docs/                     # Documentation
├── database/
│   └── init.sql             # Database initialization
├── docker-compose.yml
└── README.md
```

## Quick Start

### Prerequisites

- **Docker & Docker Compose** (Recommended)
  - Docker Engine 20.10+
  - Docker Compose 2.0+

- **OR Manual Setup:**
  - Python 3.11+
  - Node.js 18+
  - PostgreSQL 16+ with PostGIS extension

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd solar_wind_farm

# 2. Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start all services
docker-compose up --build

# 4. Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:8000/api
# API Docs: http://localhost:8000/docs
```

### Option 2: Manual Setup

#### Quick Local Run on Windows (SQLite)

Use this when you want to try the app without setting up PostgreSQL first.

```powershell
# Terminal 1: backend
cd backend
$env:DATABASE_URL="sqlite:///./local_dev.db"
$env:CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2: frontend
cd frontend
$env:VITE_API_BASE_URL="http://127.0.0.1:8000/api"
npm run dev
```

Open:
- Frontend: http://127.0.0.1:5173
- Backend API docs: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/api/health

#### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python -m venv venv
# On Windows: venv\Scripts\activate
# On Linux/Mac: source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 5. Initialize database
python -m app.db.init_db

# 6. Start backend server
uvicorn main:app --reload --port 8000
```

Backend will run at: http://localhost:8000/api

#### Frontend Setup

```bash
# 1. Navigate to frontend directory (new terminal)
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Frontend will run at: http://localhost:5173

## Usage

### 1. Register/Login
- Open http://localhost:8080 (or http://localhost:5173 for manual setup)
- Click "Register" to create a new account
- Or login with existing credentials

### 2. Create a Project
- Navigate to "Projects" page
- Fill in project details (name, type, region, capacity)
- Click on the map to select a deployment location
- Environmental data loads automatically
- AI predictions run automatically
- Click "Save Project"

### 3. View Analytics
- Navigate to "Dashboard" to see:
  - Project KPIs
  - Renewable energy metrics
  - Investment analytics
  - Interactive charts

### 4. GIS Visualization
- Navigate to "GIS Map" to view all analyzed sites
- Filter by suitability level or technology type
- Click markers for detailed site information

### 5. Generate Reports
- Navigate to "Reports" page
- Select a project to view detailed report
- Download PDF or Excel reports

## API Documentation

### Interactive API Docs
Once the backend is running, access interactive API documentation:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/users/me` - Get current user

#### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/project/{id}` - Get project details
- `DELETE /api/project/{id}` - Delete project

#### Environment
- `POST /api/environment/fetch` - Fetch environmental data
- `POST /api/environment/reverse-geocode` - Get address from coordinates

#### Predictions
- `POST /api/prediction/solar` - Solar potential analysis
- `POST /api/prediction/wind` - Wind potential analysis
- `POST /api/prediction/site-score` - Site suitability score
- `POST /api/prediction/forecast` - Energy generation forecast

#### Analytics
- `GET /api/analytics/dashboard` - Executive dashboard KPIs
- `GET /api/analytics/projects` - Project analytics
- `GET /api/analytics/resources` - Resource analytics
- `GET /api/analytics/investment` - Investment analytics

#### Reports
- `GET /api/reports` - List reports
- `GET /api/reports/{project_id}` - Get report details
- `POST /api/reports/pdf` - Download PDF report
- `POST /api/reports/excel` - Download Excel report

#### GIS
- `GET /api/gis/sites` - Get all analyzed sites

#### Health
- `GET /api/health` - Health check endpoint

## Testing

### Backend Tests

```bash
cd backend

# Install test dependencies
pip install pytest pytest-cov

# Run all tests
pytest -v

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_api_auth.py -v
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test -- --run

# Run with coverage
npm test -- --run --coverage

# Run specific test file
npm test -- --run Login.test.jsx
```

### Test Coverage
- **Backend:** 30+ test cases covering authentication, projects, predictions, analytics, and reports
- **Frontend:** 20+ test cases covering login, dashboard, projects, and GIS map
- **Total:** 50+ automated tests

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Architecture](docs/architecture.md)** - System architecture and technology stack
- **[API Documentation](docs/api.md)** - Complete API reference with examples
- **[Deployment Guide](docs/deployment.md)** - Docker, cloud deployment, and production setup
- **[Testing Guide](docs/testing.md)** - Testing strategies and best practices
- **[User Guide](docs/user-guide.md)** - Comprehensive user documentation
- **[Milestone 4 Summary](docs/milestone-4.md)** - Milestone 4 completion details

## Deployment

### Docker Compose (Production)

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Cloud Deployment

Detailed cloud deployment guides are available in [docs/deployment.md](docs/deployment.md):
- **AWS** - ECS, EC2, RDS
- **Azure** - Container Instances, Azure Database
- **GCP** - Cloud Run, Cloud SQL

## Environment Variables

### Backend (.env)
```env
# Required
SECRET_KEY=your-secure-secret-key-here
DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/dbname

# Optional
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://your-domain.com
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

See `.env.example` files for complete list of options.

## Health Check

Verify the application is running:

```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "healthy": true,
  "service": "renewable-platform"
}
```

## CI/CD

The project includes GitHub Actions workflow (`.github/workflows/ci-cd.yml`) that runs:
- Backend tests with coverage
- Frontend tests with coverage
- Docker image builds
- Linting (flake8, black, isort)
- Security scanning with Trivy

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Test connection
docker exec -it renewables-postgres psql -U postgres -d renewables_platform
```

### Backend Issues
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Rebuild backend
docker-compose up -d --build backend
```

### Frontend Issues
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

### Port Conflicts
If ports are in use, modify `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 8080
  backend:
    ports:
      - "8001:8000"  # Change 8001
```

## License

This project is developed for educational and commercial use.

## Support

For issues and questions:
1. Check the [User Guide](docs/user-guide.md)
2. Review [API Documentation](docs/api.md)
3. Check [Deployment Guide](docs/deployment.md)
4. Open an issue in the repository

## Roadmap

### Completed (Milestones 1-4)
- ✅ User authentication and authorization
- ✅ Project management (CRUD operations)
- ✅ Interactive map for location selection
- ✅ Environmental data fetching
- ✅ AI-powered predictions (solar, wind, site suitability)
- ✅ Energy generation forecasts
- ✅ Executive dashboard with KPIs
- ✅ GIS visualization
- ✅ Report generation (PDF & Excel)
- ✅ Comprehensive testing (backend & frontend)
- ✅ Complete documentation
- ✅ Docker deployment
- ✅ CI/CD pipeline

### Future Enhancements
- Redis caching for performance
- Rate limiting
- Real external API integrations (NASA POWER, weather APIs)
- Advanced ML models
- User role management
- Email notifications
- Batch site processing
- Advanced GIS layers
- Data export functionality
- Mobile application

## Acknowledgments

- OpenStreetMap for map data
- NASA POWER API for environmental data
- FastAPI, React, and open-source communities

---

**Status:** Production Ready ✅

**Version:** 1.0.0

**Last Updated:** 2024
