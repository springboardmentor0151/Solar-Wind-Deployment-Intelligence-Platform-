from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db, raw_environmental_payloads
from .. import models, schemas, auth

from app.services.environmental_service import fetch_nasa_power_data, calculate_averages
from app.services.gis_service import calculate_infrastructure_proximities
from app.services.prediction_service import predict_solar_potential, predict_wind_potential

router = APIRouter(
    prefix="/projects/{project_id}/sites/{site_id}/environmental",
    tags=["Environmental Data"],
)

def _get_site(project_id: str, site_id: str, db: Session, current_user: models.User) -> models.Site:
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if current_user.role.value != "administrator" and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this project")
        
    site = db.query(models.Site).filter(
        models.Site.id == site_id, models.Site.project_id == project_id
    ).first()
    
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
        
    return site


@router.post("/fetch", response_model=schemas.EnvironmentalReadingOut, status_code=201)
def fetch_environmental_data(
    project_id: str,
    site_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        auth.require_roles("gis_analyst", "renewable_energy_planner", "administrator")
    ),
):
    site = _get_site(project_id, site_id, db, current_user)

    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=7)

    payload = fetch_nasa_power_data(
        latitude=site.latitude,
        longitude=site.longitude,
        start_date=start_date.strftime("%Y%m%d"),
        end_date=end_date.strftime("%Y%m%d")
    )

    raw_environmental_payloads.insert_one(
        {
            "site_id": str(site.id),
            "source": "nasa_power",
            "fetched_at": datetime.utcnow(),
            "raw_payload": payload,
        }
    )

    averages = calculate_averages(payload)

    reading = models.EnvironmentalReading(
        site_id=site.id,
        source="nasa_power",
        solar_irradiance=averages["solar_irradiance"],
        wind_speed=averages["wind_speed"],
        temperature=averages["temperature"],
        rainfall=averages["rainfall"],
        cloud_cover=averages["cloud_cover"],
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    
    return reading


@router.get("/", response_model=list[schemas.EnvironmentalReadingOut])
def list_environmental_readings(
    project_id: str,
    site_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    site = _get_site(project_id, site_id, db, current_user)
    return (
        db.query(models.EnvironmentalReading)
        .filter(models.EnvironmentalReading.site_id == site.id)
        .order_by(models.EnvironmentalReading.fetched_at.desc())
        .all()
    )


@router.get("/gis-analysis")
def run_gis_spatial_analysis(
    project_id: str,
    site_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    
    site = _get_site(project_id, site_id, db, current_user)

    gis_results = calculate_infrastructure_proximities(site.latitude, site.longitude)

    return {
        "status": "success",
        "project_id": project_id,
        "site_id": site_id,
        "coordinates": {"latitude": site.latitude, "longitude": site.longitude},
        "spatial_analysis": gis_results
    }


@router.get("/predictions")
def get_site_predictions(
    project_id: str,
    site_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
   
    site = _get_site(project_id, site_id, db, current_user)

    latest_reading = (
        db.query(models.EnvironmentalReading)
        .filter(models.EnvironmentalReading.site_id == site.id)
        .order_by(models.EnvironmentalReading.fetched_at.desc())
        .first()
    )

    solar_irr = latest_reading.solar_irradiance if latest_reading else 5.2
    temp = latest_reading.temperature if latest_reading else 28.0
    cloud = latest_reading.cloud_cover if latest_reading else 20.0
    wind_spd = latest_reading.wind_speed if latest_reading else 6.0

    solar_preds = predict_solar_potential(solar_irr, temp, cloud)
    wind_preds = predict_wind_potential(wind_spd, elevation=500.0)

    return {
        "status": "success",
        "project_id": project_id,
        "site_id": site_id,
        "predictions": {
            "solar_potential": solar_preds,
            "wind_potential": wind_preds
        }
    }