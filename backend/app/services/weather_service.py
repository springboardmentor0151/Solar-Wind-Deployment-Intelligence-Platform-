import requests

BASE_URL = "https://api.open-meteo.com/v1/forecast"


def get_live_weather(latitude: float, longitude: float):
    """
    Fetch current weather from Open-Meteo API
    """

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ",".join([
            "temperature_2m",
            "relative_humidity_2m",
            "wind_speed_10m",
            "surface_pressure",
            "precipitation"
        ])
    }

    response = requests.get(
        BASE_URL,
        params=params,
        timeout=10
    )

    response.raise_for_status()

    data = response.json()

    current = data.get("current", {})

    return {
        "temperature": current.get("temperature_2m"),
        "humidity": current.get("relative_humidity_2m"),
        "wind_speed": current.get("wind_speed_10m"),
        "air_pressure": current.get("surface_pressure"),
        "rainfall": current.get("precipitation")
    }