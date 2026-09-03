from pydantic import BaseModel, Field, field_validator


class CoordinateValidation(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude must be between -90 and 90")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude must be between -180 and 180")


class EnvironmentalDataValidation(BaseModel):
    solar_irradiance: float = Field(..., ge=0, le=10, description="Solar irradiance in kWh/m2/day")
    wind_speed: float = Field(..., ge=0, le=50, description="Wind speed in m/s")
    wind_direction: float = Field(..., ge=0, le=360, description="Wind direction in degrees")
    temperature: float = Field(..., ge=-50, le=60, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    rainfall: float = Field(..., ge=0, le=2000, description="Rainfall in mm")
    cloud_cover: float = Field(..., ge=0, le=100, description="Cloud cover percentage")
    elevation: float = Field(..., ge=-500, le=9000, description="Elevation in meters")
    land_slope: float = Field(..., ge=0, le=90, description="Land slope in degrees")
    vegetation_index: float = Field(..., ge=0, le=1, description="Vegetation index (NDVI)")
    nearby_roads_km: float = Field(..., ge=0, le=500, description="Distance to nearby roads in km")
    nearby_substations_km: float = Field(..., ge=0, le=500, description="Distance to nearby substations in km")
    nearby_transmission_lines_km: float = Field(..., ge=0, le=500, description="Distance to transmission lines in km")


class ProjectValidation(BaseModel):
    name: str = Field(..., min_length=3, max_length=180, description="Project name")
    project_type: str = Field(..., description="Project type: Solar, Wind, or Hybrid")
    region: str = Field(..., min_length=2, max_length=160, description="Region name")
    capacity_mw: float = Field(..., gt=0, description="Capacity in MW")
    description: str | None = Field(None, max_length=5000, description="Project description")

    @field_validator("project_type")
    @classmethod
    def validate_project_type(cls, v: str) -> str:
        allowed = {"Solar", "Wind", "Hybrid"}
        if v not in allowed:
            raise ValueError(f"Project type must be one of: {', '.join(allowed)}")
        return v


class PredictionValidation(BaseModel):
    project_type: str = Field(..., description="Project type")
    capacity_mw: float = Field(..., gt=0, description="Capacity in MW")
    environmental_data: EnvironmentalDataValidation

    @field_validator("project_type")
    @classmethod
    def validate_project_type(cls, v: str) -> str:
        allowed = {"Solar", "Wind", "Hybrid"}
        if v not in allowed:
            raise ValueError(f"Project type must be one of: {', '.join(allowed)}")
        return v