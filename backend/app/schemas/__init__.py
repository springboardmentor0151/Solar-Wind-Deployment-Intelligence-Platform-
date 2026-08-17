from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.role import RoleCreate, RoleResponse
from app.schemas.user import UserCreate, UserResponse
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
)
from app.schemas.site import (
    SiteCreate,
    SiteUpdate,
    SiteResponse,
)
from app.schemas.geojson import (
    Geometry,
    Feature,
    FeatureCollection,
)
from app.schemas.dashboard import DashboardSummaryResponse