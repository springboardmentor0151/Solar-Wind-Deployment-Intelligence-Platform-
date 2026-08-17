from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings

from app.models.role import Role
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.repositories.dashboard_repository import DashboardRepository
from app.services.notification_trigger_service import NotificationTriggerService


class AdminService:
    """Administrative control plane for users, roles, and platform overview."""

    def __init__(self, db: Session, notification_trigger_service: NotificationTriggerService | None = None):
        self.db = db
        self.user_repository = UserRepository(db)
        self.role_repository = RoleRepository(db)
        self.dashboard_repository = DashboardRepository(db)
        self.notification_trigger_service = notification_trigger_service

    def get_users(self):
        users = self.user_repository.get_all()
        return [
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "is_active": user.is_active,
                "role_id": user.role_id,
                "role_name": user.role.name,
            }
            for user in users
        ]

    def get_roles(self):
        roles = self.role_repository.get_all()
        return [
            {
                "id": role.id,
                "name": role.name,
                "description": role.description,
            }
            for role in roles
        ]

    def get_overview(self):
        users = self.user_repository.get_all()
        roles = self.role_repository.get_all()

        role_counts = {role.id: 0 for role in roles}
        for user in users:
            role_counts[user.role_id] = role_counts.get(user.role_id, 0) + 1

        return {
            "total_users": len(users),
            "active_users": sum(1 for user in users if user.is_active),
            "inactive_users": sum(1 for user in users if not user.is_active),
            "total_projects": self.dashboard_repository.count_projects(),
            "total_sites": self.dashboard_repository.count_sites(),
            "roles": [
                {
                    "id": role.id,
                    "name": role.name,
                    "count": role_counts.get(role.id, 0),
                }
                for role in roles
            ],
            "system_status": "Online",
        }


    def get_data_sources(self):
        """Return the configured intelligence data providers without exposing secrets."""
        sources = [
            {
                "name": "NASA POWER",
                "category": "Environmental / Solar",
                "provider": "NASA POWER API",
                "configured": True,
                "status": "Available",
                "description": "Solar irradiance and climate data used by environmental analysis.",
            },
            {
                "name": "OpenWeather",
                "category": "Weather",
                "provider": "OpenWeather API",
                "configured": bool(settings.OPENWEATHER_API_KEY),
                "status": "Available" if settings.OPENWEATHER_API_KEY else "Not Configured",
                "description": "Current weather observations used by environmental intelligence.",
            },
            {
                "name": "OpenStreetMap",
                "category": "GIS / Infrastructure",
                "provider": "OSM / Overpass",
                "configured": True,
                "status": "Available",
                "description": "Road, transmission, substation and nearby geographic feature analysis.",
            },
            {
                "name": "Elevation",
                "category": "GIS / Terrain",
                "provider": "Elevation service",
                "configured": True,
                "status": "Available",
                "description": "Elevation and terrain information for site assessment.",
            },
            {
                "name": "Copernicus Sentinel",
                "category": "Remote Sensing",
                "provider": "Sentinel Hub",
                "configured": bool(settings.SENTINEL_CLIENT_ID and settings.SENTINEL_CLIENT_SECRET),
                "status": "Available" if settings.SENTINEL_CLIENT_ID and settings.SENTINEL_CLIENT_SECRET else "Optional / Not Configured",
                "description": "Satellite-derived vegetation and land-cover intelligence when credentials are configured.",
            },
            {
                "name": "ML Prediction",
                "category": "AI / Prediction",
                "provider": "Solar + Wind prediction models",
                "configured": bool(settings.ML_PREDICTION_ENABLED),
                "status": "Enabled" if settings.ML_PREDICTION_ENABLED else "Fallback Mode",
                "description": "Solar and wind generation prediction layer used by site intelligence.",
            },
        ]
        return sources

    def get_system_health(self):
        checks = []

        try:
            self.db.execute(text("SELECT 1"))
            database_status = "Healthy"
        except Exception:
            database_status = "Unavailable"

        checks.append({
            "component": "Database",
            "status": database_status,
            "details": "PostgreSQL connectivity check",
        })

        ml_status = "Enabled" if settings.ML_PREDICTION_ENABLED else "Fallback Mode"
        checks.append({
            "component": "ML Prediction",
            "status": ml_status,
            "details": f"Solar {settings.SOLAR_ML_MODEL_VERSION}; Wind {settings.WIND_ML_MODEL_VERSION}",
        })

        openweather_status = "Configured" if settings.OPENWEATHER_API_KEY else "Not Configured"
        checks.append({
            "component": "OpenWeather",
            "status": openweather_status,
            "details": "API credential presence check only; secret values are never returned.",
        })

        sentinel_status = "Configured" if settings.SENTINEL_CLIENT_ID and settings.SENTINEL_CLIENT_SECRET else "Optional / Not Configured"
        checks.append({
            "component": "Copernicus Sentinel",
            "status": sentinel_status,
            "details": "Optional remote-sensing provider.",
        })

        overall_status = "Healthy" if database_status == "Healthy" else "Degraded"
        return {
            "application": "Online",
            "database": database_status,
            "ml_prediction": ml_status,
            "overall_status": overall_status,
            "checks": checks,
        }

    def update_user_role(
        self,
        user_id: int,
        role_id: int,
        current_admin: User,
    ):
        user = self._get_user(user_id)
        role = self.role_repository.get_by_id(role_id)

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found",
            )

        # Do not allow an administrator to remove their own admin role.
        if user.id == current_admin.id and role.name != "Admin":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You cannot remove your own Admin role.",
            )

        user.role_id = role.id
        self.db.commit()
        self.db.refresh(user)

        if self.notification_trigger_service is not None:
            self.notification_trigger_service.user_role_changed(
                user_id=user.id,
                role_name=role.name,
            )

        return user

    def update_user_status(
        self,
        user_id: int,
        is_active: bool,
        current_admin: User,
    ):
        user = self._get_user(user_id)

        # Prevent an admin from locking themselves out.
        if user.id == current_admin.id and not is_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You cannot deactivate your own account.",
            )

        user.is_active = is_active
        self.db.commit()
        self.db.refresh(user)

        if self.notification_trigger_service is not None:
            self.notification_trigger_service.user_status_changed(
                user_id=user.id,
                is_active=is_active,
            )

        return user

    def _get_user(self, user_id: int) -> User:
        user = self.user_repository.get_by_id(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user
