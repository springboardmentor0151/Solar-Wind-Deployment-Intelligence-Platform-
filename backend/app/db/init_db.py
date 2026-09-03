from sqlalchemy import text
from sqlalchemy.exc import NotSupportedError, ProgrammingError

from app.db.session import Base, engine
from app.models.environment import EnvironmentalData
from app.models.forecast import Forecast
from app.models.location import Location
from app.models.prediction import Prediction
from app.models.project import Project
from app.models.report import Report
from app.models.user import User


def _reset_schema() -> None:
    with engine.begin() as connection:
        connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        connection.execute(text("CREATE SCHEMA public"))
        try:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        except NotSupportedError:
            pass


def init_db() -> None:
    message = (
        "Database initialization failed. Check DATABASE_URL, confirm PostgreSQL is running, "
        "and make sure the username/password/database match your local setup."
    )
    try:
        Base.metadata.create_all(bind=engine)
    except (ProgrammingError, Exception) as exc:
        error_text = str(exc).lower()
        if (
            "datatype mismatch" in error_text
            or "foreign key constraint" in error_text
            or "dependent objects still exist" in error_text
            or "cannot drop table" in error_text
        ):
            _reset_schema()
            try:
                Base.metadata.create_all(bind=engine)
                return
            except Exception as retry_exc:
                raise RuntimeError(message) from retry_exc
        raise RuntimeError(message) from exc


__all__ = ["init_db", "EnvironmentalData", "Forecast", "Location", "Prediction", "Project", "Report", "User"]
