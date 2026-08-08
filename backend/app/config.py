import os
from dotenv import load_dotenv

# Load env file from backend root directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./solar_wind.db")
SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_RENEWABLE_KEY_FOR_JWT_AUTHENTICATION")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
