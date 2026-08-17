from pydantic import BaseModel

from app.environmental.models.solar_result import SolarResult
from app.environmental.models.weather_result import WeatherResult
from app.gis.models.gis_result import GISResult


class EnvironmentalReport(BaseModel):
    """
    Aggregated site intelligence data.

    Environmental providers:
        NASA POWER
        OpenWeather

    GIS data:
        GIS enrichment / Sentinel / OSM / elevation etc.

    This model contains data only.

    No:
        - heuristic scoring
        - suitability scoring
        - deployment recommendation
        - ML prediction
    """

    site_name: str

    site_id: int | None = None

    latitude: float

    longitude: float

    weather: WeatherResult

    solar: SolarResult

    gis: GISResult | None = None