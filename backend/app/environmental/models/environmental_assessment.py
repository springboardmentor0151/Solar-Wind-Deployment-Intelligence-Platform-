from pydantic import BaseModel

from app.environmental.models.solar_result import SolarResult
from app.environmental.models.weather_result import WeatherResult


class EnvironmentalAssessment(BaseModel):
    """
    Environmental data collected for a site.

    This model contains provider-derived data only.

    No heuristic suitability scores are calculated here.
    ML prediction and final deployment intelligence are
    handled by the prediction/intelligence layers.
    """

    weather: WeatherResult
    solar: SolarResult