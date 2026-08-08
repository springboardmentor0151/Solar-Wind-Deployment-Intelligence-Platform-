import json
from datetime import datetime
from typing import List, Optional, Any
from fastapi import FastAPI, Depends, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from .models import (
    ProjectModel, SiteModel, NotificationModel, ReportModel, UserModel, AuditLogModel,
    ProjectCreate, ProjectUpdate, ProjectResponse, SiteCreate, SiteUpdate, SiteResponse, NotificationResponse, ReportResponse, UserResponse, UserCreate, UserUpdate, AssignableUserResponse
)
from .database import get_db, init_db, hash_password
from .auth import router as auth_router, get_current_user, RoleChecker
from .permissions import (
    can_create_project, can_run_predictions, can_submit_project,
    can_review_gis, can_approve_gis, can_approve_workflow,
    can_update_milestones, can_approve_project, PermissionChecker
)

from .engine_environmental import get_environmental_and_gis_data
from .engine_solar import calculate_solar_potential
from .engine_wind import calculate_wind_potential
from .engine_suitability import run_suitability_analysis
from .engine_optimization import optimize_deployment
from .engine_ml import train_ml_models, get_ml_predictions
from .notifications import evaluate_site_hazards_and_trigger_alerts
from .reports import generate_site_report, generate_csv_export, generate_html_print_report

app = FastAPI(
    title="Solar & Wind Deployment Intelligence Platform API",
    description="Backend API for environmental analysis, ML predictions, and site suitability ranking.",
    version="1.0.0"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin"],
)

# Include Authentication Router
app.include_router(auth_router, prefix="/api")

# Rate Limiting & Audit Logging Setup
import time
request_counts = {}  # IP -> list of timestamps

@app.middleware("http")
async def rate_limit_middleware(request: Request if 'Request' in globals() else Any, call_next: Any):
    from fastapi import Request
    if request.url.path.startswith("/api"):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Clean up old timestamps (older than 60s)
        timestamps = request_counts.get(client_ip, [])
        timestamps = [t for t in timestamps if now - t < 60]
        
        if len(timestamps) >= 100:  # 100 requests per minute
            from fastapi.responses import JSONResponse
            return JSONResponse(
                content={"detail": "Rate limit exceeded. Maximum 100 requests per minute."},
                status_code=429
            )
        
        timestamps.append(now)
        request_counts[client_ip] = timestamps
        
    return await call_next(request)

def log_activity(
    db: Session, 
    event: str, 
    user_email: str, 
    ip_address: Optional[str] = None, 
    status: str = "success",
    role: Optional[str] = None,
    action: Optional[str] = None,
    project_name: Optional[str] = None
):
    try:
        from .models import AuditLogModel, UserModel
        if not role and user_email:
            user = db.query(UserModel).filter(UserModel.email == user_email).first()
            if user:
                role = user.role
        log_entry = AuditLogModel(
            event=event,
            user_email=user_email,
            ip_address=ip_address,
            created_at=datetime.utcnow(),
            status=status,
            role=role,
            action=action,
            project_name=project_name
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        print(f"Failed to save activity log: {e}")

# Pydantic request models for the new workflow
class LocationAnalysisRequest(BaseModel):
    latitude: float
    longitude: float
    project_type: str = "solar"
    land_area: float = 10.0
    land_ownership: str = "Lease"

class SiteSaveRequest(BaseModel):
    name: str
    latitude: float
    longitude: float
    land_area: float
    land_ownership: str
    project_type: str = "solar"

class GISReviewRequest(BaseModel):
    gis_comments: str
    action: str

class ManagerReviewRequest(BaseModel):
    manager_comments: str
    action: str

class AdminReviewRequest(BaseModel):
    admin_comments: str
    action: str

def auto_assign_least_loaded_user(db: Session, role: str) -> Optional[int]:
    """
    Finds the active user of the specified role with the least number of currently active assigned projects.
    """
    users = db.query(UserModel).filter(UserModel.role == role, UserModel.is_active == True).all()
    if not users:
        return None
    
    least_loaded_user = None
    min_load = float('inf')
    
    for u in users:
        if role == "analyst":
            load = db.query(ProjectModel).filter(
                (ProjectModel.assigned_gis_analyst_id == u.id) | (ProjectModel.assigned_analyst_id == u.id),
                ProjectModel.is_archived == False,
                ~ProjectModel.status.in_(["Completed", "Rejected", "Draft"])
            ).count()
        elif role == "manager":
            load = db.query(ProjectModel).filter(
                (ProjectModel.assigned_project_manager_id == u.id) | (ProjectModel.assigned_manager_id == u.id),
                ProjectModel.is_archived == False,
                ~ProjectModel.status.in_(["Completed", "Rejected", "Draft"])
            ).count()
        elif role == "admin":
            load = db.query(ProjectModel).filter(
                (ProjectModel.assigned_administrator_id == u.id),
                ProjectModel.is_archived == False,
                ~ProjectModel.status.in_(["Completed", "Rejected", "Draft"])
            ).count()
        else:
            load = 0
            
        if load < min_load:
            min_load = load
            least_loaded_user = u
            
    return least_loaded_user.id if least_loaded_user else None

# Startup Event to seed database
@app.on_event("startup")
def startup_event():
    init_db()

# Root test endpoint
@app.get("/")
def read_root():
    return {"status": "operational", "service": "Solar & Wind Deployment Intelligence Platform API"}

# --- Global Dashboard Stats & Activities Endpoint ---
@app.get("/api/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    total_projects = db.query(ProjectModel).count()
    total_sites = db.query(SiteModel).count()
    total_users = db.query(UserModel).count()
    
    # Retrieve recent activities
    recent_activities = []
    latest_projects = db.query(ProjectModel).order_by(ProjectModel.created_at.desc()).limit(3).all()
    for p in latest_projects:
        recent_activities.append({
            "id": f"proj-{p.id}",
            "type": "project",
            "message": f"Project '{p.name}' was created in {p.region or 'Global'}.",
            "timestamp": p.created_at.isoformat() + "Z"
        })
        
    latest_sites = db.query(SiteModel).order_by(SiteModel.created_at.desc()).limit(3).all()
    for s in latest_sites:
        recent_activities.append({
            "id": f"site-{s.id}",
            "type": "site",
            "message": f"Site '{s.name}' registered (Score: {s.suitability_score}%).",
            "timestamp": s.created_at.isoformat() + "Z"
        })
        
    recent_activities.sort(key=lambda x: x["timestamp"], reverse=True)
    recent_activities = recent_activities[:6]
    
    return {
        "total_projects": total_projects,
        "total_sites": total_sites,
        "total_users": total_users,
        "recent_activities": recent_activities
    }

@app.get("/api/dashboard/stats")
def get_dashboard_role_stats(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    role = current_user.role
    
    if role == "admin":
        total_users = db.query(UserModel).count()
        total_projects = db.query(ProjectModel).count()
        active_projects = db.query(ProjectModel).filter(ProjectModel.status.notin_(["Draft", "Completed", "Rejected"])).count()
        pending_projects = db.query(ProjectModel).filter(ProjectModel.status.in_(["Submitted", "GIS Review", "Environmental Review", "Manager Review", "Administrator Approval"])).count()
        approved_projects = db.query(ProjectModel).filter(ProjectModel.status.in_(["Approved", "Construction", "Completed"])).count()
        rejected_projects = db.query(ProjectModel).filter(ProjectModel.status == "Rejected").count()
        reports_generated = db.query(ReportModel).count()
        
        latest_users = db.query(UserModel).order_by(UserModel.created_at.desc()).limit(5).all()
        user_activity = [{"email": u.email, "role": u.role, "joined": u.created_at.isoformat() + "Z"} for u in latest_users]
        
        recent_logins = []
        recent_login_users = db.query(UserModel).order_by(UserModel.last_login.desc()).limit(5).all()
        for u in recent_login_users:
            recent_logins.append({
                "username": u.username,
                "email": u.email,
                "role": u.role,
                "last_login": u.last_login.isoformat() + "Z"
            })
            
        return {
            "total_users": total_users,
            "total_projects": total_projects,
            "active_projects": active_projects,
            "pending_projects": pending_projects,
            "approved_projects": approved_projects,
            "rejected_projects": rejected_projects,
            "reports_generated": reports_generated,
            "user_activity": user_activity,
            "recent_logins": recent_logins
        }
        
    elif role == "analyst":
        pending_gis = db.query(ProjectModel).filter(ProjectModel.status == "Submitted").count()
        validation_queue = db.query(ProjectModel).filter(ProjectModel.assigned_analyst_id == current_user.id, ProjectModel.status == "GIS Review").count()
        env_requests = db.query(ProjectModel).filter(ProjectModel.assigned_analyst_id == current_user.id, ProjectModel.status == "Environmental Review").count()
        gis_approved = db.query(ProjectModel).filter(ProjectModel.assigned_analyst_id == current_user.id, ProjectModel.status == "Manager Review").count()
        
        return {
            "pending_gis_reviews": pending_gis,
            "site_validation_queue": validation_queue,
            "environmental_requests": env_requests,
            "gis_approval_status": gis_approved
        }
        
    elif role == "manager":
        active_pm = db.query(ProjectModel).filter(ProjectModel.assigned_manager_id == current_user.id, ProjectModel.status.in_(["Manager Review", "Administrator Approval", "Construction"])).count()
        pending_pm = db.query(ProjectModel).filter(ProjectModel.assigned_manager_id == current_user.id, ProjectModel.status == "Manager Review").count()
        
        pm_projects = db.query(ProjectModel).filter(ProjectModel.assigned_manager_id == current_user.id).all()
        avg_completion = int(sum(p.completion_percentage for p in pm_projects) / len(pm_projects)) if pm_projects else 0
        
        return {
            "active_projects": active_pm,
            "pending_approvals": pending_pm,
            "completion_percentage": avg_completion
        }
        
    else:  # planner
        my_projects = db.query(ProjectModel).filter(ProjectModel.owner_id == current_user.id).count()
        my_sites = db.query(SiteModel).join(ProjectModel).filter(ProjectModel.owner_id == current_user.id).count()
        my_reports = db.query(ReportModel).join(SiteModel).join(ProjectModel).filter(ProjectModel.owner_id == current_user.id).count()
        
        return {
            "my_projects_count": my_projects,
            "predictions_count": my_sites,
            "reports_count": my_reports,
            "saved_locations_count": my_sites
        }

# --- User Management Endpoint (Admin) ---
@app.get("/api/users/assignable", response_model=List[AssignableUserResponse])
def get_assignable_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    query = db.query(UserModel).filter(UserModel.is_active == True)
    if role:
        query = query.filter(UserModel.role == role.strip().lower())
    return query.all()

@app.get("/api/users", response_model=List[UserResponse])
def get_users_list(db: Session = Depends(get_db), current_user: UserModel = Depends(RoleChecker(["admin"]))):
    return db.query(UserModel).all()

@app.post("/api/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_by_admin(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["admin"]))
):
    db_user = db.query(UserModel).filter(UserModel.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    db_email = db.query(UserModel).filter(UserModel.email == user_in.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pass = hash_password(user_in.password)
    new_user = UserModel(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active,
        hashed_password=hashed_pass
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    log_activity(db, f"Created new user account '{new_user.username}' (Role: {new_user.role})", current_user.email, status="success", action="user_management")
    return new_user

@app.put("/api/users/{user_id}", response_model=UserResponse)
def update_user_by_admin(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["admin"]))
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    old_role = user.role
        
    if user_in.email is not None:
        dup_email = db.query(UserModel).filter(UserModel.email == user_in.email, UserModel.id != user_id).first()
        if dup_email:
            raise HTTPException(status_code=400, detail="Email already registered by another user")
        user.email = user_in.email
        
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.organization is not None:
        user.organization = user_in.organization
    if user_in.department is not None:
        user.department = user_in.department
    if user_in.designation is not None:
        user.designation = user_in.designation
    if user_in.experience is not None:
        user.experience = user_in.experience
    if user_in.phone_number is not None:
        user.phone_number = user_in.phone_number
        user.phone = user_in.phone_number
    if user_in.phone is not None:
        user.phone = user_in.phone
        user.phone_number = user_in.phone
    if user_in.country is not None:
        user.country = user_in.country
    if user_in.state is not None:
        user.state = user_in.state
    if user_in.city is not None:
        user.city = user_in.city
    if user_in.profile_picture is not None:
        user.profile_picture = user_in.profile_picture
    if user_in.google_picture is not None:
        user.google_picture = user_in.google_picture
        
    if user_in.password is not None and user_in.password != "":
        user.hashed_password = hash_password(user_in.password)
        
    db.commit()
    db.refresh(user)
    return user

@app.put("/api/users/profile", response_model=UserResponse)
def update_own_profile(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    user = current_user
    
    if user_in.role is not None and user_in.role != user.role:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot change your own role")
    if user_in.is_active is not None and user_in.is_active != user.is_active:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot change your own active status")
        
    if user_in.email is not None:
        dup_email = db.query(UserModel).filter(UserModel.email == user_in.email, UserModel.id != user.id).first()
        if dup_email:
            raise HTTPException(status_code=400, detail="Email already registered by another user")
        user.email = user_in.email
        
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.organization is not None:
        user.organization = user_in.organization
    if user_in.department is not None:
        user.department = user_in.department
    if user_in.designation is not None:
        user.designation = user_in.designation
    if user_in.experience is not None:
        user.experience = user_in.experience
    if user_in.phone_number is not None:
        user.phone_number = user_in.phone_number
        user.phone = user_in.phone_number
    if user_in.phone is not None:
        user.phone = user_in.phone
        user.phone_number = user_in.phone
    if user_in.country is not None:
        user.country = user_in.country
    if user_in.state is not None:
        user.state = user_in.state
    if user_in.city is not None:
        user.city = user_in.city
    if user_in.profile_picture is not None:
        user.profile_picture = user_in.profile_picture
    if user_in.google_picture is not None:
        user.google_picture = user_in.google_picture
    if user_in.skills is not None:
        user.skills = user_in.skills
    if user_in.education is not None:
        user.education = user_in.education
    if user_in.linkedin is not None:
        user.linkedin = user_in.linkedin
        user.linkedin_url = user_in.linkedin
    if user_in.linkedin_url is not None:
        user.linkedin_url = user_in.linkedin_url
        user.linkedin = user_in.linkedin_url
    if user_in.github is not None:
        user.github = user_in.github
        user.github_url = user_in.github
    if user_in.github_url is not None:
        user.github_url = user_in.github_url
        user.github = user_in.github_url
        
    if user_in.password is not None and user_in.password != "":
        try:
            UserCreate.password_validation(user_in.password)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        user.hashed_password = hash_password(user_in.password)
        
    db.commit()
    db.refresh(user)
    log_activity(db, f"Updated user account '{user.username}' details", current_user.email, status="success", action="user_management")
    if user_in.role is not None and user_in.role != old_role:
        log_activity(db, f"Changed role of user '{user.username}' from '{old_role}' to '{user_in.role}'", current_user.email, status="success", action="role_change")
    return user

@app.get("/api/users/profile/stats")
def get_own_profile_stats(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    total_projects = db.query(ProjectModel).filter(ProjectModel.owner_id == current_user.id).count()
    total_sites = db.query(SiteModel).join(ProjectModel).filter(ProjectModel.owner_id == current_user.id).count()
    reports_generated = db.query(ReportModel).join(SiteModel).join(ProjectModel).filter(ProjectModel.owner_id == current_user.id).count()
    
    return {
        "total_projects": total_projects,
        "predictions_completed": total_sites,
        "reports_generated": reports_generated
    }

@app.delete("/api/users/{user_id}")
def delete_user_by_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["admin"]))
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Admins cannot delete their own account")
        
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

# Centralized GIS Analyst Projects Query Helper (Single Source of Truth)
def get_gis_analyst_projects_query(db: Session, analyst_id: int):
    return db.query(ProjectModel).filter(
        ((ProjectModel.assigned_gis_analyst_id == analyst_id) | (ProjectModel.assigned_analyst_id == analyst_id)),
        ProjectModel.status.in_(["Submitted", "GIS Review"]),
        ProjectModel.is_archived == False
    ).order_by(ProjectModel.submitted_at.desc())

# Centralized Project Manager Projects Query Helper (Single Source of Truth)
def get_project_manager_projects_query(db: Session, manager_id: int):
    return db.query(ProjectModel).filter(
        ((ProjectModel.assigned_project_manager_id == manager_id) | (ProjectModel.assigned_manager_id == manager_id)),
        ProjectModel.status.in_(["Manager Review", "Manager Approved", "Manager Rejected"]),
        ProjectModel.is_archived == False
    ).order_by(ProjectModel.submitted_at.desc())

# --- GIS Analyst Dedicated Endpoints ---
@app.get("/api/gis/dashboard")
def get_gis_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["analyst", "admin"]))
):
    # Use centralized helper
    analyst_projects = get_gis_analyst_projects_query(db, current_user.id).all()
    pending_count = len(analyst_projects)
    
    # Approved count
    approved_count = db.query(ProjectModel).filter(
        ((ProjectModel.assigned_gis_analyst_id == current_user.id) | (ProjectModel.assigned_analyst_id == current_user.id)),
        ProjectModel.gis_approved_at.isnot(None),
        ProjectModel.is_archived == False
    ).count()
    
    # Rejected count
    rejected_count = db.query(ProjectModel).filter(
        ((ProjectModel.assigned_gis_analyst_id == current_user.id) | (ProjectModel.assigned_analyst_id == current_user.id)),
        ProjectModel.gis_rejected_at.isnot(None),
        ProjectModel.is_archived == False
    ).count()
    
    # Assigned sites count
    assigned_projects_ids = [p.id for p in analyst_projects]
    sites_count = db.query(SiteModel).filter(SiteModel.project_id.in_(assigned_projects_ids)).count() if assigned_projects_ids else 0
    
    # Recent Activities: Fetch latest 5 notifications
    notifications = db.query(NotificationModel).filter(
        NotificationModel.user_id == current_user.id
    ).order_by(NotificationModel.created_at.desc()).limit(5).all()
    
    recent_activities = []
    for n in notifications:
        recent_activities.append({
            "id": n.id,
            "message": n.message,
            "created_at": n.created_at
        })
        
    # Latest assigned projects
    latest_projects_serialized = []
    for lp in analyst_projects[:5]:
        latest_projects_serialized.append({
            "id": lp.id,
            "name": lp.name,
            "status": lp.status,
            "assignment_date": lp.assignment_date or lp.gis_assigned_at
        })
        
    # Log: Dashboard Query Result Count, Logged-in GIS Analyst ID
    print(f"\n[GIS DEBUG] Logged-in GIS Analyst ID: {current_user.id}, Dashboard Query Result Count: {pending_count}\n")
        
    return {
        "pending_reviews_count": pending_count,
        "approved_reviews_count": approved_count,
        "rejected_reviews_count": rejected_count,
        "assigned_sites_count": sites_count,
        "average_review_time": "2.4 Hours",
        "recent_activities": recent_activities,
        "latest_assigned_projects": latest_projects_serialized
    }

@app.get("/api/gis/reviews", response_model=List[ProjectResponse])
def get_gis_reviews(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["analyst", "admin"]))
):
    # Use centralized helper
    returned_projects = get_gis_analyst_projects_query(db, current_user.id).all()
    
    # Log details
    notif_count = db.query(NotificationModel).filter(NotificationModel.user_id == current_user.id).count()
    for p in returned_projects:
        print(f"\n[GIS DEBUG] Project ID: {p.id}, Project Status: {p.status}, Deleted Flag: {p.is_archived}, Owner ID: {p.owner_id}, Assigned GIS Analyst ID: {p.assigned_gis_analyst_id}, Current Logged-in GIS Analyst ID: {current_user.id}\n")
        
    print(f"\n[GIS DEBUG] GIS Review Query Result Count: {len(returned_projects)}, Notification Count: {notif_count}\n")
    
    return returned_projects

@app.get("/api/gis/sites", response_model=List[SiteResponse])
def get_gis_sites(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["analyst", "admin"]))
):
    # Use centralized helper
    analyst_projects = get_gis_analyst_projects_query(db, current_user.id).all()
    assigned_projects_ids = [p.id for p in analyst_projects]
    if not assigned_projects_ids:
        print(f"\n[GIS DEBUG] Logged-in GIS Analyst ID: {current_user.id}, Assigned Sites Query Result Count: 0\n")
        return []
        
    returned_sites = db.query(SiteModel).filter(SiteModel.project_id.in_(assigned_projects_ids)).all()
    print(f"\n[GIS DEBUG] Logged-in GIS Analyst ID: {current_user.id}, Assigned Sites Query Result Count: {len(returned_sites)}\n")
    return returned_sites

# --- Project Manager Dedicated Endpoints ---
@app.get("/api/manager/dashboard")
def get_manager_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["manager", "admin"]))
):
    pm_projects = get_project_manager_projects_query(db, current_user.id).all()
    pending_count = sum(1 for p in pm_projects if p.status == "Manager Review")
    completed_count = sum(1 for p in pm_projects if p.status == "Manager Approved")
    rejected_count = sum(1 for p in pm_projects if p.status == "Manager Rejected")
    assigned_count = len(pm_projects)
    
    # Recent Activities: Fetch latest 5 notifications
    notifications = db.query(NotificationModel).filter(
        NotificationModel.user_id == current_user.id
    ).order_by(NotificationModel.created_at.desc()).limit(5).all()
    
    recent_activities = []
    for n in notifications:
        recent_activities.append({
            "id": n.id,
            "message": n.message,
            "created_at": n.created_at
        })
        
    print(f"\n[PM DEBUG] Logged-in Project Manager ID: {current_user.id}, Manager Dashboard Query Count: {assigned_count}\n")
        
    return {
        "pending_reviews_count": pending_count,
        "completed_reviews_count": completed_count,
        "rejected_reviews_count": rejected_count,
        "assigned_projects_count": assigned_count,
        "recent_activities": recent_activities,
        "latest_assigned_projects": [
            {
                "id": p.id,
                "name": p.name,
                "status": p.status,
                "assignment_date": p.assignment_date or p.manager_assigned_at
            } for p in pm_projects[:5]
        ]
    }

@app.get("/api/manager/projects", response_model=List[ProjectResponse])
def get_manager_projects(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["manager", "admin"]))
):
    returned_projects = get_project_manager_projects_query(db, current_user.id).all()
    print(f"\n[PM DEBUG] Project ID: N/A, Status: N/A, Assigned Project Manager ID: N/A, Current Logged-in Project Manager ID: {current_user.id}, Dashboard Query Count: {len(returned_projects)}\n")
    return returned_projects

@app.get("/api/manager/workflow", response_model=List[ProjectResponse])
def get_manager_workflow(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["manager", "admin"]))
):
    returned_projects = get_project_manager_projects_query(db, current_user.id).all()
    for p in returned_projects:
        print(f"\n[PM DEBUG] Project ID: {p.id}, Status: {p.status}, Assigned Project Manager ID: {p.assigned_project_manager_id}, Current Logged-in Project Manager ID: {current_user.id}, Workflow Query Count: {len(returned_projects)}\n")
    return returned_projects

@app.get("/api/manager/milestones", response_model=List[ProjectResponse])
def get_manager_milestones(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["manager", "admin"]))
):
    returned_projects = get_project_manager_projects_query(db, current_user.id).all()
    print(f"\n[PM DEBUG] Logged-in Project Manager ID: {current_user.id}, Milestones Query Count: {len(returned_projects)}\n")
    return returned_projects

# --- Project Management Endpoints ---
@app.get("/api/projects", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(ProjectModel).filter(ProjectModel.is_archived == False).all()
    elif current_user.role == "analyst":
        # Use centralized helper
        return get_gis_analyst_projects_query(db, current_user.id).all()
    elif current_user.role == "manager":
        # Use centralized helper
        return get_project_manager_projects_query(db, current_user.id).all()
    return db.query(ProjectModel).filter(ProjectModel.owner_id == current_user.id, ProjectModel.is_archived == False).all()

@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
def get_project_by_id(project_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id, ProjectModel.is_archived == False).first()
    
    # Debug logging:
    print(f"\n[GET PROJECT DEBUG] Requested Project ID: {project_id}, Current User ID: {current_user.id}, Current User Role: {current_user.role}, Project Owner ID: {project.owner_id if project else 'N/A'}, Assigned GIS Analyst ID: {project.assigned_gis_analyst_id if project else 'N/A'}, Assigned Project Manager ID: {project.assigned_project_manager_id if project else 'N/A'}, Project Status: {project.status if project else 'N/A'}, Deleted Flag: {project.is_archived if project else 'N/A'}\n")

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or invalid project ID."
        )
        
    # Read-only access is allowed to all logged-in roles to support notifications and details previews
    return project

@app.post("/api/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate, 
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(PermissionChecker("create_project"))
):
    default_milestones = [
        {"name": "Draft Planning", "completed": True},
        {"name": "GIS Coordinate Validation", "completed": False},
        {"name": "Environmental Constraints Check", "completed": False},
        {"name": "Project Manager Assessment", "completed": False},
        {"name": "Administrator Approval", "completed": False},
        {"name": "Civil Construction Siting", "completed": False},
        {"name": "Grid Connection & Commissioning", "completed": False}
    ]
    
    project = ProjectModel(
        name=project_in.name,
        region=project_in.region,
        description=project_in.description,
        country=project_in.country,
        renewable_type=project_in.renewable_type,
        owner_id=current_user.id,
        status="Draft",
        milestones=json.dumps(default_milestones),
        completion_percentage=14,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # Log audit and trigger notification
    log_activity(db, f"Created project '{project.name}'", current_user.email, status="success")
    from .notifications import create_system_notification
    create_system_notification(db, project.id, "system", f"Project Created: '{project.name}' created successfully.")
    
    return project

def update_milestones_status(project: ProjectModel, milestone_name: str, completed: bool = True):
    try:
        milestones = json.loads(project.milestones) if project.milestones else []
        for m in milestones:
            if m["name"] == milestone_name:
                m["completed"] = completed
                break
        project.milestones = json.dumps(milestones)
        completed_count = sum(1 for m in milestones if m["completed"])
        project.completion_percentage = int((completed_count / len(milestones)) * 100) if milestones else 0
    except Exception as e:
        print(f"Error updating milestones: {e}")

@app.put("/api/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project.status == "Completed":
        raise HTTPException(status_code=403, detail="Forbidden: Completed projects are locked and read-only")
        
    # Permission check: Admin, Owner, Assigned Analyst, Assigned PM
    is_assigned = False
    if current_user.role == "admin":
        is_assigned = True
    elif current_user.role == "planner" and project.owner_id == current_user.id:
        is_assigned = True
    elif current_user.role == "analyst" and (project.assigned_gis_analyst_id == current_user.id or project.assigned_analyst_id == current_user.id):
        is_assigned = True
    elif current_user.role == "manager" and (project.assigned_project_manager_id == current_user.id or project.assigned_manager_id == current_user.id):
        is_assigned = True
        
    if not is_assigned:
        raise HTTPException(status_code=403, detail="Forbidden: You are not assigned to this project")
        
    from .notifications import create_system_notification
    
    # 1. Planner Siting Actions
    if current_user.role == "planner":
        if project.status != "Draft":
            raise HTTPException(status_code=403, detail="Forbidden: Planners can only edit Draft projects")
        if project_in.status is not None and project_in.status != project.status:
            raise HTTPException(status_code=403, detail="Forbidden: Planners must use the submit endpoint to submit projects")
            
    # 2. GIS Analyst Actions (Save Comments)
    elif current_user.role == "analyst":
        if project_in.gis_comments is not None:
            project.gis_comments = project_in.gis_comments
                
    # 3. Project Manager Assessment Actions (Toggle Milestones)
    elif current_user.role == "manager":
        # Project Managers can check off milestones
        if project_in.milestones is not None:
            project.milestones = project_in.milestones
            # Recalculate completion percentage
            try:
                m_list = json.loads(project_in.milestones)
                completed_count = sum(1 for m in m_list if m.get("completed"))
                project.completion_percentage = int((completed_count / len(m_list)) * 100) if m_list else 0
            except Exception:
                pass
                
    # 4. Administrator Final Decision Actions
    elif current_user.role == "admin":
        if project_in.status is not None:
            project.status = project_in.status
        if project_in.review_comments is not None:
            project.review_comments = project_in.review_comments
        if project_in.is_archived is not None:
            project.is_archived = project_in.is_archived
        if project_in.assigned_analyst_id is not None:
            # Verify user role
            analyst = db.query(UserModel).filter(UserModel.id == project_in.assigned_analyst_id).first()
            if analyst and analyst.role != "analyst":
                raise HTTPException(status_code=400, detail="User is not a GIS Analyst")
            project.assigned_analyst_id = project_in.assigned_analyst_id
            project.assigned_gis_analyst_id = project_in.assigned_analyst_id
        if project_in.assigned_manager_id is not None:
            # Verify user role
            manager = db.query(UserModel).filter(UserModel.id == project_in.assigned_manager_id).first()
            if manager and manager.role != "manager":
                raise HTTPException(status_code=400, detail="User is not a Project Manager")
            project.assigned_manager_id = project_in.assigned_manager_id
            project.assigned_project_manager_id = project_in.assigned_manager_id

    # Apply details updates if Admin or Draft
    if project.status == "Draft" or can_approve_project(current_user):
        if project_in.name is not None:
            project.name = project_in.name
        if project_in.region is not None:
            project.region = project_in.region
        if project_in.description is not None:
            project.description = project_in.description
        if project_in.country is not None:
            project.country = project_in.country
        if project_in.renewable_type is not None:
            project.renewable_type = project_in.renewable_type

            
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    return project

class ProjectAssignRequest(BaseModel):
    assigned_analyst_id: Optional[int] = None
    assigned_manager_id: Optional[int] = None
    assigned_administrator_id: Optional[int] = None

@app.post("/api/projects/{project_id}/assign", response_model=ProjectResponse)
def assign_project_roles(
    project_id: int,
    req: ProjectAssignRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["admin"]))
):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    from .notifications import create_system_notification
    
    if req.assigned_analyst_id is not None:
        analyst = db.query(UserModel).filter(UserModel.id == req.assigned_analyst_id).first()
        if analyst:
            if analyst.role != "analyst":
                raise HTTPException(status_code=400, detail="User is not a GIS Analyst")
            project.assigned_analyst_id = req.assigned_analyst_id
            project.assigned_gis_analyst_id = req.assigned_analyst_id
            project.gis_assigned_at = datetime.utcnow()
            project.assignment_date = datetime.utcnow()
            log_activity(db, f"Assigned GIS analyst '{analyst.username}' to project '{project.name}'", current_user.email, status="success")
            create_system_notification(db, project.id, "system", f"You have been assigned to review project '{project.name}'.", user_id=analyst.id)
            # Move to GIS Review state automatically upon assignment
            project.status = "GIS Review"
            
    if req.assigned_manager_id is not None:
        manager = db.query(UserModel).filter(UserModel.id == req.assigned_manager_id).first()
        if manager:
            if manager.role != "manager":
                raise HTTPException(status_code=400, detail="User is not a Project Manager")
            project.assigned_manager_id = req.assigned_manager_id
            project.assigned_project_manager_id = req.assigned_manager_id
            project.manager_assigned_at = datetime.utcnow()
            project.assignment_date = datetime.utcnow()
            log_activity(db, f"Assigned project manager '{manager.username}' to project '{project.name}'", current_user.email, status="success")
            create_system_notification(db, project.id, "system", f"You have been assigned as Project Manager for project '{project.name}'.", user_id=manager.id)
            # Move to Manager Review state automatically upon assignment
            project.status = "Manager Review"

    if req.assigned_administrator_id is not None:
        admin = db.query(UserModel).filter(UserModel.id == req.assigned_administrator_id).first()
        if admin:
            if admin.role != "admin":
                raise HTTPException(status_code=400, detail="User is not an Administrator")
            project.assigned_administrator_id = req.assigned_administrator_id
            project.admin_assigned_at = datetime.utcnow()
            project.assignment_date = datetime.utcnow()
            log_activity(db, f"Assigned administrator '{admin.username}' to project '{project.name}'", current_user.email, status="success")
            create_system_notification(db, project.id, "system", f"You have been assigned to final approve project '{project.name}'.", user_id=admin.id)
            # Move to Admin Review state automatically upon assignment
            project.status = "Admin Review"
            
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    return project

@app.post("/api/projects/{project_id}/claim", response_model=ProjectResponse)
def claim_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id, ProjectModel.is_archived == False).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    from .notifications import create_system_notification
    
    if current_user.role == "analyst":
        if project.status not in ["Submitted", "GIS Review"]:
            raise HTTPException(status_code=400, detail="Cannot claim project in this status.")
        if project.assigned_analyst_id is not None and project.assigned_analyst_id != current_user.id:
            raise HTTPException(status_code=400, detail="Project already assigned to another GIS Analyst.")
        project.assigned_analyst_id = current_user.id
        project.assigned_gis_analyst_id = current_user.id
        project.gis_assigned_at = datetime.utcnow()
        project.assignment_date = datetime.utcnow()
        project.status = "GIS Review"
        log_activity(db, f"Claimed GIS Analyst review for project '{project.name}'", current_user.email, status="success", action="role_change", project_name=project.name)
        create_system_notification(db, project.id, "system", f"GIS Analyst '{current_user.username}' claimed project '{project.name}' for review.", user_id=project.owner_id)
        
    elif current_user.role == "manager":
        if project.status not in ["Manager Review", "GIS Approved"]:
            raise HTTPException(status_code=400, detail="Cannot claim project in this status.")
        if project.assigned_manager_id is not None and project.assigned_manager_id != current_user.id:
            raise HTTPException(status_code=400, detail="Project already assigned to another Project Manager.")
        project.assigned_manager_id = current_user.id
        project.assigned_project_manager_id = current_user.id
        project.manager_assigned_at = datetime.utcnow()
        project.assignment_date = datetime.utcnow()
        project.status = "Manager Review"
        log_activity(db, f"Claimed Project Manager review for project '{project.name}'", current_user.email, status="success", action="role_change", project_name=project.name)
        create_system_notification(db, project.id, "system", f"Project Manager '{current_user.username}' claimed project '{project.name}' for review.", user_id=project.owner_id)
        
    else:
        raise HTTPException(status_code=403, detail="Forbidden: Only GIS Analysts and Project Managers can claim projects.")
        
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    return project

@app.post("/api/projects/{project_id}/release", response_model=ProjectResponse)
def release_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id, ProjectModel.is_archived == False).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    from .notifications import create_system_notification
    
    if current_user.role == "analyst":
        if project.assigned_analyst_id != current_user.id and project.assigned_gis_analyst_id != current_user.id:
            raise HTTPException(status_code=400, detail="You are not the assigned analyst for this project.")
        project.assigned_analyst_id = None
        project.assigned_gis_analyst_id = None
        project.status = "Submitted"
        log_activity(db, f"Released GIS Analyst review for project '{project.name}'", current_user.email, status="success", action="role_change", project_name=project.name)
        create_system_notification(db, project.id, "system", f"GIS Analyst '{current_user.username}' released project '{project.name}' review assignment.", user_id=project.owner_id)
        
    elif current_user.role == "manager":
        if project.assigned_manager_id != current_user.id and project.assigned_project_manager_id != current_user.id:
            raise HTTPException(status_code=400, detail="You are not the assigned manager for this project.")
        project.assigned_manager_id = None
        project.assigned_project_manager_id = None
        # Leave status in Manager Review (or change to GIS Approved)
        project.status = "Manager Review"
        log_activity(db, f"Released Project Manager review for project '{project.name}'", current_user.email, status="success", action="role_change", project_name=project.name)
        create_system_notification(db, project.id, "system", f"Project Manager '{current_user.username}' released project '{project.name}' review assignment.", user_id=project.owner_id)
        
    else:
        raise HTTPException(status_code=403, detail="Forbidden: Only GIS Analysts and Project Managers can release projects.")
        
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    return project

@app.post("/api/projects/{project_id}/submit", response_model=ProjectResponse)
def submit_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    status_before = project.status if project else "None"
    
    def log_denial(reason: str):
        print(f"[SUBMIT DENIAL DEBUG] Current User ID: {current_user.id}, Username: {current_user.username}, User Role: {current_user.role}, Project ID: {project_id}, Project Owner ID: {project.owner_id if project else 'N/A'}, Project Status: {project.status if project else 'N/A'}, Permission Check Result: False, Exact Reason for Denial: {reason}")

    # 1. RBAC check
    if current_user.role not in ["planner", "admin"]:
        log_denial("Unauthorized role")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized role."
        )

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. Ownership check (admin bypasses)
    if current_user.role != "admin" and project.owner_id != current_user.id:
        log_denial("User does not own the project")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit your own Draft projects."
        )

    # 3. Status checks (admin bypasses)
    if project.status == "Submitted":
        log_denial("Project has already been submitted")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project has already been submitted."
        )

    if current_user.role != "admin" and project.status not in ["Draft", "GIS Rejected", "Manager Rejected", "Rejected"]:
        log_denial("Project cannot be submitted in its current status")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project cannot be submitted in its current status."
        )
        
    project.status = "Submitted"
    project.submitted_at = datetime.utcnow()
    
    # Clear old review comments & dates
    project.gis_comments = None
    project.manager_comments = None
    project.admin_comments = None
    project.gis_reviewed_at = None
    project.manager_reviewed_at = None
    project.admin_reviewed_at = None
    project.gis_approved_at = None
    project.manager_approved_at = None
    project.admin_approved_at = None
    project.gis_rejected_at = None
    project.manager_rejected_at = None
    project.admin_rejected_at = None
    
    # Auto-assign an available GIS Analyst
    gis_id = auto_assign_least_loaded_user(db, "analyst")
    if gis_id:
        project.assigned_analyst_id = gis_id
        project.assigned_gis_analyst_id = gis_id
        project.gis_assigned_at = datetime.utcnow()
        project.assignment_date = datetime.utcnow()
    project.status = "Submitted"
    
    # Recalculate milestones: set Draft Planning to True, others False
    update_milestones_status(project, "Draft Planning", True)
    update_milestones_status(project, "GIS Coordinate Validation", False)
    update_milestones_status(project, "Environmental Constraints Check", False)
    update_milestones_status(project, "Project Manager Assessment", False)
    update_milestones_status(project, "Administrator Approval", False)
    update_milestones_status(project, "Civil Construction Siting", False)
    update_milestones_status(project, "Grid Connection & Commissioning", False)
    
    try:
        m_list = json.loads(project.milestones)
        completed_count = sum(1 for m in m_list if m.get("completed"))
        project.completion_percentage = int((completed_count / len(m_list)) * 100) if m_list else 14
    except Exception:
        project.completion_percentage = 14

    try:
        project.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(project)
        
        from .notifications import create_system_notification
        # Planner notification
        create_system_notification(
            db, project.id, "system", 
            f"Project: {project.name} | Status: Submitted | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: Project submitted successfully.", 
            user_id=current_user.id
        )
        
        if gis_id:
            # Planner notification about assignment
            create_system_notification(
                db, project.id, "system", 
                f"Project: {project.name} | Status: Submitted | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: Automatically routed to GIS Analyst.", 
                user_id=current_user.id
            )
            # GIS Analyst target notification: Title: New GIS Review Assigned Message: Planner has submitted Project <Project Name> for GIS validation
            create_system_notification(
                db, project.id, "system", 
                f"New GIS Review Assigned: Planner has submitted Project '{project.name}' for GIS validation.", 
                user_id=gis_id
            )
        else:
            # GIS Analyst target notifications (role-specific)
            create_system_notification(
                db, project.id, "system", 
                f"Project: {project.name} | Status: Submitted | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: New project submitted. Awaiting GIS Analyst assignment.", 
                recipient_role="analyst"
            )
            
        # Admin notification
        create_system_notification(
            db, project.id, "system", 
            f"Project: {project.name} | Status: Submitted | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: Project submitted by Planner. Ready for GIS Analyst assignment.", 
            recipient_role="admin"
        )
        
        # Audit logs
        log_activity(db, f"Submitted project '{project.name}' for GIS review", current_user.email, status="success", action="submit_project", project_name=project.name)
        if gis_id:
            log_activity(db, f"GIS Analyst automatically assigned to project '{project.name}'", current_user.email, status="success", action="assign_role", project_name=project.name)
            
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error during project submit transaction: {e}")
        raise HTTPException(status_code=500, detail="Database transaction failed during submit.")
        
    # Get GIS analyst name
    assigned_gis_analyst_name = "None"
    if gis_id:
        gis_user = db.query(UserModel).filter(UserModel.id == gis_id).first()
        assigned_gis_analyst_name = gis_user.username if gis_user else "None"
        
    print(f"\n[PLANNER SUBMIT DEBUG] Project ID: {project.id}, Planner ID: {current_user.id}, Planner Role: {current_user.role}, Assigned GIS Analyst ID: {gis_id or 'None'}, Assigned GIS Analyst Name: {assigned_gis_analyst_name}, Project Status Before: {status_before}, Project Status After: {project.status}, Notification Created: True, Audit Log Created: True\n")
    
    return project

@app.post("/api/projects/{project_id}/gis-review", response_model=ProjectResponse)
def gis_review_project(
    project_id: int,
    req: GISReviewRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(PermissionChecker("review_gis"))
):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.assigned_analyst_id != current_user.id and project.assigned_gis_analyst_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You are not assigned to review this project")
    if project.status not in ["Submitted", "GIS Review"]:
        raise HTTPException(status_code=403, detail="Forbidden: Project must be in Submitted or GIS Review status")
        
    try:
        project.gis_comments = req.gis_comments
        project.gis_reviewed_at = datetime.utcnow()
        
        from .notifications import create_system_notification
        if req.action == "approve":
            project.status = "Manager Review"
            project.gis_approved_at = datetime.utcnow()
            update_milestones_status(project, "GIS Coordinate Validation", True)
            update_milestones_status(project, "Environmental Constraints Check", True)
            
            # Auto-assign an available Project Manager
            pm_id = auto_assign_least_loaded_user(db, "manager")
            if pm_id:
                project.assigned_manager_id = pm_id
                project.assigned_project_manager_id = pm_id
                project.manager_assigned_at = datetime.utcnow()
                project.assignment_date = datetime.utcnow()
                
            # Target PMs
            if pm_id:
                create_system_notification(
                    db, project.id, "system", 
                    f"Project: {project.name} | Status: Manager Review | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: You have been automatically assigned to review project.", 
                    user_id=pm_id
                )
            else:
                create_system_notification(
                    db, project.id, "system", 
                    f"Project: {project.name} | Status: Manager Review | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: Project has been GIS approved. Awaiting PM assignment.", 
                    recipient_role="manager"
                )
                
            # Planner notification
            create_system_notification(
                db, project.id, "system", 
                f"Project: {project.name} | Status: GIS Approved | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: Your project passed GIS review.", 
                user_id=project.owner_id
            )
            # Admin notification
            create_system_notification(
                db, project.id, "system", 
                f"Project: {project.name} | Status: GIS Approved | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: Project approved by GIS. Ready for PM assignment.", 
                recipient_role="admin"
            )
            log_activity(db, f"Approved GIS review for project '{project.name}'", current_user.email, status="success")
        else:
            project.status = "GIS Rejected"
            project.gis_rejected_at = datetime.utcnow()
            update_milestones_status(project, "GIS Coordinate Validation", False)
            update_milestones_status(project, "Environmental Constraints Check", False)
            
            # Planner notification
            create_system_notification(
                db, project.id, "system", 
                f"Project: {project.name} | Status: GIS Rejected | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: {req.gis_comments}", 
                user_id=project.owner_id
            )
            log_activity(db, f"Rejected GIS review for project '{project.name}'", current_user.email, status="warning")
            
        try:
            m_list = json.loads(project.milestones)
            completed_count = sum(1 for m in m_list if m.get("completed"))
            project.completion_percentage = int((completed_count / len(m_list)) * 100) if m_list else 14
        except Exception:
            pass
            
        project.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(project)
    except Exception as e:
        db.rollback()
        print(f"Error during GIS review transaction: {e}")
        raise HTTPException(status_code=500, detail="Database transaction failed during GIS review.")
        
    return project

@app.post("/api/projects/{project_id}/manager-review", response_model=ProjectResponse)
def manager_review_project(
    project_id: int,
    req: ManagerReviewRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(PermissionChecker("workflow_review"))
):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.assigned_manager_id != current_user.id and project.assigned_project_manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You are not assigned as manager for this project")
    if project.status not in ["GIS Approved", "Manager Review"]:
        raise HTTPException(status_code=403, detail="Forbidden: Project must be GIS Approved or in Manager Review status")
        
    project.manager_comments = req.manager_comments
    project.manager_reviewed_at = datetime.utcnow()
    
    from .notifications import create_system_notification
    if req.action == "approve":
        project.status = "Manager Approved"
        project.manager_approved_at = datetime.utcnow()
        update_milestones_status(project, "Project Manager Assessment", True)
        
        # Auto-assign an available Administrator
        admin_id = auto_assign_least_loaded_user(db, "admin")
        if admin_id:
            project.assigned_administrator_id = admin_id
            project.admin_assigned_at = datetime.utcnow()
            project.assignment_date = datetime.utcnow()
            project.status = "Admin Review"
            
        # Target Admins
        if admin_id:
            create_system_notification(
                db, project.id, "system", 
                f"Project: {project.name} | Status: Admin Review | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: You have been automatically assigned to review project.", 
                user_id=admin_id
            )
        else:
            create_system_notification(
                db, project.id, "system", 
                f"Project: {project.name} | Status: Manager Approved | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: Project has been PM approved and is ready for final sign-off.", 
                recipient_role="admin"
            )
            
        # Planner notification
        create_system_notification(
            db, project.id, "system", 
            f"Project: {project.name} | Status: Manager Approved | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: Your project passed PM review successfully.", 
            user_id=project.owner_id
        )
        log_activity(db, f"Approved PM review for project '{project.name}'", current_user.email, status="success")
    else:
        project.status = "Manager Rejected"
        project.manager_rejected_at = datetime.utcnow()
        update_milestones_status(project, "Project Manager Assessment", False)
        
        # Planner notification
        create_system_notification(
            db, project.id, "system", 
            f"Project: {project.name} | Status: Manager Rejected | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: {req.manager_comments}", 
            user_id=project.owner_id
        )
        log_activity(db, f"Rejected PM review for project '{project.name}'", current_user.email, status="warning")
        
    try:
        m_list = json.loads(project.milestones)
        completed_count = sum(1 for m in m_list if m.get("completed"))
        project.completion_percentage = int((completed_count / len(m_list)) * 100) if m_list else 14
    except Exception:
        pass
        
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    return project

@app.post("/api/projects/{project_id}/admin-review", response_model=ProjectResponse)
def admin_review_project(
    project_id: int,
    req: AdminReviewRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(PermissionChecker("approve_project"))
):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.assigned_administrator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You are not assigned to review this project")
    if project.status not in ["Manager Approved", "Admin Review"]:
        raise HTTPException(status_code=403, detail="Forbidden: Project must be Manager Approved or in Admin Review status")
        
    project.admin_comments = req.admin_comments
    project.admin_reviewed_at = datetime.utcnow()
    project.assigned_administrator_id = current_user.id
    
    from .notifications import create_system_notification
    if req.action == "approve":
        project.status = "Completed"
        project.admin_approved_at = datetime.utcnow()
        project.completed_at = datetime.utcnow()
        update_milestones_status(project, "Administrator Approval", True)
        update_milestones_status(project, "Civil Construction Siting", True)
        update_milestones_status(project, "Grid Connection & Commissioning", True)
        project.completion_percentage = 100
        
        # Planner notification
        create_system_notification(
            db, project.id, "system", 
            f"Project: {project.name} | Status: Completed | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: {req.admin_comments}", 
            user_id=project.owner_id
        )
        log_activity(db, f"Granted final Administrator approval for project '{project.name}'", current_user.email, status="success")
    else:
        project.status = "Rejected"
        project.admin_rejected_at = datetime.utcnow()
        update_milestones_status(project, "Administrator Approval", False)
        
        # Planner notification
        create_system_notification(
            db, project.id, "system", 
            f"Project: {project.name} | Status: Rejected | Date: {datetime.utcnow().strftime('%Y-%m-%d')} | User: {current_user.username} | Comments: {req.admin_comments}", 
            user_id=project.owner_id
        )
        log_activity(db, f"Rejected final approval for project '{project.name}'", current_user.email, status="warning")
        
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    return project

@app.delete("/api/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int, 
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    
    def log_delete_attempt(allowed: bool, reason: str = ""):
        print(f"\n[DELETE PROJECT DEBUG] Project ID: {project_id}, Current User: {current_user.username if current_user else 'N/A'}, Role: {current_user.role if current_user else 'N/A'}, Project Owner: {project.owner_id if project else 'N/A'}, Status: {project.status if project else 'N/A'}, Delete Allowed: {allowed}, Reason: {reason}\n")

    if not project:
        log_delete_attempt(False, "Project not found")
        raise HTTPException(status_code=404, detail="Project not found")
        
    if current_user.role not in ["planner", "admin"]:
        log_delete_attempt(False, f"Role '{current_user.role}' not authorized")
        raise HTTPException(status_code=403, detail="Unauthorized role.")
        
    if current_user.role != "admin" and project.owner_id != current_user.id:
        log_delete_attempt(False, "User does not own this project")
        raise HTTPException(status_code=403, detail="You can only delete your own Draft projects.")
        
    if current_user.role == "planner" and project.status != "Draft":
        log_delete_attempt(False, f"Project status is '{project.status}', cannot delete")
        raise HTTPException(status_code=403, detail="This project has already entered the workflow and cannot be deleted.")
        
    log_delete_attempt(True)
    
    print(f"\n[GIS DEBUG] Project ID: {project.id}, Project Status: {project.status}, Deleted Flag: True, Owner ID: {project.owner_id}, Assigned GIS Analyst ID: {project.assigned_gis_analyst_id}, Current Logged-in GIS Analyst ID: {current_user.id}\n")
    
    try:
        # Delete related notifications first
        db.query(NotificationModel).filter(NotificationModel.project_id == project_id).delete()
        db.delete(project)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error during project delete transaction: {e}")
        raise HTTPException(status_code=500, detail="Database transaction failed during delete.")
    return

# --- Site Management & Intelligence Endpoints ---
@app.get("/api/sites", response_model=List[SiteResponse])
def get_sites(
    project_id: Optional[int] = None, 
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    query = db.query(SiteModel)
    if current_user.role != "admin":
        query = query.join(ProjectModel).filter(ProjectModel.owner_id == current_user.id)
    if project_id is not None:
        query = query.filter(SiteModel.project_id == project_id)
    return query.all()

def run_full_site_assessment(env_data: dict, project_type: str, land_area: float) -> dict:
    solar_results = calculate_solar_potential(env_data, land_area=land_area)
    wind_results = calculate_wind_potential(env_data, land_area=land_area)
    suitability_results = run_suitability_analysis(env_data, solar_results, wind_results, project_type)
    opt_results = optimize_deployment(env_data, solar_results, wind_results, land_area)
    
    # Run ML Predictions
    ml_input = {
        "solar_irradiance": env_data["environmental"]["solar_irradiance"],
        "wind_speed": env_data["environmental"]["wind_speed"],
        "temperature": env_data["environmental"]["temperature"],
        "cloud_cover": env_data["environmental"]["cloud_cover"],
        "rainfall": env_data["environmental"]["rainfall"],
        "land_slope": env_data["environmental"]["land_slope"],
        "elevation": env_data["environmental"]["elevation"],
        "distance_to_transmission": env_data["infrastructure"]["distance_to_transmission"],
        "distance_to_road": env_data["infrastructure"]["distance_to_road"]
    }
    try:
        ml_results = get_ml_predictions(ml_input)
    except Exception as e:
        print(f"ML prediction error: {e}")
        ml_results = {}
        
    return {
        "environmental": env_data["environmental"],
        "infrastructure": env_data["infrastructure"],
        "solar_prediction": solar_results,
        "wind_prediction": wind_results,
        "suitability": suitability_results,
        "optimization": opt_results,
        "ml_predictions": ml_results,
        "project_type": project_type
    }

@app.post("/api/sites", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
def create_site(
    site_in: SiteCreate, 
    project_type: str = "solar", 
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["planner"]))
):
    if not (-90.0 <= site_in.latitude <= 90.0) or not (-180.0 <= site_in.longitude <= 180.0):
        raise HTTPException(status_code=400, detail="Invalid coordinates. Latitude must be between -90 and 90, and Longitude must be between -180 and 180.")
    # Verify project exists
    project = db.query(ProjectModel).filter(ProjectModel.id == site_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status != "Draft":
        raise HTTPException(status_code=403, detail="Forbidden: Cannot add sites or run assessments on projects that have been submitted")
        
    env_data = get_environmental_and_gis_data(site_in.latitude, site_in.longitude)
    if site_in.elevation:
        env_data["environmental"]["elevation"] = site_in.elevation
    env_data["land_ownership"] = site_in.land_ownership or "Lease"
    
    site_details = run_full_site_assessment(env_data, project_type, site_in.land_area or 10.0)
    suitability_results = site_details["suitability"]
    opt_results = site_details["optimization"]
    
    infra_list = site_in.existing_infrastructure or []
    if env_data["infrastructure"]["distance_to_transmission"] < 2.0:
        infra_list.append("Near Grid line")
    if env_data["infrastructure"]["distance_to_road"] < 0.5:
        infra_list.append("Access Road Proximity")
        
    new_site = SiteModel(
        project_id=site_in.project_id,
        name=site_in.name,
        latitude=site_in.latitude,
        longitude=site_in.longitude,
        region=site_in.region or env_data["environmental"].get("region", "Global Coordinates"),
        land_area=site_in.land_area,
        elevation=env_data["environmental"]["elevation"],
        existing_infrastructure=json.dumps(infra_list),
        land_ownership=site_in.land_ownership,
        suitability_score=suitability_results["scores"]["overall"],
        suitability_category=suitability_results["category"],
        
        # New columns
        country=env_data["location"].get("country"),
        state=env_data["location"].get("state"),
        district=env_data["location"].get("district"),
        solar_score=suitability_results["scores"].get("solar"),
        wind_score=suitability_results["scores"].get("wind"),
        recommended_plant=opt_results.get("recommended_technology"),
        analysis_date=datetime.utcnow(),
        
        details_json=json.dumps(site_details)
    )
    
    db.add(new_site)
    db.commit()
    db.refresh(new_site)
    
    evaluate_site_hazards_and_trigger_alerts(
        db, new_site.id, project.id, env_data, suitability_results["scores"]["overall"]
    )
    
    return new_site

# --- NEW WORKFLOW ENDPOINTS (Analyze only, and save confirmed site under project) ---
# Supports both prefixed (/api/...) and non-prefixed paths for client compatibility
@app.post("/analyze-location")
@app.post("/api/analyze-location")
def analyze_location_only(
    req: LocationAnalysisRequest,
    current_user: UserModel = Depends(RoleChecker(["planner"]))
):
    """
    Performs full topographic and weather resource analysis for coordinates
    WITHOUT creating any records in the SQLite database.
    """
    if not (-90.0 <= req.latitude <= 90.0) or not (-180.0 <= req.longitude <= 180.0):
        raise HTTPException(status_code=400, detail="Invalid coordinates. Latitude must be between -90 and 90, and Longitude must be between -180 and 180.")
    env_data = get_environmental_and_gis_data(req.latitude, req.longitude)
    env_data["land_ownership"] = req.land_ownership
    
    site_details = run_full_site_assessment(env_data, req.project_type, req.land_area)
    suitability_results = site_details["suitability"]
    
    return {
        "latitude": req.latitude,
        "longitude": req.longitude,
        "land_area": req.land_area,
        "land_ownership": req.land_ownership,
        "suitability_score": suitability_results["scores"]["overall"],
        "suitability_category": suitability_results["category"],
        "details_json": json.dumps(site_details)
    }

@app.post("/projects/{project_id}/sites", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
@app.post("/api/projects/{project_id}/sites", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
def save_analyzed_site(
    project_id: int,
    site_in: SiteSaveRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["planner"]))
):
    """
    Actually persists the analyzed site into the database under the selected project.
    """
    if not (-90.0 <= site_in.latitude <= 90.0) or not (-180.0 <= site_in.longitude <= 180.0):
        raise HTTPException(status_code=400, detail="Invalid coordinates. Latitude must be between -90 and 90, and Longitude must be between -180 and 180.")
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status != "Draft":
        raise HTTPException(status_code=403, detail="Forbidden: Cannot add sites or run assessments on projects that have been submitted")
        
    env_data = get_environmental_and_gis_data(site_in.latitude, site_in.longitude)
    env_data["land_ownership"] = site_in.land_ownership
    
    site_details = run_full_site_assessment(env_data, site_in.project_type, site_in.land_area)
    suitability_results = site_details["suitability"]
    opt_results = site_details["optimization"]
    
    infra_list = []
    if env_data["infrastructure"]["distance_to_transmission"] < 2.0:
        infra_list.append("Near Grid line")
    if env_data["infrastructure"]["distance_to_road"] < 0.5:
        infra_list.append("Access Road Proximity")
        
    new_site = SiteModel(
        project_id=project_id,
        name=site_in.name,
        latitude=site_in.latitude,
        longitude=site_in.longitude,
        region=env_data["environmental"].get("region", "Global Coordinates"),
        land_area=site_in.land_area,
        elevation=env_data["environmental"]["elevation"],
        existing_infrastructure=json.dumps(infra_list),
        land_ownership=site_in.land_ownership,
        suitability_score=suitability_results["scores"]["overall"],
        suitability_category=suitability_results["category"],
        
        # New columns
        country=env_data["location"].get("country"),
        state=env_data["location"].get("state"),
        district=env_data["location"].get("district"),
        solar_score=suitability_results["scores"].get("solar"),
        wind_score=suitability_results["scores"].get("wind"),
        recommended_plant=opt_results.get("recommended_technology"),
        analysis_date=datetime.utcnow(),
        
        details_json=json.dumps(site_details)
    )
    
    db.add(new_site)
    db.commit()
    db.refresh(new_site)
    
    evaluate_site_hazards_and_trigger_alerts(
        db, new_site.id, project.id, env_data, suitability_results["scores"]["overall"]
    )
    
    return new_site

# --- GET, PUT, DELETE Site endpoints ---
@app.get("/api/sites/{site_id}", response_model=SiteResponse)
def get_site_detail(site_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    site = db.query(SiteModel).filter(SiteModel.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site

@app.put("/api/sites/{site_id}", response_model=SiteResponse)
def update_site(
    site_id: int,
    site_in: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["planner"]))
):
    site = db.query(SiteModel).filter(SiteModel.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
        
    project = db.query(ProjectModel).filter(ProjectModel.id == site.project_id).first()
    if project and project.status != "Draft":
        raise HTTPException(status_code=403, detail="Forbidden: Cannot modify sites on projects that have been submitted")
        
    recalculate = False
    if site_in.name is not None:
        site.name = site_in.name
    if site_in.latitude is not None:
        site.latitude = site_in.latitude
        recalculate = True
    if site_in.longitude is not None:
        site.longitude = site_in.longitude
        recalculate = True
    if site_in.region is not None:
        site.region = site_in.region
    if site_in.land_area is not None:
        site.land_area = site_in.land_area
        recalculate = True
    if site_in.elevation is not None:
        site.elevation = site_in.elevation
        recalculate = True
    if site_in.existing_infrastructure is not None:
        site.existing_infrastructure = json.dumps(site_in.existing_infrastructure)
    if site_in.land_ownership is not None:
        site.land_ownership = site_in.land_ownership
        recalculate = True
        
    if recalculate:
        details = json.loads(site.details_json) if site.details_json else {}
        project_type = details.get("project_type", "solar")
        
        env_data = get_environmental_and_gis_data(site.latitude, site.longitude)
        if site_in.elevation:
            env_data["environmental"]["elevation"] = site.elevation
        env_data["land_ownership"] = site.land_ownership
        
        site_details = run_full_site_assessment(env_data, project_type, site.land_area or 10.0)
        suitability_results = site_details["suitability"]
        opt_results = site_details["optimization"]
        site.details_json = json.dumps(site_details)
        site.suitability_score = suitability_results["scores"]["overall"]
        site.suitability_category = suitability_results["category"]
        site.elevation = env_data["environmental"]["elevation"]
        
        evaluate_site_hazards_and_trigger_alerts(
            db, site.id, site.project_id, env_data, suitability_results["scores"]["overall"]
        )
        
    db.commit()
    db.refresh(site)
    return site

@app.delete("/api/sites/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(
    site_id: int, 
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(RoleChecker(["planner"]))
):
    site = db.query(SiteModel).filter(SiteModel.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    project = db.query(ProjectModel).filter(ProjectModel.id == site.project_id).first()
    if project and project.status != "Draft":
        raise HTTPException(status_code=403, detail="Forbidden: Cannot delete sites on projects that have been submitted")
    db.delete(site)
    db.commit()
    return

# --- Notification System Endpoints ---
@app.get("/api/notifications", response_model=List[NotificationResponse])
def get_notifications(
    project_id: Optional[int] = None, 
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    query = db.query(NotificationModel)
    if current_user.role == "planner":
        owned_project_ids = [p.id for p in db.query(ProjectModel).filter(ProjectModel.owner_id == current_user.id).all()]
        query = query.filter(
            (NotificationModel.project_id.in_(owned_project_ids)) | 
            (NotificationModel.user_id == current_user.id) |
            (NotificationModel.recipient_role == "planner")
        )
    elif current_user.role == "analyst":
        query = query.filter(
            (NotificationModel.recipient_role == "analyst") |
            (NotificationModel.user_id == current_user.id)
        )
    elif current_user.role == "manager":
        query = query.filter(
            (NotificationModel.recipient_role == "manager") |
            (NotificationModel.user_id == current_user.id)
        )
    if project_id is not None:
        query = query.filter(NotificationModel.project_id == project_id)
    return query.order_by(NotificationModel.created_at.desc()).all()

@app.post("/api/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int, 
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    notif = db.query(NotificationModel).filter(NotificationModel.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@app.post("/api/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    query = db.query(NotificationModel).filter(NotificationModel.is_read == False)
    if current_user.role == "planner":
        owned_project_ids = [p.id for p in db.query(ProjectModel).filter(ProjectModel.owner_id == current_user.id).all()]
        query = query.filter(
            (NotificationModel.project_id.in_(owned_project_ids)) | 
            (NotificationModel.user_id == current_user.id) |
            (NotificationModel.recipient_role == "planner")
        )
    elif current_user.role == "analyst":
        query = query.filter(
            (NotificationModel.recipient_role == "analyst") |
            (NotificationModel.user_id == current_user.id)
        )
    elif current_user.role == "manager":
        query = query.filter(
            (NotificationModel.recipient_role == "manager") |
            (NotificationModel.user_id == current_user.id)
        )
    
    unread_notifications = query.all()
    for notif in unread_notifications:
        notif.is_read = True
        
    db.commit()
    return {"message": "All notifications marked as read", "count": len(unread_notifications)}

# --- Reports & Export Endpoints ---
@app.get("/api/sites/{site_id}/reports", response_model=List[ReportResponse])
def get_site_reports(
    site_id: int, 
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    site = db.query(SiteModel).filter(SiteModel.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
        
    project = db.query(ProjectModel).filter(ProjectModel.id == site.project_id).first()
    is_authorized = False
    if current_user.role == "admin":
        is_authorized = True
    elif current_user.role == "planner" and project and project.owner_id == current_user.id:
        is_authorized = True
    elif current_user.role == "analyst" and project and (project.assigned_gis_analyst_id == current_user.id or project.assigned_analyst_id == current_user.id):
        is_authorized = True
    elif current_user.role == "manager" and project and (project.assigned_project_manager_id == current_user.id or project.assigned_manager_id == current_user.id):
        is_authorized = True
        
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Forbidden: You are not authorized to view reports for this site")
        
    return db.query(ReportModel).filter(ReportModel.site_id == site_id).all()

@app.post("/api/sites/{site_id}/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report(
    site_id: int, 
    report_type: str, 
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    site = db.query(SiteModel).filter(SiteModel.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
        
    project = db.query(ProjectModel).filter(ProjectModel.id == site.project_id).first()
    is_authorized = False
    if current_user.role == "admin":
        is_authorized = True
    elif current_user.role == "planner" and project and project.owner_id == current_user.id:
        is_authorized = True
    elif current_user.role == "analyst" and project and (project.assigned_gis_analyst_id == current_user.id or project.assigned_analyst_id == current_user.id):
        is_authorized = True
    elif current_user.role == "manager" and project and (project.assigned_project_manager_id == current_user.id or project.assigned_manager_id == current_user.id):
        is_authorized = True
        
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Forbidden: You are not authorized to generate reports for this site")
        
    try:
        report = generate_site_report(db, site_id, report_type)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/sites/{site_id}/download/excel")
def download_excel_report(
    site_id: int, 
    report_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    site = db.query(SiteModel).filter(SiteModel.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
        
    project = db.query(ProjectModel).filter(ProjectModel.id == site.project_id).first()
    is_authorized = False
    if current_user.role == "admin":
        is_authorized = True
    elif current_user.role == "planner" and project and project.owner_id == current_user.id:
        is_authorized = True
    elif current_user.role == "analyst" and project and (project.assigned_gis_analyst_id == current_user.id or project.assigned_analyst_id == current_user.id):
        is_authorized = True
    elif current_user.role == "manager" and project and (project.assigned_project_manager_id == current_user.id or project.assigned_manager_id == current_user.id):
        is_authorized = True
        
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Forbidden: You are not authorized to download reports for this site")
        
    csv_bytes = generate_csv_export(site, report_type)
    filename = f"feasibility_report_{site_id}"
    if report_type:
        filename += f"_{report_type}"
    filename += ".csv"
    headers = {
        "Content-Disposition": f"attachment; filename={filename}"
    }
    log_activity(db, f"Downloaded Excel/CSV report ({report_type or 'full'}) for site '{site.name}'", current_user.email, status="success", action="report_download", project_name=project.name if project else None)
    return Response(content=csv_bytes, media_type="text/csv", headers=headers)

@app.get("/api/sites/{site_id}/download/csv")
def download_csv_report(
    site_id: int, 
    report_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    return download_excel_report(site_id, report_type, db, current_user)

@app.get("/api/sites/{site_id}/download/pdf")
def download_pdf_report(
    site_id: int, 
    report_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    site = db.query(SiteModel).filter(SiteModel.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
        
    project = db.query(ProjectModel).filter(ProjectModel.id == site.project_id).first()
    is_authorized = False
    if current_user.role == "admin":
        is_authorized = True
    elif current_user.role == "planner" and project and project.owner_id == current_user.id:
        is_authorized = True
    elif current_user.role == "analyst" and project and (project.assigned_gis_analyst_id == current_user.id or project.assigned_analyst_id == current_user.id):
        is_authorized = True
    elif current_user.role == "manager" and project and (project.assigned_project_manager_id == current_user.id or project.assigned_manager_id == current_user.id):
        is_authorized = True
        
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Forbidden: You are not authorized to download reports for this site")
        
    html_content = generate_html_print_report(site, report_type)
    log_activity(db, f"Downloaded PDF/HTML report ({report_type or 'full'}) for site '{site.name}'", current_user.email, status="success", action="report_download", project_name=project.name if project else None)
    return Response(content=html_content, media_type="text/html")

# --- ML Model Administration Endpoints ---
@app.get("/api/ml/models")
def get_ml_models_comparison(
    current_user: UserModel = Depends(RoleChecker(["admin"]))
):
    try:
        # Import engine_ml directly
        from .engine_ml import train_ml_models, _model_metrics, _best_model_name
        # Train if not already done
        if not _model_metrics:
            train_ml_models()
        return {
            "metrics": _model_metrics,
            "best_model": _best_model_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch ML metrics: {e}")

@app.post("/api/ml/train")
def trigger_ml_models_retraining(
    current_user: UserModel = Depends(RoleChecker(["admin"]))
):
    try:
        from .engine_ml import train_ml_models
        res = train_ml_models()
        return {
            "message": "Models trained successfully",
            "metrics": res["metrics"],
            "best_model": res["best_model"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {e}")

# --- Module 10 Endpoints ---

class PredictEnvironmentRequest(BaseModel):
    latitude: float
    longitude: float

class PredictSolarRequest(BaseModel):
    solar_irradiance: Optional[float] = None
    temperature: Optional[float] = None
    cloud_cover: Optional[float] = None
    land_slope: Optional[float] = None
    land_area: Optional[float] = 10.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PredictWindRequest(BaseModel):
    wind_speed: Optional[float] = None
    temperature: Optional[float] = None
    elevation: Optional[float] = None
    land_slope: Optional[float] = None
    land_area: Optional[float] = 10.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PredictHybridRequest(BaseModel):
    solar_irradiance: Optional[float] = None
    wind_speed: Optional[float] = None
    temperature: Optional[float] = None
    cloud_cover: Optional[float] = None
    rainfall: Optional[float] = None
    land_slope: Optional[float] = None
    elevation: Optional[float] = None
    distance_to_transmission: Optional[float] = None
    distance_to_road: Optional[float] = None
    land_area: Optional[float] = 10.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class GenerateReportRequest(BaseModel):
    site_id: int

@app.get("/environment")
@app.get("/api/environment")
def get_environment_params(latitude: float, longitude: float):
    from .services.dataset_service import fetch_environmental_data
    return fetch_environmental_data(latitude, longitude)

@app.get("/weather")
@app.get("/api/weather")
def get_weather_params(latitude: float, longitude: float):
    from .services.dataset_service import fetch_environmental_data
    env = fetch_environmental_data(latitude, longitude)
    return {
        "temperature": env["temperature"],
        "humidity": env["humidity"],
        "wind_speed": env["wind_speed"],
        "wind_direction": env["wind_direction"],
        "pressure": env["pressure"],
        "rainfall": env["rainfall"],
        "cloud_cover": env["cloud_cover"]
    }

@app.get("/solar")
@app.get("/api/solar")
def get_solar_prediction(latitude: float, longitude: float, land_area: float = 10.0, current_user: UserModel = Depends(PermissionChecker("run_predictions"))):
    from .services.dataset_service import fetch_environmental_data
    from .prediction.solar_prediction import calculate_solar_potential as calc_solar_pot
    env = fetch_environmental_data(latitude, longitude)
    env_data = {"environmental": env, "latitude": latitude, "longitude": longitude}
    return calc_solar_pot(env_data, land_area)

@app.get("/wind")
@app.get("/api/wind")
def get_wind_prediction(latitude: float, longitude: float, land_area: float = 10.0, current_user: UserModel = Depends(PermissionChecker("run_predictions"))):
    from .services.dataset_service import fetch_environmental_data
    from .prediction.wind_prediction import calculate_wind_potential as calc_wind_pot
    env = fetch_environmental_data(latitude, longitude)
    env_data = {"environmental": env, "latitude": latitude, "longitude": longitude}
    return calc_wind_pot(env_data, land_area)

@app.post("/predict/site")
@app.post("/api/predict/site")
def predict_site_suitability(req: LocationAnalysisRequest, current_user: UserModel = Depends(PermissionChecker("run_predictions"))):
    from .engine_environmental import get_environmental_and_gis_data
    from .prediction.solar_prediction import calculate_solar_potential as calc_solar_pot
    from .prediction.wind_prediction import calculate_wind_potential as calc_wind_pot
    from .prediction.hybrid_prediction import run_hybrid_recommendation
    from .ml.predict import predict_suitability
    
    env_data = get_environmental_and_gis_data(req.latitude, req.longitude)
    env = env_data["environmental"]
    loc = env_data["location"]
    
    solar_res = calc_solar_pot(env_data, req.land_area)
    wind_res = calc_wind_pot(env_data, req.land_area)
    hybrid_res = run_hybrid_recommendation(solar_res, wind_res, env_data)
    
    ml_features = {
        "solar_irradiance": env["solar_irradiance"],
        "wind_speed": env["wind_speed"],
        "temperature": env["temperature"],
        "cloud_cover": env["cloud_cover"],
        "rainfall": env["rainfall"],
        "land_slope": env["land_slope"],
        "elevation": env["elevation"],
        "distance_to_transmission": env_data["infrastructure"]["distance_to_transmission"],
        "distance_to_road": env_data["infrastructure"]["distance_to_road"]
    }
    rf_pred = predict_suitability(ml_features)
    
    site_details = {
        "environmental": env,
        "infrastructure": env_data["infrastructure"],
        "location": loc,
        "solar": solar_res,
        "wind": wind_res,
        "hybrid": hybrid_res
    }
    
    return {
        "latitude": req.latitude,
        "longitude": req.longitude,
        "environmental_data": env,
        "location": loc,
        "solar_prediction": solar_res,
        "wind_prediction": wind_res,
        "hybrid_recommendation": hybrid_res,
        "ml_suitability_score": rf_pred,
        "details_json": json.dumps(site_details)
    }

@app.post("/predict/environment")
@app.post("/api/predict/environment")
def predict_custom_environment(req: PredictEnvironmentRequest, current_user: UserModel = Depends(PermissionChecker("run_predictions"))):
    from .services.dataset_service import fetch_environmental_data
    return fetch_environmental_data(req.latitude, req.longitude)

@app.post("/predict/solar")
@app.post("/api/predict/solar")
def predict_custom_solar(req: PredictSolarRequest, current_user: UserModel = Depends(PermissionChecker("run_predictions"))):
    from .services.dataset_service import fetch_environmental_data
    from .prediction.solar_prediction import calculate_solar_potential as calc_solar_pot
    
    if req.latitude is not None and req.longitude is not None:
        env = fetch_environmental_data(req.latitude, req.longitude)
        env_data = {"environmental": env, "latitude": req.latitude, "longitude": req.longitude}
        return calc_solar_pot(env_data, req.land_area)
        
    env_data = {
        "environmental": {
            "solar_irradiance": req.solar_irradiance,
            "temperature": req.temperature,
            "cloud_cover": req.cloud_cover,
            "land_slope": req.land_slope
        }
    }
    return calc_solar_pot(env_data, req.land_area)

@app.post("/predict/wind")
@app.post("/api/predict/wind")
def predict_custom_wind(req: PredictWindRequest, current_user: UserModel = Depends(PermissionChecker("run_predictions"))):
    from .services.dataset_service import fetch_environmental_data
    from .prediction.wind_prediction import calculate_wind_potential as calc_wind_pot
    
    if req.latitude is not None and req.longitude is not None:
        env = fetch_environmental_data(req.latitude, req.longitude)
        env_data = {"environmental": env, "latitude": req.latitude, "longitude": req.longitude}
        return calc_wind_pot(env_data, req.land_area)
        
    env_data = {
        "environmental": {
            "wind_speed": req.wind_speed,
            "temperature": req.temperature,
            "elevation": req.elevation,
            "land_slope": req.land_slope
        }
    }
    return calc_wind_pot(env_data, req.land_area)

@app.post("/predict/hybrid")
@app.post("/api/predict/hybrid")
def predict_custom_hybrid(req: PredictHybridRequest, current_user: UserModel = Depends(PermissionChecker("run_predictions"))):
    from .prediction.solar_prediction import calculate_solar_potential as calc_solar_pot
    from .prediction.wind_prediction import calculate_wind_potential as calc_wind_pot
    from .prediction.hybrid_prediction import run_hybrid_recommendation
    from .services.dataset_service import fetch_environmental_data
    from .engine_environmental import get_environmental_and_gis_data
    
    if req.latitude is not None and req.longitude is not None:
        env_data = get_environmental_and_gis_data(req.latitude, req.longitude)
        solar_res = calc_solar_pot(env_data, req.land_area)
        wind_res = calc_wind_pot(env_data, req.land_area)
        return run_hybrid_recommendation(solar_res, wind_res, env_data)
        
    env_data = {
        "environmental": {
            "solar_irradiance": req.solar_irradiance,
            "wind_speed": req.wind_speed,
            "temperature": req.temperature,
            "cloud_cover": req.cloud_cover,
            "rainfall": req.rainfall,
            "land_slope": req.land_slope,
            "elevation": req.elevation
        },
        "infrastructure": {
            "distance_to_transmission": req.distance_to_transmission,
            "distance_to_road": req.distance_to_road
        }
    }
    solar_res = calc_solar_pot(env_data, req.land_area)
    wind_res = calc_wind_pot(env_data, req.land_area)
    return run_hybrid_recommendation(solar_res, wind_res, env_data)

@app.get("/reports")
@app.get("/api/reports")
def list_reports(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if current_user.role == "admin":
        reports = db.query(ReportModel).all()
    else:
        reports = db.query(ReportModel).join(SiteModel).join(ProjectModel).filter(
            ProjectModel.owner_id == current_user.id
        ).all()
    return reports

@app.post("/generate-report")
@app.post("/api/generate-report")
def generate_custom_report(
    req: GenerateReportRequest, 
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["planner", "manager"]))
):
    site = db.query(SiteModel).filter(SiteModel.id == req.site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
        
    project = db.query(ProjectModel).filter(ProjectModel.id == site.project_id).first()
    if current_user.role != "admin" and (not project or project.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this site")
    
    from .reports import generate_html_print_report
    html_content = generate_html_print_report(site)
    return Response(content=html_content, media_type="text/html")

@app.get("/api/logs")
def get_activity_logs(
    query: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    action: Optional[str] = None,
    export: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(RoleChecker(["admin"]))
):
    db_query = db.query(AuditLogModel)
    if query:
        db_query = db_query.filter(
            (AuditLogModel.event.like(f"%{query}%")) | 
            (AuditLogModel.user_email.like(f"%{query}%")) |
            (AuditLogModel.project_name.like(f"%{query}%"))
        )
    if role:
        db_query = db_query.filter(AuditLogModel.role == role)
    if status:
        db_query = db_query.filter(AuditLogModel.status == status)
    if action:
        db_query = db_query.filter(AuditLogModel.action == action)
        
    logs = db_query.order_by(AuditLogModel.created_at.desc()).all()
    
    if export:
        import csv
        import io
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Timestamp", "User", "Role", "IP Address", "Action", "Project", "Result", "Event"])
        for l in logs:
            writer.writerow([
                l.id,
                l.created_at.isoformat() + "Z",
                l.user_email,
                l.role or "unknown",
                l.ip_address or "127.0.0.1",
                l.action or "unknown",
                l.project_name or "none",
                l.status,
                l.event
            ])
        headers = {
            "Content-Disposition": "attachment; filename=audit_logs.csv"
        }
        return Response(content=output.getvalue(), media_type="text/csv", headers=headers)
        
    result = []
    for l in logs[:100]:  # limit to 100 on JSON API
        diff = datetime.utcnow() - l.created_at
        if diff.days > 0:
            time_str = f"{diff.days} days ago"
        elif diff.seconds > 3600:
            time_str = f"{diff.seconds // 3600} hours ago"
        elif diff.seconds > 60:
            time_str = f"{diff.seconds // 60} mins ago"
        else:
            time_str = "Just Now"
            
        result.append({
            "id": l.id,
            "type": "audit" if l.status == "success" else l.status,
            "event": l.event,
            "user": l.user_email,
            "ip": l.ip_address or "127.0.0.1",
            "time": time_str,
            "status": l.status,
            "role": l.role or "unknown",
            "action": l.action or "unknown",
            "project": l.project_name or "none"
        })
    return result

@app.delete("/api/logs")
def purge_activity_logs(db: Session = Depends(get_db), current_user: UserModel = Depends(RoleChecker(["admin"]))):
    db.query(AuditLogModel).delete()
    db.commit()
    return {"message": "Logs purged successfully"}

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        # Verify db is accessible
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unhealthy: {str(e)}")
