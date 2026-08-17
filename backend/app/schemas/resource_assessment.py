from pydantic import BaseModel, Field


class ResourceMetric(BaseModel):
    value: float | None = None
    unit: str
    source: str
    status: str = "available"
    note: str | None = None


class SolarResourceAssessment(BaseModel):
    annual_irradiance: ResourceMetric
    peak_sun_hours: ResourceMetric
    expected_energy_output: ResourceMetric
    capacity_factor: ResourceMetric
    performance_ratio: ResourceMetric


class WindResourceAssessment(BaseModel):
    average_wind_speed: ResourceMetric
    wind_power_density: ResourceMetric
    turbulence_intensity: ResourceMetric
    capacity_factor: ResourceMetric
    expected_annual_energy_production: ResourceMetric


class ResourceAssessmentResponse(BaseModel):
    site_id: int
    site_name: str
    latitude: float
    longitude: float
    solar: SolarResourceAssessment
    wind: WindResourceAssessment
    assessment_notes: list[str] = Field(default_factory=list)
