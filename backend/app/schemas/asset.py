from pydantic import BaseModel


class AssetCreate(BaseModel):
    asset_name: str
    asset_type: str
    manufacturer: str
    capacity: float
    site_id: int


class AssetUpdate(BaseModel):
    asset_name: str
    asset_type: str
    manufacturer: str
    capacity: float
    site_id: int


class AssetResponse(BaseModel):
    id: int
    asset_name: str
    asset_type: str
    manufacturer: str
    capacity: float
    status: str
    site_id: int
    created_by: int

    class Config:
        from_attributes = True