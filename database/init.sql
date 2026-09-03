CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(160) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(15) NOT NULL DEFAULT 'Planner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(180) NOT NULL,
    project_type VARCHAR(10) NOT NULL,
    region VARCHAR(160) NOT NULL,
    capacity_mw DOUBLE PRECISION NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address VARCHAR(500) NOT NULL,
    geom GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED
);

CREATE INDEX IF NOT EXISTS ix_locations_geom ON locations USING GIST (geom);

CREATE TABLE IF NOT EXISTS environmental_data (
    id SERIAL PRIMARY KEY,
    project_id INTEGER UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    solar_irradiance DOUBLE PRECISION NOT NULL,
    wind_speed DOUBLE PRECISION NOT NULL,
    wind_direction DOUBLE PRECISION NOT NULL,
    temperature DOUBLE PRECISION NOT NULL,
    humidity DOUBLE PRECISION NOT NULL,
    rainfall DOUBLE PRECISION NOT NULL,
    cloud_cover DOUBLE PRECISION NOT NULL,
    elevation DOUBLE PRECISION NOT NULL,
    land_slope DOUBLE PRECISION NOT NULL,
    vegetation_index DOUBLE PRECISION NOT NULL,
    nearby_roads_km DOUBLE PRECISION NOT NULL,
    nearby_substations_km DOUBLE PRECISION NOT NULL,
    nearby_transmission_lines_km DOUBLE PRECISION NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    solar_potential DOUBLE PRECISION NOT NULL,
    wind_potential DOUBLE PRECISION NOT NULL,
    energy_generation_forecast DOUBLE PRECISION NOT NULL,
    capacity_factor DOUBLE PRECISION NOT NULL,
    performance_ratio DOUBLE PRECISION NOT NULL,
    annual_energy_output DOUBLE PRECISION NOT NULL,
    wind_power_density DOUBLE PRECISION NOT NULL,
    suitability_score DOUBLE PRECISION NOT NULL,
    investment_score DOUBLE PRECISION NOT NULL,
    roi_estimate DOUBLE PRECISION NOT NULL,
    deployment_recommendation TEXT NOT NULL,
    technology_recommendation VARCHAR(220) NOT NULL,
    confidence_score DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forecasts (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    month VARCHAR(12) NOT NULL,
    solar_mwh DOUBLE PRECISION NOT NULL,
    wind_mwh DOUBLE PRECISION NOT NULL,
    hybrid_mwh DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    report_type VARCHAR(40) NOT NULL,
    file_name VARCHAR(220) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
