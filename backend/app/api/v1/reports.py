from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from fastapi.responses import StreamingResponse

from app.api.deps import (
    get_report_service,
)

from app.auth.permissions import (
    require_roles,
)

from app.schemas.reports import (
    SiteReportResponse,
    SiteComparisonResponse,
)

from app.services.report_service import (
    ReportService,
)


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)



@router.get(
    "/site-comparison",
    response_model=SiteComparisonResponse,
)
def compare_sites(
    site_ids: list[int] = Query(...),
    service: ReportService = Depends(get_report_service),
    current_user=Depends(
        require_roles(
            "Admin",
            "Renewable Energy Planner",
            "Project Manager",
            "GIS Analyst",
        )
    ),
):
    """Compare 2-5 sites using the existing suitability/recommendation pipeline."""
    try:
        return service.compare_sites(site_ids)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    
# =========================================================
# SITE REPORT - JSON
# =========================================================

@router.get(
    "/sites/{site_id}",
    response_model=SiteReportResponse,
)
def get_site_report(
    site_id: int,

    service: ReportService = Depends(
        get_report_service,
    ),

    current_user=Depends(
        require_roles(
            "Admin",
            "Renewable Energy Planner",
            "Project Manager",
            "GIS Analyst",
        )
    ),
):

    try:

        return service.generate_site_report(
            site_id
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


# =========================================================
# SITE REPORT - PDF
# =========================================================

@router.get(
    "/sites/{site_id}/pdf",
)
def download_site_report_pdf(
    site_id: int,

    service: ReportService = Depends(
        get_report_service,
    ),

    current_user=Depends(
        require_roles(
            "Admin",
            "Renewable Energy Planner",
            "Project Manager",
            "GIS Analyst",
        )
    ),
):

    try:

        pdf = service.generate_pdf(
            site_id
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; '
                f'filename="site_report_{site_id}.pdf"'
            )
        },
    )


# =========================================================
# SITE REPORT - EXCEL
# =========================================================

@router.get(
    "/sites/{site_id}/excel",
)
def download_site_report_excel(
    site_id: int,

    service: ReportService = Depends(
        get_report_service,
    ),

    current_user=Depends(
        require_roles(
            "Admin",
            "Renewable Energy Planner",
            "Project Manager",
            "GIS Analyst",
        )
    ),
):

    try:

        excel = service.generate_excel(
            site_id
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    return StreamingResponse(
        excel,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                f'attachment; '
                f'filename="site_report_{site_id}.xlsx"'
            )
        },
    )