import os
import sys
from pathlib import Path


os.environ.setdefault("DATABASE_URL", "sqlite:///./test_renewables.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("ENVIRONMENT", "testing")

# Add project root to Python path (parent of backend directory)
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
