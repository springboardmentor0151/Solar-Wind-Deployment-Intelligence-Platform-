import logging
import time
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.router import api_router
from app.core.config import get_settings
from app.db.init_db import init_db


settings = get_settings()
logging.basicConfig(level=logging.INFO if settings.environment != "production" else logging.WARNING)
logger = logging.getLogger("renewable-platform")

app = FastAPI(
    title=settings.app_name,
    version="0.5.0",
    debug=settings.debug,
    description="APIs for renewable project analysis, GIS visualization, analytics, reports, and deployment readiness.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    error_code = "HTTP_ERROR"
    if exc.status_code == 401:
        error_code = "UNAUTHORIZED"
    elif exc.status_code == 404:
        error_code = "NOT_FOUND"
    elif exc.status_code == 422:
        error_code = "VALIDATION_ERROR"
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "detail": exc.detail, "message": exc.detail, "error_code": error_code},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation failed for one or more request fields.",
            "error_code": "VALIDATION_ERROR",
            "details": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled API error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "An unexpected server error occurred.", "error_code": "SERVER_ERROR"},
    )


@app.middleware("http")
async def log_requests(request: Request, call_next):
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled API error on %s %s", request.method, request.url.path)
        raise
    duration_ms = round((time.perf_counter() - started) * 1000, 2)
    logger.info("%s %s -> %s (%sms)", request.method, request.url.path, response.status_code, duration_ms)
    return response


@app.on_event("startup")
def on_startup() -> None:
    logger.info("Starting %s in %s mode", settings.app_name, settings.environment)
    init_db()
    logger.info("Database initialization completed")


@app.get("/health")
def root_health() -> dict[str, Any]:
    return {"status": "healthy", "healthy": True, "service": "renewable-platform"}


app.include_router(api_router, prefix=settings.api_prefix)
