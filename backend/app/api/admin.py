from collections import Counter
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Site, Analysis, UserRole
from app.schemas.auth import UserOut, UserUpdate
from app.api.deps import require_admin
from app.core.config import settings

router = APIRouter(prefix="/api/v1/admin", tags=["Admin Dashboard"])


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: str, payload: UserUpdate, db: Session = Depends(get_db),
                 admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/toggle-active", response_model=UserOut)
def toggle_active(user_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return None


@router.get("/platform-stats")
def platform_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """System monitoring + platform analytics + data source management overview."""
    users = db.query(User).all()
    sites = db.query(Site).all()
    analyses = db.query(Analysis).all()

    users_by_role = Counter(u.role.value for u in users)
    active_users = sum(1 for u in users if u.is_active)

    category_counts = Counter()
    for a in analyses:
        category_counts[a.suitability_result["category"]] += 1

    # Data source management: which live vs. synthetic-fallback sources have been used
    # across every analysis ever run — lets an admin see if a live integration is failing.
    source_usage = Counter()
    for a in analyses:
        for s in (a.data_sources or []):
            source_usage[s] += 1

    site_status_counts = Counter(s.status.value for s in sites)

    return {
        "total_users": len(users),
        "active_users": active_users,
        "inactive_users": len(users) - active_users,
        "users_by_role": dict(users_by_role),
        "total_sites": len(sites),
        "total_analyses_run": len(analyses),
        "site_status_distribution": dict(site_status_counts),
        "category_distribution": dict(category_counts),
        "data_source_usage": dict(source_usage),
        "configured_data_sources": {
            "NASA POWER": settings.NASA_POWER_BASE_URL,
            "Open-Meteo": settings.OPEN_METEO_FORECAST_URL,
            "Open-Elevation": settings.OPEN_ELEVATION_URL,
            "OpenStreetMap Overpass": settings.OVERPASS_URL,
        },
        "synthetic_fallback_enabled": settings.ALLOW_SYNTHETIC_FALLBACK,
        "available_roles": [r.value for r in UserRole],
    }
