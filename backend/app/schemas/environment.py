from pydantic import BaseModel, Field


class CoordinateRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class ReverseGeocodeResponse(CoordinateRequest):
    address: str


class EnvironmentalDataRead(CoordinateRequest):
    solar_irradiance: float
    wind_speed: float
    wind_direction: float
    temperature: float
    humidity: float
    rainfall: float
    cloud_cover: float
    elevation: float
    land_slope: float
    vegetation_index: float
    nearby_roads_km: float
    nearby_substations_km: float
    nearby_transmission_lines_km: float

    model_config = {"from_attributes": True}
