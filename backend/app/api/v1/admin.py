from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_notification_trigger_service
from app.auth.permissions import require_roles
from app.models.user import User
from app.schemas.admin import (
    AdminOverviewResponse,
    AdminRoleResponse,
    AdminUserResponse,
    AdminUserRoleUpdate,
    AdminUserStatusUpdate,
    AdminDataSourceResponse,
    AdminSystemHealthResponse,
)
from app.services.admin_service import AdminService
from app.services.notification_trigger_service import NotificationTriggerService


router = APIRouter(
    prefix="/admin",
    tags=["Administration"],
)


@router.get(
    "/overview",
    response_model=AdminOverviewResponse,
)
def get_admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    return AdminService(db).get_overview()


@router.get(
    "/users",
    response_model=list[AdminUserResponse],
)
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    return AdminService(db).get_users()


@router.get(
    "/roles",
    response_model=list[AdminRoleResponse],
)
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    return AdminService(db).get_roles()


@router.get(
    "/data-sources",
    response_model=list[AdminDataSourceResponse],
)
def get_admin_data_sources(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    return AdminService(db).get_data_sources()


@router.get(
    "/system-health",
    response_model=AdminSystemHealthResponse,
)
def get_admin_system_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin")),
):
    return AdminService(db).get_system_health()


@router.patch(
    "/users/{user_id}/role",
    response_model=AdminUserResponse,
)
def update_user_role(
    user_id: int,
    payload: AdminUserRoleUpdate,
    db: Session = Depends(get_db),
    notification_trigger_service: NotificationTriggerService = Depends(
        get_notification_trigger_service
    ),
    current_user: User = Depends(require_roles("Admin")),
):
    user = AdminService(
        db,
        notification_trigger_service,
    ).update_user_role(
        user_id=user_id,
        role_id=payload.role_id,
        current_admin=current_user,
    )

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "is_active": user.is_active,
        "role_id": user.role_id,
        "role_name": user.role.name,
    }


@router.patch(
    "/users/{user_id}/status",
    response_model=AdminUserResponse,
)
def update_user_status(
    user_id: int,
    payload: AdminUserStatusUpdate,
    db: Session = Depends(get_db),
    notification_trigger_service: NotificationTriggerService = Depends(
        get_notification_trigger_service
    ),
    current_user: User = Depends(require_roles("Admin")),
):
    user = AdminService(
        db,
        notification_trigger_service,
    ).update_user_status(
        user_id=user_id,
        is_active=payload.is_active,
        current_admin=current_user,
    )

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "is_active": user.is_active,
        "role_id": user.role_id,
        "role_name": user.role.name,
    }
