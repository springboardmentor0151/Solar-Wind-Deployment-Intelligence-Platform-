from pydantic import BaseModel


class ResourceAssessmentRequest(BaseModel):
    solar_score: float
    wind_score: float
    environmental_score: float


class ResourceAssessmentResponse(BaseModel):
    overall_score: float
    recommendation: str