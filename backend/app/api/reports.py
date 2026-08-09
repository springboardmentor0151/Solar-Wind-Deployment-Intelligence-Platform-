from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Site, Analysis
from app.api.deps import get_current_user
from app.schemas.site import SiteOut
from app.services import report_service

router = APIRouter(prefix="/api/v1/reports", tags=["Reports & Export"])


def _get_site_and_analysis(db: Session, site_id: str, current_user: User):
    site = db.query(Site).filter(Site.id == site_id, Site.owner_id == current_user.id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    analysis = db.query(Analysis).filter(Analysis.site_id == site.id).order_by(Analysis.created_at.desc()).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis available for this site")
    return site, analysis


@router.get("/{site_id}/pdf")
def export_pdf(site_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site, analysis = _get_site_and_analysis(db, site_id, current_user)
    site_dict = SiteOut.model_validate(site).model_dump()
    analysis_dict = {
        "suitability_result": analysis.suitability_result,
        "solar_result": analysis.solar_result,
        "wind_result": analysis.wind_result,
        "forecast_result": analysis.forecast_result,
    }
    pdf_bytes = report_service.build_pdf_report(site_dict, analysis_dict)
    filename = f"{site.name.replace(' ', '_')}_site_assessment.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{site_id}/excel")
def export_excel(site_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site, analysis = _get_site_and_analysis(db, site_id, current_user)
    site_dict = SiteOut.model_validate(site).model_dump()
    analysis_dict = {
        "suitability_result": analysis.suitability_result,
        "solar_result": analysis.solar_result,
        "wind_result": analysis.wind_result,
        "forecast_result": analysis.forecast_result,
    }
    xlsx_bytes = report_service.build_excel_report(site_dict, analysis_dict)
    filename = f"{site.name.replace(' ', '_')}_site_assessment.xlsx"
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
