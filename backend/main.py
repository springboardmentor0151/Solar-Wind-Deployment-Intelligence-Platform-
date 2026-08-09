

import hashlib
import hmac
import io
import csv
import json
import os
import sqlite3
import time
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from data_simulator import get_environmental_profile, profile_to_dict
from scoring import solar_potential, wind_potential, compute_site_score, energy_forecast, deployment_plan
from fpdf import FPDF


SECRET_KEY = "dev-secret-change-me-in-production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 12
DB_PATH = "platform.db"

ROLES = ["Renewable Energy Planner", "GIS Analyst", "Project Manager", "Administrator"]

bearer_scheme = HTTPBearer()

app = FastAPI(
    title="Solar & Wind Deployment Intelligence Platform",
    description="Core setup, auth, site management, and environmental/resource prediction engines.",
    version="0.2.0",
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])



def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return f"{salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, hash_hex = stored.split("$")
    except ValueError:
        return False
    salt = bytes.fromhex(salt_hex)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return hmac.compare_digest(dk.hex(), hash_hex)


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
       
        db.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL
            )
        """)
     
        db.execute("""
            CREATE TABLE IF NOT EXISTS sites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_id INTEGER NOT NULL,
                parent_project_id INTEGER,
                project_name TEXT NOT NULL,
                region TEXT,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                land_area_m2 REAL NOT NULL,
                land_ownership TEXT,
                existing_infrastructure TEXT,
                created_at TEXT NOT NULL,
                environmental_profile TEXT NOT NULL,
                solar_result TEXT NOT NULL,
                wind_result TEXT NOT NULL,
                score_result TEXT,
                forecast_result TEXT,
                deployment_result TEXT
            )
        """)
       
        for column, coltype in [
            ("existing_infrastructure", "TEXT"),
            ("score_result", "TEXT"),
            ("forecast_result", "TEXT"),
            ("deployment_result", "TEXT"),
            ("parent_project_id", "INTEGER"),
        ]:
            try:
                db.execute(f"ALTER TABLE sites ADD COLUMN {column} {coltype}")
            except sqlite3.OperationalError:
                pass  


init_db()


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str = Field(min_length=6)
    role: str = "Renewable Energy Planner"


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str


def create_token(user_id: int, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    with get_db() as db:
        row = db.execute("SELECT * FROM users WHERE id = ?", (payload["sub"],)).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return dict(row)


def require_role(*allowed_roles):
    
    def checker(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail=f"Requires one of roles: {allowed_roles}")
        return user
    return checker



@app.post("/api/auth/register", response_model=TokenResponse, tags=["1. Auth & RBAC"])
def register(req: RegisterRequest):
    if req.role not in ROLES:
        raise HTTPException(status_code=400, detail=f"role must be one of {ROLES}")
    with get_db() as db:
        existing = db.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        hashed = hash_password(req.password)
        cur = db.execute(
            "INSERT INTO users (full_name, email, hashed_password, role, created_at) VALUES (?, ?, ?, ?, ?)",
            (req.full_name, req.email, hashed, req.role, datetime.now(timezone.utc).isoformat()),
        )
        user_id = cur.lastrowid
    token = create_token(user_id, req.role)
    return TokenResponse(access_token=token, role=req.role, full_name=req.full_name)


@app.post("/api/auth/login", response_model=TokenResponse, tags=["1. Auth & RBAC"])
def login(req: LoginRequest):
    with get_db() as db:
        row = db.execute("SELECT * FROM users WHERE email = ?", (req.email,)).fetchone()
    if not row or not verify_password(req.password, row["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_token(row["id"], row["role"])
    return TokenResponse(access_token=token, role=row["role"], full_name=row["full_name"])


@app.get("/api/auth/me", tags=["1. Auth & RBAC"])
def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "full_name": user["full_name"], "email": user["email"], "role": user["role"]}



class SiteCreateRequest(BaseModel):
    project_name: str
    region: Optional[str] = ""
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    land_area_m2: float = Field(gt=0, description="Usable land area in square meters")
    existing_infrastructure: Optional[str] = ""
    land_ownership: Optional[str] = "Private"
    parent_project_id: Optional[int] = None


class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = ""

DEFAULT_TURBINE_COUNT = 3


def _row_to_site(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "parent_project_id": row["parent_project_id"],
        "project_name": row["project_name"],
        "region": row["region"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "land_area_m2": row["land_area_m2"],
        "land_ownership": row["land_ownership"],
        "existing_infrastructure": row["existing_infrastructure"],
        "created_at": row["created_at"],
        "environmental_profile": json.loads(row["environmental_profile"]),
        "solar": json.loads(row["solar_result"]),
        "wind": json.loads(row["wind_result"]),
        "score": json.loads(row["score_result"]) if row["score_result"] else None,
        "forecast": json.loads(row["forecast_result"]) if row["forecast_result"] else None,
        "deployment": json.loads(row["deployment_result"]) if row["deployment_result"] else None,
    }


def _run_full_pipeline(req: "SiteCreateRequest"):
   
    profile = get_environmental_profile(req.latitude, req.longitude, req.land_ownership)
    solar = solar_potential(req.land_area_m2, profile)
    wind = wind_potential(DEFAULT_TURBINE_COUNT, profile)
    score = compute_site_score(profile, solar, wind, req.existing_infrastructure)
    forecast = energy_forecast(solar, wind, score["recommended_technology"], profile)
    deployment = deployment_plan(req.land_area_m2, score["recommended_technology"], solar, wind)
    return profile, solar, wind, score, forecast, deployment


def _format_project_code(project_id: int) -> str:
    
    return f"PRJ-{project_id:04d}"


@app.post("/api/projects", tags=["2a. Projects"])
def create_project(req: ProjectCreateRequest, user: dict = Depends(get_current_user)):
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO projects (owner_id, name, description, created_at) VALUES (?, ?, ?, ?)",
            (user["id"], req.name, req.description, datetime.now(timezone.utc).isoformat()),
        )
        project_id = cur.lastrowid
        row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    result = dict(row)
    result["project_code"] = _format_project_code(result["id"])
    return result


@app.get("/api/projects", tags=["2a. Projects"])
def list_projects(user: dict = Depends(get_current_user)):
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM projects WHERE owner_id = ? ORDER BY id DESC", (user["id"],)
        ).fetchall()
        projects = []
        for row in rows:
            count = db.execute(
                "SELECT COUNT(*) as c FROM sites WHERE parent_project_id = ? AND owner_id = ?",
                (row["id"], user["id"]),
            ).fetchone()["c"]
            p = dict(row)
            p["site_count"] = count
            p["project_code"] = _format_project_code(p["id"])
            projects.append(p)
    return projects


@app.get("/api/projects/{project_id}", tags=["2a. Projects"])
def get_project(project_id: int, user: dict = Depends(get_current_user)):
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM projects WHERE id = ? AND owner_id = ?", (project_id, user["id"])
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        site_rows = db.execute(
            "SELECT * FROM sites WHERE parent_project_id = ? AND owner_id = ? ORDER BY id DESC",
            (project_id, user["id"]),
        ).fetchall()
    project = dict(row)
    project["project_code"] = _format_project_code(project["id"])
    project["sites"] = [_row_to_site(r) for r in site_rows]
    return project




@app.delete("/api/projects/{project_id}", tags=["2a. Projects"])
def delete_project(project_id: int, user: dict = Depends(get_current_user)):
   
    with get_db() as db:
        db.execute(
            "DELETE FROM sites WHERE parent_project_id = ? AND owner_id = ?", (project_id, user["id"])
        )
        db.execute("DELETE FROM projects WHERE id = ? AND owner_id = ?", (project_id, user["id"]))
    return {"deleted": True}


@app.post("/api/sites", tags=["2. Site Management"])
def create_site(req: SiteCreateRequest, user: dict = Depends(get_current_user)):

    profile, solar, wind, score, forecast, deployment = _run_full_pipeline(req)

    with get_db() as db:
        cur = db.execute(
            """INSERT INTO sites
               (owner_id, parent_project_id, project_name, region, latitude, longitude, land_area_m2,
                land_ownership, existing_infrastructure, created_at,
                environmental_profile, solar_result, wind_result,
                score_result, forecast_result, deployment_result)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user["id"], req.parent_project_id, req.project_name, req.region, req.latitude, req.longitude,
                req.land_area_m2, profile.land_ownership, req.existing_infrastructure,
                datetime.now(timezone.utc).isoformat(),
                json.dumps(profile_to_dict(profile)), json.dumps(solar), json.dumps(wind),
                json.dumps(score), json.dumps(forecast), json.dumps(deployment),
            ),
        )
        site_id = cur.lastrowid
        row = db.execute("SELECT * FROM sites WHERE id = ?", (site_id,)).fetchone()

    return _row_to_site(row)


@app.put("/api/sites/{site_id}", tags=["2. Site Management"])
def update_site(site_id: int, req: SiteCreateRequest, user: dict = Depends(get_current_user)):
    """Edits an existing site and re-runs every engine against the updated
    location/land area."""
    with get_db() as db:
        existing = db.execute(
            "SELECT id FROM sites WHERE id = ? AND owner_id = ?", (site_id, user["id"])
        ).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Site not found")

    profile, solar, wind, score, forecast, deployment = _run_full_pipeline(req)

    with get_db() as db:
        db.execute(
            """UPDATE sites SET
                 parent_project_id = ?, project_name = ?, region = ?, latitude = ?, longitude = ?,
                 land_area_m2 = ?, land_ownership = ?, existing_infrastructure = ?,
                 environmental_profile = ?, solar_result = ?, wind_result = ?,
                 score_result = ?, forecast_result = ?, deployment_result = ?
               WHERE id = ? AND owner_id = ?""",
            (
                req.parent_project_id, req.project_name, req.region, req.latitude, req.longitude,
                req.land_area_m2, profile.land_ownership, req.existing_infrastructure,
                json.dumps(profile_to_dict(profile)), json.dumps(solar), json.dumps(wind),
                json.dumps(score), json.dumps(forecast), json.dumps(deployment),
                site_id, user["id"],
            ),
        )
        row = db.execute("SELECT * FROM sites WHERE id = ?", (site_id,)).fetchone()

    return _row_to_site(row)


@app.get("/api/sites", tags=["2. Site Management"])
def list_sites(user: dict = Depends(get_current_user), project_id: Optional[int] = None):
    with get_db() as db:
        if project_id is not None:
            rows = db.execute(
                "SELECT * FROM sites WHERE owner_id = ? AND parent_project_id = ? ORDER BY id DESC",
                (user["id"], project_id),
            ).fetchall()
        else:
            rows = db.execute(
                "SELECT * FROM sites WHERE owner_id = ? ORDER BY id DESC", (user["id"],)
            ).fetchall()
    return [_row_to_site(r) for r in rows]


@app.get("/api/sites/{site_id}", tags=["2. Site Management"])
def get_site(site_id: int, user: dict = Depends(get_current_user)):
    with get_db() as db:
        row = db.execute("SELECT * FROM sites WHERE id = ? AND owner_id = ?", (site_id, user["id"])).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Site not found")
    return _row_to_site(row)


@app.delete("/api/sites/{site_id}", tags=["2. Site Management"])
def delete_site(site_id: int, user: dict = Depends(get_current_user)):
    with get_db() as db:
        db.execute("DELETE FROM sites WHERE id = ? AND owner_id = ?", (site_id, user["id"]))
    return {"deleted": True}


def build_pdf_report(site: dict) -> bytes:
    p = site["environmental_profile"]
    solar = site["solar"]
    wind = site["wind"]

    pdf = FPDF()
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 12, "Site Resource Assessment Report", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, f"Generated {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", ln=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(4)

    def section(title):
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_fill_color(230, 245, 238)
        pdf.cell(0, 9, title, ln=True, fill=True)
        pdf.set_font("Helvetica", "", 11)
        pdf.ln(1)

    def row(label, value):
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(70, 7, str(label))
        pdf.set_font("Helvetica", "", 11)
        pdf.cell(0, 7, str(value), ln=True)

    section("Project Details")
    row("Project Name:", site["project_name"])
    row("Region:", site["region"] or "Not specified")
    row("Coordinates:", f"{site['latitude']}, {site['longitude']}")
    row("Land Area:", f"{site['land_area_m2']:.0f} m2")
    row("Land Ownership:", site["land_ownership"] or "Unknown")
    row("Existing Infrastructure:", site["existing_infrastructure"] or "None reported")
    pdf.ln(3)

    section("Environmental Profile")
    row("Elevation:", f"{p['elevation_m']} m")
    row("Land Slope:", f"{p['land_slope_deg']} deg")
    row("Land Cover Type:", p["land_cover_type"])
    row("Avg Temperature:", f"{p['avg_temperature_c']} C")
    row("Annual Rainfall:", f"{p['annual_rainfall_mm']} mm")
    row("Distance to Road:", f"{p['distance_to_road_km']} km")
    row("Distance to Transmission Line:", f"{p['distance_to_transmission_km']} km")
    row("Distance to Substation:", f"{p['distance_to_substation_km']} km")
    row("Protected Zone:", "Yes" if p["in_protected_zone"] else "No")
    pdf.ln(3)

    section("Solar Resource Assessment")
    row("Annual Irradiance:", f"{solar['annual_irradiance_kwh_m2']} kWh/m2")
    row("Peak Sun Hours:", f"{solar['peak_sun_hours']} h/day")
    row("Capacity Factor:", f"{solar['capacity_factor_pct']}%")
    row("Expected Energy Output:", f"{solar['expected_energy_output_kwh_year']:,.0f} kWh/yr")
    pdf.ln(3)

    section("Wind Resource Assessment")
    row("Average Wind Speed:", f"{wind['average_wind_speed_ms']} m/s")
    row("Prevailing Wind Direction:", f"{p['wind_direction_compass']} ({p['wind_direction_deg']} deg)" if p['wind_direction_deg'] is not None else "Unknown")
    row("Wind Power Density:", f"{wind['wind_power_density_w_m2']} W/m2")
    row("Capacity Factor:", f"{wind['capacity_factor_pct']}%")
    row("Turbines Modeled:", wind["turbines_recommended"])
    row("Expected Annual Output:", f"{wind['expected_annual_energy_production_kwh']:,.0f} kWh/yr")

    score = site.get("score")
    forecast = site.get("forecast")
    deployment = site.get("deployment")

    if score:
        pdf.ln(3)
        section("Site Suitability Score")
        row("Overall Deployment Score:", f"{score['overall_deployment_score']} / 100")
        row("Suitability Category:", score["suitability_category"])
        row("Investment Priority:", score["investment_priority"])
        row("Recommended Technology:", score["recommended_technology"])
        row("  Renewable Resource (35%):", score["renewable_resource_score"])
        row("  Geographic Suitability (25%):", score["geographic_suitability_score"])
        row("  Infrastructure Accessibility (15%):", score["infrastructure_accessibility_score"])
        row("  Environmental Impact (15%):", score["environmental_impact_score"])
        row("  Economic Feasibility (10%):", score["economic_feasibility_score"])

    if forecast:
        pdf.ln(3)
        section("Energy Forecast")
        row("Annual Output (recommended tech):", f"{forecast['annual_output_kwh']:,.0f} kWh/yr")
        row("Equivalent Homes Powered:", forecast["homes_powered_equivalent"])

    if deployment:
        pdf.ln(3)
        section("Deployment Optimization")
        row("Estimated Installed Capacity:", f"{deployment['estimated_installed_capacity_kw']:,.0f} kW")
        row("Capacity if Land/Turbines Doubled:", f"{deployment['expanded_capacity_kw']:,.0f} kW")

    data_sources = p.get("data_sources")
    if data_sources:
        pdf.ln(3)
        section("Data Sources")
        for label, source in data_sources.items():
            row(f"{label}:", source)

    return bytes(pdf.output())


@app.get("/api/sites/{site_id}/resource-report", tags=["3. Resource Assessment Reports"])
def resource_report(site_id: int, fmt: str = "json", user: dict = Depends(get_current_user)):
    with get_db() as db:
        row = db.execute("SELECT * FROM sites WHERE id = ? AND owner_id = ?", (site_id, user["id"])).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Site not found")
    site = _row_to_site(row)

    if fmt == "pdf":
        pdf_bytes = build_pdf_report(site)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=site_{site_id}_resource_report.pdf"},
        )

    if fmt == "csv":
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(["Field", "Value"])
        flat = {
            "Project Name": site["project_name"],
            "Region": site["region"],
            "Latitude": site["latitude"],
            "Longitude": site["longitude"],
            "Land Area (m2)": site["land_area_m2"],
            "Land Ownership": site["land_ownership"],
            "Existing Infrastructure": site["existing_infrastructure"],
            "Elevation (m)": site["environmental_profile"]["elevation_m"],
            "Land Slope (deg)": site["environmental_profile"]["land_slope_deg"],
            "Land Cover Type": site["environmental_profile"]["land_cover_type"],
            "Solar - Annual Irradiance (kWh/m2)": site["solar"]["annual_irradiance_kwh_m2"],
            "Solar - Peak Sun Hours": site["solar"]["peak_sun_hours"],
            "Solar - Capacity Factor (%)": site["solar"]["capacity_factor_pct"],
            "Solar - Expected Output (kWh/yr)": site["solar"]["expected_energy_output_kwh_year"],
            "Wind - Avg Speed (m/s)": site["wind"]["average_wind_speed_ms"],
            "Wind - Direction": site["environmental_profile"]["wind_direction_compass"],
            "Wind - Power Density (W/m2)": site["wind"]["wind_power_density_w_m2"],
            "Wind - Capacity Factor (%)": site["wind"]["capacity_factor_pct"],
            "Wind - Expected Output (kWh/yr)": site["wind"]["expected_annual_energy_production_kwh"],
        }
        if site["score"]:
            flat.update({
                "Overall Deployment Score": site["score"]["overall_deployment_score"],
                "Suitability Category": site["score"]["suitability_category"],
                "Investment Priority": site["score"]["investment_priority"],
                "Recommended Technology": site["score"]["recommended_technology"],
            })
        if site["forecast"]:
            flat.update({
                "Annual Output - Recommended Tech (kWh/yr)": site["forecast"]["annual_output_kwh"],
                "Homes Powered (equivalent)": site["forecast"]["homes_powered_equivalent"],
            })
        if site["deployment"]:
            flat.update({
                "Estimated Installed Capacity (kW)": site["deployment"]["estimated_installed_capacity_kw"],
                "Capacity if Land/Turbines Doubled (kW)": site["deployment"]["expanded_capacity_kw"],
            })
        for k, v in flat.items():
            writer.writerow([k, v])
        buf.seek(0)
        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=site_{site_id}_resource_report.csv"},
        )

    return site


@app.get("/api/dashboard/summary", tags=["4. Dashboard"])
def dashboard_summary(user: dict = Depends(get_current_user)):
    with get_db() as db:
        rows = db.execute("SELECT * FROM sites WHERE owner_id = ?", (user["id"],)).fetchall()
    sites = [_row_to_site(r) for r in rows]
    if not sites:
        return {
            "total_sites": 0, "total_land_area_m2": 0, "sites_with_infrastructure": 0,
            "regions_covered": 0, "avg_deployment_score": 0, "by_category": {}, "top_sites": [],
        }

    total_land_area = sum(s["land_area_m2"] for s in sites)
    sites_with_infra = sum(
        1 for s in sites if s["existing_infrastructure"] and s["existing_infrastructure"].strip()
    )

    scored_sites = [s for s in sites if s["score"]]
    avg_score = (
        round(sum(s["score"]["overall_deployment_score"] for s in scored_sites) / len(scored_sites), 1)
        if scored_sites else 0
    )

    by_category = {}
    for s in scored_sites:
        cat = s["score"]["suitability_category"]
        by_category[cat] = by_category.get(cat, 0) + 1

    top_sites = sorted(scored_sites, key=lambda s: s["score"]["overall_deployment_score"], reverse=True)[:5]

    return {
        "total_sites": len(sites),
        "total_land_area_m2": round(total_land_area, 0),
        "sites_with_infrastructure": sites_with_infra,
        "regions_covered": len({s["region"] for s in sites if s["region"]}),
        "avg_deployment_score": avg_score,
        "by_category": by_category,
        "top_sites": [
            {
                "id": s["id"],
                "project_name": s["project_name"],
                "score": s["score"]["overall_deployment_score"],
                "category": s["score"]["suitability_category"],
                "recommended_technology": s["score"]["recommended_technology"],
                "investment_priority": s["score"]["investment_priority"],
            }
            for s in top_sites
        ],
    }

@app.get("/api/infrastructure-suggestion", tags=["2. Site Management"])
def suggest_infrastructure(latitude: float, longitude: float, user: dict = Depends(get_current_user)):
    profile = get_environmental_profile(latitude, longitude)
    road = profile.distance_to_road_km
    line = profile.distance_to_transmission_km
    sub = profile.distance_to_substation_km

    if sub <= 5 and road <= 3:
        suggestion = "Road + Grid Access"
    elif sub <= 5:
        suggestion = "Substation Nearby"
    elif line <= 5:
        suggestion = "Grid Connection"
    elif road <= 3:
        suggestion = "Road Access"
    else:
        suggestion = ""

    return {
        "suggested_infrastructure": suggestion,
        "distance_to_road_km": road,
        "distance_to_transmission_km": line,
        "distance_to_substation_km": sub,
    }

@app.get("/api/health", tags=["System"])
def health():
    return {"status": "ok", "time": time.time()}


@app.get("/", tags=["System"])
def root():
    return {
        "message": "Solar & Wind Deployment Intelligence Platform API",
        "docs": "/docs",
        "roles": ROLES,
        "scope": "Auth/RBAC, Site Management, Environmental Data Engine, Solar & Wind Prediction, Resource Reports",
    }
