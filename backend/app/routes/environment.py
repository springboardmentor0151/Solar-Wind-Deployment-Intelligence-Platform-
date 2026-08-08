from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.site import Site

from app.services.weather_service import get_live_weather
from app.services.nasa_service import get_solar_data

from app.models.site import Site
from app.services.weather_service import get_live_weather

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles

from app.models.environmental_data import EnvironmentalData
from app.schemas.environmental_data import (
    EnvironmentalDataCreate,
    EnvironmentalDataResponse,
)

router = APIRouter(
    prefix="/environment",
    tags=["Environmental Data"]
)


@router.post(
    "/",
    response_model=EnvironmentalDataResponse,
    status_code=status.HTTP_201_CREATED
)
def create_environmental_data(
    data: EnvironmentalDataCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["Admin", "GIS Analyst"]))
):
    new_record = EnvironmentalData(**data.model_dump())

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


@router.get(
    "/",
    response_model=list[EnvironmentalDataResponse]
)
def get_environmental_data(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(EnvironmentalData).all()


@router.get(
    "/site/{site_id}",
    response_model=list[EnvironmentalDataResponse]
)
def get_site_environmental_data(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return (
        db.query(EnvironmentalData)
        .filter(EnvironmentalData.site_id == site_id)
        .all()
    )

@router.get(
    "/live/{site_id}"
)
@router.post(
    "/sync/{site_id}",
    response_model=EnvironmentalDataResponse
)
def sync_live_environment_data(
    site_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["Admin", "GIS Analyst"]))
):

    site = (
        db.query(Site)
        .filter(Site.id == site_id)
        .first()
    )

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Site not found"
        )

    # Get Weather Data
    weather = get_live_weather(
        site.latitude,
        site.longitude
    )

    # Get NASA Solar Data
    solar = get_solar_data(
        site.latitude,
        site.longitude
    )

    # Save Environmental Record
    new_record = EnvironmentalData(
        site_id=site.id,
        temperature=weather["temperature"],
        humidity=weather["humidity"],
        wind_speed=weather["wind_speed"],
        solar_irradiance=solar["solar_irradiance"],
        rainfall=weather["rainfall"],
        air_pressure=weather["air_pressure"]
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record
@router.put(
    "/{record_id}",
    response_model=EnvironmentalDataResponse
)
def update_environmental_data(
    record_id: int,
    data: EnvironmentalDataCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["Admin", "GIS Analyst"]))
):
    db_record = (
        db.query(EnvironmentalData)
        .filter(EnvironmentalData.id == record_id)
        .first()
    )

    if not db_record:
        raise HTTPException(
            status_code=404,
            detail="Environmental data not found"
        )

    db_record.site_id = data.site_id
    db_record.temperature = data.temperature
    db_record.humidity = data.humidity
    db_record.wind_speed = data.wind_speed
    db_record.solar_irradiance = data.solar_irradiance
    db_record.rainfall = data.rainfall
    db_record.air_pressure = data.air_pressure

    db.commit()
    db.refresh(db_record)

    return db_record

@router.delete(
    "/{record_id}"
)
def delete_environmental_data(
    record_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["Admin"]))
):
    db_record = (
        db.query(EnvironmentalData)
        .filter(EnvironmentalData.id == record_id)
        .first()
    )

    if not db_record:
        raise HTTPException(
            status_code=404,
            detail="Environmental data not found"
        )

    db.delete(db_record)
    db.commit()

    return {
        "message": "Environmental data deleted successfully"
    }