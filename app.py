import os
import pickle
import math
import json
from datetime import datetime
import numpy as np
from flask import Flask, render_template_string, request, redirect, url_for, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///renewables.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ==============================================================================
# DATABASE MODELS
# ==============================================================================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='planner') # 'planner', 'analyst', 'manager', 'admin'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    region = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='Planned') # 'Planned', 'Under Analysis', 'Approved', 'Rejected'
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sites = db.relationship('Site', backref='project', lazy=True, cascade="all, delete-orphan")


class Site(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    region = db.Column(db.String(120), nullable=False)
    land_area = db.Column(db.Float, nullable=False) # Hectares
    elevation = db.Column(db.Float, nullable=False) # Meters
    land_ownership = db.Column(db.String(50), nullable=False) # 'Public', 'Private', 'Federal'
    
    distance_road = db.Column(db.Float, nullable=False) # km
    distance_transmission = db.Column(db.Float, nullable=False) # km
    distance_substation = db.Column(db.Float, nullable=False) # km
    
    status = db.Column(db.String(50), nullable=False, default='Pending') # 'Pending', 'Analyzed', 'Selected'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    environmental_data = db.relationship('EnvironmentalData', backref='site', uselist=False, cascade="all, delete-orphan")
    suitability_analysis = db.relationship('SuitabilityAnalysis', backref='site', uselist=False, cascade="all, delete-orphan")
    energy_forecasts = db.relationship('EnergyForecast', backref='site', lazy=True, cascade="all, delete-orphan")


class EnvironmentalData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    site_id = db.Column(db.Integer, db.ForeignKey('site.id'), nullable=False)
    solar_irradiance = db.Column(db.Float, nullable=False) # kWh/m2/day
    wind_speed = db.Column(db.Float, nullable=False) # m/s
    wind_direction = db.Column(db.Float, nullable=False) # degrees
    temperature = db.Column(db.Float, nullable=False) # Celsius
    rainfall = db.Column(db.Float, nullable=False) # mm
    cloud_cover = db.Column(db.Float, nullable=False) # %
    land_slope = db.Column(db.Float, nullable=False) # degrees
    vegetation_index = db.Column(db.Float, nullable=False) # NDVI (0.0 to 1.0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)


class SuitabilityAnalysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    site_id = db.Column(db.Integer, db.ForeignKey('site.id'), nullable=False)
    resource_score = db.Column(db.Float, nullable=False)
    geographic_score = db.Column(db.Float, nullable=False)
    infrastructure_score = db.Column(db.Float, nullable=False)
    environmental_score = db.Column(db.Float, nullable=False)
    economic_score = db.Column(db.Float, nullable=False)
    overall_score = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False) # 'Excellent', 'Highly Suitable', 'Moderately Suitable', 'Low Suitability', 'Unsuitable'
    recommendation = db.Column(db.Text, nullable=True)
    analyzed_at = db.Column(db.DateTime, default=datetime.utcnow)


class EnergyForecast(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    site_id = db.Column(db.Integer, db.ForeignKey('site.id'), nullable=False)
    technology = db.Column(db.String(20), nullable=False) # 'solar', 'wind', 'hybrid'
    annual_generation = db.Column(db.Float, nullable=False) # MWh
    capacity_factor = db.Column(db.Float, nullable=False) # %
    performance_ratio = db.Column(db.Float, nullable=False) # %
    revenue_est = db.Column(db.Float, nullable=False) # USD
    payback_period = db.Column(db.Float, nullable=False) # Years
    seasonal_data_json = db.Column(db.Text, nullable=False) # Monthly forecast JSON


class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=True)
    site_id = db.Column(db.Integer, db.ForeignKey('site.id'), nullable=True)
    alert_type = db.Column(db.String(50), nullable=False) # 'weather', 'suitability', 'risk', 'system'
    severity = db.Column(db.String(20), nullable=False) # 'info', 'warning', 'critical'
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ==============================================================================
# GEOGRAPHY SIMULATION & MACHINE LEARNING INFERENCE
# ==============================================================================

MODELS = {}
API_CALLS_LOG = [] # Simulated API logs

def log_api_call(source, endpoint, params, status_code=200):
    API_CALLS_LOG.append({
        'timestamp': datetime.utcnow().strftime('%H:%M:%S'),
        'source': source,
        'endpoint': endpoint,
        'params': str(params),
        'status_code': status_code
    })
    # Keep last 50 logs
    if len(API_CALLS_LOG) > 50:
        API_CALLS_LOG.pop(0)

def load_ml_models():
    paths = {
        'suit_model': 'instance/models/suitability_model.pkl',
        'suit_scaler': 'instance/models/suitability_scaler.pkl',
        'solar_model': 'instance/models/solar_model.pkl',
        'solar_scaler': 'instance/models/solar_scaler.pkl',
        'wind_model': 'instance/models/wind_model.pkl',
        'wind_scaler': 'instance/models/wind_scaler.pkl'
    }
    for name, path in paths.items():
        if os.path.exists(path):
            try:
                with open(path, 'rb') as f:
                    MODELS[name] = pickle.load(f)
            except Exception as e:
                print(f"Error loading {path}: {e}")
        else:
            print(f"Model file {path} not found. Using mathematical backup.")

def get_deterministic_profile(lat, lon):
    # Deterministic RNG based on lat/lon to ensure consistency
    seed = int(abs(lat * 100000 + lon * 100000)) % 10000000
    rng = np.random.default_rng(seed)
    
    # Elevation: mock SRTM
    elevation = float(np.clip(120.0 + 380.0 * np.sin(lat * 2.0) * np.cos(lon * 2.0) + rng.normal(0, 20), 5.0, 3200.0))
    
    # Slope: derived from topography
    land_slope = float(np.clip(abs(np.sin(lat * 5.0)) * 25.0 + rng.uniform(0.5, 6.0), 0.5, 45.0))
    
    # Proximities (OSM simulated)
    distance_road = float(rng.uniform(0.05, 15.0))
    distance_transmission = float(rng.uniform(0.1, 30.0))
    distance_substation = float(rng.uniform(0.2, 40.0))
    
    # Vegetation index (Sentinel-2 simulated)
    vegetation_index = float(np.clip(0.35 + 0.3 * np.cos(lat * 1.5) + rng.normal(0, 0.05), 0.05, 0.95))
    
    # Climate simulation (NASA POWER & OpenWeather simulated)
    base_temp = 34.0 - 0.45 * abs(lat) - 0.006 * elevation
    temperature = float(base_temp + rng.uniform(-3.0, 3.0))
    rainfall = float(np.clip(100.0 * (vegetation_index * 12.0) + rng.uniform(-100, 100), 20.0, 3000.0))
    cloud_cover = float(np.clip((rainfall / 3000.0) * 85.0 + rng.uniform(2.0, 20.0), 1.0, 99.0))
    
    insolation = 8.5 - 0.065 * abs(lat)
    solar_irradiance = float(np.clip(insolation * (1.0 - 0.55 * (cloud_cover / 100.0)) + rng.normal(0, 0.1), 1.2, 8.5))
    
    wind_baseline = 3.2 + 3.0 * (elevation / 1000.0)
    wind_speed = float(np.clip(wind_baseline + rng.uniform(0.0, 5.0), 1.2, 22.0))
    wind_direction = float(rng.uniform(0.0, 360.0))
    
    return {
        'elevation': elevation,
        'land_slope': land_slope,
        'distance_road': distance_road,
        'distance_transmission': distance_transmission,
        'distance_substation': distance_substation,
        'vegetation_index': vegetation_index,
        'temperature': temperature,
        'rainfall': rainfall,
        'cloud_cover': cloud_cover,
        'solar_irradiance': solar_irradiance,
        'wind_speed': wind_speed,
        'wind_direction': wind_direction
    }

def run_suitability_prediction(env, ownership):
    ownership_map = {'Public': 0, 'Private': 1, 'Federal': 2}
    ownership_val = ownership_map.get(ownership, 1)
    
    X = np.array([[
        env['solar_irradiance'],
        env['wind_speed'],
        env['elevation'],
        env['land_slope'],
        env['distance_road'],
        env['distance_transmission'],
        env['distance_substation'],
        env['vegetation_index'],
        ownership_val
    ]])
    
    res_score = 0.5 * (min(env['solar_irradiance'] / 7.0, 1.0) * 100) + 0.5 * (min(env['wind_speed'] / 12.0, 1.0) * 100)
    geo_score = max(0.0, (1.0 - min(env['land_slope'] / 25.0, 1.0)) * 100 - 5.0 * min(env['elevation'] / 2000.0, 1.0))
    infra_score = (
        0.4 * (1.0 - min(env['distance_road'] / 5.0, 1.0)) * 100 +
        0.3 * (1.0 - min(env['distance_transmission'] / 10.0, 1.0)) * 100 +
        0.3 * (1.0 - min(env['distance_substation'] / 15.0, 1.0)) * 100
    )
    env_score = (1.0 - env['vegetation_index']) * 100
    econ_score = 100.0 if ownership == 'Public' else 70.0 if ownership == 'Private' else 40.0
    
    subscores = {
        'resource': float(res_score),
        'geographic': float(geo_score),
        'infrastructure': float(infra_score),
        'environmental': float(env_score),
        'economic': float(econ_score)
    }
    
    if 'suit_model' in MODELS and 'suit_scaler' in MODELS:
        try:
            X_scaled = MODELS['suit_scaler'].transform(X)
            pred_cat = int(MODELS['suit_model'].predict(X_scaled)[0])
        except Exception as e:
            print(f"Error in model prediction: {e}")
            pred_cat = 2
    else:
        # Math calculation
        overall = 0.35 * res_score + 0.25 * geo_score + 0.15 * infra_score + 0.15 * env_score + 0.10 * econ_score
        if overall >= 85: pred_cat = 4
        elif overall >= 70: pred_cat = 3
        elif overall >= 50: pred_cat = 2
        elif overall >= 30: pred_cat = 1
        else: pred_cat = 0
        
    categories = {0: 'Unsuitable', 1: 'Low Suitability', 2: 'Moderately Suitable', 3: 'Highly Suitable', 4: 'Excellent'}
    return categories.get(pred_cat, 'Moderately Suitable'), subscores

def predict_capacity_factors(env):
    # Solar capacity factor
    X_sol = np.array([[env['solar_irradiance'], env['temperature'], env['cloud_cover'], env['land_slope']]])
    if 'solar_model' in MODELS and 'solar_scaler' in MODELS:
        try:
            X_scaled = MODELS['solar_scaler'].transform(X_sol)
            cf_solar = float(MODELS['solar_model'].predict(X_scaled)[0])
        except:
            cf_solar = float(np.clip(env['solar_irradiance'] * 4.2 * (1.0 - 0.004*max(0, env['temperature']-25.0)), 5.0, 35.0))
    else:
        cf_solar = float(np.clip(env['solar_irradiance'] * 4.2 * (1.0 - 0.004*max(0, env['temperature']-25.0)), 5.0, 35.0))
        
    # Wind capacity factor
    X_wind = np.array([[env['wind_speed'], env['elevation'], env['land_slope']]])
    if 'wind_model' in MODELS and 'wind_scaler' in MODELS:
        try:
            X_scaled = MODELS['wind_scaler'].transform(X_wind)
            cf_wind = float(MODELS['wind_model'].predict(X_scaled)[0])
        except:
            cf_wind = float(np.clip(env['wind_speed'] * 3.5 * np.exp(-env['elevation']/8400.0), 0.0, 55.0))
    else:
        cf_wind = float(np.clip(env['wind_speed'] * 3.5 * np.exp(-env['elevation']/8400.0), 0.0, 55.0))
        
    return cf_solar, cf_wind

# ==============================================================================
# APPLICATION SETUP
# ==============================================================================

with app.app_context():
    db.create_all()
    load_ml_models()

# Render utility
def render_page(title, content):
    # Basic legacy template support for tests and simple routes
    return render_template_string('''
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ title }}</title>
        <style>
            :root { --bg:#07111f; --panel:#101c2e; --accent:#22c55e; --accent2:#38bdf8; --text:#f8fafc; --muted:#94a3b8; --border:rgba(255,255,255,0.12); }
            * { box-sizing: border-box; }
            body {
                margin: 0; font-family: Arial, sans-serif; background: linear-gradient(135deg, var(--bg), #10213a 55%, #1d4ed8);
                color: var(--text); min-height: 100vh;
            }
            .shell { max-width: 1100px; margin: 0 auto; padding: 24px; }
            .topbar {
                display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border: 1px solid var(--border);
                border-radius: 16px; background: rgba(16,28,46,0.8); backdrop-filter: blur(10px); margin-bottom: 22px;
            }
            .brand { font-size: 1.2rem; font-weight: 700; }
            .nav a { color: var(--text); text-decoration: none; margin-left: 14px; padding: 8px 10px; border-radius: 999px; }
            .nav a:hover { background: rgba(56,189,248,0.14); }
            .card {
                background: linear-gradient(145deg, rgba(16,28,46,0.96), rgba(12,20,34,0.95)); border: 1px solid var(--border);
                border-radius: 22px; padding: 28px; box-shadow: 0 10px 35px rgba(0,0,0,0.28);
            }
            h1, h2 { margin-top: 0; }
            .hero { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; align-items: center; }
            .badge { display: inline-block; background: linear-gradient(90deg, var(--accent), var(--accent2)); color: #03210f; padding: 7px 12px; border-radius: 999px; font-weight: 700; font-size: 0.9rem; margin-bottom: 10px; }
            .muted { color: var(--muted); }
            .grid { display: grid; gap: 14px; }
            input, select, textarea, button {
                width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); margin-top: 8px; font-size: 1rem;
            }
            input, select, textarea { background: #0d1729; color: var(--text); }
            button {
                background: linear-gradient(90deg, var(--accent), var(--accent2)); color: #04131f; font-weight: 700; border: none; cursor: pointer;
            }
            button:hover { transform: translateY(-1px); }
            .panel { background: rgba(255,255,255,0.04); border: 1px solid var(--border); padding: 14px; border-radius: 14px; margin-top: 12px; }
            .pill { color: var(--accent2); font-weight: 700; }
            .project { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
            .project:last-child { border-bottom: none; }
            @media (max-width: 800px) { .hero { grid-template-columns: 1fr; } }
        </style>
    </head>
    <body>
        <div class="shell">
            <nav class="topbar">
                <div class="brand">🌞🌬️ Renewable Intelligence</div>
                <div class="nav">
                    <a href="/">Home</a>
                    {% if 'user_id' not in session %}
                    <a href="/register">Register</a>
                    <a href="/login">Login</a>
                    {% else %}
                    <a href="/dashboard">Dashboard</a>
                    <a href="/logout">Logout</a>
                    {% endif %}
                    <a href="/projects">Projects</a>
                </div>
            </nav>
            <div class="card">
                <h1>{{ title }}</h1>
                {{ content|safe }}
            </div>
        </div>
    </body>
    </html>
    ''', title=title, content=content)

# ==============================================================================
# FLASK WEB INTERFACE & USER ROUTES
# ==============================================================================

@app.route('/')
def home():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    content = '''
    <div class="hero">
        <div>
            <div class="badge">AI-powered deployment planning</div>
            <h2>Solar & Wind Deployment Intelligence Platform</h2>
            <p class="muted">Explore high-potential renewable sites with geospatial insight, weather awareness, and guided project planning in a single workspace.</p>
            <div class="grid" style="display: flex; gap: 10px; margin-top: 20px;">
                <a href="/register" style="flex: 1;"><button type="button">Create account</button></a>
                <a href="/login" style="flex: 1;"><button type="button" style="background: transparent; border: 1px solid var(--accent2); color: var(--accent2);">Sign in</button></a>
            </div>
        </div>
        <div style="text-align: center; font-size: 5rem;">🌞🌬️</div>
    </div>
    '''
    return render_page('Welcome', content)


@app.route('/register', methods=['GET', 'POST'])
def register():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        role = request.form.get('role', 'planner')

        if User.query.filter((User.username == username) | (User.email == email)).first():
            return 'User already exists', 400

        user = User(username=username, email=email, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        session['user_id'] = user.id
        session['username'] = user.username
        session['role'] = user.role
        return redirect(url_for('dashboard'))

    content = '''
    <div class="panel">
        <h2>Create account</h2>
        <form method="post">
            <input name="username" placeholder="Username" required>
            <input name="email" placeholder="Email" type="email" required>
            <input name="password" placeholder="Password" type="password" required>
            <div style="margin-top: 10px;">
                <label style="font-size: 0.9rem; color: var(--muted);">Select User Role:</label>
                <select name="role" style="margin-top: 4px;">
                    <option value="planner">Renewable Energy Planner</option>
                    <option value="analyst">GIS Analyst</option>
                    <option value="manager">Project Manager</option>
                    <option value="admin">Administrator</option>
                </select>
            </div>
            <button type="submit" style="margin-top: 18px;">Register</button>
        </form>
    </div>
    '''
    return render_page('Register', content)


@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form['username']).first()
        if user and user.check_password(request.form['password']):
            session['user_id'] = user.id
            session['username'] = user.username
            session['role'] = user.role
            return redirect(url_for('dashboard'))
        return 'Invalid credentials', 401

    content = '''
    <div class="panel">
        <h2>Login</h2>
        <form method="post">
            <input name="username" placeholder="Username" required>
            <input name="password" placeholder="Password" type="password" required>
            <button type="submit" style="margin-top: 18px;">Login</button>
        </form>
    </div>
    '''
    return render_page('Login', content)


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))


@app.route('/projects', methods=['GET', 'POST'])
def projects():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        project = Project(
            name=request.form['name'],
            region=request.form['region'],
            description=request.form['description'],
            status=request.form.get('status', 'Planned'),
            owner_id=session['user_id']
        )
        db.session.add(project)
        db.session.commit()
        
        # Check if the request is AJAX/API, return JSON
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.is_json:
            return jsonify({
                'id': project.id,
                'name': project.name,
                'region': project.region,
                'description': project.description,
                'status': project.status
            }), 201
            
        return redirect(url_for('projects'))

    projects_list = Project.query.filter_by(owner_id=session['user_id']).all()
    
    # Check if request wants JSON
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.is_json:
        return jsonify([{
            'id': p.id,
            'name': p.name,
            'region': p.region,
            'description': p.description,
            'status': p.status
        } for p in projects_list])

    form = '''
    <div class="panel">
        <h2>Create Project</h2>
        <form method="post">
            <input name="name" placeholder="Project name" required>
            <input name="region" placeholder="Region" required>
            <textarea name="description" placeholder="Description" required></textarea>
            <input name="status" placeholder="Status" value="Planned">
            <button type="submit">Save</button>
        </form>
    </div>
    <div class="panel">
        <h2>Your Projects</h2>
    '''
    for project in projects_list:
        form += f'<div class="project"><strong>{project.name}</strong> — {project.region} <span class="muted">({project.status})</span></div>'
    form += '</div>'
    return render_page('Projects', form)

# ==============================================================================
# REST API ENDPOINTS
# ==============================================================================

def build_dashboard_summary(user_id):
    projects = Project.query.filter_by(owner_id=user_id).all()
    project_ids = [project.id for project in projects]
    sites = Site.query.filter(Site.project_id.in_(project_ids)).all()

    suitability_summary = {
        'average_overall_score': 0.0,
        'category_breakdown': {},
        'top_sites': []
    }

    forecast_summary = {
        'total_generation_mwh': 0.0,
        'average_solar_capacity_factor': 0.0,
        'average_wind_capacity_factor': 0.0,
        'top_revenue_site': None
    }

    if sites:
        scored_sites = []
        solar_cf_values = []
        wind_cf_values = []
        total_generation = 0.0
        top_revenue = None

        for site in sites:
            suit = site.suitability_analysis
            if suit:
                scored_sites.append({
                    'id': site.id,
                    'name': site.name,
                    'score': float(suit.overall_score),
                    'category': suit.category
                })
                suitability_summary['category_breakdown'][suit.category] = suitability_summary['category_breakdown'].get(suit.category, 0) + 1

            for forecast in site.energy_forecasts:
                if forecast.technology == 'solar':
                    solar_cf_values.append(float(forecast.capacity_factor))
                elif forecast.technology == 'wind':
                    wind_cf_values.append(float(forecast.capacity_factor))
                total_generation += float(forecast.annual_generation)

                if not top_revenue or forecast.revenue_est > top_revenue['revenue_est']:
                    top_revenue = {
                        'site_name': site.name,
                        'technology': forecast.technology,
                        'revenue_est': float(forecast.revenue_est)
                    }

        suitability_summary['average_overall_score'] = round(sum(item['score'] for item in scored_sites) / len(scored_sites), 1) if scored_sites else 0.0
        suitability_summary['top_sites'] = sorted(scored_sites, key=lambda item: item['score'], reverse=True)[:3]
        forecast_summary['total_generation_mwh'] = round(total_generation, 1)
        forecast_summary['average_solar_capacity_factor'] = round(sum(solar_cf_values) / len(solar_cf_values), 1) if solar_cf_values else 0.0
        forecast_summary['average_wind_capacity_factor'] = round(sum(wind_cf_values) / len(wind_cf_values), 1) if wind_cf_values else 0.0
        forecast_summary['top_revenue_site'] = top_revenue

    optimization_recommendations = []
    ranked_sites = sorted(suitability_summary['top_sites'], key=lambda item: item['score'], reverse=True)
    for site in ranked_sites:
        optimization_recommendations.append({
            'site_name': site['name'],
            'category': site['category'],
            'score': site['score']
        })

    return {
        'project_count': len(projects),
        'site_count': len(sites),
        'suitability_summary': suitability_summary,
        'forecast_summary': forecast_summary,
        'optimization_recommendations': optimization_recommendations
    }


@app.route('/api/dashboard/summary')
def api_dashboard_summary():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    return jsonify(build_dashboard_summary(session['user_id']))


@app.route('/api/profile', methods=['GET', 'PUT'])
def api_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    if request.method == 'GET':
        return jsonify({
            'username': user.username,
            'email': user.email,
            'role': user.role
        })
        
    if request.method == 'PUT':
        data = request.get_json()
        new_username = data.get('username')
        new_email = data.get('email')
        new_password = data.get('password')
        
        # Check duplicate username
        if new_username and new_username != user.username:
            existing = User.query.filter_by(username=new_username).first()
            if existing:
                return jsonify({'error': 'Username already taken'}), 400
            user.username = new_username
            session['username'] = new_username
            
        # Check duplicate email
        if new_email and new_email != user.email:
            existing = User.query.filter_by(email=new_email).first()
            if existing:
                return jsonify({'error': 'Email already registered'}), 400
            user.email = new_email
            
        # Update password if provided
        if new_password and len(new_password) > 0:
            user.set_password(new_password)
            
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully', 'username': user.username, 'email': user.email})


@app.route('/api/projects', methods=['GET', 'POST'])
def api_projects():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    if request.method == 'POST':
        data = request.get_json() or request.form
        project = Project(
            name=data['name'],
            region=data['region'],
            description=data['description'],
            status=data.get('status', 'Planned'),
            owner_id=session['user_id']
        )
        db.session.add(project)
        db.session.commit()
        return jsonify({
            'id': project.id,
            'name': project.name,
            'region': project.region,
            'description': project.description,
            'status': project.status
        }), 201
        
    projects_list = Project.query.filter_by(owner_id=session['user_id']).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'region': p.region,
        'description': p.description,
        'status': p.status
    } for p in projects_list])


@app.route('/api/projects/<int:project_id>', methods=['GET', 'PUT', 'DELETE'])
def api_project_detail(project_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    project = Project.query.filter_by(id=project_id, owner_id=session['user_id']).first()
    if not project:
        return jsonify({'error': 'Project not found'}), 404
        
    if request.method == 'DELETE':
        db.session.delete(project)
        db.session.commit()
        return jsonify({'message': 'Project deleted'})
        
    if request.method == 'PUT':
        data = request.get_json()
        project.name = data.get('name', project.name)
        project.region = data.get('region', project.region)
        project.description = data.get('description', project.description)
        project.status = data.get('status', project.status)
        db.session.commit()
        
    # GET detail
    sites = Site.query.filter_by(project_id=project.id).all()
    return jsonify({
        'id': project.id,
        'name': project.name,
        'region': project.region,
        'description': project.description,
        'status': project.status,
        'sites': [{
            'id': s.id,
            'name': s.name,
            'latitude': s.latitude,
            'longitude': s.longitude,
            'status': s.status,
            'category': s.suitability_analysis.category if s.suitability_analysis else 'Pending',
            'overall_score': s.suitability_analysis.overall_score if s.suitability_analysis else 0
        } for s in sites]
    })


@app.route('/api/projects/<int:project_id>/optimize', methods=['GET', 'POST'])
def api_project_optimize(project_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    project = Project.query.filter_by(id=project_id, owner_id=session['user_id']).first()
    if not project:
        return jsonify({'error': 'Project not found'}), 404
        
    # Get parameters
    if request.method == 'POST':
        data = request.get_json() or {}
    else:
        data = request.args or {}
        
    target_capacity_mw = float(data.get('target_capacity_mw', 50.0))
    discount_rate = float(data.get('discount_rate', 8.0))
    tariff = float(data.get('tariff', 0.08)) # $/kWh
    storage_capacity_mwh = float(data.get('storage_capacity_mwh', 10.0))
    
    sites = Site.query.filter_by(project_id=project_id).all()
    if not sites:
        return jsonify({'error': 'No sites found for this project. Please register sites first.'}), 400
        
    results = []
    total_possible_capacity_mw = 0.0
    
    for site in sites:
        env = site.environmental_data
        suit = site.suitability_analysis
        if not env or not suit:
            continue
            
        forecasts = {f.technology: f for f in site.energy_forecasts}
        solar_cf = forecasts['solar'].capacity_factor if 'solar' in forecasts else 15.0
        wind_cf = forecasts['wind'].capacity_factor if 'wind' in forecasts else 20.0
        
        # Tech choice correlation
        corr = -0.5
        try:
            solar_seasonal = json.loads(forecasts['solar'].seasonal_data_json) if 'solar' in forecasts else [0.0]*12
            wind_seasonal = json.loads(forecasts['wind'].seasonal_data_json) if 'wind' in forecasts else [0.0]*12
            if len(solar_seasonal) == 12 and len(wind_seasonal) == 12:
                corr = float(np.corrcoef(solar_seasonal, wind_seasonal)[0, 1])
        except:
            pass
            
        # Select best technology
        solar_score = solar_cf * 1.5
        wind_score = wind_cf * 1.0
        
        if (solar_cf > 14.0 and wind_cf > 22.0) or (corr < -0.15 and solar_cf > 10.0 and wind_cf > 15.0):
            tech_choice = 'hybrid'
            site_capacity_mw = site.land_area * 0.55
            cf = 0.6 * solar_cf + 0.4 * wind_cf
            capex_per_mw = 1200000.0
        elif solar_score >= wind_score:
            tech_choice = 'solar'
            site_capacity_mw = site.land_area * 0.5
            cf = solar_cf
            capex_per_mw = 1000000.0
        else:
            tech_choice = 'wind'
            site_capacity_mw = site.land_area * 0.35
            cf = wind_cf
            capex_per_mw = 1400000.0
            
        total_possible_capacity_mw += site_capacity_mw
        
        # Initial CapEx (without storage)
        capex = site_capacity_mw * capex_per_mw
        annual_generation = site_capacity_mw * 8760 * (cf / 100.0)
        revenue = annual_generation * tariff * 1000.0 # MWh * 1000 * tariff = $
        opex = capex * 0.018
        net_revenue = revenue - opex
        
        # NPV over 25 years
        npv = -capex
        for t in range(1, 26):
            npv += net_revenue / ((1 + discount_rate / 100.0) ** t)
            
        # IRR calculation
        irr = 0.0
        if net_revenue > 0:
            low = -0.99
            high = 2.0
            for _ in range(50):
                mid = (low + high) / 2.0
                val = -capex
                for t in range(1, 26):
                    val += net_revenue / ((1 + mid) ** t)
                if val > 0:
                    low = mid
                else:
                    high = mid
            irr = low * 100.0
            
        payback = capex / net_revenue if net_revenue > 0 else 99.0
        
        irr_norm = min(max(irr, 0) / 20.0, 1.0) * 100.0
        ranking_score = 0.5 * suit.overall_score + 0.5 * irr_norm
        
        results.append({
            'site_id': site.id,
            'site_name': site.name,
            'tech_choice': tech_choice,
            'capacity_mw': site_capacity_mw,
            'cf': cf,
            'capex': capex,
            'annual_generation': annual_generation,
            'revenue': revenue,
            'opex': opex,
            'net_revenue': net_revenue,
            'npv': npv,
            'irr': irr,
            'payback': payback,
            'ranking_score': ranking_score,
            'suitability_score': suit.overall_score,
            'suitability_category': suit.category,
            'land_area': site.land_area
        })
        
    # Rank sites by score descending
    results.sort(key=lambda x: x['ranking_score'], reverse=True)
    
    # Selection algorithm to meet target capacity
    selected_sites = []
    accumulated_capacity_mw = 0.0
    
    for res in results:
        if accumulated_capacity_mw < target_capacity_mw:
            selected_sites.append(res)
            accumulated_capacity_mw += res['capacity_mw']
            
    # Pro-rate battery storage to selected sites
    total_selected_capacity_mw = sum(s['capacity_mw'] for s in selected_sites)
    
    for s in selected_sites:
        if total_selected_capacity_mw > 0:
            s_storage = storage_capacity_mwh * (s['capacity_mw'] / total_selected_capacity_mw)
        else:
            s_storage = 0.0
            
        s['allocated_storage_mwh'] = s_storage
        storage_capex = s_storage * 350000.0 # $350k per MWh
        
        # Update Capex and financial calculations
        s['capex'] += storage_capex
        s['opex'] = s['capex'] * 0.018
        s['net_revenue'] = s['revenue'] - s['opex']
        
        # Recalculate NPV & IRR with storage
        npv = -s['capex']
        for t in range(1, 26):
            npv += s['net_revenue'] / ((1 + discount_rate / 100.0) ** t)
        s['npv'] = npv
        
        irr = 0.0
        if s['net_revenue'] > 0:
            low = -0.99
            high = 2.0
            for _ in range(50):
                mid = (low + high) / 2.0
                val = -s['capex']
                for t in range(1, 26):
                    val += s['net_revenue'] / ((1 + mid) ** t)
                if val > 0:
                    low = mid
                else:
                    high = mid
            irr = low * 100.0
        s['irr'] = irr
        s['payback'] = s['capex'] / s['net_revenue'] if s['net_revenue'] > 0 else 99.0
        
    # Totals
    total_capex = sum(s['capex'] for s in selected_sites)
    total_revenue = sum(s['revenue'] for s in selected_sites)
    total_npv = sum(s['npv'] for s in selected_sites)
    avg_irr = float(np.mean([s['irr'] for s in selected_sites])) if selected_sites else 0.0
    total_generation = sum(s['annual_generation'] for s in selected_sites)
    avg_payback = total_capex / (total_revenue - (total_capex * 0.018)) if total_capex > 0 and (total_revenue - (total_capex * 0.018)) > 0 else 0.0
    
    # Phased expansion plan mapping
    phases = []
    if len(selected_sites) >= 1:
        phases.append({
            'phase': 'Phase 1: Foundation',
            'sites': [selected_sites[0]['site_name']],
            'capacity_mw': selected_sites[0]['capacity_mw'],
            'capex': selected_sites[0]['capex'],
            'timeline': 'Months 0 - 12'
        })
    if len(selected_sites) >= 2:
        phase2_sites = selected_sites[1:3]
        phases.append({
            'phase': 'Phase 2: Expansion',
            'sites': [s['site_name'] for s in phase2_sites],
            'capacity_mw': sum(s['capacity_mw'] for s in phase2_sites),
            'capex': sum(s['capex'] for s in phase2_sites),
            'timeline': 'Months 12 - 24'
        })
    if len(selected_sites) > 3:
        phase3_sites = selected_sites[3:]
        phases.append({
            'phase': 'Phase 3: Integration',
            'sites': [s['site_name'] for s in phase3_sites],
            'capacity_mw': sum(s['capacity_mw'] for s in phase3_sites),
            'capex': sum(s['capex'] for s in phase3_sites),
            'timeline': 'Months 24 - 36'
        })
        
    # Strategic text recommendation
    if selected_sites:
        top_site = selected_sites[0]
        recs = f"Based on our multi-factor optimization engine, we recommend a total deployment of **{total_selected_capacity_mw:.1f} MW** across **{len(selected_sites)} selected sites** out of {len(sites)} evaluated, with an estimated initial investment of **${total_capex:,.0f}**.\n\n"
        recs += f"**Site '{top_site['site_name']}'** is ranked as the #1 priority due to its outstanding suitability score ({top_site['suitability_score']:.1f}%) and projected IRR ({top_site['irr']:.1f}%). "
        
        techs_count = {}
        for s in selected_sites:
            techs_count[s['tech_choice']] = techs_count.get(s['tech_choice'], 0) + 1
            
        tech_summary = ", ".join([f"{count} {tech}" for tech, count in techs_count.items()])
        recs += f"The optimized technology configuration is: **{tech_summary}**. "
        
        if 'hybrid' in techs_count:
            recs += "Hybrid systems were chosen for their capability to utilize complementary seasonal profiles (summer solar & winter wind) and maintain stable grid output. "
            
        if storage_capacity_mwh > 0:
            recs += f"We have pro-rated **{storage_capacity_mwh:.1f} MWh** of battery storage capacity among the selected sites to smooth generation curves. "
            
        recs += f"\nThe overall project portfolio yields a strong Net Present Value (NPV) of **${total_npv:,.2f}** with an average IRR of **{avg_irr:.1f}%** and a payback period of **{avg_payback:.1f} years**."
    else:
        recs = "No sites could be selected. Please ensure sites are registered and have complete suitability data."
        
    return jsonify({
        'summary': {
            'total_capex': total_capex,
            'total_revenue': total_revenue,
            'total_npv': total_npv,
            'avg_irr': avg_irr,
            'total_generation': total_generation,
            'avg_payback': avg_payback,
            'target_capacity_mw': target_capacity_mw,
            'actual_capacity_mw': total_selected_capacity_mw,
            'storage_capacity_mwh': storage_capacity_mwh,
            'recommendations': recs
        },
        'ranked_sites': results,
        'selected_sites': selected_sites,
        'phases': phases
    })


@app.route('/api/sites', methods=['POST'])
def api_sites():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.get_json()
    project = Project.query.filter_by(id=data['project_id'], owner_id=session['user_id']).first()
    if not project:
        return jsonify({'error': 'Project not found or unauthorized'}), 404
        
    lat = float(data['latitude'])
    lon = float(data['longitude'])
    
    # 1. Simulate GIS and Climate attributes deteministically
    log_api_call('NASA POWER API', '/api/v1/climate', {'lat': lat, 'lon': lon})
    log_api_call('Global Wind Atlas', '/api/v1/wind', {'lat': lat, 'lon': lon})
    log_api_call('NASA SRTM DEM', '/api/v1/elevation', {'lat': lat, 'lon': lon})
    log_api_call('OpenStreetMap', '/api/v1/infrastructure', {'lat': lat, 'lon': lon})
    log_api_call('Copernicus Sentinel Hub', '/api/v1/landcover', {'lat': lat, 'lon': lon})
    
    env = get_deterministic_profile(lat, lon)
    
    # Create Site
    site = Site(
        project_id=project.id,
        name=data['name'],
        latitude=lat,
        longitude=lon,
        region=data.get('region', project.region),
        land_area=float(data.get('land_area', 10.0)),
        elevation=env['elevation'],
        land_ownership=data.get('land_ownership', 'Public'),
        distance_road=env['distance_road'],
        distance_transmission=env['distance_transmission'],
        distance_substation=env['distance_substation'],
        status='Analyzed'
    )
    db.session.add(site)
    db.session.flush() # Populate site ID
    
    # Create Environmental Data
    env_data = EnvironmentalData(
        site_id=site.id,
        solar_irradiance=env['solar_irradiance'],
        wind_speed=env['wind_speed'],
        wind_direction=env['wind_direction'],
        temperature=env['temperature'],
        rainfall=env['rainfall'],
        cloud_cover=env['cloud_cover'],
        land_slope=env['land_slope'],
        vegetation_index=env['vegetation_index']
    )
    db.session.add(env_data)
    
    # 2. Run Suitability Random Forest prediction
    category, subscores = run_suitability_prediction(env, site.land_ownership)
    overall_score = 0.35 * subscores['resource'] + 0.25 * subscores['geographic'] + 0.15 * subscores['infrastructure'] + 0.15 * subscores['environmental'] + 0.10 * subscores['economic']
    
    suitability = SuitabilityAnalysis(
        site_id=site.id,
        resource_score=subscores['resource'],
        geographic_score=subscores['geographic'],
        infrastructure_score=subscores['infrastructure'],
        environmental_score=subscores['environmental'],
        economic_score=subscores['economic'],
        overall_score=overall_score,
        category=category,
        recommendation=f"This site is categorized as {category}. Resources are rated at {subscores['resource']:.1f}/100, and infrastructure access is at {subscores['infrastructure']:.1f}/100."
    )
    db.session.add(suitability)
    
    # 3. Predict solar and wind capacity factors
    cf_solar, cf_wind = predict_capacity_factors(env)
    
    # Create Solar Forecast
    # Expected Annual Energy (MWh) = Area (hectares) * 10,000 m2/hectare * panel efficiency (20%) * Irradiance * 365 / 1000
    solar_capacity_mw = site.land_area * 0.5 # Rule of thumb: 0.5 MW per hectare
    solar_annual_mwh = solar_capacity_mw * 8760 * (cf_solar / 100.0)
    solar_revenue = solar_annual_mwh * 80.0 # $80 per MWh
    solar_cost = solar_capacity_mw * 1000000.0 # $1M per MW
    solar_payback = solar_cost / solar_revenue if solar_revenue > 0 else 99
    
    solar_seasonal = [float(cf_solar * (1.0 + 0.25 * math.sin(2 * math.pi * (m - 6) / 12))) for m in range(1, 13)]
    
    solar_forecast = EnergyForecast(
        site_id=site.id,
        technology='solar',
        annual_generation=solar_annual_mwh,
        capacity_factor=cf_solar,
        performance_ratio=80.0,
        revenue_est=solar_revenue,
        payback_period=solar_payback,
        seasonal_data_json=json.dumps(solar_seasonal)
    )
    db.session.add(solar_forecast)
    
    # Create Wind Forecast
    wind_capacity_mw = site.land_area * 0.35 # Rule of thumb: 0.35 MW per hectare
    wind_annual_mwh = wind_capacity_mw * 8760 * (cf_wind / 100.0)
    wind_revenue = wind_annual_mwh * 80.0 # $80 per MWh
    wind_cost = wind_capacity_mw * 1400000.0 # $1.4M per MW
    wind_payback = wind_cost / wind_revenue if wind_revenue > 0 else 99
    
    wind_seasonal = [float(cf_wind * (1.0 + 0.35 * math.cos(2 * math.pi * (m - 12) / 12))) for m in range(1, 13)]
    
    wind_forecast = EnergyForecast(
        site_id=site.id,
        technology='wind',
        annual_generation=wind_annual_mwh,
        capacity_factor=cf_wind,
        performance_ratio=90.0,
        revenue_est=wind_revenue,
        payback_period=wind_payback,
        seasonal_data_json=json.dumps(wind_seasonal)
    )
    db.session.add(wind_forecast)
    
    # 4. Generate Alerts based on Risk/Threshold Violations
    if env['land_slope'] > 25.0:
        db.session.add(Alert(
            project_id=project.id,
            site_id=site.id,
            alert_type='risk',
            severity='critical',
            message=f"Site {site.name} slope exceeds 25° ({env['land_slope']:.1f}°). High risk of erosion and construction difficulty."
        ))
    elif env['land_slope'] > 15.0:
        db.session.add(Alert(
            project_id=project.id,
            site_id=site.id,
            alert_type='risk',
            severity='warning',
            message=f"Site {site.name} slope is steep ({env['land_slope']:.1f}°). Construction will require grading."
        ))
        
    if env['wind_speed'] > 18.0:
        db.session.add(Alert(
            project_id=project.id,
            site_id=site.id,
            alert_type='weather',
            severity='critical',
            message=f"Site {site.name} exhibits extremely high average wind speeds ({env['wind_speed']:.1f} m/s). Extreme wind event risks."
        ))
        
    if env['vegetation_index'] > 0.8:
        db.session.add(Alert(
            project_id=project.id,
            site_id=site.id,
            alert_type='suitability',
            severity='warning',
            message=f"Site {site.name} has high NDVI forest density ({env['vegetation_index']:.2f}). Requires clearing, environmental impact report required."
        ))
        
    if overall_score < 40.0:
        db.session.add(Alert(
            project_id=project.id,
            site_id=site.id,
            alert_type='suitability',
            severity='warning',
            message=f"Site {site.name} has a low overall suitability score ({overall_score:.1f}%). Investment viability is questionable."
        ))

    db.session.commit()
    
    return jsonify({
        'id': site.id,
        'name': site.name,
        'latitude': site.latitude,
        'longitude': site.longitude,
        'overall_score': overall_score,
        'category': category
    }), 201


@app.route('/api/sites/<int:site_id>', methods=['GET', 'DELETE'])
def api_site_detail(site_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    site = Site.query.get(site_id)
    if not site:
        return jsonify({'error': 'Site not found'}), 404
        
    # Check project ownership
    project = Project.query.filter_by(id=site.project_id, owner_id=session['user_id']).first()
    if not project:
        return jsonify({'error': 'Unauthorized'}), 403
        
    if request.method == 'DELETE':
        db.session.delete(site)
        db.session.commit()
        return jsonify({'message': 'Site deleted'})
        
    # GET details
    env = site.environmental_data
    suit = site.suitability_analysis
    forecasts = {f.technology: {
        'annual_generation': f.annual_generation,
        'capacity_factor': f.capacity_factor,
        'performance_ratio': f.performance_ratio,
        'revenue_est': f.revenue_est,
        'payback_period': f.payback_period,
        'seasonal_data': json.loads(f.seasonal_data_json)
    } for f in site.energy_forecasts}
    
    return jsonify({
        'id': site.id,
        'name': site.name,
        'latitude': site.latitude,
        'longitude': site.longitude,
        'region': site.region,
        'land_area': site.land_area,
        'elevation': site.elevation,
        'land_ownership': site.land_ownership,
        'distance_road': site.distance_road,
        'distance_transmission': site.distance_transmission,
        'distance_substation': site.distance_substation,
        'environmental': {
            'solar_irradiance': env.solar_irradiance,
            'wind_speed': env.wind_speed,
            'wind_direction': env.wind_direction,
            'temperature': env.temperature,
            'rainfall': env.rainfall,
            'cloud_cover': env.cloud_cover,
            'land_slope': env.land_slope,
            'vegetation_index': env.vegetation_index
        } if env else None,
        'suitability': {
            'resource_score': suit.resource_score,
            'geographic_score': suit.geographic_score,
            'infrastructure_score': suit.infrastructure_score,
            'environmental_score': suit.environmental_score,
            'economic_score': suit.economic_score,
            'overall_score': suit.overall_score,
            'category': suit.category,
            'recommendation': suit.recommendation
        } if suit else None,
        'forecasts': forecasts
    })


@app.route('/api/recalculate-suitability/<int:site_id>', methods=['POST'])
def api_recalculate_suitability(site_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    site = Site.query.get(site_id)
    if not site:
        return jsonify({'error': 'Site not found'}), 404
        
    data = request.get_json()
    w_res = float(data.get('resource_weight', 35))
    w_geo = float(data.get('geographic_weight', 25))
    w_infra = float(data.get('infrastructure_weight', 15))
    w_env = float(data.get('environmental_weight', 15))
    w_econ = float(data.get('economic_weight', 10))
    
    total_w = w_res + w_geo + w_infra + w_env + w_econ
    if abs(total_w - 100.0) > 0.01:
        return jsonify({'error': 'Weights must sum to 100%'}), 400
        
    suit = site.suitability_analysis
    if not suit:
        return jsonify({'error': 'Suitability data missing'}), 400
        
    overall_score = (
        (w_res * suit.resource_score) +
        (w_geo * suit.geographic_score) +
        (w_infra * suit.infrastructure_score) +
        (w_env * suit.environmental_score) +
        (w_econ * suit.economic_score)
    ) / 100.0
    
    if overall_score >= 85: category = 'Excellent'
    elif overall_score >= 70: category = 'Highly Suitable'
    elif overall_score >= 50: category = 'Moderately Suitable'
    elif overall_score >= 30: category = 'Low Suitability'
    else: category = 'Unsuitable'
    
    suit.overall_score = overall_score
    suit.category = category
    suit.recommendation = f"Suitability recalculated with custom weights. Category: {category}. Overall score: {overall_score:.1f}%."
    db.session.commit()
    
    return jsonify({
        'overall_score': overall_score,
        'category': category,
        'recommendation': suit.recommendation
    })


@app.route('/api/alerts', methods=['GET'])
def api_alerts():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    # Get alerts for projects owned by this user
    user_projects = Project.query.filter_by(owner_id=session['user_id']).all()
    project_ids = [p.id for p in user_projects]
    
    alerts = Alert.query.filter(Alert.project_id.in_(project_ids)).order_by(Alert.created_at.desc()).all()
    return jsonify([{
        'id': a.id,
        'site_id': a.site_id,
        'alert_type': a.alert_type,
        'severity': a.severity,
        'message': a.message,
        'is_read': a.is_read,
        'created_at': a.created_at.strftime('%Y-%m-%d %H:%M')
    } for a in alerts])


@app.route('/api/alerts/<int:alert_id>/read', methods=['POST'])
def api_alert_read(alert_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({'error': 'Alert not found'}), 404
        
    alert.is_read = True
    db.session.commit()
    return jsonify({'message': 'Alert marked as read'})


@app.route('/api/admin/metrics', methods=['GET'])
def api_admin_metrics():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
        
    user_count = User.query.count()
    project_count = Project.query.count()
    site_count = Site.query.count()
    
    avg_suit = db.session.query(db.func.avg(SuitabilityAnalysis.overall_score)).scalar() or 0.0
    
    return jsonify({
        'users': user_count,
        'projects': project_count,
        'sites': site_count,
        'avg_suitability': round(float(avg_suit), 1),
        'api_logs': API_CALLS_LOG,
        'data_sources': [
            {'name': 'NASA POWER API', 'status': 'Online', 'type': 'Weather/Climate'},
            {'name': 'Global Wind Atlas', 'status': 'Online', 'type': 'Wind Resources'},
            {'name': 'NASA SRTM DEM', 'status': 'Online', 'type': 'Terrain Elevation'},
            {'name': 'OpenStreetMap', 'status': 'Online', 'type': 'Infrastructure Proximities'},
            {'name': 'Copernicus Sentinel Hub', 'status': 'Online', 'type': 'Land Cover'}
        ]
    })


@app.route('/api/users', methods=['GET'])
def api_users():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
        
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'role': u.role
    } for u in users])


@app.route('/api/users/<int:user_id>/role', methods=['POST'])
def api_user_role(user_id):
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    data = request.get_json()
    new_role = data.get('role')
    if new_role not in ['planner', 'analyst', 'manager', 'admin']:
        return jsonify({'error': 'Invalid role'}), 400
        
    user.role = new_role
    db.session.commit()
    return jsonify({'message': 'Role updated successfully'})


@app.route('/api/map-analysis', methods=['GET'])
def api_map_analysis():
    lat = float(request.args.get('lat', 0))
    lon = float(request.args.get('lon', 0))
    
    # Run deterministic simulation for ANY map point
    env = get_deterministic_profile(lat, lon)
    category, subscores = run_suitability_prediction(env, 'Public')
    overall_score = 0.35 * subscores['resource'] + 0.25 * subscores['geographic'] + 0.15 * subscores['infrastructure'] + 0.15 * subscores['environmental'] + 0.10 * subscores['economic']
    
    return jsonify({
        'latitude': lat,
        'longitude': lon,
        'elevation': env['elevation'],
        'land_slope': env['land_slope'],
        'solar_irradiance': env['solar_irradiance'],
        'wind_speed': env['wind_speed'],
        'distance_road': env['distance_road'],
        'distance_transmission': env['distance_transmission'],
        'overall_score': overall_score,
        'category': category
    })


@app.route('/api/export-site-report/<int:site_id>')
def api_export_site_report(site_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    site = Site.query.get(site_id)
    if not site:
        return 'Site not found', 404
        
    env = site.environmental_data
    suit = site.suitability_analysis
    forecasts = {f.technology: f for f in site.energy_forecasts}
    
    report_html = f'''
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Site Assessment Report: {site.name}</title>
        <style>
            body {{ font-family: 'Inter', sans-serif; color: #333; margin: 40px; line-height: 1.5; }}
            .header {{ border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }}
            .brand {{ font-weight: bold; font-size: 1.5rem; color: #10b981; }}
            h1 {{ margin-top: 10px; color: #111827; }}
            .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }}
            .card {{ border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; background: #f9fafb; }}
            .card h3 {{ margin-top: 0; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }}
            .score {{ font-size: 2.2rem; font-weight: bold; color: #10b981; }}
            .badge {{ display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.85rem; background: #d1fae5; color: #065f46; }}
            .metric {{ display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.95rem; }}
            .metric .label {{ color: #6b7280; }}
            .metric .val {{ font-weight: 500; color: #111827; }}
            .rec {{ background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 0 8px 8px 0; margin-bottom: 30px; }}
            button.print-btn {{ background: #10b981; color: white; border: none; padding: 10px 20px; font-size: 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; margin-bottom: 20px; }}
            @media print {{ button.print-btn {{ display: none; }} body {{ margin: 20px; }} }}
        </style>
    </head>
    <body>
        <button class="print-btn" onclick="window.print()">Print Report</button>
        <div class="header">
            <div class="brand">🌞🌬️ Renewable Intelligence Platform</div>
            <h1>Site Assessment Report: {site.name}</h1>
            <p>Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} | Site Coordinates: {site.latitude:.5f}, {site.longitude:.5f}</p>
        </div>
        
        <div class="rec">
            <h3>Executive Summary</h3>
            <p><strong>Overall Category:</strong> <span class="badge">{suit.category if suit else 'Pending'}</span></p>
            <p>{suit.recommendation if suit else 'No recommendation generated yet.'}</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>Geographic & Infrastructure Profile</h3>
                <div class="metric"><span class="label">Region</span><span class="val">{site.region}</span></div>
                <div class="metric"><span class="label">Land Area</span><span class="val">{site.land_area} Hectares</span></div>
                <div class="metric"><span class="label">Elevation</span><span class="val">{site.elevation:.1f} m</span></div>
                <div class="metric"><span class="label">Land Ownership</span><span class="val">{site.land_ownership}</span></div>
                <div class="metric"><span class="label">Distance to Roads</span><span class="val">{site.distance_road:.2f} km</span></div>
                <div class="metric"><span class="label">Distance to Transmission</span><span class="val">{site.distance_transmission:.2f} km</span></div>
                <div class="metric"><span class="label">Distance to Substation</span><span class="val">{site.distance_substation:.2f} km</span></div>
            </div>
            
            <div class="card">
                <h3>Environmental Resources</h3>
                <div class="metric"><span class="label">Solar Irradiance</span><span class="val">{env.solar_irradiance:.2f} kWh/m²/day</span></div>
                <div class="metric"><span class="label">Average Wind Speed</span><span class="val">{env.wind_speed:.2f} m/s</span></div>
                <div class="metric"><span class="label">Wind Direction</span><span class="val">{env.wind_direction:.1f}°</span></div>
                <div class="metric"><span class="label">Average Temperature</span><span class="val">{env.temperature:.1f} °C</span></div>
                <div class="metric"><span class="label">Annual Rainfall</span><span class="val">{env.rainfall:.1f} mm</span></div>
                <div class="metric"><span class="label">Average Cloud Cover</span><span class="val">{env.cloud_cover:.1f}%</span></div>
                <div class="metric"><span class="label">Land Slope</span><span class="val">{env.land_slope:.1f}°</span></div>
                <div class="metric"><span class="label">Vegetation Index (NDVI)</span><span class="val">{env.vegetation_index:.2f}</span></div>
            </div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>Suitability Breakdown</h3>
                <div class="metric"><span class="label">Resource Score (35%)</span><span class="val">{suit.resource_score:.1f}/100</span></div>
                <div class="metric"><span class="label">Geographic Score (25%)</span><span class="val">{suit.geographic_score:.1f}/100</span></div>
                <div class="metric"><span class="label">Infrastructure Score (15%)</span><span class="val">{suit.infrastructure_score:.1f}/100</span></div>
                <div class="metric"><span class="label">Environmental Score (15%)</span><span class="val">{suit.environmental_score:.1f}/100</span></div>
                <div class="metric"><span class="label">Economic Score (10%)</span><span class="val">{suit.economic_score:.1f}/100</span></div>
                <div style="text-align: center; margin-top: 15px;">
                    <div class="score">{suit.overall_score:.1f}%</div>
                    <div style="font-size:0.8rem; color:#6b7280;">Overall Weighted Suitability</div>
                </div>
            </div>
            
            <div class="card">
                <h3>Energy Potential & Economic Forecasts</h3>
                <h4 style="margin: 10px 0 5px 0; color:#111827;">Solar PV Option</h4>
                <div class="metric"><span class="label">Expected Generation</span><span class="val">{forecasts['solar'].annual_generation:.1f} MWh/yr</span></div>
                <div class="metric"><span class="label">Capacity Factor</span><span class="val">{forecasts['solar'].capacity_factor:.1f}%</span></div>
                <div class="metric"><span class="label">Est. Annual Revenue</span><span class="val">${forecasts['solar'].revenue_est:,.2f}</span></div>
                <div class="metric"><span class="label">Payback Period</span><span class="val">{forecasts['solar'].payback_period:.1f} Years</span></div>
                
                <h4 style="margin: 15px 0 5px 0; color:#111827;">Wind Turbine Option</h4>
                <div class="metric"><span class="label">Expected Generation</span><span class="val">{forecasts['wind'].annual_generation:.1f} MWh/yr</span></div>
                <div class="metric"><span class="label">Capacity Factor</span><span class="val">{forecasts['wind'].capacity_factor:.1f}%</span></div>
                <div class="metric"><span class="label">Est. Annual Revenue</span><span class="val">${forecasts['wind'].revenue_est:,.2f}</span></div>
                <div class="metric"><span class="label">Payback Period</span><span class="val">{forecasts['wind'].payback_period:.1f} Years</span></div>
            </div>
        </div>
        
        <div style="margin-top: 40px; font-size: 0.8rem; text-align: center; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            Solar & Wind Deployment Intelligence Platform. Confidential Report for Internal Planning Use Only.
        </div>
    </body>
    </html>
    '''
    return report_html

# ==============================================================================
# MAIN SPA INTERFACE ROUTE
# ==============================================================================

@app.route('/dashboard')
@app.route('/dashboard/<tab_name>')
def dashboard(tab_name='overview'):
    if 'user_id' not in session:
        return redirect(url_for('login'))

    username = session.get('username', 'User')
    role = session.get('role', 'planner')
    valid_tabs = {'overview', 'projects', 'gis', 'predictions', 'suitability', 'optimization', 'investment', 'alerts', 'reports', 'admin'}
    active_tab = tab_name if tab_name in valid_tabs else 'overview'
    tab_titles = {
        'overview': 'Overview Dashboard',
        'projects': 'Projects & Sites Console',
        'gis': 'GIS Analytics Console',
        'predictions': 'Resource Forecast Console',
        'suitability': 'Suitability Scoring Console',
        'optimization': 'Optimization Console',
        'investment': 'Financial Analysis Console',
        'alerts': 'Alerts & Notifications Console',
        'reports': 'Reports Export Console',
        'admin': 'System Admin Console',
    }
    tab_title = tab_titles.get(active_tab, 'Overview Dashboard')

    # SPA index page
    return render_template_string('''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Solar & Wind Deployment Intelligence Dashboard</title>
        
        <!-- Google Fonts -->
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Space+Grotesk:wght@400;600&display=swap" rel="stylesheet">
        
        <!-- Leaflet Map CSS -->
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        
        <!-- Premium Styling CSS -->
        <style>
            :root {
                --bg: #070c17;
                --panel: rgba(16, 26, 48, 0.65);
                --panel-solid: #0d1629;
                --accent-green: #10b981;
                --accent-cyan: #06b6d4;
                --accent-gold: #f59e0b;
                --accent-pink: #ec4899;
                --border: rgba(255, 255, 255, 0.08);
                --text: #f8fafc;
                --muted: #94a3b8;
                --shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
            }
            
            * {
                box-sizing: border-box;
                font-family: 'Outfit', sans-serif;
            }
            
            body {
                margin: 0;
                background: radial-gradient(circle at top right, #11203b, #070c17 60%);
                color: var(--text);
                min-height: 100vh;
                display: flex;
                overflow-x: hidden;
            }
            
            /* Layout Structure */
            .sidebar {
                width: 250px;
                border-right: 1px solid var(--border);
                background: rgba(10, 17, 33, 0.9);
                backdrop-filter: blur(16px);
                display: flex;
                flex-direction: column;
                height: 100vh;
                position: fixed;
                z-index: 100;
            }
            
            .main-content {
                margin-left: 250px;
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
                padding: 24px;
                overflow-y: auto;
            }
            
            /* Sidebar Menu */
            .brand {
                padding: 24px 20px;
                font-size: 1.3rem;
                font-weight: 800;
                letter-spacing: 0.5px;
                background: linear-gradient(90deg, var(--accent-green), var(--accent-cyan));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                border-bottom: 1px solid var(--border);
            }
            
            .nav-menu {
                padding: 20px 10px;
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            
            .nav-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 14px;
                border-radius: 12px;
                color: var(--muted);
                text-decoration: none;
                font-size: 1rem;
                font-weight: 600;
                transition: all 0.25s ease;
                cursor: pointer;
            }
            
            .nav-item:hover, .nav-item.active {
                color: var(--text);
                background: rgba(255, 255, 255, 0.05);
                box-shadow: inset 2px 0 0 var(--accent-cyan);
            }
            
            .nav-item.active {
                background: rgba(6, 182, 212, 0.12);
                color: var(--accent-cyan);
                box-shadow: inset 4px 0 0 var(--accent-cyan);
            }
            
            .user-profile {
                padding: 16px 20px;
                border-top: 1px solid var(--border);
                background: rgba(0,0,0,0.2);
            }
            
            .username {
                font-weight: 700;
                font-size: 0.95rem;
            }
            
            .user-role {
                font-size: 0.75rem;
                color: var(--accent-cyan);
                text-transform: uppercase;
                letter-spacing: 0.8px;
                margin-top: 2px;
                font-family: 'Space Grotesk', sans-serif;
            }
            
            /* Top Navigation Bar */
            .top-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                background: var(--panel);
                border: 1px solid var(--border);
                padding: 14px 20px;
                border-radius: 16px;
                backdrop-filter: blur(12px);
                box-shadow: var(--shadow);
            }
            
            .page-title h2 {
                margin: 0;
                font-size: 1.4rem;
                font-weight: 800;
            }
            
            .top-actions {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            
            .badge-role {
                background: rgba(16, 185, 129, 0.15);
                color: var(--accent-green);
                border: 1px solid rgba(16, 185, 129, 0.2);
                padding: 4px 10px;
                border-radius: 99px;
                font-size: 0.8rem;
                font-weight: 700;
            }
            
            .bell-container {
                position: relative;
                cursor: pointer;
            }
            
            .bell-icon {
                font-size: 1.3rem;
            }
            
            .bell-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: var(--accent-pink);
                color: white;
                font-size: 0.65rem;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }
            
            /* Cards & Panels */
            .glass-card {
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: 20px;
                padding: 24px;
                backdrop-filter: blur(16px);
                box-shadow: var(--shadow);
                margin-bottom: 24px;
                transition: all 0.3s ease;
            }
            
            .glass-card:hover {
                border-color: rgba(255,255,255,0.15);
            }
            
            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 18px;
            }
            
            .card-header h3 {
                margin: 0;
                font-size: 1.15rem;
                font-weight: 700;
                color: var(--text);
            }
            
            /* Grid Systems */
            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 20px;
                margin-bottom: 24px;
            }
            
            .stats-card {
                background: linear-gradient(135deg, rgba(22, 36, 64, 0.7), rgba(12, 20, 36, 0.8));
                border: 1px solid var(--border);
                padding: 20px;
                border-radius: 18px;
                box-shadow: var(--shadow);
            }
            
            .stats-val {
                font-size: 2.2rem;
                font-weight: 800;
                margin: 10px 0 5px 0;
            }
            
            .stats-label {
                color: var(--muted);
                font-size: 0.85rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            /* Lists, Tables, Details */
            table {
                width: 100%;
                border-collapse: collapse;
                text-align: left;
            }
            
            th {
                color: var(--muted);
                font-weight: 600;
                font-size: 0.85rem;
                text-transform: uppercase;
                padding: 12px 16px;
                border-bottom: 1px solid var(--border);
            }
            
            td {
                padding: 14px 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                font-size: 0.95rem;
            }
            
            tr:hover td {
                background: rgba(255, 255, 255, 0.02);
            }
            
            /* Controls & Inputs */
            select, input, textarea {
                width: 100%;
                padding: 11px 14px;
                background: rgba(7, 12, 23, 0.85);
                border: 1px solid var(--border);
                border-radius: 10px;
                color: var(--text);
                margin-top: 6px;
                font-size: 0.95rem;
                transition: border-color 0.25s;
            }
            
            select:focus, input:focus, textarea:focus {
                outline: none;
                border-color: var(--accent-cyan);
            }
            
            button {
                background: linear-gradient(90deg, var(--accent-green), var(--accent-cyan));
                color: #041224;
                font-weight: 700;
                border: none;
                padding: 12px 20px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 0.95rem;
                transition: all 0.2s ease;
            }
            
            button:hover {
                transform: translateY(-1.5px);
                box-shadow: 0 4px 12px rgba(6, 182, 212, 0.25);
            }
            
            /* Alert badges */
            .badge-severity {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 6px;
                font-weight: 700;
                font-size: 0.75rem;
                text-transform: uppercase;
            }
            
            .severity-critical { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
            .severity-warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
            .severity-info { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
            
            /* Tab Container animation */
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
                animation: fadeIn 0.4s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(6px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            /* Leaflet map styles */
            .leaflet-container {
                background: #08101f;
                font-family: inherit;
            }
            
            .site-popup h4 { margin: 0 0 5px 0; color: var(--text); }
            .site-popup p { margin: 3px 0; font-size: 0.85rem; color: var(--muted); }
            
            /* Slider layout */
            .slider-group {
                margin-bottom: 14px;
            }
            .slider-label {
                display: flex;
                justify-content: space-between;
                font-size: 0.85rem;
                color: var(--muted);
                margin-bottom: 4px;
            }
            .slider-label span.weight-val {
                color: var(--accent-cyan);
                font-weight: 700;
            }
            input[type="range"] {
                -webkit-appearance: none;
                background: rgba(255,255,255,0.1);
                height: 6px;
                border-radius: 99px;
            }
            input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                background: var(--accent-cyan);
                border-radius: 50%;
                cursor: pointer;
            }
        </style>
    </head>
    <body>
        <!-- SIDEBAR -->
        <div class="sidebar">
            <a href="/dashboard" style="text-decoration: none;"><div class="brand">🌞🌬️ RENEWABLE INTEL</div></a>
            <div class="nav-menu">
                <a class="nav-item{% if active_tab == 'overview' %} active{% endif %}" href="/dashboard/overview" onclick="event.preventDefault(); if (typeof window.switchTab === 'function') { window.switchTab('overview'); } else { window.location.href = '/dashboard/overview'; }">📊 Overview</a>
                <a class="nav-item{% if active_tab == 'projects' %} active{% endif %}" href="/dashboard/projects" onclick="event.preventDefault(); if (typeof window.switchTab === 'function') { window.switchTab('projects'); } else { window.location.href = '/dashboard/projects'; }">📁 Projects & Sites</a>
                
                {% if role == 'analyst' %}
                <a class="nav-item{% if active_tab == 'gis' %} active{% endif %}" href="/dashboard/gis" onclick="event.preventDefault(); if (typeof window.switchTab === 'function') { window.switchTab('gis'); } else { window.location.href = '/dashboard/gis'; }">🗺️ GIS Analytics</a>
                {% endif %}
                
                {% if role == 'planner' or role == 'analyst' %}
                <a class="nav-item{% if active_tab == 'predictions' %} active{% endif %}" href="/dashboard/predictions" onclick="event.preventDefault(); if (typeof window.switchTab === 'function') { window.switchTab('predictions'); } else { window.location.href = '/dashboard/predictions'; }">⚡ Resource Forecast</a>
                <a class="nav-item{% if active_tab == 'suitability' %} active{% endif %}" href="/dashboard/suitability" onclick="event.preventDefault(); if (typeof window.switchTab === 'function') { window.switchTab('suitability'); } else { window.location.href = '/dashboard/suitability'; }">🎯 Suitability Scoring</a>
                {% endif %}
                
                {% if role == 'planner' or role == 'manager' %}
                <a class="nav-item{% if active_tab == 'optimization' %} active{% endif %}" href="/dashboard/optimization" onclick="event.preventDefault(); if (typeof window.switchTab === 'function') { window.switchTab('optimization'); } else { window.location.href = '/dashboard/optimization'; }">🚀 Optimization</a>
                <a class="nav-item{% if active_tab == 'investment' %} active{% endif %}" href="/dashboard/investment" onclick="event.preventDefault(); if (typeof window.switchTab === 'function') { window.switchTab('investment'); } else { window.location.href = '/dashboard/investment'; }">💵 Financial Analysis</a>
                {% endif %}
                
                <a class="nav-item{% if active_tab == 'alerts' %} active{% endif %}" href="/dashboard/alerts" onclick="event.preventDefault(); if (typeof window.switchTab === 'function') { window.switchTab('alerts'); } else { window.location.href = '/dashboard/alerts'; }">🔔 Notifications</a>
                <a class="nav-item{% if active_tab == 'reports' %} active{% endif %}" href="/dashboard/reports" onclick="event.preventDefault(); if (typeof window.switchTab === 'function') { window.switchTab('reports'); } else { window.location.href = '/dashboard/reports'; }">📄 Reports Export</a>
                
                {% if role == 'admin' %}
                <a class="nav-item{% if active_tab == 'admin' %} active{% endif %}" href="/dashboard/admin" onclick="event.preventDefault(); if (typeof window.switchTab === 'function') { window.switchTab('admin'); } else { window.location.href = '/dashboard/admin'; }">⚙️ System Admin</a>
                {% endif %}
            </div>
            <div class="user-profile">
                <div class="username" id="sidebar-username">Welcome, {{ username }}</div>
                <div class="user-role">{{ role }}</div>
                <a href="/profile" style="color: var(--accent-cyan); font-size: 0.8rem; text-decoration: none; display: block; margin-top: 6px; cursor: pointer;">✏️ Edit Profile</a>
                <a href="/logout" style="color: var(--muted); font-size: 0.8rem; text-decoration: none; display: inline-block; margin-top: 6px;">Sign Out →</a>
            </div>
        </div>
        
        <!-- MAIN PANEL -->
        <div class="main-content">
            <!-- TOP BAR -->
            <div class="top-bar">
                <div class="page-title">
                    <h2 id="current-tab-title">{{ tab_title }}</h2>
                </div>
                <div class="top-actions">
                    <span class="badge-role">{{ role }} view</span>
                    <div class="bell-container" onclick="window.switchTab('alerts')">
                        <span class="bell-icon">🔔</span>
                        <span class="bell-badge" id="unread-alert-count">0</span>
                    </div>
                </div>
            </div>
            
            <!-- OVERVIEW TAB -->
            <div id="tab-overview" class="tab-content{% if active_tab == 'overview' %} active{% endif %}">
                <div class="dashboard-grid">
                    <div class="stats-card">
                        <div class="stats-label">Total Projects</div>
                        <div class="stats-val" id="stat-projects">0</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-label">Analyzed Sites</div>
                        <div class="stats-val" id="stat-sites">0</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-label">Avg Suitability</div>
                        <div class="stats-val" id="stat-avg-suit">0.0%</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-label">Active Alerts</div>
                        <div class="stats-val" id="stat-alerts" style="color: var(--accent-pink);">0</div>
                    </div>
                </div>
                
                <div class="glass-card">
                    <div class="card-header">
                        <h3>Global Site Coordinates Mapping</h3>
                    </div>
                    <div id="overview-map" style="height: 380px; border-radius: 12px; border: 1px solid var(--border);"></div>
                </div>
                
                <div class="glass-card">
                    <div class="card-header">
                        <h3>Recent Environmental Risks & Alerts</h3>
                    </div>
                    <div style="overflow-x: auto;">
                        <table id="recent-alerts-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Type</th>
                                    <th>Severity</th>
                                    <th>Message</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- dynamic content -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- PROJECTS TAB -->
            <div id="tab-projects" class="tab-content{% if active_tab == 'projects' %} active{% endif %}">
                <div style="display: grid; grid-template-columns: 320px 1fr; gap: 24px; align-items: start;">
                    <!-- LEFT COLUMN -->
                    <div style="display: flex; flex-direction: column; gap: 24px;">
                        <div class="glass-card">
                            <div class="card-header">
                                <h3>Create New Project</h3>
                            </div>
                            <form id="create-project-form" onsubmit="createProject(event)">
                                <input id="new-proj-name" placeholder="Project Name" required>
                                <input id="new-proj-region" placeholder="Region Name" required>
                                <textarea id="new-proj-desc" placeholder="Project Description..." style="height: 80px;" required></textarea>
                                <button type="submit" style="margin-top: 12px; width: 100%;">Create Project</button>
                            </form>
                        </div>
                        
                        <div class="glass-card">
                            <div class="card-header">
                                <h3>Your Projects</h3>
                            </div>
                            <div id="project-list" style="display: flex; flex-direction: column; gap: 10px;">
                                <!-- dynamic content -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- RIGHT COLUMN -->
                    <div class="glass-card" id="project-details-panel" style="display: none;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 18px;">
                            <div>
                                <h3 id="detail-proj-name" style="margin: 0; font-size: 1.4rem;">Project Name</h3>
                                <p id="detail-proj-desc" class="muted" style="margin: 6px 0 0 0;">Description</p>
                            </div>
                            <div style="width: 180px;">
                                <label style="font-size: 0.75rem; text-transform: uppercase; color: var(--muted); font-weight: 700;">Status</label>
                                <select id="detail-proj-status" onchange="updateProjectStatus()">
                                    <option value="Planned">Planned</option>
                                    <option value="Under Analysis">Under Analysis</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h4 style="margin: 0; font-size: 1.1rem;">Registered Evaluation Sites</h4>
                            <button onclick="openCreateSiteModal()">Add Site Registration</button>
                        </div>
                        
                        <div style="overflow-x: auto;">
                            <table id="project-sites-table">
                                <thead>
                                    <tr>
                                        <th>Site Name</th>
                                        <th>Coordinates</th>
                                        <th>Suitability Grade</th>
                                        <th>Score</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- dynamic content -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- GIS MAP TAB -->
            <div id="tab-gis" class="tab-content{% if active_tab == 'gis' %} active{% endif %}">
                <div style="display: grid; grid-template-columns: 1fr 340px; gap: 24px; height: calc(100vh - 160px);">
                    <div class="glass-card" style="padding: 0; position: relative; height: 100%;">
                        <div id="gis-interactive-map" style="height: 100%; border-radius: 20px;"></div>
                        <!-- Floating controls -->
                        <div style="position: absolute; top: 12px; right: 12px; z-index: 1000; background: rgba(10, 16, 30, 0.95); border: 1px solid var(--border); padding: 12px; border-radius: 12px; width: 220px; box-shadow: var(--shadow);">
                            <h4 style="margin: 0 0 8px 0; font-size: 0.9rem;">Map GIS Overlay Layers</h4>
                            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 0.85rem; cursor: pointer;">
                                <input type="radio" name="gis-layer" value="normal" checked onchange="toggleGISOverlay()" style="width: auto; margin:0;"> Normal Satellite View
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 0.85rem; cursor: pointer;">
                                <input type="radio" name="gis-layer" value="solar" onchange="toggleGISOverlay()" style="width: auto; margin:0;"> NASA Solar Irradiance Heatmap
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 0.85rem; cursor: pointer;">
                                <input type="radio" name="gis-layer" value="wind" onchange="toggleGISOverlay()" style="width: auto; margin:0;"> Wind Atlas Speed Heatmap
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 0.85rem; cursor: pointer;">
                                <input type="checkbox" id="infra-layer-check" onchange="toggleGISOverlay()" style="width: auto; margin:0;"> Show Power Infrastructure Lines
                            </label>
                        </div>
                    </div>
                    
                    <div class="glass-card" style="height: 100%; overflow-y: auto;">
                        <div class="card-header">
                            <h3>Point Analysis Console</h3>
                        </div>
                        <p class="muted" style="font-size: 0.85rem; margin-top: -10px;">Click anywhere on the map to trigger simulated telemetry fetch and suitability classification.</p>
                        
                        <div id="gis-analysis-result" style="display: flex; flex-direction: column; gap: 14px; margin-top: 18px;">
                            <div style="text-align: center; padding: 40px 10px; color: var(--muted);">
                                📍 Click Map Coordinate to Start Analysis
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- PREDICTIONS TAB -->
            <div id="tab-predictions" class="tab-content{% if active_tab == 'predictions' %} active{% endif %}">
                <div class="glass-card">
                    <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 12px;">
                        <h3 style="margin: 0;">Analyze Potential for Site:</h3>
                        <select id="predictions-site-selector" style="width: 250px; margin:0;" onchange="loadSitePredictions()">
                            <!-- dynamic content -->
                        </select>
                    </div>
                </div>
                
                <div id="predictions-analytics-container" style="display: none;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                        <!-- SOLAR POTENTIAL CARD -->
                        <div class="glass-card">
                            <div class="card-header" style="border-bottom: 1px solid var(--border); padding-bottom: 10px;">
                                <h3>🌞 Solar Potential Prediction Model</h3>
                            </div>
                            <div class="dashboard-grid" style="margin-top: 15px; grid-template-columns: 1fr 1fr;">
                                <div class="stats-card" style="padding: 12px; background: rgba(0,0,0,0.1);">
                                    <div class="stats-label" style="font-size:0.7rem;">Predicted Capacity Factor</div>
                                    <div class="stats-val" id="pred-sol-cf" style="font-size: 1.6rem;">0.0%</div>
                                </div>
                                <div class="stats-card" style="padding: 12px; background: rgba(0,0,0,0.1);">
                                    <div class="stats-label" style="font-size:0.7rem;">Annual Output Est</div>
                                    <div class="stats-val" id="pred-sol-out" style="font-size: 1.6rem;">0 MWh</div>
                                </div>
                            </div>
                            <div style="height: 240px; margin-top: 15px; position: relative;">
                                <canvas id="solar-seasonal-chart"></canvas>
                            </div>
                        </div>
                        
                        <!-- WIND POTENTIAL CARD -->
                        <div class="glass-card">
                            <div class="card-header" style="border-bottom: 1px solid var(--border); padding-bottom: 10px;">
                                <h3>🌬️ Wind Potential Prediction Model</h3>
                            </div>
                            <div class="dashboard-grid" style="margin-top: 15px; grid-template-columns: 1fr 1fr;">
                                <div class="stats-card" style="padding: 12px; background: rgba(0,0,0,0.1);">
                                    <div class="stats-label" style="font-size:0.7rem;">Predicted Capacity Factor</div>
                                    <div class="stats-val" id="pred-wind-cf" style="font-size: 1.6rem;">0.0%</div>
                                </div>
                                <div class="stats-card" style="padding: 12px; background: rgba(0,0,0,0.1);">
                                    <div class="stats-label" style="font-size:0.7rem;">Annual Output Est</div>
                                    <div class="stats-val" id="pred-wind-out" style="font-size: 1.6rem;">0 MWh</div>
                                </div>
                            </div>
                            <div style="height: 240px; margin-top: 15px; position: relative;">
                                <canvas id="wind-seasonal-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="predictions-empty" class="glass-card" style="text-align: center; padding: 60px 10px; color: var(--muted);">
                    📁 Please select a registered site above to load energy potential models.
                </div>
            </div>
            
            <!-- SUITABILITY SCORING TAB -->
            <div id="tab-suitability" class="tab-content{% if active_tab == 'suitability' %} active{% endif %}">
                <div class="glass-card">
                    <div style="display: flex; gap: 16px; align-items: center;">
                        <h3 style="margin: 0;">Analyze Suitability for Site:</h3>
                        <select id="suitability-site-selector" style="width: 250px; margin:0;" onchange="loadSiteSuitability()">
                            <!-- dynamic content -->
                        </select>
                    </div>
                </div>
                
                <div id="suitability-analytics-container" style="display: none; display: grid; grid-template-columns: 1fr 380px; gap: 24px;">
                    <!-- LEFT COLUMN -->
                    <div class="glass-card">
                        <div class="card-header" style="border-bottom:1px solid var(--border); padding-bottom:10px;">
                            <h3>Multi-Factor Scoring Model Analysis</h3>
                        </div>
                        
                        <div style="display: flex; justify-content: space-around; align-items: center; padding: 20px 0;">
                            <div style="text-align: center;">
                                <div class="stats-val" id="suit-overall-score" style="font-size: 3.5rem; color: var(--accent-green); margin:0;">0.0%</div>
                                <div style="font-size: 0.95rem; color: var(--muted); font-weight: 700; margin-top: 5px;">Weighted Deployment Index</div>
                            </div>
                            <div style="text-align: center;">
                                <div class="badge-role" id="suit-category-badge" style="font-size: 1.1rem; padding: 8px 18px; border-radius: 8px; background: rgba(6,182,212,0.12); color: var(--accent-cyan); border-color: rgba(6,182,212,0.3);">Highly Suitable</div>
                                <div style="font-size: 0.95rem; color: var(--muted); font-weight: 700; margin-top: 5px;">Suitability Grade</div>
                            </div>
                        </div>
                        
                        <div style="height: 280px; margin-top: 15px; position: relative; width: 100%;">
                            <canvas id="suitability-radar-chart"></canvas>
                        </div>
                    </div>
                    
                    <!-- RIGHT COLUMN: Weights tuner -->
                    <div class="glass-card">
                        <div class="card-header">
                            <h3>Scoring Weights Tuner</h3>
                        </div>
                        <p class="muted" style="font-size:0.85rem; margin-top:-10px;">Adjust weights representing project priorities. Total weights MUST sum to 100%.</p>
                        
                        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 15px;">
                            <div class="slider-group">
                                <div class="slider-label">
                                    <span>Resource Availability (Solar/Wind)</span>
                                    <span class="weight-val" id="val-w-res">35%</span>
                                </div>
                                <input type="range" id="slider-w-res" min="0" max="100" value="35" oninput="adjustWeights('res')">
                            </div>
                            
                            <div class="slider-group">
                                <div class="slider-label">
                                    <span>Geographic Suitability (Slope/Elevation)</span>
                                    <span class="weight-val" id="val-w-geo">25%</span>
                                </div>
                                <input type="range" id="slider-w-geo" min="0" max="100" value="25" oninput="adjustWeights('geo')">
                            </div>
                            
                            <div class="slider-group">
                                <div class="slider-label">
                                    <span>Infrastructure Accessibility (Roads/Grid)</span>
                                    <span class="weight-val" id="val-w-infra">15%</span>
                                </div>
                                <input type="range" id="slider-w-infra" min="0" max="100" value="15" oninput="adjustWeights('infra')">
                            </div>
                            
                            <div class="slider-group">
                                <div class="slider-label">
                                    <span>Environmental Impact Constraints (NDVI)</span>
                                    <span class="weight-val" id="val-w-env">15%</span>
                                </div>
                                <input type="range" id="slider-w-env" min="0" max="100" value="15" oninput="adjustWeights('env')">
                            </div>
                            
                            <div class="slider-group">
                                <div class="slider-label">
                                    <span>Economic Feasibility (Land Ownership)</span>
                                    <span class="weight-val" id="val-w-econ">10%</span>
                                </div>
                                <input type="range" id="slider-w-econ" min="0" max="100" value="10" oninput="adjustWeights('econ')">
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 15px; margin-top: 10px;">
                                <div style="font-size:0.9rem;">Total Weights Sum: <span id="weight-total" style="font-weight: 700; color: var(--accent-green);">100%</span></div>
                                <button id="recalculate-weights-btn" onclick="saveWeights()">Recalculate</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="suitability-empty" class="glass-card" style="text-align: center; padding: 60px 10px; color: var(--muted);">
                    🎯 Please select a registered site above to run suitability models.
                </div>
            </div>
            
            <!-- FINANCIAL ANALYSIS TAB -->
            <div id="tab-investment" class="tab-content{% if active_tab == 'investment' %} active{% endif %}">
                <div class="glass-card">
                    <div style="display: flex; gap: 16px; align-items: center;">
                        <h3 style="margin: 0;">Analyze Financials for Site:</h3>
                        <select id="investment-site-selector" style="width: 250px; margin:0;" onchange="loadSiteInvestment()">
                            <!-- dynamic content -->
                        </select>
                    </div>
                </div>
                
                <div id="investment-analytics-container" style="display: none; display: grid; grid-template-columns: 340px 1fr; gap: 24px; align-items: start;">
                    <!-- LEFT COLUMN -->
                    <div class="glass-card">
                        <div class="card-header">
                            <h3>Investment Parameters</h3>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            <div>
                                <label style="font-size: 0.8rem; color: var(--muted);">Technology Selection</label>
                                <select id="invest-tech-select" onchange="runFinancialProjections()">
                                    <option value="solar">Solar PV Plant</option>
                                    <option value="wind">Wind Farm</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 0.8rem; color: var(--muted);">Capital Cost ($/kW)</label>
                                <input type="number" id="invest-cap-cost" value="1000" min="200" max="5000" onchange="runFinancialProjections()">
                            </div>
                            <div>
                                <label style="font-size: 0.8rem; color: var(--muted);">Grid Tariff ($/kWh)</label>
                                <input type="number" id="invest-tariff" value="0.08" step="0.01" min="0.02" max="0.5" onchange="runFinancialProjections()">
                            </div>
                            
                            <div style="border-top:1px solid var(--border); padding-top: 15px; margin-top: 5px;">
                                <div class="metric" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem;">
                                    <span class="label" style="color:var(--muted);">Total Capital required:</span>
                                    <span class="val" id="invest-total-cap" style="font-weight:700;">$0.00</span>
                                </div>
                                <div class="metric" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem;">
                                    <span class="label" style="color:var(--muted);">Expected Revenue / yr:</span>
                                    <span class="val" id="invest-annual-rev" style="color:var(--accent-green); font-weight:700;">$0.00</span>
                                </div>
                                <div class="metric" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem;">
                                    <span class="label" style="color:var(--muted);">Payback Period:</span>
                                    <span class="val" id="invest-payback" style="color:var(--accent-cyan); font-weight:700;">0.0 Years</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- RIGHT COLUMN -->
                    <div class="glass-card">
                        <div class="card-header">
                            <h3>25-Year Cumulative Cash Flow Projection</h3>
                        </div>
                        <div style="height: 320px; position: relative;">
                            <canvas id="invest-cashflow-chart"></canvas>
                        </div>
                    </div>
                </div>
                
                <div id="investment-empty" class="glass-card" style="text-align: center; padding: 60px 10px; color: var(--muted);">
                    💵 Please select a registered site above to run investment forecasting.
                </div>
            </div>
            
            <!-- OPTIMIZATION TAB -->
            <div id="tab-optimization" class="tab-content{% if active_tab == 'optimization' %} active{% endif %}">
                <div class="glass-card">
                    <div style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <h3 style="margin: 0; white-space: nowrap;">Optimize Project:</h3>
                            <select id="optimize-project-selector" style="width: 250px; margin:0;" onchange="loadProjectOptimization()">
                                <!-- dynamic content -->
                            </select>
                        </div>
                    </div>
                </div>
                
                <div id="optimization-analytics-container" style="display: none; grid-template-columns: 360px 1fr; gap: 24px; align-items: start;">
                    <!-- LEFT COLUMN: INPUT PARAMETERS -->
                    <div class="glass-card">
                        <div class="card-header">
                            <h3>Optimization Parameters</h3>
                        </div>
                        <p class="muted" style="font-size:0.85rem; margin-top:-10px;">Adjust settings to run the multi-factor deployment planner.</p>
                        
                        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 15px;">
                            <div class="slider-group">
                                <div class="slider-label">
                                    <span>Target Portfolio Capacity</span>
                                    <span class="weight-val" id="val-opt-target">50 MW</span>
                                </div>
                                <input type="range" id="slider-opt-target" min="5" max="300" value="50" oninput="document.getElementById('val-opt-target').innerText = this.value + ' MW'">
                            </div>
                            
                            <div class="slider-group">
                                <div class="slider-label">
                                    <span>Discount Rate (25-Yr NPV)</span>
                                    <span class="weight-val" id="val-opt-discount">8.0%</span>
                                </div>
                                <input type="range" id="slider-opt-discount" min="10" max="200" value="80" oninput="document.getElementById('val-opt-discount').innerText = (this.value / 10.0).toFixed(1) + '%'">
                            </div>
                            
                            <div class="slider-group">
                                <div class="slider-label">
                                    <span>Power Purchase Tariff</span>
                                    <span class="weight-val" id="val-opt-tariff">$0.08 / kWh</span>
                                </div>
                                <input type="range" id="slider-opt-tariff" min="2" max="25" value="8" oninput="document.getElementById('val-opt-tariff').innerText = '$' + (this.value / 100.0).toFixed(2) + ' / kWh'">
                            </div>
                            
                            <div class="slider-group">
                                <div class="slider-label">
                                    <span>Battery Storage Capacity</span>
                                    <span class="weight-val" id="val-opt-storage">10 MWh</span>
                                </div>
                                <input type="range" id="slider-opt-storage" min="0" max="100" value="10" oninput="document.getElementById('val-opt-storage').innerText = this.value + ' MWh'">
                            </div>
                            
                            <button id="run-optimization-btn" onclick="runOptimization()" style="margin-top: 10px; width: 100%; padding: 12px; background: linear-gradient(90deg, var(--accent-green), var(--accent-cyan)); border: none; font-weight: 700; border-radius: 8px; cursor: pointer; color: white;">🚀 Run Deployment Planner</button>
                        </div>
                    </div>
                    
                    <!-- RIGHT COLUMN: RESULTS -->
                    <div style="display: flex; flex-direction: column; gap: 24px; width: 100%;">
                        <!-- TOP METRIC CARDS -->
                        <div class="dashboard-grid" style="grid-template-columns: repeat(4, 1fr); margin:0;">
                            <div class="stats-card">
                                <div class="stats-label">Portfolio CapEx</div>
                                <div class="stats-val" id="opt-metric-capex" style="font-size: 1.5rem;">$0</div>
                            </div>
                            <div class="stats-card">
                                <div class="stats-label">Projected NPV</div>
                                <div class="stats-val" id="opt-metric-npv" style="font-size: 1.5rem; color: var(--accent-green);">$0</div>
                            </div>
                            <div class="stats-card">
                                <div class="stats-label">Average IRR</div>
                                <div class="stats-val" id="opt-metric-irr" style="font-size: 1.5rem; color: var(--accent-cyan);">0.0%</div>
                            </div>
                            <div class="stats-card">
                                <div class="stats-label">Payback Period</div>
                                <div class="stats-val" id="opt-metric-payback" style="font-size: 1.5rem; color: var(--accent-gold);">0.0 Yrs</div>
                            </div>
                        </div>
                        
                        <!-- TABULAR SITES RANKING -->
                        <div class="glass-card">
                            <div class="card-header">
                                <h3>Optimized Deployment Configuration</h3>
                            </div>
                            <div style="overflow-x: auto; margin-top: 10px;">
                                <table id="optimization-sites-table" style="width: 100%; text-align: left; border-collapse: collapse;">
                                    <thead>
                                        <tr style="border-bottom: 1px solid var(--border); color: var(--muted); font-size:0.85rem;">
                                            <th style="padding: 10px;">Rank</th>
                                            <th style="padding: 10px;">Site Name</th>
                                            <th style="padding: 10px;">Tech Selection</th>
                                            <th style="padding: 10px;">Allocated MW</th>
                                            <th style="padding: 10px;">Pro-rated Storage</th>
                                            <th style="padding: 10px;">Estimated Capex</th>
                                            <th style="padding: 10px;">IRR</th>
                                            <th style="padding: 10px;">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- dynamic content -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- EXPANSION TIMELINE AND REC -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                            <div class="glass-card">
                                <div class="card-header">
                                    <h3>Phased Expansion Timeline</h3>
                                </div>
                                <div id="optimization-phased-plan" style="margin-top: 12px; display: flex; flex-direction: column; gap: 14px;">
                                    <!-- dynamic timeline content -->
                                </div>
                            </div>
                            <div class="glass-card">
                                <div class="card-header">
                                    <h3>Strategic Investment Recommendation</h3>
                                </div>
                                <div id="optimization-strategic-rec" style="font-size: 0.9rem; line-height: 1.6; margin-top: 12px; color: var(--muted);">
                                    <!-- dynamic text recommendations -->
                                </div>
                            </div>
                        </div>

                        <!-- VISUAL CHART -->
                        <div class="glass-card">
                            <div class="card-header">
                                <h3>Phase-wise Capital Allocation & Portfolio Cumulative NPV</h3>
                            </div>
                            <div style="height: 280px; position: relative;">
                                <canvas id="optimization-chart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="optimization-empty" class="glass-card" style="text-align: center; padding: 60px 10px; color: var(--muted);">
                    🚀 Please select a project above to run deployment optimization.
                </div>
            </div>
            
            <!-- ALERTS TAB -->
            <div id="tab-alerts" class="tab-content{% if active_tab == 'alerts' %} active{% endif %}">
                <div class="glass-card">
                    <div class="card-header">
                        <h3>Site Alerts & Notifications Dashboard</h3>
                        <div style="display:flex; gap:8px;">
                            <button onclick="loadAlerts('all')" style="padding: 6px 12px; font-size: 0.8rem; background: rgba(255,255,255,0.05); color: var(--text);">All Alerts</button>
                            <button onclick="loadAlerts('unread')" style="padding: 6px 12px; font-size: 0.8rem; background: var(--accent-cyan); color: #041224;">Unread Only</button>
                        </div>
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table id="full-alerts-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Alert Type</th>
                                    <th>Severity</th>
                                    <th>Message</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- dynamic content -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- REPORTS TAB -->
            <div id="tab-reports" class="tab-content{% if active_tab == 'reports' %} active{% endif %}">
                <div class="glass-card">
                    <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin: 0;">Export Assessment for Site:</h3>
                        <select id="reports-site-selector" style="width: 250px; margin:0;">
                            <!-- dynamic content -->
                        </select>
                        <button onclick="exportSiteReport()">Open Printable Report</button>
                    </div>
                </div>
                
                <div class="glass-card" style="text-align:center; padding: 50px 10px;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📄</div>
                    <h3>Print-Ready PDF Reports & Excel CSV Export</h3>
                    <p class="muted" style="max-width: 500px; margin: 0 auto 20px auto; font-size:0.9rem;">
                        Assessments generate layout sheets for client hand-offs, construction plans, and government feasibility hearings.
                    </p>
                    <button onclick="exportSitesCSV()" style="background:transparent; border: 1px solid var(--accent-cyan); color: var(--accent-cyan);">Download Sites Comparison (CSV)</button>
                </div>
            </div>
            
            <!-- SYSTEM ADMIN TAB -->
            <div id="tab-admin" class="tab-content{% if active_tab == 'admin' %} active{% endif %}">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <!-- LEFT COLUMN -->
                    <div style="display:flex; flex-direction:column; gap:24px;">
                        <div class="glass-card">
                            <div class="card-header">
                                <h3>Data Source Integrations</h3>
                            </div>
                            <div style="overflow-x: auto;">
                                <table id="admin-sources-table">
                                    <thead>
                                        <tr>
                                            <th>API Source</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- dynamic content -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="glass-card">
                            <div class="card-header">
                                <h3>Recent Simulated API Logs</h3>
                            </div>
                            <div style="overflow-x: auto;">
                                <table id="admin-logs-table">
                                    <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>Service</th>
                                            <th>Endpoint</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- dynamic content -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- RIGHT COLUMN: Users manager -->
                    <div class="glass-card">
                        <div class="card-header">
                            <h3>User Role Manager</h3>
                        </div>
                        <div style="overflow-x: auto;">
                            <table id="admin-users-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Active Role</th>
                                        <th>Update Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- dynamic content -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- EDIT PROFILE MODAL -->
        <div id="edit-profile-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 1000; align-items: center; justify-content: center;">
            <div class="glass-card" style="width: 400px; max-width: 90%; background: var(--panel-solid);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 18px;">
                    <h3 style="margin: 0;">Edit User Profile</h3>
                    <span onclick="closeEditProfileModal()" style="font-size: 1.5rem; cursor: pointer; color: var(--muted);">&times;</span>
                </div>
                
                <form id="edit-profile-form" onsubmit="updateProfile(event)">
                    <div>
                        <label style="font-size: 0.8rem; color: var(--muted); display: block; margin-bottom: 4px;">Username</label>
                        <input id="profile-username" placeholder="New username" style="width:100%; padding:10px; margin-bottom:12px;" required>
                    </div>
                    <div>
                        <label style="font-size: 0.8rem; color: var(--muted); display: block; margin-bottom: 4px;">Email Address</label>
                        <input id="profile-email" type="email" placeholder="New email" style="width:100%; padding:10px; margin-bottom:12px;" required>
                    </div>
                    <div>
                        <label style="font-size: 0.8rem; color: var(--muted); display: block; margin-bottom: 4px;">New Password (leave blank to keep current)</label>
                        <input id="profile-password" type="password" placeholder="New password" style="width:100%; padding:10px; margin-bottom:12px;">
                    </div>
                    <div style="margin-top: 15px;">
                        <button type="submit" style="width: 100%; padding: 12px; background: linear-gradient(90deg, var(--accent-green), var(--accent-cyan)); border: none; font-weight: 700; border-radius: 8px; cursor: pointer; color: white;">Save Profile Changes</button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- CREATE SITE MODAL -->
        <div id="create-site-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 1000; align-items: center; justify-content: center;">
            <div class="glass-card" style="width: 800px; max-width: 90%; max-height: 90vh; overflow-y: auto; background: var(--panel-solid);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 18px;">
                    <h3 style="margin: 0;">Register New Evaluation Site</h3>
                    <span onclick="closeCreateSiteModal()" style="font-size: 1.5rem; cursor: pointer; color: var(--muted);">&times;</span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <!-- Modal inputs -->
                    <form id="create-site-form" onsubmit="createSite(event)">
                        <div>
                            <label style="font-size: 0.8rem; color: var(--muted);">Site Name</label>
                            <input id="modal-site-name" placeholder="E.g. Ridge Site A" required>
                        </div>
                        <div style="margin-top: 10px;">
                            <label style="font-size: 0.8rem; color: var(--muted);">Land Area (Hectares)</label>
                            <input id="modal-site-area" type="number" value="15" min="1" max="1000" required>
                        </div>
                        <div style="margin-top: 10px;">
                            <label style="font-size: 0.8rem; color: var(--muted);">Land Ownership</label>
                            <select id="modal-site-ownership">
                                <option value="Public">Public (Low Cost)</option>
                                <option value="Private">Private (Medium Cost)</option>
                                <option value="Federal">Federal (High Friction)</option>
                            </select>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                            <div>
                                <label style="font-size: 0.8rem; color: var(--muted);">Latitude</label>
                                <input id="modal-site-lat" type="number" step="0.00001" placeholder="45.12345" required>
                            </div>
                            <div>
                                <label style="font-size: 0.8rem; color: var(--muted);">Longitude</label>
                                <input id="modal-site-lon" type="number" step="0.00001" placeholder="-122.54321" required>
                            </div>
                        </div>
                        
                        <button type="submit" style="margin-top: 20px; width: 100%;">Run AI Suitability & Save</button>
                    </form>
                    
                    <!-- Modal map selection picker -->
                    <div>
                        <label style="font-size: 0.8rem; color: var(--muted); display: block; margin-bottom: 6px;">Double-Click map to Pin Coordinates</label>
                        <div id="modal-map-picker" style="height: 300px; border-radius: 10px; border: 1px solid var(--border);"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- JavaScript scripts -->
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        
        <script>
            // Global states
            let currentTab = 'overview';
            let projects = [];
            let selectedProjectId = null;
            let selectedSiteId = null;
            let activeSiteDetails = null;
            let alerts = [];
            
            // Map instances
            let overviewMap = null;
            let modalMap = null;
            let modalMarker = null;
            let gisMap = null;
            let gisAnalysisMarker = null;
            
            // Charts instances
            let solarChart = null;
            let windChart = null;
            let radarChart = null;
            let cashflowChart = null;
            let optimizationChart = null;
            
            // Map Layers reference
            let gisHeatmapLayer = null;
            let gisInfraLinesLayer = null;
            
            // Initialization
            window.switchTab = function(tabId) {
                const safeTab = (tabId || 'overview').toLowerCase();
                const titleEl = document.getElementById('current-tab-title');
                if (titleEl) {
                    titleEl.innerText = safeTab.charAt(0).toUpperCase() + safeTab.slice(1) + ' Console';
                }
                document.querySelectorAll('.sidebar .nav-item').forEach(el => el.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                const navItems = Array.from(document.querySelectorAll('.sidebar .nav-menu .nav-item'));
                const matchedNavItem = navItems.find(el => {
                    const href = el.getAttribute('href') || '';
                    const onc = el.getAttribute('onclick') || '';
                    return href.includes('/dashboard/' + safeTab) || onc.includes(safeTab);
                });
                if (matchedNavItem) matchedNavItem.classList.add('active');
                const tabEl = document.getElementById('tab-' + safeTab);
                if (tabEl) tabEl.classList.add('active');
                if (window.history && window.history.replaceState) {
                    window.history.replaceState({}, '', '/dashboard/' + safeTab);
                }
                currentTab = safeTab;
                if (safeTab === 'overview') {
                    setTimeout(() => { if (overviewMap) overviewMap.invalidateSize(); }, 200);
                } else if (safeTab === 'gis') {
                    initGISMap();
                } else if (safeTab === 'predictions') {
                    populateSiteSelectors('predictions-site-selector');
                } else if (safeTab === 'suitability') {
                    populateSiteSelectors('suitability-site-selector');
                } else if (safeTab === 'investment') {
                    populateSiteSelectors('investment-site-selector');
                } else if (safeTab === 'optimization') {
                    populateProjectSelector('optimize-project-selector');
                    document.getElementById('optimization-analytics-container').style.display = 'none';
                    document.getElementById('optimization-empty').style.display = 'block';
                } else if (safeTab === 'reports') {
                    populateSiteSelectors('reports-site-selector');
                } else if (safeTab === 'admin') {
                    loadAdminMetrics();
                }
            };

            window.onload = function() {
                const initialTab = (window.__initialTab && window.__initialTab !== 'dashboard') ? window.__initialTab : (window.location.pathname.split('/').pop() || 'overview');
                loadProjects();
                loadStats();
                loadAlerts();
                initOverviewMap();
                if (initialTab !== 'dashboard' && initialTab !== 'overview') {
                    window.switchTab(initialTab);
                } else {
                    window.switchTab('overview');
                }
            };
            
            // stats loader
            function loadStats() {
                fetch('/api/alerts')
                    .then(res => res.json())
                    .then(data => {
                        alerts = data;
                        const unread = alerts.filter(a => !a.is_read).length;
                        document.getElementById('unread-alert-count').innerText = unread;
                        document.getElementById('stat-alerts').innerText = alerts.length;
                        
                        // Populate recent alerts table in dashboard
                        const tbody = document.getElementById('recent-alerts-table').querySelector('tbody');
                        tbody.innerHTML = '';
                        alerts.slice(0, 5).forEach(a => {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${a.created_at}</td>
                                <td>${a.alert_type}</td>
                                <td><span class="badge-severity severity-${a.severity}">${a.severity}</span></td>
                                <td>${a.message}</td>
                                <td>${a.is_read ? '<span class="muted">Read</span>' : `<button onclick="markAlertRead(${a.id})" style="padding:4px 8px; font-size:0.75rem;">Dismiss</button>`}</td>
                            `;
                            tbody.appendChild(tr);
                        });
                    });
            }
            
            function markAlertRead(id) {
                fetch(`/api/alerts/${id}/read`, { method: 'POST' })
                    .then(res => res.json())
                    .then(() => {
                        loadStats();
                    });
            }
            
            function loadAlerts(filter = 'all') {
                fetch('/api/alerts')
                    .then(res => res.json())
                    .then(data => {
                        const tbody = document.getElementById('full-alerts-table').querySelector('tbody');
                        tbody.innerHTML = '';
                        const list = filter === 'unread' ? data.filter(a => !a.is_read) : data;
                        
                        if (list.length === 0) {
                            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;" class="muted">No alerts found.</td></tr>';
                            return;
                        }
                        
                        list.forEach(a => {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${a.created_at}</td>
                                <td>${a.alert_type}</td>
                                <td><span class="badge-severity severity-${a.severity}">${a.severity}</span></td>
                                <td>${a.message}</td>
                                <td>${a.is_read ? '<span class="muted">Read</span>' : `<button onclick="markAlertRead(${a.id})" style="padding:4px 8px; font-size:0.75rem;">Dismiss</button>`}</td>
                            `;
                            tbody.appendChild(tr);
                        });
                    });
            }
            
            // project loaders
            function loadProjects() {
                fetch('/api/projects')
                    .then(res => res.json())
                    .then(data => {
                        projects = data;
                        document.getElementById('stat-projects').innerText = projects.length;
                        
                        const listEl = document.getElementById('project-list');
                        listEl.innerHTML = '';
                        
                        if (projects.length === 0) {
                            listEl.innerHTML = '<div class="muted">No projects created yet.</div>';
                            return;
                        }
                        
                        projects.forEach(p => {
                            const div = document.createElement('div');
                            div.className = 'nav-item';
                            div.style.justifyContent = 'space-between';
                            if (p.id === selectedProjectId) div.classList.add('active');
                            div.onclick = () => selectProject(p.id);
                            div.innerHTML = `<span>📂 ${p.name}</span> <span class="badge-role" style="font-size:0.7rem;">${p.status}</span>`;
                            listEl.appendChild(div);
                        });
                        
                        if (selectedProjectId) {
                            selectProject(selectedProjectId);
                        }
                    });
            }
            
            function createProject(e) {
                e.preventDefault();
                const name = document.getElementById('new-proj-name').value.trim();
                const region = document.getElementById('new-proj-region').value.trim();
                const description = document.getElementById('new-proj-desc').value.trim();
                if (!name || !region || !description) {
                    alert('Please complete all project fields.');
                    return;
                }
                
                fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, region, description })
                })
                .then(async res => {
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        throw new Error(data.error || 'Unable to create project');
                    }
                    document.getElementById('create-project-form').reset();
                    selectedProjectId = data.id;
                    await loadProjects();
                    window.switchTab('projects');
                })
                .catch(err => {
                    alert(err.message || 'Unable to create project');
                });
            }
            
            function selectProject(id) {
                selectedProjectId = id;
                // Highlight active in left list
                document.querySelectorAll('#project-list .nav-item').forEach(el => el.classList.remove('active'));
                
                fetch(`/api/projects/${id}`)
                    .then(res => res.json())
                    .then(data => {
                        document.getElementById('project-details-panel').style.display = 'block';
                        document.getElementById('detail-proj-name').innerText = data.name;
                        document.getElementById('detail-proj-desc').innerText = data.description;
                        document.getElementById('detail-proj-status').value = data.status;
                        
                        // Populate sites table
                        const tbody = document.getElementById('project-sites-table').querySelector('tbody');
                        tbody.innerHTML = '';
                        
                        document.getElementById('stat-sites').innerText = data.sites.length;
                        
                        let totalScore = 0;
                        data.sites.forEach(s => {
                            totalScore += s.overall_score;
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td><strong>${s.name}</strong></td>
                                <td>${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}</td>
                                <td><span class="badge-role" style="background:rgba(6,182,212,0.12); color:var(--accent-cyan); border:1px solid var(--accent-cyan);">${s.category}</span></td>
                                <td><strong>${s.overall_score.toFixed(1)}%</strong></td>
                                <td>
                                    <button onclick="deleteSite(${s.id})" style="padding:4px 8px; font-size:0.75rem; background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.2);">Delete</button>
                                </td>
                            `;
                            tbody.appendChild(tr);
                        });
                        
                        if (data.sites.length > 0) {
                            document.getElementById('stat-avg-suit').innerText = (totalScore / data.sites.length).toFixed(1) + '%';
                        } else {
                            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;" class="muted">No sites registered for this project yet.</td></tr>';
                            document.getElementById('stat-avg-suit').innerText = '0.0%';
                        }
                        
                        // Add marker to overview map
                        updateOverviewMapMarkers(data.sites);
                    });
            }
            
            function updateProjectStatus() {
                const status = document.getElementById('detail-proj-status').value;
                fetch(`/api/projects/${selectedProjectId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                })
                .then(res => res.json())
                .then(() => {
                    loadProjects();
                });
            }
            
            // USER PROFILE EDIT FUNCTIONS
            function openEditProfileModal() {
                fetch('/api/profile')
                    .then(res => res.json())
                    .then(data => {
                        document.getElementById('profile-username').value = data.username;
                        document.getElementById('profile-email').value = data.email;
                        document.getElementById('profile-password').value = '';
                        document.getElementById('edit-profile-modal').style.display = 'flex';
                    });
            }
            
            function closeEditProfileModal() {
                document.getElementById('edit-profile-modal').style.display = 'none';
            }
            
            function updateProfile(e) {
                e.preventDefault();
                const username = document.getElementById('profile-username').value;
                const email = document.getElementById('profile-email').value;
                const password = document.getElementById('profile-password').value;
                
                fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        alert(data.error);
                        return;
                    }
                    document.getElementById('sidebar-username').innerText = `Welcome, ${data.username}`;
                    closeEditProfileModal();
                    alert('Profile updated successfully!');
                });
            }
            
            // Site registrations
            function openCreateSiteModal() {
                document.getElementById('create-site-modal').style.display = 'flex';
                // Init modal picker map
                setTimeout(() => {
                    if (typeof L === 'undefined') {
                        document.getElementById('modal-map-picker').innerHTML = '<div style="padding:40px; text-align:center; color:var(--muted);">⚠️ Maps are unavailable offline. Please manually type coordinates.</div>';
                        return;
                    }
                    if (!modalMap) {
                        modalMap = L.map('modal-map-picker').setView([45.0, -120.0], 6);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(modalMap);
                        
                        modalMap.on('dblclick', function(e) {
                            const lat = e.latlng.lat;
                            const lon = e.latlng.lng;
                            document.getElementById('modal-site-lat').value = lat.toFixed(5);
                            document.getElementById('modal-site-lon').value = lon.toFixed(5);
                            
                            if (modalMarker) {
                                modalMarker.setLatLng(e.latlng);
                            } else {
                                modalMarker = L.marker(e.latlng).addTo(modalMap);
                            }
                        });
                    } else if (modalMap) {
                        modalMap.invalidateSize();
                    }
                }, 200);
            }
            
            function closeCreateSiteModal() {
                document.getElementById('create-site-modal').style.display = 'none';
            }
            
            function createSite(e) {
                e.preventDefault();
                const name = document.getElementById('modal-site-name').value;
                const land_area = document.getElementById('modal-site-area').value;
                const land_ownership = document.getElementById('modal-site-ownership').value;
                const latitude = document.getElementById('modal-site-lat').value;
                const longitude = document.getElementById('modal-site-lon').value;
                
                fetch('/api/sites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        project_id: selectedProjectId,
                        name,
                        land_area,
                        land_ownership,
                        latitude,
                        longitude
                    })
                })
                .then(res => res.json())
                .then(() => {
                    closeCreateSiteModal();
                    document.getElementById('create-site-form').reset();
                    if (modalMarker) {
                        modalMap.removeLayer(modalMarker);
                        modalMarker = null;
                    }
                    selectProject(selectedProjectId);
                    loadStats();
                });
            }
            
            function deleteSite(id) {
                if (confirm('Are you sure you want to delete this site evaluation?')) {
                    fetch(`/api/sites/${id}`, { method: 'DELETE' })
                        .then(res => res.json())
                        .then(() => {
                            selectProject(selectedProjectId);
                            loadStats();
                        });
                }
            }
            
            // Project dropdown populator for optimization tab
            function populateProjectSelector(selectorId) {
                const sel = document.getElementById(selectorId);
                sel.innerHTML = '<option value="">-- Select Active Project --</option>';
                
                fetch('/api/projects')
                    .then(res => res.json())
                    .then(projs => {
                        projs.forEach(p => {
                            const opt = document.createElement('option');
                            opt.value = p.id;
                            opt.innerText = `${p.name} (${p.region})`;
                            sel.appendChild(opt);
                        });
                        
                        if (selectedProjectId) {
                            sel.value = selectedProjectId;
                        }
                    });
            }
            
            function loadProjectOptimization() {
                selectedProjectId = document.getElementById('optimize-project-selector').value;
                if (!selectedProjectId) {
                    document.getElementById('optimization-analytics-container').style.display = 'none';
                    document.getElementById('optimization-empty').style.display = 'block';
                    return;
                }
                document.getElementById('optimization-analytics-container').style.display = 'grid';
                document.getElementById('optimization-empty').style.display = 'none';
                runOptimization();
            }
            
            function runOptimization() {
                if (!selectedProjectId) return;
                
                const target_capacity_mw = parseFloat(document.getElementById('slider-opt-target').value);
                const discount_rate = parseFloat(document.getElementById('slider-opt-discount').value) / 10.0;
                const tariff = parseFloat(document.getElementById('slider-opt-tariff').value) / 100.0;
                const storage_capacity_mwh = parseFloat(document.getElementById('slider-opt-storage').value);
                
                fetch(`/api/projects/${selectedProjectId}/optimize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        target_capacity_mw,
                        discount_rate,
                        tariff,
                        storage_capacity_mwh
                    })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        alert(data.error);
                        return;
                    }
                    
                    // Render metric totals
                    document.getElementById('opt-metric-capex').innerText = '$' + data.summary.total_capex.toLocaleString(undefined, {maximumFractionDigits: 0});
                    document.getElementById('opt-metric-npv').innerText = '$' + data.summary.total_npv.toLocaleString(undefined, {maximumFractionDigits: 0});
                    document.getElementById('opt-metric-irr').innerText = data.summary.avg_irr.toFixed(1) + '%';
                    document.getElementById('opt-metric-payback').innerText = data.summary.avg_payback.toFixed(1) + ' Yrs';
                    
                    // Render ranked sites table
                    const tbody = document.getElementById('optimization-sites-table').querySelector('tbody');
                    tbody.innerHTML = '';
                    
                    data.ranked_sites.forEach((site, index) => {
                        const isSelected = data.selected_sites.some(s => s.site_id === site.site_id);
                        const statusBadge = isSelected 
                            ? `<span class="badge-role" style="background:rgba(16,185,129,0.12); color:var(--accent-green); border:1px solid var(--accent-green);">Selected</span>`
                            : `<span class="badge-role" style="background:rgba(239,68,68,0.12); color:var(--accent-pink); border:1px solid var(--accent-pink);">Excluded</span>`;
                            
                        const row = document.createElement('tr');
                        row.style.borderBottom = '1px solid var(--border)';
                        if (isSelected) {
                            row.style.background = 'rgba(255, 255, 255, 0.02)';
                        }
                        
                        const allocatedStorage = isSelected ? (site.allocated_storage_mwh ? site.allocated_storage_mwh.toFixed(1) + ' MWh' : '0.0 MWh') : '—';
                        const currentCapex = isSelected ? site.capex : site.capacity_mw * (site.tech_choice === 'solar' ? 1000000.0 : site.tech_choice === 'wind' ? 1400000.0 : 1200000.0);
                        
                        row.innerHTML = `
                            <td style="padding:10px; font-weight:700;">#${index + 1}</td>
                            <td style="padding:10px;"><strong>${site.site_name}</strong></td>
                            <td style="padding:10px; text-transform:capitalize;">${site.tech_choice}</td>
                            <td style="padding:10px;">${site.capacity_mw.toFixed(1)} MW</td>
                            <td style="padding:10px;">${allocatedStorage}</td>
                            <td style="padding:10px;">$${currentCapex.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                            <td style="padding:10px;">${site.irr.toFixed(1)}%</td>
                            <td style="padding:10px;">${statusBadge}</td>
                        `;
                        tbody.appendChild(row);
                    });
                    
                    // Render phased expansion timeline
                    const timelineContainer = document.getElementById('optimization-phased-plan');
                    timelineContainer.innerHTML = '';
                    
                    if (data.phases.length === 0) {
                        timelineContainer.innerHTML = '<div class="muted" style="text-align:center; padding: 20px;">No phases planned. Add sites to start planning.</div>';
                    } else {
                        data.phases.forEach((phase, index) => {
                            const div = document.createElement('div');
                            div.className = 'glass-card';
                            div.style.margin = '0';
                            div.style.padding = '12px 16px';
                            div.style.background = 'rgba(255,255,255,0.03)';
                            div.style.borderLeft = `4px solid ${index === 0 ? 'var(--accent-green)' : index === 1 ? 'var(--accent-cyan)' : 'var(--accent-gold)'}`;
                            
                            div.innerHTML = `
                                <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.95rem;">
                                    <span style="color:var(--text);">${phase.phase}</span>
                                    <span style="color:var(--accent-cyan); font-family:\'Space Grotesk\', sans-serif;">${phase.timeline}</span>
                                </div>
                                <div style="font-size:0.85rem; color:var(--muted); margin-top:6px;">
                                    Sites: <strong>${phase.sites.join(', ')}</strong> | Capacity: <strong>${phase.capacity_mw.toFixed(1)} MW</strong>
                                </div>
                                <div style="font-size:0.85rem; color:var(--muted); margin-top:2px;">
                                    Phase Capital: <strong>$${phase.capex.toLocaleString(undefined, {maximumFractionDigits:0})}</strong>
                                </div>
                            `;
                            timelineContainer.appendChild(div);
                        });
                    }
                    
                    // Render strategic recommendation markdown
                    const recContainer = document.getElementById('optimization-strategic-rec');
                    let recHtml = data.summary.recommendations
                        .replace(/\\n\\n/g, '<br><br>')
                        .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
                    recContainer.innerHTML = `<div style="background: rgba(255, 255, 255, 0.02); padding: 15px; border-radius: 8px; border: 1px solid var(--border);">${recHtml}</div>`;
                    
                    // Render Phase chart
                    const phaseLabels = data.phases.map(p => p.phase.split(':')[0]);
                    const phaseCapex = data.phases.map(p => p.capex);
                    
                    let cumulativeNpv = 0;
                    const phaseNpv = data.phases.map(p => {
                        const totalPhaseCapex = data.summary.total_capex;
                        const proportion = totalPhaseCapex > 0 ? p.capex / totalPhaseCapex : 0;
                        cumulativeNpv += data.summary.total_npv * proportion;
                        return cumulativeNpv;
                    });
                    
                    renderOptimizationChart(phaseLabels, phaseCapex, phaseNpv);
                });
            }
            
            function renderOptimizationChart(labels, capexData, npvData) {
                if (optimizationChart) optimizationChart.destroy();
                
                const ctx = document.getElementById('optimization-chart').getContext('2d');
                optimizationChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Phase Capital Deployment ($)',
                                data: capexData,
                                backgroundColor: 'rgba(6, 182, 212, 0.65)',
                                borderColor: 'var(--accent-cyan)',
                                borderWidth: 1.5,
                                yAxisID: 'y'
                            },
                            {
                                label: 'Cumulative Portfolio NPV ($)',
                                data: npvData,
                                type: 'line',
                                borderColor: 'var(--accent-green)',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                fill: false,
                                borderWidth: 2.5,
                                yAxisID: 'y1'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: '#f8fafc' } } },
                        scales: {
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                grid: { color: 'rgba(255,255,255,0.06)' },
                                ticks: { color: '#94a3b8' },
                                title: { display: true, text: 'Capital Spend ($)', color: '#f8fafc' }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                grid: { drawOnChartArea: false },
                                ticks: { color: '#94a3b8' },
                                title: { display: true, text: 'Net Present Value ($)', color: '#f8fafc' }
                            },
                            x: {
                                ticks: { color: '#94a3b8' }
                            }
                        }
                    }
                });
            }
            
            // Site dropdown populator for prediction tabs
            function populateSiteSelectors(selectorId) {
                const sel = document.getElementById(selectorId);
                sel.innerHTML = '<option value="">-- Select Evaluated Site --</option>';
                
                fetch('/api/projects')
                    .then(res => res.json())
                    .then(projs => {
                        let promises = projs.map(p => fetch(`/api/projects/${p.id}`).then(r => r.json()));
                        Promise.all(promises).then(details => {
                            details.forEach(d => {
                                d.sites.forEach(s => {
                                    const opt = document.createElement('option');
                                    opt.value = s.id;
                                    opt.innerText = `${d.name} — ${s.name} (${s.category})`;
                                    sel.appendChild(opt);
                                });
                            });
                            
                            // Re-select if active
                            if (selectedSiteId) {
                                sel.value = selectedSiteId;
                            }
                        });
                    });
            }
            
            // MAP INIT FUNCTIONS
            function initOverviewMap() {
                if (typeof L === 'undefined') {
                    document.getElementById('overview-map').innerHTML = '<div style="padding:40px; text-align:center; color:var(--muted);">⚠️ Maps are unavailable offline.</div>';
                    return;
                }
                if (!overviewMap) {
                    overviewMap = L.map('overview-map').setView([30.0, 0.0], 2);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(overviewMap);
                }
            }
            
            function updateOverviewMapMarkers(sites) {
                if (typeof L === 'undefined' || !overviewMap) return;
                // Clear active markers
                overviewMap.eachLayer(layer => {
                    if (layer instanceof L.Marker) {
                        overviewMap.removeLayer(layer);
                    }
                });
                
                if (sites.length === 0) return;
                
                let group = [];
                sites.forEach(s => {
                    const marker = L.marker([s.latitude, s.longitude])
                        .addTo(overviewMap)
                        .bindPopup(`
                            <div class="site-popup">
                                <h4>${s.name}</h4>
                                <p><strong>Coordinates:</strong> ${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}</p>
                                <p><strong>Category:</strong> ${s.category}</p>
                                <p><strong>Score:</strong> ${s.overall_score.toFixed(1)}%</p>
                            </div>
                        `);
                    group.push([s.latitude, s.longitude]);
                });
                
                if (group.length > 0) {
                    overviewMap.fitBounds(group, { padding: [30, 30] });
                }
            }
            
            function initGISMap() {
                setTimeout(() => {
                    if (typeof L === 'undefined') {
                        document.getElementById('gis-interactive-map').innerHTML = '<div style="padding:40px; text-align:center; color:var(--muted);">⚠️ Maps are unavailable offline.</div>';
                        return;
                    }
                    if (!gisMap) {
                        gisMap = L.map('gis-interactive-map').setView([45.0, -120.0], 5);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(gisMap);
                        
                        gisMap.on('click', function(e) {
                            analyzeGISPoint(e.latlng.lat, e.latlng.lng);
                            
                            if (gisAnalysisMarker) {
                                gisAnalysisMarker.setLatLng(e.latlng);
                            } else {
                                gisAnalysisMarker = L.marker(e.latlng).addTo(gisMap);
                            }
                        });
                    } else if (gisMap) {
                        gisMap.invalidateSize();
                    }
                }, 200);
            }
            
            function toggleGISOverlay() {
                if (typeof L === 'undefined' || !gisMap) return;
                const selected = document.querySelector('input[name="gis-layer"]:checked').value;
                const showInfra = document.getElementById('infra-layer-check').checked;
                
                // Clear current canvas overlay layers
                if (gisHeatmapLayer) {
                    gisMap.removeLayer(gisHeatmapLayer);
                    gisHeatmapLayer = null;
                }
                
                if (gisInfraLinesLayer) {
                    gisMap.removeLayer(gisInfraLinesLayer);
                    gisInfraLinesLayer = null;
                }
                
                if (selected === 'solar') {
                    // Create simulated grid overlay using Canvas
                    gisHeatmapLayer = L.gridLayer({
                        createTile: function(coords) {
                            const tile = document.createElement('canvas');
                            tile.width = 256;
                            tile.height = 256;
                            const ctx = tile.getContext('2d');
                            // Simulated Solar Irradiance Heatmap based on latitude
                            ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
                            ctx.fillRect(0, 0, 256, 256);
                            return tile;
                        }
                    }).addTo(gisMap);
                } else if (selected === 'wind') {
                    gisHeatmapLayer = L.gridLayer({
                        createTile: function(coords) {
                            const tile = document.createElement('canvas');
                            tile.width = 256;
                            tile.height = 256;
                            const ctx = tile.getContext('2d');
                            // Simulated Wind Speed Heatmap (blue-ish overlay)
                            ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
                            ctx.fillRect(0, 0, 256, 256);
                            return tile;
                        }
                    }).addTo(gisMap);
                }
                
                if (showInfra) {
                    // Draw mock transmission lines on the map center
                    const center = gisMap.getCenter();
                    const lat = center.lat;
                    const lon = center.lng;
                    
                    const lineCoords = [
                        [lat - 0.2, lon - 0.2],
                        [lat - 0.05, lon + 0.1],
                        [lat + 0.1, lon + 0.3]
                    ];
                    
                    gisInfraLinesLayer = L.polyline(lineCoords, { color: '#ec4899', weight: 4, dashArray: '8, 8' }).addTo(gisMap);
                    gisMap.addLayer(gisInfraLinesLayer);
                }
            }
            
            function analyzeGISPoint(lat, lon) {
                const resEl = document.getElementById('gis-analysis-result');
                resEl.innerHTML = `<div style="text-align:center; padding: 40px 10px;" class="muted">Fetching telemetry...</div>`;
                
                fetch(`/api/map-analysis?lat=${lat}&lon=${lon}`)
                    .then(res => res.json())
                    .then(data => {
                        resEl.innerHTML = `
                            <div class="stats-card" style="background:rgba(0,0,0,0.1); border-color:var(--border);">
                                <h4 style="margin:0 0 8px 0; color:var(--accent-cyan);">CLASSIFIED SUITABILITY</h4>
                                <div class="stats-val" style="font-size:1.8rem; margin:0; color:var(--accent-green);">${data.overall_score.toFixed(1)}%</div>
                                <div class="user-role" style="margin-top:4px;">${data.category}</div>
                            </div>
                            
                            <div style="display:flex; flex-direction:column; gap:8px; font-size:0.9rem;">
                                <div class="metric" style="display:flex; justify-content:space-between;"><span class="label" style="color:var(--muted);">Latitude:</span><span class="val">${data.latitude.toFixed(5)}</span></div>
                                <div class="metric" style="display:flex; justify-content:space-between;"><span class="label" style="color:var(--muted);">Longitude:</span><span class="val">${data.longitude.toFixed(5)}</span></div>
                                <div class="metric" style="display:flex; justify-content:space-between;"><span class="label" style="color:var(--muted);">Elevation:</span><span class="val">${data.elevation.toFixed(1)} m</span></div>
                                <div class="metric" style="display:flex; justify-content:space-between;"><span class="label" style="color:var(--muted);">Terrain Slope:</span><span class="val">${data.land_slope.toFixed(1)}°</span></div>
                                <div class="metric" style="display:flex; justify-content:space-between;"><span class="label" style="color:var(--muted);">Solar Irradiance:</span><span class="val">${data.solar_irradiance.toFixed(2)} kWh/m²/day</span></div>
                                <div class="metric" style="display:flex; justify-content:space-between;"><span class="label" style="color:var(--muted);">Wind Speed:</span><span class="val">${data.wind_speed.toFixed(2)} m/s</span></div>
                                <div class="metric" style="display:flex; justify-content:space-between;"><span class="label" style="color:var(--muted);">Road Proximity:</span><span class="val">${data.distance_road.toFixed(2)} km</span></div>
                                <div class="metric" style="display:flex; justify-content:space-between;"><span class="label" style="color:var(--muted);">Grid Proximity:</span><span class="val">${data.distance_transmission.toFixed(2)} km</span></div>
                            </div>
                        `;
                    });
            }
            
            // PREDICTION MODELS AND CHARTS
            function loadSitePredictions() {
                selectedSiteId = document.getElementById('predictions-site-selector').value;
                if (!selectedSiteId) {
                    document.getElementById('predictions-analytics-container').style.display = 'none';
                    document.getElementById('predictions-empty').style.display = 'block';
                    return;
                }
                
                fetch(`/api/sites/${selectedSiteId}`)
                    .then(res => res.json())
                    .then(data => {
                        activeSiteDetails = data;
                        document.getElementById('predictions-analytics-container').style.display = 'block';
                        document.getElementById('predictions-empty').style.display = 'none';
                        
                        document.getElementById('pred-sol-cf').innerText = data.forecasts.solar.capacity_factor.toFixed(1) + '%';
                        document.getElementById('pred-sol-out').innerText = Math.round(data.forecasts.solar.annual_generation) + ' MWh';
                        document.getElementById('pred-wind-cf').innerText = data.forecasts.wind.capacity_factor.toFixed(1) + '%';
                        document.getElementById('pred-wind-out').innerText = Math.round(data.forecasts.wind.annual_generation) + ' MWh';
                        
                        renderSeasonalCharts(data.forecasts.solar.seasonal_data, data.forecasts.wind.seasonal_data);
                    });
            }
            
            function renderSeasonalCharts(solarSeasonal, windSeasonal) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                
                if (solarChart) solarChart.destroy();
                if (windChart) windChart.destroy();
                
                const ctxSol = document.getElementById('solar-seasonal-chart').getContext('2d');
                solarChart = new Chart(ctxSol, {
                    type: 'bar',
                    data: {
                        labels: months,
                        datasets: [{
                            label: 'Expected Solar Capacity Factor (%)',
                            data: solarSeasonal,
                            backgroundColor: 'rgba(245, 158, 11, 0.7)',
                            borderColor: '#f59e0b',
                            borderWidth: 1.5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.06)' } } }
                    }
                });
                
                const ctxWind = document.getElementById('wind-seasonal-chart').getContext('2d');
                windChart = new Chart(ctxWind, {
                    type: 'line',
                    data: {
                        labels: months,
                        datasets: [{
                            label: 'Expected Wind Capacity Factor (%)',
                            data: windSeasonal,
                            borderColor: '#06b6d4',
                            backgroundColor: 'rgba(6, 182, 212, 0.1)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.06)' } } }
                    }
                });
            }
            
            // SUITABILITY ANALYSIS TAB
            function loadSiteSuitability() {
                selectedSiteId = document.getElementById('suitability-site-selector').value;
                if (!selectedSiteId) {
                    document.getElementById('suitability-analytics-container').style.display = 'none';
                    document.getElementById('suitability-empty').style.display = 'block';
                    return;
                }
                
                fetch(`/api/sites/${selectedSiteId}`)
                    .then(res => res.json())
                    .then(data => {
                        activeSiteDetails = data;
                        document.getElementById('suitability-analytics-container').style.display = 'grid';
                        document.getElementById('suitability-empty').style.display = 'none';
                        
                        document.getElementById('suit-overall-score').innerText = data.suitability.overall_score.toFixed(1) + '%';
                        document.getElementById('suit-category-badge').innerText = data.suitability.category;
                        
                        // Populate sliders
                        document.getElementById('slider-w-res').value = 35;
                        document.getElementById('val-w-res').innerText = '35%';
                        document.getElementById('slider-w-geo').value = 25;
                        document.getElementById('val-w-geo').innerText = '25%';
                        document.getElementById('slider-w-infra').value = 15;
                        document.getElementById('val-w-infra').innerText = '15%';
                        document.getElementById('slider-w-env').value = 15;
                        document.getElementById('val-w-env').innerText = '15%';
                        document.getElementById('slider-w-econ').value = 10;
                        document.getElementById('val-w-econ').innerText = '10%';
                        document.getElementById('weight-total').innerText = '100%';
                        
                        renderRadarChart(data.suitability);
                    });
            }
            
            function adjustWeights(source) {
                const wRes = parseInt(document.getElementById('slider-w-res').value);
                const wGeo = parseInt(document.getElementById('slider-w-geo').value);
                const wInfra = parseInt(document.getElementById('slider-w-infra').value);
                const wEnv = parseInt(document.getElementById('slider-w-env').value);
                const wEcon = parseInt(document.getElementById('slider-w-econ').value);
                
                document.getElementById('val-w-res').innerText = wRes + '%';
                document.getElementById('val-w-geo').innerText = wGeo + '%';
                document.getElementById('val-w-infra').innerText = wInfra + '%';
                document.getElementById('val-w-env').innerText = wEnv + '%';
                document.getElementById('val-w-econ').innerText = wEcon + '%';
                
                const sum = wRes + wGeo + wInfra + wEnv + wEcon;
                const totalEl = document.getElementById('weight-total');
                totalEl.innerText = sum + '%';
                if (sum === 100) {
                    totalEl.style.color = 'var(--accent-green)';
                    document.getElementById('recalculate-weights-btn').disabled = false;
                } else {
                    totalEl.style.color = 'var(--accent-pink)';
                    document.getElementById('recalculate-weights-btn').disabled = true;
                }
            }
            
            function saveWeights() {
                const wRes = parseInt(document.getElementById('slider-w-res').value);
                const wGeo = parseInt(document.getElementById('slider-w-geo').value);
                const wInfra = parseInt(document.getElementById('slider-w-infra').value);
                const wEnv = parseInt(document.getElementById('slider-w-env').value);
                const wEcon = parseInt(document.getElementById('slider-w-econ').value);
                
                fetch(`/api/recalculate-suitability/${selectedSiteId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resource_weight: wRes,
                        geographic_weight: wGeo,
                        infrastructure_weight: wInfra,
                        environmental_weight: wEnv,
                        economic_weight: wEcon
                    })
                })
                .then(res => res.json())
                .then(data => {
                    document.getElementById('suit-overall-score').innerText = data.overall_score.toFixed(1) + '%';
                    document.getElementById('suit-category-badge').innerText = data.category;
                    
                    // Reload radar with updated weights? 
                    // Let's just reload the site details
                    fetch(`/api/sites/${selectedSiteId}`)
                        .then(res => res.json())
                        .then(updatedData => {
                            renderRadarChart(updatedData.suitability);
                            loadStats();
                        });
                });
            }
            
            function renderRadarChart(suit) {
                if (radarChart) radarChart.destroy();
                
                const ctx = document.getElementById('suitability-radar-chart').getContext('2d');
                radarChart = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: ['Resource', 'Geographic', 'Infrastructure', 'Environmental', 'Economic'],
                        datasets: [{
                            label: 'Site Suitability Index',
                            data: [
                                suit.resource_score,
                                suit.geographic_score,
                                suit.infrastructure_score,
                                suit.environmental_score,
                                suit.economic_score
                            ],
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            borderColor: '#10b981',
                            pointBackgroundColor: '#10b981',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                angleLines: { color: 'rgba(255,255,255,0.08)' },
                                grid: { color: 'rgba(255,255,255,0.08)' },
                                pointLabels: { color: 'var(--muted)', font: { size: 10 } },
                                ticks: { display: false, max: 100, min: 0 }
                            }
                        }
                    }
                });
            }
            
            // INVESTMENT PROJECTIONS
            function loadSiteInvestment() {
                selectedSiteId = document.getElementById('investment-site-selector').value;
                if (!selectedSiteId) {
                    document.getElementById('investment-analytics-container').style.display = 'none';
                    document.getElementById('investment-empty').style.display = 'block';
                    return;
                }
                
                fetch(`/api/sites/${selectedSiteId}`)
                    .then(res => res.json())
                    .then(data => {
                        activeSiteDetails = data;
                        document.getElementById('investment-analytics-container').style.display = 'grid';
                        document.getElementById('investment-empty').style.display = 'none';
                        
                        runFinancialProjections();
                    });
            }
            
            function runFinancialProjections() {
                const tech = document.getElementById('invest-tech-select').value;
                const costPerKw = parseFloat(document.getElementById('invest-cap-cost').value);
                const tariff = parseFloat(document.getElementById('invest-tariff').value);
                
                const forecast = activeSiteDetails.forecasts[tech];
                const area = activeSiteDetails.land_area;
                
                // Capacities & Cost calculations
                let capMw = tech === 'solar' ? area * 0.5 : area * 0.35;
                let capKw = capMw * 1000;
                let capCost = capKw * costPerKw;
                let annualMwh = forecast.annual_generation;
                let revenue = annualMwh * 1000 * tariff; // kWh conversion
                let payback = capCost / revenue;
                
                document.getElementById('invest-total-cap').innerText = '$' + capCost.toLocaleString(undefined, {maximumFractionDigits: 0});
                document.getElementById('invest-annual-rev').innerText = '$' + revenue.toLocaleString(undefined, {maximumFractionDigits: 0});
                document.getElementById('invest-payback').innerText = payback.toFixed(1) + ' Years';
                
                // 25-Year cash flow mapping
                let cashFlows = [-capCost];
                let cumulative = -capCost;
                let years = ['Year 0'];
                
                for (let y = 1; y <= 25; y++) {
                    // Inflation/O&M cost subtraction (let's assume 2% O&M cost of capital cost)
                    let omCost = capCost * 0.018;
                    let netRevenue = revenue - omCost;
                    cumulative += netRevenue;
                    cashFlows.push(cumulative);
                    years.push('Yr ' + y);
                }
                
                renderCashflowChart(years, cashFlows);
            }
            
            function renderCashflowChart(labels, data) {
                if (cashflowChart) cashflowChart.destroy();
                
                const ctx = document.getElementById('invest-cashflow-chart').getContext('2d');
                cashflowChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Cumulative Cash Flow ($)',
                            data: data,
                            borderColor: '#ec4899',
                            backgroundColor: 'rgba(236, 72, 153, 0.1)',
                            fill: true,
                            borderWidth: 2.5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { grid: { color: 'rgba(255,255,255,0.06)' } } }
                    }
                });
            }
            
            // SYSTEM ADMIN PAGE
            function loadAdminMetrics() {
                fetch('/api/admin/metrics')
                    .then(res => res.json())
                    .then(data => {
                        // Sources Status
                        const tbodyS = document.getElementById('admin-sources-table').querySelector('tbody');
                        tbodyS.innerHTML = '';
                        data.data_sources.forEach(ds => {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td><strong>${ds.name}</strong></td>
                                <td>${ds.type}</td>
                                <td><span class="badge-role">${ds.status}</span></td>
                            `;
                            tbodyS.appendChild(tr);
                        });
                        
                        // API logs
                        const tbodyL = document.getElementById('admin-logs-table').querySelector('tbody');
                        tbodyL.innerHTML = '';
                        
                        if (data.api_logs.length === 0) {
                            tbodyL.innerHTML = '<tr><td colspan="4" style="text-align:center;" class="muted">No API calls logged.</td></tr>';
                        } else {
                            data.api_logs.slice(0, 10).forEach(log => {
                                const tr = document.createElement('tr');
                                tr.innerHTML = `
                                    <td>${log.timestamp}</td>
                                    <td>${log.source}</td>
                                    <td><code>${log.endpoint}</code></td>
                                    <td><span class="badge-role" style="background:rgba(16,185,129,0.12); color:var(--accent-green);">${log.status_code}</span></td>
                                `;
                                tbodyL.appendChild(tr);
                            });
                        }
                    });
                    
                // Users list
                fetch('/api/users')
                    .then(res => res.json())
                    .then(usersList => {
                        const tbodyU = document.getElementById('admin-users-table').querySelector('tbody');
                        tbodyU.innerHTML = '';
                        usersList.forEach(u => {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td><strong>${u.username}</strong></td>
                                <td>${u.email}</td>
                                <td><span class="badge-role">${u.role}</span></td>
                                <td>
                                    <select style="width:120px; padding:4px; margin:0;" onchange="updateUserRole(${u.id}, this.value)">
                                        <option value="planner" ${u.role === 'planner' ? 'selected' : ''}>Planner</option>
                                        <option value="analyst" ${u.role === 'analyst' ? 'selected' : ''}>Analyst</option>
                                        <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>Manager</option>
                                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                                    </select>
                                </td>
                            `;
                            tbodyU.appendChild(tr);
                        });
                    });
            }
            
            function updateUserRole(userId, newRole) {
                fetch(`/api/users/${userId}/role`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: newRole })
                })
                .then(res => res.json())
                .then(() => {
                    loadAdminMetrics();
                });
            }
            
            // REPORTS EXPORT
            function exportSiteReport() {
                const id = document.getElementById('reports-site-selector').value;
                if (!id) {
                    alert('Please select a site first.');
                    return;
                }
                window.open(`/api/export-site-report/${id}`, '_blank');
            }
            
            function exportSitesCSV() {
                // Download client-side generated CSV of compared projects/sites
                let csv = 'Project,Site,Latitude,Longitude,Ownership,Elevation(m),Slope(deg),Solar Irradiance(kWh/m2/day),Wind Speed(m/s),Overall Suitability Score,Category\\n';
                
                fetch('/api/projects')
                    .then(res => res.json())
                    .then(projs => {
                        let promises = projs.map(p => fetch(`/api/projects/${p.id}`).then(r => r.json()));
                        Promise.all(promises).then(details => {
                            details.forEach(d => {
                                d.sites.forEach(s => {
                                    // Fetch full details
                                    fetch(`/api/sites/${s.id}`)
                                        .then(r => r.json())
                                        .then(full => {
                                            csv += `"${d.name}","${full.name}",${full.latitude},${full.longitude},"${full.land_ownership}",${full.elevation.toFixed(1)},${full.environmental.land_slope.toFixed(1)},${full.environmental.solar_irradiance.toFixed(2)},${full.environmental.wind_speed.toFixed(2)},${full.suitability.overall_score.toFixed(1)},"${full.suitability.category}"\\n`;
                                        });
                                });
                            });
                            
                            setTimeout(() => {
                                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                const link = document.createElement("a");
                                link.href = URL.createObjectURL(blob);
                                link.setAttribute("download", "renewable_sites_comparison.csv");
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }, 1000);
                        });
                    });
            }
        </script>
    </body>
    </html>
    ''', username=username, role=role, active_tab=active_tab, tab_title=tab_title)

@app.route('/profile')
def profile_page():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    return render_template_string('''
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Profile Settings</title>
        <style>
            body { margin: 0; font-family: Arial, sans-serif; background: linear-gradient(135deg, #07111f, #10213a); color: #f8fafc; min-height: 100vh; display: grid; place-items: center; }
            .card { width: min(460px, 92vw); background: rgba(16,28,46,0.95); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 28px; box-shadow: 0 12px 35px rgba(0,0,0,0.28); }
            input, button { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); margin-top: 10px; font-size: 1rem; }
            input { background: #0d1729; color: #f8fafc; }
            button { background: linear-gradient(90deg, #22c55e, #38bdf8); color: #04131f; font-weight: 700; cursor: pointer; border: none; }
            a { color: #38bdf8; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>Edit User Profile</h2>
            <p style="color: #94a3b8;">Update your account details or password.</p>
            <form id="profile-form" onsubmit="updateProfile(event)">
                <input id="profile-username" placeholder="Username" required>
                <input id="profile-email" type="email" placeholder="Email" required>
                <input id="profile-password" type="password" placeholder="New password (optional)">
                <button type="submit">Save Changes</button>
            </form>
            <p style="margin-top: 14px;"><a href="/dashboard">Back to dashboard</a></p>
        </div>
        <script>
            fetch('/api/profile')
                .then(res => res.json())
                .then(data => {
                    document.getElementById('profile-username').value = data.username;
                    document.getElementById('profile-email').value = data.email;
                });

            function updateProfile(e) {
                e.preventDefault();
                const payload = {
                    username: document.getElementById('profile-username').value,
                    email: document.getElementById('profile-email').value,
                    password: document.getElementById('profile-password').value
                };
                fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                    .then(res => res.json())
                    .then(data => {
                        if (data.error) {
                            alert(data.error);
                        } else {
                            alert('Profile updated successfully!');
                            window.location.href = '/dashboard';
                        }
                    });
            }
        </script>
    </body>
    </html>
    ''')

# ==============================================================================
# MAIN EXECUTOR
# ==============================================================================

def create_app():
    return app

if __name__ == '__main__':
    app.run(debug=True)
