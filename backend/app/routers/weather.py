from fastapi import APIRouter
import requests

router = APIRouter(
    prefix="/weather",
    tags=["Weather"]
)

@router.get("/")
def get_weather(lat: float, lon: float):

    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}"
        f"&longitude={lon}"
        f"&current=temperature_2m,wind_speed_10m"
        f"&daily=precipitation_sum,shortwave_radiation_sum"
        f"&timezone=auto"
    )

    response = requests.get(url, timeout=10)
    weather = response.json()

    current = weather.get("current", {})
    daily = weather.get("daily", {})

    temperature = current.get("temperature_2m", 0)
    wind_speed = current.get("wind_speed_10m", 0)
    rainfall = daily.get("precipitation_sum", [0])[0]
    solar_radiation = daily.get("shortwave_radiation_sum", [0])[0]

    return {
        "temperature": temperature,
        "wind_speed": wind_speed,
        "rainfall": rainfall,
        "solar_radiation": solar_radiation,
    }