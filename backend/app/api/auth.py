from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserUpdate,
    ChangePassword,
    UserResponse,
    Token
)
from app.auth.password import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    admin_required
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.get("/")
def test_auth():
    return {
        "message": "Authentication API is working!"
    }


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create new user
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hash_password(user.password),
        role=user.role
    )

    # Save to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    db_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        db_user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={"sub": db_user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    updated_user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    current_user.full_name = updated_user.full_name

    db.commit()
    db.refresh(current_user)

    return current_user


@router.put("/change-password")
def change_password(
    password_data: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Verify current password
    if not verify_password(
        password_data.current_password,
        current_user.hashed_password
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    # Check new password matches confirm password
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match"
        )

    # Prevent using the same password again
    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password"
        )

    # Hash and save the new password
    current_user.hashed_password = hash_password(
        password_data.new_password
    )

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Password changed successfully"
    }


@router.get("/admin")
def admin_dashboard(
    current_user: User = Depends(admin_required)
):
    return {
        "message": "Welcome Admin!",
        "admin": current_user.full_name,
        "email": current_user.email
    }