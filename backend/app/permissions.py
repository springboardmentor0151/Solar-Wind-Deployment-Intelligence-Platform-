from typing import Set, Dict, Optional
from fastapi import HTTPException, status, Depends
from .auth import get_current_user
from .models import UserModel

# Centralized Permission Matrix
PERMISSIONS: Dict[str, Set[str]] = {
    "admin": {
        "create_project", "run_predictions", "submit_project",
        "review_gis", "approve_gis",
        "workflow_review", "update_milestones",
        "approve_project", "delete_project", "manage_users", "view_logs", "purge_logs", "assign_roles"
    },
    "planner": {
        "create_project", "run_predictions", "submit_project"
    },
    "analyst": {
        "review_gis", "approve_gis", "run_predictions"
    },
    "manager": {
        "workflow_review", "update_milestones", "run_predictions"
    }
}

def has_permission(user: Optional[UserModel], permission: str) -> bool:
    if not user:
        return False
    user_role = getattr(user, "role", None)
    if not user_role:
        return False
    allowed = PERMISSIONS.get(user_role.lower(), set())
    return permission in allowed

# Centralized Permission Service helper functions
def can_create_project(user: UserModel) -> bool:
    return has_permission(user, "create_project")

def can_run_predictions(user: UserModel) -> bool:
    return has_permission(user, "run_predictions")

def can_submit_project(user: UserModel) -> bool:
    return has_permission(user, "submit_project")

def can_review_gis(user: UserModel) -> bool:
    return has_permission(user, "review_gis")

def can_approve_gis(user: UserModel) -> bool:
    return has_permission(user, "approve_gis")

def can_approve_workflow(user: UserModel) -> bool:
    return has_permission(user, "workflow_review")

def can_update_milestones(user: UserModel) -> bool:
    return has_permission(user, "update_milestones")

def can_approve_project(user: UserModel) -> bool:
    return has_permission(user, "approve_project")

# FastAPI Dependency Injection Wrapper
class PermissionChecker:
    def __init__(self, permission: str):
        self.permission = permission

    def __call__(self, current_user: UserModel = Depends(get_current_user)) -> UserModel:
        if not has_permission(current_user, self.permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation forbidden: user role '{current_user.role}' lacks '{self.permission}' permission"
            )
        return current_user
