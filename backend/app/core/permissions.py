from fastapi import HTTPException
from app.models.user import User


def require_roles(user: User, allowed_roles: list):
    user_role = user.role.lower()
    allowed = [role.lower() for role in allowed_roles]

    print("User role:", user_role)
    print("Allowed roles:", allowed)

    if user_role not in allowed:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to perform this action."
        )