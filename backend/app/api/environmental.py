from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.environmental import EnvironmentalData
from app.models.user import User
from app.schemas.environmental import EnvironmentalCreate, EnvironmentalResponse
from app.core.dependencies import get_current_user
from app.core.permissions import require_roles

router = APIRouter(
    prefix="/environment",
    tags=["Environmental Data"]
)


# -----------------------------
# Create Environmental Data
# -----------------------------
@router.post("/", response_model=EnvironmentalResponse)
def create_environment_data(
    data: EnvironmentalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_roles(current_user, ["admin", "manager"])

    env = EnvironmentalData(
        site_id=data.site_id,
        solar_irradiance=data.solar_irradiance,
        wind_speed=data.wind_speed,
        temperature=data.temperature,
        rainfall=data.rainfall,
        cloud_cover=data.cloud_cover,
        created_by=current_user.id
    )

    db.add(env)
    db.commit()
    db.refresh(env)

    return env


# -----------------------------
# Get All Environmental Data
# -----------------------------
@router.get("/", response_model=list[EnvironmentalResponse])
def get_environment_data(db: Session = Depends(get_db)):
    return db.query(EnvironmentalData).all()


# -----------------------------
# Get Environmental Data by ID
# -----------------------------
@router.get("/{env_id}", response_model=EnvironmentalResponse)
def get_environment_record(
    env_id: int,
    db: Session = Depends(get_db)
):
    env = db.query(EnvironmentalData).filter(
        EnvironmentalData.id == env_id
    ).first()

    if not env:
        return {"message": "Environmental record not found"}

    return env


# -----------------------------
# Update Environmental Data
# -----------------------------
@router.put("/{env_id}", response_model=EnvironmentalResponse)
def update_environment_record(
    env_id: int,
    data: EnvironmentalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_roles(current_user, ["admin", "manager"])

    env = db.query(EnvironmentalData).filter(
        EnvironmentalData.id == env_id
    ).first()

    if not env:
        return {"message": "Environmental record not found"}

    env.site_id = data.site_id
    env.solar_irradiance = data.solar_irradiance
    env.wind_speed = data.wind_speed
    env.temperature = data.temperature
    env.rainfall = data.rainfall
    env.cloud_cover = data.cloud_cover

    db.commit()
    db.refresh(env)

    return env


# -----------------------------
# Delete Environmental Data
# -----------------------------
@router.delete("/{env_id}")
def delete_environment_record(
    env_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_roles(current_user, ["admin", "manager"])

    env = db.query(EnvironmentalData).filter(
        EnvironmentalData.id == env_id
    ).first()

    if not env:
        return {"message": "Environmental record not found"}

    db.delete(env)
    db.commit()

    return {"message": "Environmental record deleted successfully"}