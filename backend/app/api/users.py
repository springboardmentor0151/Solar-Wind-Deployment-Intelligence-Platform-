from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.auth.oauth2 import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me")
def get_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == current_user["user_id"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    return {
        "id": user.id,
        "username": user.full_name,
        "email": user.email,
        "role": user.role,
        "status": "Active"
    }