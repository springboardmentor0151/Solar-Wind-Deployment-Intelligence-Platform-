import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.project import Project
from app.models.report import Report
from app.models.user import User
from app.services.analytics_service import build_project_report


router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("")
def list_reports(_: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(select(Report, Project.name).join(Project).order_by(desc(Report.created_at))).all()
    return [
        {
            "id": report.id,
            "project_id": report.project_id,
            "project_name": name,
            "report_type": report.report_type,
            "file_name": report.file_name,
            "created_at": report.created_at,
        }
        for report, name in rows
    ]


@router.get("/{project_id}", summary="View a complete renewable deployment assessment report")
def read_report_detail(
    project_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    report = build_project_report(db, project_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return report


@router.post("/pdf")
def download_pdf(project_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    report = build_project_report(db, project_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    project = report["project_information"]
    environmental = report["environmental_assessment"]
    renewable = report["renewable_assessment"]
    deployment = report["deployment_recommendation"]

    stream = io.BytesIO()
    pdf = canvas.Canvas(stream, pagesize=letter)
    pdf.setTitle(f"{project['name']} Renewable Deployment Report")
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(72, 730, "Solar & Wind Deployment Intelligence Report")
    pdf.setFont("Helvetica", 9)
    pdf.drawRightString(540, 730, datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"))
    pdf.setFont("Helvetica", 11)
    rows = [
        ("Project", project["name"]),
        ("Type", project["project_type"]),
        ("Region", project["region"]),
        ("Location", project["address"]),
        ("Latitude / Longitude", f"{project['latitude']}, {project['longitude']}"),
        ("Capacity", f"{project['capacity_mw']} MW"),
        ("Solar Irradiance", f"{environmental['solar_irradiance']} kWh/m2/day"),
        ("Wind Speed", f"{environmental['wind_speed']} m/s"),
        ("Temperature", f"{environmental['temperature']} C"),
        ("Rainfall", f"{environmental['rainfall']} mm"),
        ("Elevation", f"{environmental['elevation']} m"),
        ("Solar Potential", f"{renewable['solar_potential']}%"),
        ("Wind Potential", f"{renewable['wind_potential']}%"),
        ("Suitability Score", f"{renewable['suitability_score']}%"),
        ("Final Recommendation", report["final_recommendation"]),
        ("Recommended Technology", renewable["recommended_technology"]),
        ("Expected Generation", f"{deployment['expected_generation_mwh']} MWh/year"),
        ("ROI Estimate", f"{deployment['roi_estimate']}%"),
    ]
    y = 690
    for label, value in rows:
        pdf.drawString(72, y, f"{label}: {value}")
        y -= 21
        if y < 90:
            pdf.showPage()
            y = 730
            pdf.setFont("Helvetica", 11)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(72, y - 8, "Deployment Recommendation")
    pdf.setFont("Helvetica", 10)
    text = pdf.beginText(72, y - 30)
    text.setLeading(14)
    for line in deployment["recommendation"].split(". "):
        text.textLine(line.strip())
    pdf.drawText(text)
    pdf.showPage()
    pdf.save()
    return Response(
        content=stream.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="project-{project_id}-report.pdf"'},
    )


@router.post("/excel")
def download_excel(project_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    report = build_project_report(db, project_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    project = report["project_information"]
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Assessment Report"
    sheet.append(["Section", "Metric", "Value"])
    for section, values in report.items():
        if isinstance(values, dict):
            for key, value in values.items():
                sheet.append([section, key, value])
    sheet.append(["final_recommendation", "classification", report["final_recommendation"]])
    stream = io.BytesIO()
    workbook.save(stream)
    return Response(
        content=stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="project-{project_id}-report.xlsx"'},
    )
