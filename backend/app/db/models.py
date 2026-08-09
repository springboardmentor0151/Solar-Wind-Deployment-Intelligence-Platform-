import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Float, Integer, DateTime, ForeignKey, Enum, JSON, Text, Boolean
)
from sqlalchemy.orm import relationship

from app.db.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    RENEWABLE_ENERGY_PLANNER = "renewable_energy_planner"
    GIS_ANALYST = "gis_analyst"
    PROJECT_MANAGER = "project_manager"
    ADMINISTRATOR = "administrator"


class SiteStatus(str, enum.Enum):
    PROSPECTING = "prospecting"           # just analyzed / registered
    FEASIBILITY_STUDY = "feasibility_study"
    APPROVED = "approved"
    IN_CONSTRUCTION = "in_construction"
    OPERATIONAL = "operational"
    ON_HOLD = "on_hold"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.RENEWABLE_ENERGY_PLANNER, nullable=False)
    organization = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sites = relationship("Site", back_populates="owner", cascade="all, delete-orphan")


class Site(Base):
    __tablename__ = "sites"

    id = Column(String, primary_key=True, default=gen_uuid)
    project_id = Column(String, unique=True, index=True, default=lambda: f"PRJ-{uuid.uuid4().hex[:8].upper()}")
    name = Column(String, nullable=False)
    region = Column(String, nullable=True)
    country = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    land_area_hectares = Column(Float, default=100.0)
    land_ownership = Column(String, default="Unspecified")
    notes = Column(Text, nullable=True)

    status = Column(Enum(SiteStatus), default=SiteStatus.PROSPECTING, nullable=False)
    target_operational_date = Column(DateTime, nullable=True)
    assigned_gis_analyst = Column(String, nullable=True)
    assigned_project_manager = Column(String, nullable=True)

    owner_id = Column(String, ForeignKey("users.id"))
    owner = relationship("User", back_populates="sites")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    analyses = relationship("Analysis", back_populates="site", cascade="all, delete-orphan")


class Analysis(Base):
    """Stores the full computed intelligence snapshot for a site (cached result)."""
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, default=gen_uuid)
    site_id = Column(String, ForeignKey("sites.id"))
    site = relationship("Site", back_populates="analyses")

    # Raw environmental data
    environmental_data = Column(JSON, nullable=False)
    # Terrain / infrastructure data
    geographic_data = Column(JSON, nullable=False)
    # Solar potential outputs
    solar_result = Column(JSON, nullable=False)
    # Wind potential outputs
    wind_result = Column(JSON, nullable=False)
    # Suitability scoring outputs
    suitability_result = Column(JSON, nullable=False)
    # Energy + revenue forecasts
    forecast_result = Column(JSON, nullable=False)

    data_sources = Column(JSON, nullable=True)  # which providers served the data (live vs fallback)

    created_at = Column(DateTime, default=datetime.utcnow)
