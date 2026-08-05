from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


# ==========================
# USER
# ==========================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Project Manager")
    created_at = Column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="owner")


# ==========================
# PROJECT
# ==========================

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    region = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    sites = relationship(
        "Site",
        back_populates="project",
        cascade="all, delete"
    )


# ==========================
# SITE
# ==========================

class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)

    site_name = Column(String, nullable=False)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    land_area = Column(Float, nullable=True)
    elevation = Column(Float, nullable=True)

    infrastructure = Column(String, nullable=True)
    land_ownership = Column(String, nullable=True)

    # AI Prediction Results
    prediction = Column(String, nullable=True)
    score = Column(Float, nullable=True)
    rating = Column(String, nullable=True)

    project_id = Column(Integer, ForeignKey("projects.id"))

    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="sites")