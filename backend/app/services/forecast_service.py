import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class ForecastService:

    @staticmethod
    def predict(latitude: float, longitude: float):

        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={latitude}"
            f"&longitude={longitude}"
            f"&current="
            f"temperature_2m,"
            f"relative_humidity_2m,"
            f"wind_speed_10m,"
            f"cloud_cover,"
            f"precipitation"
        )

        response = requests.get(
            url,
            timeout=10,
            verify=False
        )

        response.raise_for_status()

        data = response.json()

        current = data["current"]

        return {
            "temperature": current["temperature_2m"],
            "humidity": current["relative_humidity_2m"],
            "wind_speed": current["wind_speed_10m"],
            "cloud_cover": current["cloud_cover"],
            "precipitation": current["precipitation"]
        }