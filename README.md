# AI-Powered Solar & Wind Deployment Intelligence

A web-based platform for renewable-energy site exploration, GIS and environmental analysis, solar/wind resource assessment, site intelligence, forecasting, investment recommendations, deployment planning, and role-based dashboards.

## 1. Project Structure

```text
AI-Powered-Solar-Wind-Deployment-Intelligence/
├── backend/
│   ├── app/
│   ├── alembic/
│   ├── scripts/
│   ├── datasets/
│   ├── ml_core/
│   └── ...
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── docker/
│   └── postgres/
│       └── init.sql
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

## 2. Main Technologies

### Backend
- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- PostGIS
- Pydantic
- JWT authentication
- Scikit-learn / XGBoost
- GIS/geospatial libraries
- NASA POWER / OpenWeather integrations
- ReportLab / OpenPyXL for reports

### Frontend
- React
- Vite
- Axios
- React Query
- Tailwind CSS

### Database
- PostgreSQL
- PostGIS
- Docker

## 3. Prerequisites

Install the following before starting:

- Python 3.10+
- Node.js 18+
- npm
- Git
- Docker Desktop
- Docker Compose

Make sure Docker Desktop is running before starting PostgreSQL.

## 4. Clone the Repository

```bash
git clone <REPOSITORY_URL>
cd AI-Powered-Solar-Wind-Deployment-Intelligence
```

## 5. Backend Setup

Open a terminal in the project root.

### Create and activate the Python environment

Windows PowerShell:

```powershell
python -m venv myenv
.\myenv\Scripts\Activate.ps1
```

If the environment already exists:

```powershell
.\myenv\Scripts\Activate.ps1
```

### Install dependencies

```powershell
pip install -r requirements.txt
```

## 6. Environment Variables

Create a `.env` file in the project root.

You can start from:

```powershell
Copy-Item .env.example .env
```

Then update the values for your environment.

Important variables include:

```env
APP_NAME=AI Powered Solar & Wind Deployment Intelligence Platform
APP_VERSION=1.0.0
DEBUG=True

HOST=127.0.0.1
PORT=8000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/solarwind_db

SECRET_KEY=CHANGE_ME_TO_A_RANDOM_SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

OPENWEATHER_API_KEY=YOUR_API_KEY

MAX_RETRIES=3
REQUEST_TIMEOUT=60
LOG_LEVEL=INFO
```

Use a strong random value for `SECRET_KEY`.

Do not commit your real `.env` file or API keys.

## 7. Start PostgreSQL + PostGIS

From the project root:

```powershell
docker compose up -d postgres
```

Check the container:

```powershell
docker ps
```

The PostgreSQL service uses:

```text
Database: solarwind_db
User: postgres
Password: postgres
Port: 5432
```

The project also includes:

```text
docker/postgres/init.sql
```

which enables:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

### Optional pgAdmin

Start all Docker services:

```powershell
docker compose up -d
```

pgAdmin is available at:

```text
http://localhost:5050
```

Default credentials from the Docker Compose configuration:

```text
Email: admin@solarwind.com
Password: admin123
```

## 8. Database Migrations with Alembic

Always run Alembic from the `backend` directory.

```powershell
cd backend
```

Check the current migration:

```powershell
alembic current
```

View migration history:

```powershell
alembic history
```

Apply all migrations:

```powershell
alembic upgrade head
```

Verify that the database is synchronized:

```powershell
alembic check
```

Expected result when everything is synchronized:

```text
No new upgrade operations detected.
```

### Important

Do not manually edit the database schema when an Alembic migration should be used.

If a new database schema change is intentionally introduced, create a migration and review it before applying it:

```powershell
alembic revision --autogenerate -m "describe the change"
```

Then inspect the generated file and run:

```powershell
alembic upgrade head
```

## 9. Start the Backend

From:

```text
backend/
```

run:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend:

```text
http://localhost:8000
```

FastAPI Swagger documentation:

```text
http://localhost:8000/docs
```

ReDoc:

```text
http://localhost:8000/redoc
```

## 10. Frontend Setup

Open a second terminal.

Go to:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Create/update the frontend `.env` file according to the frontend configuration.

The frontend API base URL should point to the backend, for example:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Use the variable name expected by the current frontend `axiosClient` configuration.

Start the frontend:

```powershell
npm run dev
```

Vite will display the local URL, normally:

```text
http://localhost:5173
```

## 11. Running the Complete Application

You normally need three running components:

### Terminal 1 — PostgreSQL

From project root:

```powershell
docker compose up -d postgres
```

### Terminal 2 — Backend

```powershell
cd backend
.\..\myenv\Scripts\Activate.ps1
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Terminal 3 — Frontend

```powershell
cd frontend
npm run dev
```

Then open the frontend URL shown by Vite.

## 12. Authentication and Roles

The application contains role-based access.

Current roles include:

- GIS Analyst
- Renewable Energy Planner
- Project Manager
- Admin

Public registration should only be used for the permitted non-admin roles.

Admin accounts should not be created through public registration if the backend prevents selecting the Admin role.

For local testing, an administrator can be created/assigned through the project's authorized administrative/database setup process.

After changing a user's role directly in PostgreSQL, verify it:

```powershell
docker exec -it solarwind-postgres psql -U postgres -d solarwind_db -c "SELECT u.id, u.full_name, u.email, r.name AS role, u.is_active FROM users u JOIN roles r ON r.id = u.role_id ORDER BY u.id;"
```

## 13. Role-Based Flows

### GIS Analyst

The GIS Analyst flow includes functionality such as:

- Site/location exploration
- GIS enrichment
- Environmental enrichment
- Site intelligence
- Resource assessment
- Site comparison
- Site reports

### Renewable Energy Planner

The planner flow includes:

- Candidate-site intelligence
- Generation forecasting
- Investment recommendations
- Planner overview
- Renewable deployment planning

The dashboard should use stored candidate intelligence where available instead of repeatedly running expensive analysis for every site during each dashboard request.

### Project Manager

The project-manager flow includes:

- Project/site intelligence
- Deployment-related information
- Investment recommendations
- Project overview/dashboard functionality

Expensive intelligence should be reused from persisted candidate/project data rather than recalculated for every dashboard request.

### Admin

The Admin flow is intended for administrative management and oversight according to the implemented backend/frontend permissions.

## 14. Candidate Intelligence Backfill

The project contains scripts used to populate persisted candidate intelligence.

If a script imports the backend `app` package, run it from the `backend` directory.

Example:

```powershell
cd backend
python -m scripts.backfill_candidate_intelligence
```

If the script is structured as a directly executable file and module execution is not supported, use the project's current script invocation documented in the source.

The important point is that the backend root must be on Python's import path.

Do NOT run:

```powershell
python scripts/backfill_candidate_intelligence.py
```

from the project root if the script expects `app` to resolve from `backend`.

## 15. Stored Candidate Intelligence

Candidate-site intelligence may contain persisted information such as:

- Forecast
- Investment recommendation
- Other candidate analysis outputs

This persistence is important for dashboard performance.

To inspect candidate intelligence in PostgreSQL:

```powershell
docker exec -it solarwind-postgres psql -U postgres -d solarwind_db -c "SELECT id, site_id, status, (analysis_snapshot::jsonb ? 'forecast') AS has_forecast, (analysis_snapshot::jsonb ? 'investment') AS has_investment FROM candidate_sites ORDER BY id;"
```

## 16. ML Models and Pipelines

The project contains an ML core containing trained models/pipelines used by the application.

Do not retrain or regenerate production model artifacts unless the model-training workflow specifically requires it.

Keep model artifacts and their expected paths/configuration consistent with the backend configuration.

If model files are large, confirm the repository's intended storage strategy before pushing them to Git.

## 17. External Data Sources

The platform uses external data sources for renewable-resource and environmental intelligence.

Examples include:

- NASA POWER
- OpenWeather
- GIS/geospatial data services
- Other configured geospatial providers

Required API keys must be placed in environment variables and must never be hard-coded.

## 18. Reports

The backend supports site-report functionality including:

### JSON report

```text
GET /api/v1/reports/sites/{site_id}
```

### PDF report

```text
GET /api/v1/reports/sites/{site_id}/pdf
```

### Excel report

```text
GET /api/v1/reports/sites/{site_id}/excel
```

### Site comparison

```text
GET /api/v1/reports/site-comparison?site_ids=10&site_ids=9
```

Site comparison accepts multiple `site_ids` as query parameters.

Do not send a request body with this GET endpoint.

## 19. Useful Database Commands

List roles:

```powershell
docker exec -it solarwind-postgres psql -U postgres -d solarwind_db -c "SELECT id, name FROM roles ORDER BY id;"
```

List users:

```powershell
docker exec -it solarwind-postgres psql -U postgres -d solarwind_db -c "SELECT id, full_name, email, role_id, is_active FROM users ORDER BY id;"
```

Check deployment history:

```powershell
docker exec -it solarwind-postgres psql -U postgres -d solarwind_db -c "\d deployment_history"
```

Check candidate sites:

```powershell
docker exec -it solarwind-postgres psql -U postgres -d solarwind_db -c "SELECT id, site_id, status FROM candidate_sites ORDER BY id;"
```

## 20. API Health Check

Once the backend is running, open:

```text
http://localhost:8000/docs
```

Use Swagger to verify authentication and API endpoints.

If a request returns `401`, check authentication/token configuration.

If a request returns `403`, check the user's role and endpoint permissions.

If a request returns `422`, check the request parameters/body against the endpoint schema.

If a request returns `500`, check the backend terminal logs first.

## 21. Frontend Build

Before deployment, verify the production build:

```powershell
cd frontend
npm run build
```

If the build succeeds, the production assets are generated in the Vite output directory.

## 22. Backend Production Check

Before deployment:

```powershell
cd backend
alembic current
alembic check
```

Make sure:

- Database migrations are up to date.
- Required environment variables are configured.
- API keys are available through environment variables.
- ML model artifacts are present.
- Backend starts without errors.

## 23. Git Workflow

Check the current branch:

```powershell
git branch
```

Check changes:

```powershell
git status
```

Review the files before committing:

```powershell
git diff
```

Commit:

```powershell
git add .
git commit -m "describe your change"
```

Push:

```powershell
git push origin <branch-name>
```

Do not commit:

```text
.env
myenv/
node_modules/
__pycache__/
*.pyc
```

Follow the repository `.gitignore`.

## 24. Important Development Rules

### Do not change database schema without migrations

Use Alembic for schema changes.

### Do not expose secrets

Never commit:

- API keys
- JWT secrets
- Database passwords
- Production credentials

### Do not unnecessarily recompute expensive intelligence

Dashboard requests should preferably read persisted candidate intelligence rather than executing expensive ML/API/optimization pipelines repeatedly for every site.

### Keep frontend and backend contracts synchronized

When changing an endpoint:

1. Update backend schema.
2. Update backend endpoint/service.
3. Update frontend API client.
4. Update frontend component.
5. Test the complete request/response flow.

## 25. Troubleshooting

### `ModuleNotFoundError: No module named 'app'`

Make sure you are inside `backend`:

```powershell
cd backend
```

Activate the environment:

```powershell
..\myenv\Scripts\Activate.ps1
```

Then run backend modules/scripts from the backend directory.

### Alembic says the database is behind

Run:

```powershell
alembic current
alembic history
alembic upgrade head
```

Then:

```powershell
alembic check
```

### PostgreSQL connection error

Check:

```powershell
docker ps
```

and:

```powershell
docker logs solarwind-postgres
```

Verify that `DATABASE_URL` matches the actual Docker database configuration.

### Frontend cannot reach backend

Check:

- Backend is running on port 8000.
- Frontend API base URL is correct.
- CORS configuration allows the frontend origin.
- Browser Network tab for the exact request URL/status.

### Dashboard is slow

Check whether the dashboard is recalculating intelligence for every site.

Candidate intelligence should be persisted/backfilled and reused where the implemented architecture expects stored results.

## 26. Production Deployment

For cloud deployment, the following components generally need separate production configuration:

1. PostgreSQL/PostGIS database
2. FastAPI backend
3. React/Vite frontend
4. ML model artifacts
5. Environment variables/secrets
6. External API credentials

Do not use the development Docker/PostgreSQL password or development JWT secret in production.

Set:

```env
DEBUG=False
```

Use a production database URL and strong secrets.

Run migrations against the production database:

```powershell
alembic upgrade head
```

Do not expose PostgreSQL directly to the public internet unless required and properly secured.
