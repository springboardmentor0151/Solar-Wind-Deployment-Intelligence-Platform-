from app.database.database import Base, engine

# Import all models here
from app.models.user import User
from app.models.project import Project
from app.models.site import Site

Base.metadata.create_all(bind=engine)

print("✅ Database tables created successfully!")