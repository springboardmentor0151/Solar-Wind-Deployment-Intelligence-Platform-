import os
import requests
from functools import lru_cache
from dotenv import load_dotenv


# Load environment variables
load_dotenv()


# Get API key from .env
API_KEY = os.getenv("OPENWEATHER_API_KEY")


@lru_cache(maxsize=100)
def get_weather(latitude, longitude):

    if not API_KEY:
        raise RuntimeError(
            "OPENWEATHER_API_KEY is not configured in .env"
        )

    url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?lat={latitude}"
        f"&lon={longitude}"
        f"&appid={API_KEY}"
        f"&units=metric"
    )

    try:
        response = requests.get(
            url,
            timeout=5
        )

        response.raise_for_status()

        return response.json()

    except requests.RequestException as e:

        print("Weather API Error:", e)

        return {
            "main": {
                "temp": 0,
                "humidity": 0
            },
            "wind": {
                "speed": 0
            }
        }