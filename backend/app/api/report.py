from fastapi import APIRouter
from app.schemas.report import ReportRequest, ReportResponse
from app.services.report_service import ReportService
import traceback

router = APIRouter(
    prefix="/report",
    tags=["Report"],
)

@router.post(
    "/generate",
    response_model=ReportResponse,
)
def generate(data: ReportRequest):
    try:
        return ReportService.generate(
            data.latitude,
            data.longitude,
        )
    except Exception as e:
        print("\n========== REPORT ERROR ==========")
        traceback.print_exc()
        print("==================================\n")
        raise