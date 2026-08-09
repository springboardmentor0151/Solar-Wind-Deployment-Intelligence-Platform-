# Renewsite — Solar & Wind Deployment Intelligence Platform

A full-stack, working implementation of the AI-powered platform described in
`AI_Solar_&_Wind_Deployment_Intelligence_Platform.pdf`: it recommends optimal
locations for solar and wind projects by analyzing live environmental,
geographic, and infrastructure data through trained ML models and a weighted
suitability-scoring engine.

This is real, runnable code — not a mockup:

- **Backend**: FastAPI + SQLAlchemy + JWT auth, with live integrations to
  NASA POWER, Open-Meteo, Open-Elevation, and OpenStreetMap Overpass (with a
  physically-informed synthetic fallback if a live source is unreachable, so
  the platform always returns a usable analysis).
- **ML models**: real `scikit-learn` `RandomForestRegressor`/`Classifier`
  models, trained and serialized with `joblib` — not hard-coded formulas
  dressed up as "AI." See `backend/app/ml/train_models.py`.
- **Frontend**: React 18 + Vite + Tailwind + Leaflet + Recharts, matching the
  Renewsite product design (map explorer, site intelligence, compare & rank,
  reports, capacity planner).

---

## 1. Quick start (Docker — recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API docs (Swagger): http://localhost:8000/docs

The backend image trains the ML models at build time, so the container is
ready to serve real predictions immediately — no manual setup step needed.

---

## 2. Running locally without Docker

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Train the ML models (creates backend/app/ml/models/*.joblib)
python -m app.ml.train_models

# Run the API
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # points the app at http://localhost:8000/api/v1
npm run dev
```

App: http://localhost:5173

---

## 3. How it works

### Environmental Data Collection Engine (`app/services/environmental_service.py`)
For any latitude/longitude, the backend pulls:
- **Solar irradiance, wind speed, temperature, rainfall, cloud cover** — NASA
  POWER climatology API
- **Live current conditions** — Open-Meteo
- **Elevation** — Open-Elevation
- **Roads, substations, transmission lines, urban centers, water bodies** —
  OpenStreetMap Overpass API

If a provider is unreachable (rate-limited, offline, etc.), each data source
falls back independently to a physically-informed synthetic model (e.g. solar
irradiance follows a latitude/desert-band model; wind follows a
mid-latitude-westerlies model). The response always reports which sources were
actually used in `analysis.data_sources`, so you can see live vs. fallback
data at a glance.

### Solar & Wind Potential Prediction Engines
Two `RandomForestRegressor` models (trained on physically-grounded synthetic
training data — see the "About the ML models" section below) predict panel/
turbine capacity factor from the environmental features, from which all
downstream metrics (peak sun hours, expected MWh/yr, turbine class, etc.) are
derived.

### Site Suitability Intelligence Engine (`app/services/suitability_service.py`)
Implements the weighted Deployment Suitability Score from the spec:

```
Score = Resource(35%) + Geographic(25%) + Infrastructure(15%)
      + Environmental(15%) + Economic(10%)
```

A trained `RandomForestClassifier` maps the five sub-scores to a category
(`Excellent` / `Highly Suitable` / `Moderately Suitable` / `Low Suitability` /
`Unsuitable`) — it learned the score→category relationship rather than using a
hard-coded if/else ladder.

### Energy Forecasting & Deployment Optimization (`app/services/forecast_service.py`)
25-year production forecast with technology-specific degradation, CAPEX/OPEX
estimates, revenue projection, and payback period. The Capacity Planner page
lets you re-run this forecast for any installed capacity, PPA price, or
technology choice against a site's cached resource data.

### Reports & Export (`app/services/report_service.py`)
Generates a formatted PDF site-assessment report (ReportLab) and a multi-sheet
Excel workbook (openpyxl) for any registered site.

---

## 4. About the ML models

`backend/app/ml/train_models.py` trains three models:

| Model | Type | Target |
|---|---|---|
| `solar_capacity_factor_model` | RandomForestRegressor | Solar panel capacity factor |
| `wind_capacity_factor_model` | RandomForestRegressor | Wind turbine capacity factor |
| `suitability_category_model` | RandomForestClassifier | Deployment suitability category |

Training data is generated from **physically-informed synthetic
distributions** (e.g. the solar model's capacity factor rises with
irradiance and falls with cloud cover and heat-driven panel derating, based on
standard PV performance-ratio physics). There is no free, offline, licensed
ground-truth dataset available to train on directly in this environment — but
the entire pipeline (feature engineering → train/test split → fit → evaluate
→ serialize with `joblib`) is real and production-shaped. To retrain on real
measured data (e.g. an NREL or PVGIS export), replace `generate_solar_dataset`
/ `generate_wind_dataset` with a loader for your CSV — nothing else needs to
change.

Run `python -m app.ml.train_models` any time to retrain and see held-out
MAE/R²/accuracy printed to the console.

---

## 5. API overview

Full interactive docs at `/docs`. Key routes:

| Route | Description |
|---|---|
| `POST /api/v1/auth/register`, `/login` | JWT auth |
| `POST /api/v1/sites/analyze` | Run the full intelligence pipeline for arbitrary coordinates (no save) |
| `POST /api/v1/sites` | Register a site (runs + caches full analysis) |
| `GET /api/v1/sites` | List your registered sites with latest score |
| `GET /api/v1/sites/{id}/analysis` | Full cached analysis for a site |
| `POST /api/v1/sites/{id}/reanalyze` | Refresh a site's analysis |
| `GET /api/v1/sites/compare/table?ids=a,b,c` | Side-by-side comparison + ranking |
| `POST /api/v1/sites/{id}/plan` | Deployment Optimization Engine — custom capacity/PPA/tech forecast |
| `GET /api/v1/dashboard/summary` | Renewable Energy Planner dashboard aggregates |
| `GET /api/v1/dashboard/gis-analyst` | GIS Analyst dashboard — terrain/environmental/infra analytics |
| `GET /api/v1/dashboard/project-manager` | Project Manager dashboard — status, feasibility, timeline, cost-benefit |
| `GET /api/v1/admin/platform-stats` | Administrator dashboard — platform-wide analytics |
| `GET/PATCH/DELETE /api/v1/admin/users` | Administrator — user management (admin role required) |
| `GET /api/v1/reports/{id}/pdf`, `/excel` | Export a site assessment report |

All `/sites`, `/dashboard`, and `/reports` routes require
`Authorization: Bearer <token>`.

---

## 6. Project structure

```
renewsite/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, router wiring, CORS
│   │   ├── core/                   # config, JWT/password security
│   │   ├── db/                     # SQLAlchemy models + session
│   │   ├── schemas/                # Pydantic request/response models
│   │   ├── services/                # environmental, solar, wind, suitability,
│   │   │                             forecast, report generation engines
│   │   ├── ml/
│   │   │   ├── train_models.py     # trains & saves the 3 sklearn models
│   │   │   └── models/*.joblib     # trained model artifacts
│   │   └── api/                    # auth, sites, dashboard, reports routers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/                  # Dashboard, Explore, SiteDetail, Compare,
│   │   │                             Reports, CapacityPlanner, Login, Register
│   │   ├── components/             # AppShell (sidebar nav), AnalysisPanel
│   │   ├── context/                # AuthContext, SitesContext
│   │   └── api/client.js           # axios instance with JWT interceptor
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

---

## 7. Roles &amp; role-specific dashboards

Renewsite has four roles, each with its own purpose-built dashboard (the
Dashboard page automatically routes to the right one based on who's logged
in):

| Role | Dashboard shows |
|---|---|
| **Renewable Energy Planner** | Recommended/top-ranked sites, portfolio-wide energy output, category distribution, investment snapshot |
| **GIS Analyst** | Terrain &amp; environmental analytics (elevation, slope, NDVI), infrastructure proximity table, protected-zone/agricultural-land flags, live-vs-fallback data source provenance |
| **Project Manager** | Project status board (Prospecting → Feasibility Study → Approved → In Construction → Operational → On Hold), feasibility pass/fail, cost-benefit totals, deployment timeline |
| **Administrator** | User management (view/disable/remove users), platform-wide analytics, site status distribution, configured data sources &amp; their usage |

There's no seeded account — register your own from the app's **Create an
account** screen and pick a role there.

Every registered site also carries a **project status** and optional
**target operational date** (set when registering a site on the Explore page,
or updated any time from the Site Intelligence page) — this is what powers
the Project Manager's timeline and status board.

---

## 8. Free, public hosting (GitHub + Neon + Render + Vercel)

This deploys Renewsite so **anyone with the URL can use it** — not just you
on `localhost`. All four pieces below are free, no credit card required.

### Step 1 — Push the code to GitHub
```bash
cd renewsite
git init
git add .
git commit -m "Initial commit"
```
Create a new empty repository at **https://github.com/new** (name it
`renewsite`, don't add a README/gitignore there — you already have one), then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/renewsite.git
git branch -M main
git push -u origin main
```

### Step 2 — Create a free shared database (Neon)
1. Go to **https://neon.tech**, sign up free, click **Create a project**
   (name it `renewsite`)
2. Copy the **Connection string** from the dashboard — looks like:
   ```
   postgresql://alex:AbC123xyz@ep-cool-forest-12345.us-east-2.aws.neon.tech/renewsite?sslmode=require
   ```
   Keep this tab open, you'll paste it into Render in Step 3.

This one database is what makes it **shared** — every visitor to your hosted
app talks to this same Neon database, so everyone sees the same accounts and
sites (each user's own sites stay private to their own login, same as
locally — Neon just replaces the local SQLite file so it works across the
internet instead of only on your PC).

### Step 3 — Deploy the backend (Render)
1. Go to **https://render.com**, sign up free (you can sign up with GitHub)
2. Click **New +** → **Blueprint**, connect your `renewsite` GitHub repo —
   Render will detect the `render.yaml` file included in this project and
   pre-fill most settings
3. When it asks for the `DATABASE_URL` environment variable, paste your Neon
   connection string from Step 2
4. Click **Apply** / **Create**. First build takes a few minutes (it also
   trains the ML models automatically as part of the build)
5. Once it's live, copy your backend's public URL from the Render dashboard —
   looks like `https://renewsite-backend.onrender.com`

If you'd rather not use the blueprint: **New +** → **Web Service** → connect
the repo → set **Root Directory** to `backend` → **Build Command**:
`pip install -r requirements.txt && python -m app.ml.train_models` →
**Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` → add
`DATABASE_URL` (your Neon string) and `SECRET_KEY` (any long random string)
as environment variables.

### Step 4 — Deploy the frontend (Vercel)
1. Go to **https://vercel.com**, sign up free (with GitHub)
2. Click **Add New** → **Project**, import your `renewsite` GitHub repo
3. Set **Root Directory** to `frontend`
4. Under **Environment Variables**, add:
   ```
   VITE_API_BASE_URL = https://renewsite-backend.onrender.com/api/v1
   ```
   (your actual Render URL from Step 3, with `/api/v1` on the end)
5. Click **Deploy**

Vercel gives you a public URL like `https://renewsite-yourname.vercel.app` —
**that's the link you share with anyone**, they don't need to install
anything.

### Notes
- Render's free tier spins down after 15 minutes of inactivity and takes
  ~30-60 seconds to wake up on the next visit — normal for a free tier, not a
  bug. Neon's free tier behaves similarly (brief "cold start" after idle).
- Any time you push new code to GitHub's `main` branch, both Render and
  Vercel automatically redeploy — no manual re-upload needed.
- Keep your Neon connection string and Render `SECRET_KEY` private — don't
  commit them into GitHub. They only ever go into Render's/Vercel's
  environment variable settings in the dashboard, never into a file in the
  repo (the `.gitignore` already excludes `.env` files for this reason).

---

## 9. Notes & honest limitations

- **Live data sandboxing**: in network-restricted environments the app
  transparently uses its synthetic fallback (this is by design, not a bug —
  see `analysis.data_sources` in any response to check which was used). With
  normal internet access, it calls the real NASA POWER / Open-Meteo /
  Open-Elevation / Overpass APIs, all of which are free and require no API
  key.
- **ML training data** is synthetic-but-physically-grounded (see section 4) —
  swap in real measured data for production use.
- **Secondary database (MongoDB)** and **OAuth2 social login** from the
  original spec were scoped out to keep the delivered project focused and
  fully working end-to-end on SQLite + JWT; both are straightforward
  additions (SQLAlchemy already isolates the DB layer, and FastAPI has
  first-class OAuth2 support) if you need them.
- **Roles**: scoped to the four core operational roles (Renewable Energy
  Planner, GIS Analyst, Project Manager, Administrator). Investor and
  Government/Regulator were dropped to keep each dashboard tightly scoped to
  a real day-to-day workflow rather than diluting them — add a role back by
  extending `UserRole` in `backend/app/db/models.py` and building it a
  dashboard the same way the other four are built.
- **Revenue/CAPEX figures** use representative industry-average $/MW
  constants (`forecast_service.py`) — adjust these for your market.
