"""
Application configuration.

All values can be overridden with environment variables (see .env.example).
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Renewsite — Solar & Wind Deployment Intelligence Platform"
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_super_secret_key_1234567890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./renewsite.db"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "*"]

    # External data sources (all free, no API key required)
    NASA_POWER_BASE_URL: str = "https://power.larc.nasa.gov/api/temporal/climatology/point"
    OPEN_METEO_FORECAST_URL: str = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_ARCHIVE_URL: str = "https://archive-api.open-meteo.com/v1/archive"
    OPEN_ELEVATION_URL: str = "https://api.open-elevation.com/api/v1/lookup"
    OVERPASS_URL: str = "https://overpass-api.de/api/interpreter"
    NOMINATIM_URL: str = "https://nominatim.openstreetmap.org/search"

    # External API request timeout (seconds)
    EXTERNAL_TIMEOUT: float = 10.0
    # OpenStreetMap's public Overpass instance is frequently much slower than the
    # other providers, especially on a first (cold-cache) query — give it more room
    # before we give up and fall back.
    OVERPASS_TIMEOUT: float = 25.0

    # NASA POWER climatology baseline period (they require an explicit start/end
    # year range for the climatology endpoint; omitting it causes a 400 error).
    NASA_POWER_START_YEAR: str = "2001"
    NASA_POWER_END_YEAR: str = "2020"

    # If external services are unreachable, fall back to the physically-informed
    # synthetic generator so the platform always returns a usable analysis.
    ALLOW_SYNTHETIC_FALLBACK: bool = True


settings = Settings()
