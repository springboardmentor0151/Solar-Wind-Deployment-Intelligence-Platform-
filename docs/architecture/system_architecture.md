# System Architecture (Milestone 1 slice)

The full spec architecture diagram has ~15 microservices. For an 8-week, 4-milestone
build, it's implemented as a modular monolith — one FastAPI app, cleanly
separated into modules that map 1:1 to the spec's microservices. This is what
real teams do before they actually need to split into microservices, and
it's realistic for the timeline.

## Layered view (what's built vs. the spec diagram)
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (React.js)                                     │
│  Login / Signup / Change Password → Projects → Sites      │
└───────────────────────┬───────────────────────────────────┘
│ REST (JSON, JWT bearer token)
┌───────────────────────▼───────────────────────────────────┐
│  API GATEWAY  =  FastAPI app entrypoint (backend/main.py)  │
│  - routing, CORS, JWT auth dependency, request validation  │
└───────────────────────┬───────────────────────────────────┘
│
┌───────────────────┼─────────────────────┬───────────────────┐
▼                   ▼                     ▼                   ▼
┌─────────┐      ┌───────────────┐    ┌──────────────────┐  ┌─────────────┐
│  User & │      │ Project & Site│    │  Environmental    │  │ (Milestone  │
│  Access │      │  Service      │    │  Data Service      │  │  2/3/4      │
│  Service │      │ (routers/     │    │ (routers/         │  │  modules    │
│(auth.py +│      │  projects.py, │    │  environmental.py)│  │  plug in    │
│routers/  │      │  sites.py)    │    │  → NASA POWER,     │  │  here —     │
│auth.py)  │      │               │    │  OpenWeather, OSM  │  │  models/,   │
│          │      │               │    │                    │  │  notebooks/)│
└────┬────┘      └───────┬───────┘    └─────────┬──────────┘  └─────────────┘
│                   │                      │
└───────────────────┴──────────┬───────────┘
▼
┌───────────────────────────────┐
│  PostgreSQL + PostGIS          │
│  (users, projects, sites,      │
│   environmental_readings)       │
└───────────────────────────────┘
│
┌───────────────────────────────┐
│  MongoDB (secondary store)       │
│  raw external API responses,     │
│  satellite metadata, logs          │
└───────────────────────────────┘

## Why PostgreSQL + PostGIS and MongoDB

- **PostgreSQL + PostGIS**: structured, relational data that needs geospatial
  queries — e.g. "find all sites within 5km of a substation". PostGIS adds a
  `geography` column type and spatial functions (`ST_DWithin`, etc.) directly
  usable from SQL/SQLAlchemy.
- **MongoDB**: unstructured/variable-shape data — raw JSON payloads pulled
  from NASA POWER / OpenWeather / Sentinel Hub, which have different schemas
  per provider and don't need relational joins.

## Auth flow (login / signup / change password)
Signup:  POST /auth/register {full_name, email, password, role}
→ password is hashed (bcrypt) before storage, never stored plain
Login:   POST /auth/login {username=email, password}
→ verifies hash, returns a JWT access token (expires in 60 min by default)
Change:  POST /auth/change-password {current_password, new_password}
→ requires a valid JWT (must already be logged in)
→ re-verifies current_password against the stored hash before allowing
the change (prevents an unattended session being used to hijack
the account by silently swapping the password)

## Tech stack decisions

| Layer | Choice | Reason |
|---|---|---|
| Backend | Python + FastAPI (managed with `uv`) | async, auto-generated OpenAPI docs, fast dependency resolution |
| Frontend | React.js | component-based, matches spec |
| Primary DB | PostgreSQL + PostGIS | relational + geospatial queries |
| Secondary DB | MongoDB | flexible schema for raw external API data |
| Auth | JWT (OAuth2 password flow) | stateless, standard for SPA + API |
| Containerization | Docker + docker-compose | reproducible local/dev environment |