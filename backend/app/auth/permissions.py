# Operational roles used by the current target architecture.
GIS_ANALYST_ROLE = "GIS Analyst"
ENERGY_PLANNER_ROLE = "Renewable Energy Planner"
PROJECT_MANAGER_ROLE = "Project Manager"

OPERATIONAL_ROLES = {
    GIS_ANALYST_ROLE,
    ENERGY_PLANNER_ROLE,
    PROJECT_MANAGER_ROLE,
}

from fastapi import Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.models.user import User


def require_roles(
    *allowed_roles: str,
):
    """
    Role-Based Access Control (RBAC).

    Allows access only if the authenticated user
    has one of the required roles.
    """

    allowed_roles = set(allowed_roles)

    def role_checker(
        current_user: User = Depends(
            get_current_user,
        ),
    ) -> User:

        if current_user.role is None:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No role has been assigned to this user.",
            )

        if current_user.role.name not in allowed_roles:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have permission "
                    "to perform this action."
                ),
            )

        return current_user

    return role_checker