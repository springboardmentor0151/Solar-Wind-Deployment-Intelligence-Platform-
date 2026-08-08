from sqlalchemy import Column, Integer, String, Boolean

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(String(120), unique=True, nullable=False, index=True)

    password = Column(String(255), nullable=False)

    role = Column(String(50), default="Planner")

    is_active = Column(Boolean, default=True)