from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.asset import Asset
from app.models.user import User
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.core.dependencies import get_current_user
from app.core.permissions import require_roles

router = APIRouter(
    prefix="/assets",
    tags=["Assets"]
)


@router.post("/", response_model=AssetResponse)
def create_asset(
    asset: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_roles(current_user, ["admin", "manager"])

    new_asset = Asset(
        asset_name=asset.asset_name,
        asset_type=asset.asset_type,
        manufacturer=asset.manufacturer,
        capacity=asset.capacity,
        site_id=asset.site_id,
        created_by=current_user.id
    )

    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)

    return new_asset


@router.get("/", response_model=list[AssetResponse])
def get_assets(db: Session = Depends(get_db)):
    return db.query(Asset).all()


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int,
    asset: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_roles(current_user, ["admin", "manager"])

    db_asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    db_asset.asset_name = asset.asset_name
    db_asset.asset_type = asset.asset_type
    db_asset.manufacturer = asset.manufacturer
    db_asset.capacity = asset.capacity
    db_asset.site_id = asset.site_id

    db.commit()
    db.refresh(db_asset)

    return db_asset


@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_roles(current_user, ["admin"])

    asset = db.query(Asset).filter(Asset.id == asset_id).first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    db.delete(asset)
    db.commit()

    return {"message": "Asset deleted successfully"}