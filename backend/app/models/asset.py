from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database.database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)

    asset_name = Column(String(100), nullable=False)

    asset_type = Column(String(50), nullable=False)

    manufacturer = Column(String(100), nullable=False)

    capacity = Column(Float, nullable=False)

    status = Column(String(50), default="Active")

    site_id = Column(Integer, ForeignKey("sites.id"))

    created_by = Column(Integer, ForeignKey("users.id"))