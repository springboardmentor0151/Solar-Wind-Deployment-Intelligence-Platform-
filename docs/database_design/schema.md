# Relational Database Schema Design (PostgreSQL + PostGIS)

This layout models users, project scopes, site locations, and spatial coordinate layers.

### 1. `users` Table
Handles core profile management and role assignments.
* `id` (UUID, Primary Key)
* `email` (VARCHAR, Unique)
* `password_hash` (VARCHAR)
* `role` (VARCHAR) — *Planner, Analyst, Manager, Admin*
* `created_at` (TIMESTAMP)

### 2. `projects` Table
Aggregates multiple target deployment evaluations under a cohesive umbrella.
* `id` (UUID, Primary Key)
* `user_id` (UUID, Foreign Key referencing `users.id`)
* `name` (VARCHAR)
* `description` (TEXT)
* `created_at` (TIMESTAMP)

### 3. `sites` Table
Maintains granular geospatial variables and physical infrastructure dimensions for assessment.
* `id` (UUID, Primary Key)
* `project_id` (UUID, Foreign Key referencing `projects.id`)
* `name` (VARCHAR)
* `coordinates` (GEOMETRY Point, SRID 4326) — *Spatial location points*
* `land_area_sq_meters` (NUMERIC)
* `elevation_meters` (NUMERIC)
* `slope_degree` (NUMERIC)
* `nearest_grid_distance_km` (NUMERIC)
* `suitability_score` (NUMERIC)
* `created_at` (TIMESTAMP)