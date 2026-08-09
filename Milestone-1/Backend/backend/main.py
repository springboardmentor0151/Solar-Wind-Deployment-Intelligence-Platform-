"""
Solar & Wind Deployment Intelligence — Backend (Milestone 1)

Run locally with:
    uvicorn backend.main:app --reload --port 8000

(from inside the Backend/ folder, with the venv activated)

Interactive API docs: http://localhost:8000/docs
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .routers import site_analysis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("solarwind.backend")

app = FastAPI(
    title="Solar & Wind Deployment Intelligence — Backend",
    description=(
        "Milestone 1 backend: NASA POWER, elevation (SRTM-backed), and "
        "OpenStreetMap GIS integration for renewable energy site analysis."
    ),
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allows the local Vite dev server (and any origins listed in
# FRONTEND_ORIGINS) to call this API from the browser.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(site_analysis.router)


@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok", "service": "solarwind-backend"}


# ---------------------------------------------------------------------------
# Global error handlers — return clean JSON, never leak stack traces to the
# frontend.
# ---------------------------------------------------------------------------


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    # Typically triggered by missing/invalid latitude or longitude.
    #
    # Pydantic v2 puts the raw exception object (e.g. a ValueError) inside
    # each error's "ctx" dict, which json.dumps can't serialize on its own —
    # so we rebuild a clean, string-only version of each error here.
    clean_errors = []
    for error in exc.errors():
        clean_errors.append(
            {
                "field": ".".join(str(part) for part in error.get("loc", [])),
                "message": error.get("msg"),
                "type": error.get("type"),
            }
        )

    return JSONResponse(
        status_code=422,
        content=jsonable_encoder(
            {
                "success": False,
                "error": "Invalid request data.",
                "details": clean_errors,
            }
        ),
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error while processing request")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An unexpected server error occurred. Please try again.",
        },
    )
