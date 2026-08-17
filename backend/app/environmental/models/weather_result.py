from pydantic import BaseModel


class WeatherResult(BaseModel):
    """
    Weather information collected
    from OpenWeather.
    """

    temperature: float | None = None

    humidity: float | None = None

    rainfall: float | None = None

    wind_speed: float | None = None

    wind_direction: float | None = None

    pressure: float | None = None

    cloud_cover: float | None = None