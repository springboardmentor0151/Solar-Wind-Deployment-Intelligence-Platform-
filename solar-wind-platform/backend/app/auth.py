from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import jwt
from sqlalchemy.orm import Session
from pydantic import BaseModel
from .database import get_db, hash_password, verify_password
from .models import UserModel, UserCreate, UserResponse, Token, ForgotPasswordRequest, ResetPasswordRequest, GoogleLoginResponse
from .config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, DEBUG

router = APIRouter(prefix="/auth", tags=["authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

used_reset_tokens = set()

def log_activity_direct(db: Session, event: str, email: str, status: str = "success"):
    try:
        from .models import AuditLogModel, UserModel
        user = db.query(UserModel).filter(UserModel.email == email).first()
        role = user.role if user else None
        log_entry = AuditLogModel(
            event=event,
            user_email=email,
            ip_address="127.0.0.1",
            created_at=datetime.utcnow(),
            status=status,
            role=role,
            action="login" if "login" in event.lower() else "register" if "register" in event.lower() or "registered" in event.lower() else None
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        print(f"Direct log error: {e}")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependency to get current user
def get_current_user(request: Request, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserModel:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if user is None:
        # Also try searching by email in case sub is the email address
        user = db.query(UserModel).filter(UserModel.email == username).first()
        
    is_temp = payload.get("temp", False)
    
    if user is None:
        if is_temp:
            path = request.url.path.rstrip('/')
            allowed_paths = ["/api/auth/me", "/api/auth/complete-profile", "/api/auth/onboarding-status"]
            if path in allowed_paths:
                email = payload.get("email") or username
                name = payload.get("full_name") or "Google User"
                picture = payload.get("google_picture")
                
                temp_user = UserModel(
                    username=email.split("@")[0],
                    email=email,
                    full_name=name,
                    profile_picture=picture,
                    google_picture=picture,
                    is_onboarded=False,
                    role="planner",
                    is_active=True
                )
                return temp_user
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Complete your profile before accessing the platform."
                )
        raise credentials_exception
        
    is_user_onboarded = getattr(user, "is_onboarded", True)
    if is_user_onboarded is None:
        is_user_onboarded = True
        
    if not is_user_onboarded:
        path = request.url.path.rstrip('/')
        allowed_paths = ["/api/auth/me", "/api/auth/complete-profile", "/api/auth/onboarding-status"]
        if path not in allowed_paths:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Complete your profile before accessing the platform."
            )
            
    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled. Contact system administrator."
        )
    return user

# Helper dependency to check role
class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: UserModel = Depends(get_current_user)) -> UserModel:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation restricted to roles: {', '.join(self.allowed_roles)}"
            )
        return current_user

# Authentication Endpoints
@router.post("/signup", response_model=UserResponse)
@router.post("/register", response_model=UserResponse)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if username exists
    db_user = db.query(UserModel).filter(UserModel.username == user_in.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    # Check if email exists
    db_email = db.query(UserModel).filter(UserModel.email == user_in.email).first()
    if db_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    hashed_password = hash_password(user_in.password)
    new_user = UserModel(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        role="planner",
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    identifier = form_data.username.strip()
    if "@" in identifier:
        user = db.query(UserModel).filter(UserModel.email == identifier).first()
    else:
        user = db.query(UserModel).filter(UserModel.username == identifier).first()
        
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled. Contact system administrator."
        )
        
    user.last_login = datetime.utcnow()
    db.commit()
    log_activity_direct(db, f"User login successfully", user.email, "success")
        
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: UserModel = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    log_activity_direct(db, f"User logout successfully", current_user.email, "success")
    return {"message": "Logged out successfully"}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == req.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email."
        )
    
    # Generate a secure reset token valid for 15 minutes
    reset_token = create_access_token(
        data={"sub": user.email, "type": "reset"},
        expires_delta=timedelta(minutes=15)
    )
    reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
    
    # Template
    mock_email = f"""
Subject: Reset your GeoEnergy AI password

Hello {user.full_name or user.username},

We received a request to reset your password.

Click the button below.

Reset Password: {reset_link}

If you didn't request this, ignore this email.

The link expires in 15 minutes.
"""
    
    if DEBUG:
        print("\n=== [DEBUG] PASSWORD RESET EMAIL DISPATCHED ===")
        print(mock_email)
        print("================================================\n")
        
    return {
        "message": "Password reset instructions have been sent to your email address."
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if req.token in used_reset_tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has already been used"
        )
        
    try:
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid password reset token"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expired or invalid password reset token"
        )
        
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Validate password rules using schema validator
    try:
        UserCreate.password_validation(req.password)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
        
    hashed_password = hash_password(req.password)
    user.hashed_password = hashed_password
    db.commit()
    
    # Invalidate token
    used_reset_tokens.add(req.token)
    
    return {"message": "Password updated successfully. Please log in."}

class RefreshRequest(BaseModel):
    token: str

@router.post("/refresh", response_model=Token)
def refresh_expired_token(req: RefreshRequest, db: Session = Depends(get_db)):
    try:
        # Decode without verifying expiration to find sub
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token encryption")
        
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account disabled")
        
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }

class GoogleLoginRequest(BaseModel):
    credential: str

@router.post("/google-login", response_model=GoogleLoginResponse)
def google_oauth_login_v2(req: GoogleLoginRequest, db: Session = Depends(get_db)):
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    import os
    
    token = req.credential
    
    client_id = os.getenv("VITE_GOOGLE_CLIENT_ID") or os.getenv("GOOGLE_CLIENT_ID")
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        email = idinfo.get("email")
        name = idinfo.get("name", "Google User")
        picture = idinfo.get("picture")
    except Exception as e:
        print(f"Google Token Verification failed: {e}")
        raise HTTPException(status_code=401, detail="Google authentication token verification failed")
            
    if not email:
        raise HTTPException(status_code=401, detail="Could not retrieve email from Google login")
        
    user = db.query(UserModel).filter(UserModel.email == email).first()
    
    email_exists = user is not None
    is_onboarded = getattr(user, "is_onboarded", True) if email_exists else False
    new_user = not email_exists
    db_record_created = False
    
    print(f"[GOOGLE LOGIN DEBUG] email: {email}")
    print(f"[GOOGLE LOGIN DEBUG] email exists in DB: {email_exists}")
    print(f"[GOOGLE LOGIN DEBUG] new_user: {new_user}")
    print(f"[GOOGLE LOGIN DEBUG] is_onboarded: {is_onboarded}")
    print(f"[GOOGLE LOGIN DEBUG] database record created: {db_record_created}")
    
    if not user:
        import time
        issued_at = int(time.time())
        expires_at = issued_at + 15 * 60
        temp_token = create_access_token(
            data={
                "sub": email, 
                "email": email, 
                "full_name": name, 
                "google_picture": picture, 
                "temp": True,
                "issued_at": issued_at,
                "expires_at": expires_at
            },
            expires_delta=timedelta(minutes=15)
        )
        return {
            "access_token": temp_token,
            "token_type": "bearer",
            "user": None,
            "new_user": True,
            "is_onboarded": False
        }
    else:
        is_user_onboarded = getattr(user, "is_onboarded", True)
        if is_user_onboarded is None:
            is_user_onboarded = True
            
        if not is_user_onboarded:
            import time
            issued_at = int(time.time())
            expires_at = issued_at + 15 * 60
            temp_token = create_access_token(
                data={
                    "sub": user.username, 
                    "email": email, 
                    "full_name": user.full_name or name, 
                    "google_picture": user.google_picture or picture, 
                    "temp": True,
                    "issued_at": issued_at,
                    "expires_at": expires_at
                },
                expires_delta=timedelta(minutes=15)
            )
            return {
                "access_token": temp_token,
                "token_type": "bearer",
                "user": user,
                "new_user": False,
                "is_onboarded": False
            }
            
        user.last_login = datetime.utcnow()
        if picture and not user.profile_picture:
            user.profile_picture = picture
            user.google_picture = picture
        db.commit()
        db.refresh(user)
        log_activity_direct(db, f"User login successfully via Google OAuth", email, "success")
        
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role, "is_onboarded": True}
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user,
            "new_user": False,
            "is_onboarded": True
        }

class CompleteProfileRequest(BaseModel):
    full_name: str
    phone: str
    organization: str
    department: str
    designation: str
    country: str
    state: str
    city: str
    experience: Optional[str] = None
    education: str
    skills: str
    linkedin_url: Optional[str] = ""
    github_url: Optional[str] = ""
    role: str

@router.post("/complete-profile", response_model=Token)
def complete_profile(
    req: CompleteProfileRequest,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # Decode the temporary token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        is_temp = payload.get("temp", False)
        email = payload.get("email")
        google_name = payload.get("full_name")
        google_picture = payload.get("google_picture")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid temporary session token"
        )
        
    if not is_temp or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token is invalid or expired"
        )

    # 1. Validation checks
    required_fields = {
        "full_name": req.full_name,
        "phone": req.phone,
        "organization": req.organization,
        "department": req.department,
        "designation": req.designation,
        "country": req.country,
        "state": req.state,
        "city": req.city,
        "education": req.education,
        "skills": req.skills,
        "role": req.role
    }
    for field_name, value in required_fields.items():
        if not value or not value.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Field '{field_name}' is mandatory and cannot be empty."
            )
            
    # Phone number check: strictly 10 numeric digits, no spaces/alphabets/symbols
    phone_val = req.phone.strip()
    if not phone_val.isdigit() or len(phone_val) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid 10-digit phone number."
        )

    # Education dropdown selection check
    allowed_education = ["Diploma", "B.Tech / BE", "M.Tech / ME", "MCA", "MSc", "PhD", "Other"]
    if req.education.strip() not in allowed_education:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid education selection."
        )

    # Experience check: optional. positive number up to 50
    exp_val = None
    if req.experience and req.experience.strip():
        exp_strip = req.experience.strip()
        try:
            exp_num = float(exp_strip)
            if exp_num < 0 or exp_num > 50:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Experience must be a positive number up to 50 years."
                )
            if exp_num == 0:
                exp_val = "0 Years (Fresh Graduate)"
            else:
                formatted_num = int(exp_num) if exp_num.is_integer() else exp_num
                exp_val = f"{formatted_num} Year{'s' if formatted_num != 1 else ''}"
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Experience must be a positive number."
            )
    else:
        exp_val = "0 Years (Fresh Graduate)"

    # Social handles check: optional. validate format if provided.
    from urllib.parse import urlparse
    def is_valid_url(url: str) -> bool:
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except Exception:
            return False

    linkedin_val = req.linkedin_url.strip() if req.linkedin_url else ""
    github_val = req.github_url.strip() if req.github_url else ""

    if linkedin_val:
        if not is_valid_url(linkedin_val):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid LinkedIn URL format."
            )
    else:
        linkedin_val = None

    if github_val:
        if not is_valid_url(github_val):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid GitHub URL format."
            )
    else:
        github_val = None

    allowed_roles = ["planner", "analyst", "manager"]
    requested_role = req.role.strip().lower()
    if requested_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role selection is invalid. Users registering with Google can never choose Administrator."
        )
        
    # 2. Get or create user
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if user and getattr(user, "is_onboarded", True):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Google account already registered."
        )
        
    if not user:
        username_base = email.split("@")[0]
        username = username_base
        counter = 1
        while db.query(UserModel).filter(UserModel.username == username).first():
            username = f"{username_base}{counter}"
            counter += 1
            
        user = UserModel(
            username=username,
            email=email,
            hashed_password=hash_password("GoogleUserAuth123!"),
            is_active=True,
            google_picture=google_picture,
            profile_picture=google_picture,
            created_at=datetime.utcnow()
        )
        db.add(user)
        
    # 3. Update user profile data
    user.full_name = req.full_name.strip()
    user.phone = phone_val
    user.phone_number = phone_val
    user.organization = req.organization.strip()
    user.department = req.department.strip()
    user.designation = req.designation.strip()
    user.country = req.country.strip()
    user.state = req.state.strip()
    user.city = req.city.strip()
    user.experience = exp_val
    user.education = req.education.strip()
    user.skills = req.skills.strip()
    user.linkedin_url = linkedin_val
    user.linkedin = linkedin_val
    user.github_url = github_val
    user.github = github_val
    
    user.role = requested_role
    user.is_onboarded = True
    user.last_login = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    # 4. Generate fully authorized JWT token
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "is_onboarded": True}
    )
    
    log_activity_direct(db, f"Completed user onboarding profile registration successfully", user.email, "success")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }

@router.get("/onboarding-status")
def get_onboarding_status(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    import time
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = payload.get("exp")
        expires_in = max(0, int(exp - time.time())) if exp else 0
        
        is_temp = payload.get("temp", False)
        if is_temp:
            email = payload.get("email")
            name = payload.get("full_name")
            picture = payload.get("google_picture")
            
            user = db.query(UserModel).filter(UserModel.email == email).first()
            is_onboarded = user.is_onboarded if user else False
            
            return {
                "authenticated": True,
                "is_onboarded": is_onboarded,
                "expires_in": expires_in,
                "email": email,
                "full_name": name,
                "picture": picture
            }
        else:
            username = payload.get("sub")
            user = db.query(UserModel).filter(UserModel.username == username).first()
            if not user:
                user = db.query(UserModel).filter(UserModel.email == username).first()
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
                
            return {
                "authenticated": True,
                "is_onboarded": getattr(user, "is_onboarded", True),
                "expires_in": expires_in,
                "email": user.email,
                "full_name": user.full_name,
                "picture": user.google_picture or user.profile_picture
            }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
