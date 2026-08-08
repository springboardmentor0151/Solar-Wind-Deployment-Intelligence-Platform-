import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import bcrypt
from .models import Base, UserModel, ProjectModel, SiteModel
from .config import DATABASE_URL

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        
        # --- SQLite-Compatible Users Table Migration ---
        try:
            user_columns_check = [col["name"] for col in inspector.get_columns("users")]
            if "created_at" not in user_columns_check:
                print("Users.created_at column is missing. Recreating table to apply SQLite-compatible migration...")
                
                # Step 1: Query all current records from the old users table using raw SQL
                existing_cols = [c for c in user_columns_check if c != "created_at"]
                cols_str = ", ".join([f'"{c}"' for c in existing_cols])
                
                with engine.connect() as conn:
                    old_users = conn.execute(text(f"SELECT {cols_str} FROM users")).fetchall()
                    old_users_data = []
                    for row in old_users:
                        data = dict(zip(existing_cols, row))
                        old_users_data.append(data)
                
                # Step 2: Rename users to users_old and drop old indexes to prevent collision
                with engine.begin() as conn:
                    for index_name in ["ix_users_id", "ix_users_username", "ix_users_email"]:
                        try:
                            conn.execute(text(f"DROP INDEX IF EXISTS {index_name}"))
                        except Exception:
                            pass
                    conn.execute(text("ALTER TABLE users RENAME TO users_old"))
                
                # Step 3: Recreate the new users table using Base metadata
                Base.metadata.tables['users'].create(bind=engine)
                
                # Step 4: Copy records from users_old to users, populating created_at
                from datetime import datetime
                now_time = datetime.utcnow()
                
                with engine.begin() as conn:
                    for u in old_users_data:
                        columns_to_insert = list(u.keys())
                        
                        # Ensure new columns have default values
                        if "created_at" not in columns_to_insert:
                            columns_to_insert.append("created_at")
                            u["created_at"] = now_time
                        if "last_login" not in columns_to_insert:
                            columns_to_insert.append("last_login")
                            u["last_login"] = now_time
                        if "is_active" not in columns_to_insert:
                            columns_to_insert.append("is_active")
                            u["is_active"] = True
                            
                        placeholders = ", ".join([f":{col}" for col in columns_to_insert])
                        quoted_columns = ", ".join(f'"{c}"' for c in columns_to_insert)
                        insert_sql = text(
                          f"INSERT INTO users ({quoted_columns}) VALUES ({placeholders})"
                        )
                        conn.execute(insert_sql, u)
                    
                    # Drop users_old
                    conn.execute(text("DROP TABLE users_old"))
                    
                print("Successfully migrated users table in SQLite!")
                # Re-inspect to get correct updated columns list for subsequent checks
                inspector = inspect(engine)
        except Exception as table_migration_error:
            print(f"Users table migration warning: {table_migration_error}")
            
        # --- SQLite-Compatible Projects Table Migration ---
        try:
            project_columns_check = [col["name"] for col in inspector.get_columns("projects")]
            if "status" not in project_columns_check or "updated_at" not in project_columns_check:
                print("Projects columns are missing. Recreating table to apply SQLite-compatible migration...")
                
                # Step 1: Query all current records from the old projects table using raw SQL
                existing_cols = [c for c in project_columns_check if c not in ["status", "submitted_at", "reviewed_at", "reviewer_name", "review_comments", "is_archived", "updated_at"]]
                cols_str = ", ".join([f'"{c}"' for c in existing_cols])
                
                with engine.connect() as conn:
                    old_projects = conn.execute(text(f"SELECT {cols_str} FROM projects")).fetchall()
                    old_projects_data = []
                    for row in old_projects:
                        data = dict(zip(existing_cols, row))
                        old_projects_data.append(data)
                
                # Step 2: Rename projects to projects_old and drop old indexes to prevent collision
                with engine.begin() as conn:
                    for index_name in ["ix_projects_id"]:
                        try:
                            conn.execute(text(f"DROP INDEX IF EXISTS {index_name}"))
                        except Exception:
                            pass
                    conn.execute(text("ALTER TABLE projects RENAME TO projects_old"))
                
                # Step 3: Recreate the new projects table using Base metadata
                Base.metadata.tables['projects'].create(bind=engine)
                
                # Step 4: Copy records from projects_old to projects
                from datetime import datetime
                now_time = datetime.utcnow()
                
                with engine.begin() as conn:
                    for p in old_projects_data:
                        columns_to_insert = list(p.keys())
                        
                        # Populate new columns
                        if "status" not in columns_to_insert:
                            columns_to_insert.append("status")
                            p["status"] = "Draft"
                        if "is_archived" not in columns_to_insert:
                            columns_to_insert.append("is_archived")
                            p["is_archived"] = False
                        if "updated_at" not in columns_to_insert:
                            columns_to_insert.append("updated_at")
                            p["updated_at"] = now_time
                            
                        placeholders = ", ".join([f":{col}" for col in columns_to_insert])
                        quoted_columns = ", ".join(f'"{c}"' for c in columns_to_insert)
                        insert_sql = text(
                            f"INSERT INTO projects ({quoted_columns}) VALUES ({placeholders})"
                        )
                        conn.execute(insert_sql, p)
                    
                    # Drop projects_old
                    conn.execute(text("DROP TABLE projects_old"))
                    
                print("Successfully migrated projects table in SQLite!")
                inspector = inspect(engine)
        except Exception as project_migration_error:
            print(f"Projects table migration warning: {project_migration_error}")
            
        # Check columns of sites table to run auto-migrations for new columns
        columns = [col["name"] for col in inspector.get_columns("sites")]
        
        new_cols = {
            "country": "VARCHAR(255)",
            "state": "VARCHAR(255)",
            "district": "VARCHAR(255)",
            "solar_score": "FLOAT",
            "wind_score": "FLOAT",
            "recommended_plant": "VARCHAR(255)",
            "analysis_date": "TIMESTAMP"
        }
        
        # We run standard ALTER statements on the database engine directly
        with engine.begin() as conn:
            for col_name, col_type in new_cols.items():
                if col_name not in columns:
                    print(f"Altering table sites to add column {col_name}")
                    conn.execute(text(f"ALTER TABLE sites ADD COLUMN {col_name} {col_type}"))
                    
            # Check columns of users table to run auto-migrations for is_active
            user_columns = [col["name"] for col in inspector.get_columns("users")]
            if "is_active" not in user_columns:
                print("Altering table users to add column is_active")
                # Default is 1 for SQLite, True for postgresql
                conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT True"))
                
            new_user_cols = {
                "organization": "VARCHAR(255)",
                "department": "VARCHAR(255)",
                "designation": "VARCHAR(255)",
                "experience": "VARCHAR(255)",
                "phone_number": "VARCHAR(255)",
                "phone": "VARCHAR(255)",
                "country": "VARCHAR(255)",
                "state": "VARCHAR(255)",
                "city": "VARCHAR(255)",
                "profile_picture": "TEXT",
                "google_picture": "TEXT",
                "skills": "VARCHAR(500)",
                "education": "VARCHAR(255)",
                "linkedin": "VARCHAR(255)",
                "linkedin_url": "VARCHAR(255)",
                "github": "VARCHAR(255)",
                "github_url": "VARCHAR(255)",
                "is_onboarded": "BOOLEAN DEFAULT True",
                "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "last_login": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "permissions": "VARCHAR(1024)"
            }
            for col_name, col_def in new_user_cols.items():
                if col_name not in user_columns:
                    print(f"Altering table users to add column {col_name}")
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}"))
                
            # Check columns of projects table to run auto-migrations for country and renewable_type
            project_columns = [col["name"] for col in inspector.get_columns("projects")]
            if "country" not in project_columns:
                print("Altering table projects to add column country")
                conn.execute(text("ALTER TABLE projects ADD COLUMN country VARCHAR(255)"))
            if "renewable_type" not in project_columns:
                print("Altering table projects to add column renewable_type")
                conn.execute(text("ALTER TABLE projects ADD COLUMN renewable_type VARCHAR(255) DEFAULT 'solar'"))
                
            new_project_cols = {
                "status": "VARCHAR(50) DEFAULT 'Draft'",
                "submitted_at": "TIMESTAMP",
                "reviewed_at": "TIMESTAMP",
                "reviewer_name": "VARCHAR(255)",
                "review_comments": "VARCHAR(1000)",
                "is_archived": "BOOLEAN DEFAULT False",
                "assigned_analyst_id": "INTEGER",
                "assigned_manager_id": "INTEGER",
                "assigned_administrator_id": "INTEGER",
                "assigned_gis_analyst_id": "INTEGER",
                "assigned_project_manager_id": "INTEGER",
                "assignment_date": "TIMESTAMP",
                "gis_assigned_at": "TIMESTAMP",
                "manager_assigned_at": "TIMESTAMP",
                "admin_assigned_at": "TIMESTAMP",
                "completed_at": "TIMESTAMP",
                "gis_comments": "VARCHAR(2048)",
                "manager_comments": "VARCHAR(2048)",
                "admin_comments": "VARCHAR(2048)",
                "gis_reviewed_at": "TIMESTAMP",
                "manager_reviewed_at": "TIMESTAMP",
                "admin_reviewed_at": "TIMESTAMP",
                "gis_approved_at": "TIMESTAMP",
                "manager_approved_at": "TIMESTAMP",
                "admin_approved_at": "TIMESTAMP",
                "gis_rejected_at": "TIMESTAMP",
                "manager_rejected_at": "TIMESTAMP",
                "admin_rejected_at": "TIMESTAMP",
                "milestones": "VARCHAR(2048) DEFAULT '[]'",
                "completion_percentage": "INTEGER DEFAULT 0",
                "updated_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
            }
            for col_name, col_def in new_project_cols.items():
                if col_name not in project_columns:
                    print(f"Altering table projects to add column {col_name}")
                    conn.execute(text(f"ALTER TABLE projects ADD COLUMN {col_name} {col_def}"))

            # Check columns of notifications table to run auto-migrations for user_id and recipient_role
            notification_columns = [col["name"] for col in inspector.get_columns("notifications")]
            if "user_id" not in notification_columns:
                print("Altering table notifications to add column user_id")
                conn.execute(text("ALTER TABLE notifications ADD COLUMN user_id INTEGER"))
            if "recipient_role" not in notification_columns:
                print("Altering table notifications to add column recipient_role")
                conn.execute(text("ALTER TABLE notifications ADD COLUMN recipient_role VARCHAR(255)"))

            # Check columns of audit_logs table to run auto-migrations for role, action, and project_name
            audit_columns = [col["name"] for col in inspector.get_columns("audit_logs")]
            if "role" not in audit_columns:
                print("Altering table audit_logs to add column role")
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN role VARCHAR(255)"))
            if "action" not in audit_columns:
                print("Altering table audit_logs to add column action")
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN action VARCHAR(255)"))
            if "project_name" not in audit_columns:
                print("Altering table audit_logs to add column project_name")
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN project_name VARCHAR(255)"))
    except Exception as migration_error:
        print(f"Database migration warning: {migration_error}")

    try:
        # Reassign existing projects from all planners to admin to ensure empty planner dashboards
        planners = db.query(UserModel).filter(UserModel.role == "planner").all()
        admin_u = db.query(UserModel).filter(UserModel.username == "admin").first()
        if planners and admin_u:
            planner_ids = [p.id for p in planners]
            planner_projects = db.query(ProjectModel).filter(ProjectModel.owner_id.in_(planner_ids)).all()
            for p in planner_projects:
                p.owner_id = admin_u.id
            db.commit()

        # Check if users already exist
        if db.query(UserModel).first() is not None:
            # Ensure the default users exist
            default_users_list = [
                ("planner", "planner@solarwind.io", "Alex Reed (Renewable Planner)", "planner", "planner123", "Renewable Planning", "Senior Planner", "create_project,edit_own_project,delete_own_project,select_location,environmental_analysis,solar_prediction,wind_prediction,hybrid_prediction,generate_reports,submit_project"),
                ("analyst", "analyst@solarwind.io", "Sarah Chen (GIS Analyst)", "analyst", "analyst123", "GIS & Analysis", "GIS Specialist", "view_submitted_projects,review_coordinates,validate_land_classification,validate_terrain,validate_flood_risk,validate_protected_areas,validate_airport_buffer,validate_water_bodies,add_gis_comments,approve_gis_review,reject_gis_review"),
                ("manager", "manager@solarwind.io", "Elena Rostova (Project Manager)", "manager", "manager123", "Project Management", "Project Manager", "view_approved_gis_projects,update_workflow,update_milestones,track_progress,approve_manager_review,reject_manager_review,generate_progress_reports"),
                ("admin", "admin@solarwind.io", "System Administrator", "admin", "admin123", "System Administration", "IT Administrator", "create_user,edit_user,delete_user,activate_user,deactivate_user,assign_roles,reset_password,view_all_projects,delete_any_project,assign_gis_analyst,assign_project_manager,final_approval,view_all_reports,view_analytics,manage_notifications")
            ]
            for username, email, full_name, role, password, dept, desig, perms in default_users_list:
                u = db.query(UserModel).filter(UserModel.username == username).first()
                if not u:
                    u = UserModel(
                        username=username,
                        email=email,
                        hashed_password=hash_password(password),
                        full_name=full_name,
                        role=role,
                        department=dept,
                        designation=desig,
                        permissions=perms
                    )
                    db.add(u)
            db.commit()
            return
            
        print("Seeding database with default users and Indian renewable sample data...")
        
        # Create users
        users = [
            UserModel(
                username="planner",
                email="planner@solarwind.io",
                hashed_password=hash_password("planner123"),
                full_name="Alex Reed (Renewable Planner)",
                role="planner",
                department="Renewable Planning",
                designation="Senior Planner",
                permissions="create_project,edit_own_project,delete_own_project,select_location,environmental_analysis,solar_prediction,wind_prediction,hybrid_prediction,generate_reports,submit_project"
            ),
            UserModel(
                username="analyst",
                email="analyst@solarwind.io",
                hashed_password=hash_password("analyst123"),
                full_name="Sarah Chen (GIS Analyst)",
                role="analyst",
                department="GIS & Analysis",
                designation="GIS Specialist",
                permissions="view_submitted_projects,review_coordinates,validate_land_classification,validate_terrain,validate_flood_risk,validate_protected_areas,validate_airport_buffer,validate_water_bodies,add_gis_comments,approve_gis_review,reject_gis_review"
            ),
            UserModel(
                username="manager",
                email="manager@solarwind.io",
                hashed_password=hash_password("manager123"),
                full_name="Elena Rostova (Project Manager)",
                role="manager",
                department="Project Management",
                designation="Project Manager",
                permissions="view_approved_gis_projects,update_workflow,update_milestones,track_progress,approve_manager_review,reject_manager_review,generate_progress_reports"
            ),
            UserModel(
                username="admin",
                email="admin@solarwind.io",
                hashed_password=hash_password("admin123"),
                full_name="System Administrator",
                role="admin",
                department="System Administration",
                designation="IT Administrator",
                permissions="create_user,edit_user,delete_user,activate_user,deactivate_user,assign_roles,reset_password,view_all_projects,delete_any_project,assign_gis_analyst,assign_project_manager,final_approval,view_all_reports,view_analytics,manage_notifications"
            )
        ]
        
        for u in users:
            db.add(u)
        db.commit()
        
        # Reload users to get IDs
        admin = db.query(UserModel).filter(UserModel.username == "admin").first()
        
        # Seed Projects (Indian focus)
        project1 = ProjectModel(
            name="Rajasthan Desert Solar Initiative",
            region="Rajasthan",
            description="Utility-scale PV solar expansion program in the Bhadla Solar Park region.",
            owner_id=admin.id
        )
        project2 = ProjectModel(
            name="Tamil Nadu Coastal Wind Grid",
            region="Tamil Nadu",
            description="Wind farm network assessment centered around high wind-velocity gaps near Tirunelveli and Muppandal.",
            owner_id=admin.id
        )
        db.add(project1)
        db.add(project2)
        db.commit()
        
        # Seed Sites
        import json
        
        # Indian Bhadla Solar Site details
        solar_details = {
            "environmental": {
                "solar_irradiance": 6.2, # kWh/m2/day (High desert irradiance)
                "wind_speed": 3.8,       # m/s
                "wind_direction": 240,   # degrees
                "temperature": 34.5,     # °C
                "rainfall": 150,         # mm/year
                "cloud_cover": 8,        # % (Very clear skies)
                "elevation": 220.0,      # meters
                "land_slope": 0.8,       # degrees (Extremely flat)
                "vegetation_index": 0.08 # NDVI (Arid desert)
            },
            "infrastructure": {
                "distance_to_road": 0.2,       # km
                "distance_to_transmission": 0.8, # km
                "distance_to_substation": 2.5,   # km
                "nearest_urban_area": 45.0,      # km (Jodhpur district)
                "in_protected_zone": False,
                "on_agricultural_land": False,
                "near_water_bodies": False
            },
            "solar_prediction": {
                "annual_irradiance": 2263.0,   # kWh/m2/year
                "peak_sun_hours": 6.2,
                "expected_energy_output": 1680000.0, # kWh/MW/year
                "capacity_factor": 25.8,       # %
                "performance_ratio": 80.2,     # %
                "shading_loss": 0.8            # %
            },
            "wind_prediction": {
                "average_wind_speed": 3.8,
                "wind_power_density": 95.0,    # W/m2
                "turbulence_intensity": 8.5,   # %
                "capacity_factor": 9.5,
                "expected_annual_energy": 832200.0
            },
            "suitability": {
                "scores": {
                    "resource_availability": 98.0,
                    "geographic_suitability": 97.0,
                    "infrastructure_accessibility": 92.0,
                    "environmental_impact": 95.0,
                    "economic_feasibility": 94.0,
                    "overall": 95.2
                },
                "category": "Excellent"
            },
            "project_type": "solar"
        }
        
        # Indian Muppandal Wind Site details
        wind_details = {
            "environmental": {
                "solar_irradiance": 4.8,
                "wind_speed": 8.5,       # m/s (High monsoon pass speeds)
                "wind_direction": 190,
                "temperature": 28.2,
                "rainfall": 920,
                "cloud_cover": 35,
                "elevation": 45.0,
                "land_slope": 1.2,
                "vegetation_index": 0.35
            },
            "infrastructure": {
                "distance_to_road": 0.5,
                "distance_to_transmission": 2.1,
                "distance_to_substation": 5.0,
                "nearest_urban_area": 18.0,      # km (Kanyakumari/Tirunelveli border)
                "in_protected_zone": False,
                "on_agricultural_land": True,
                "near_water_bodies": False
            },
            "solar_prediction": {
                "annual_irradiance": 1752.0,
                "peak_sun_hours": 4.8,
                "expected_energy_output": 1280000.0,
                "capacity_factor": 18.5,
                "performance_ratio": 76.5,
                "shading_loss": 2.2
            },
            "wind_prediction": {
                "average_wind_speed": 8.5,
                "wind_power_density": 512.0,   # W/m2
                "turbulence_intensity": 11.2,
                "capacity_factor": 39.5,       # % (Excellent wind tunnel)
                "expected_annual_energy": 3459800.0
            },
            "suitability": {
                "scores": {
                    "resource_availability": 94.0,
                    "geographic_suitability": 90.0,
                    "infrastructure_accessibility": 85.0,
                    "environmental_impact": 82.0,
                    "economic_feasibility": 88.0,
                    "overall": 87.8
                },
                "category": "Excellent"
            },
            "project_type": "wind"
        }
        
        site1 = SiteModel(
            project_id=project1.id,
            name="Bhadla Solar Phase IV",
            latitude=27.539,
            longitude=71.918,
            region="Rajasthan",
            land_area=1200.0,
            elevation=220.0,
            existing_infrastructure=json.dumps(["Grid Substation Corridor", "Gravel Access Roads"]),
            land_ownership="State Government Lease",
            suitability_score=95.2,
            suitability_category="Excellent",
            details_json=json.dumps(solar_details)
        )
        
        site2 = SiteModel(
            project_id=project2.id,
            name="Muppandal Wind Sector C",
            latitude=8.261,
            longitude=77.551,
            region="Tamil Nadu",
            land_area=750.0,
            elevation=45.0,
            existing_infrastructure=json.dumps(["Access Highways", "High-Voltage Power lines"]),
            land_ownership="Private Agricultural Lease",
            suitability_score=87.8,
            suitability_category="Excellent",
            details_json=json.dumps(wind_details)
        )
        
        db.add(site1)
        db.add(site2)
        db.commit()
        print("Database seeded with Indian renewable data successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
