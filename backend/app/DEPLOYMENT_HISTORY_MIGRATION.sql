-- Phase 6: Deployment history
-- Prefer Alembic autogenerate in the real backend repository.

CREATE TABLE IF NOT EXISTS deployment_history (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    technology VARCHAR(50) NOT NULL,
    capacity_mw DOUBLE PRECISION,
    status VARCHAR(30) NOT NULL,
    planned_start TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_deployment_history_id ON deployment_history(id);
CREATE INDEX IF NOT EXISTS ix_deployment_history_project_id ON deployment_history(project_id);
CREATE INDEX IF NOT EXISTS ix_deployment_history_site_id ON deployment_history(site_id);
CREATE INDEX IF NOT EXISTS ix_deployment_history_status ON deployment_history(status);
CREATE INDEX IF NOT EXISTS ix_deployment_history_changed_by ON deployment_history(changed_by);
