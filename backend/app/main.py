from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.settings import settings
from app.database.database import engine

# API Routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.admin import router as admin_router
from app.api.projects import router as project_router
from app.api.sites import router as site_router

from app.api.environmental import router as environmental_router
from app.api.solar import router as solar_router
from app.api.wind import router as wind_router
from app.api.report import router as report_router

from app.api import suitability
from app.api import optimization
from app.api import forecast
from app.api import investment

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",

    "http://localhost:5174",
    "http://127.0.0.1:5174",

    "http://localhost:5175",
    "http://127.0.0.1:5175",

    "http://localhost:5177",
    "http://127.0.0.1:5177",

    "http://localhost:5178",
    "http://127.0.0.1:5178",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(project_router)
app.include_router(site_router)

app.include_router(environmental_router)
app.include_router(solar_router)
app.include_router(wind_router)
app.include_router(report_router)

app.include_router(suitability.router)
app.include_router(optimization.router)
app.include_router(forecast.router)
app.include_router(investment.router)


@app.get("/")
def root():
    return {
        "message": f"{settings.APP_NAME} API is running 🚀"
    }


@app.get("/db-test")
def db_test():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            return {
                "status": "Connected Successfully",
                "database": result.scalar()
            }
    except Exception as e:
        return {
            "status": "Connection Failed",
            "error": str(e)
        }


@app.get("/test")
def test():
    return {"message": "CORS working"}