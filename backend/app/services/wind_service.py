import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class WindService:

    @staticmethod
    def predict(latitude: float, longitude: float):

        try:
            # Get wind speed
            url = (
                f"https://api.open-meteo.com/v1/forecast"
                f"?latitude={latitude}"
                f"&longitude={longitude}"
                f"&current=wind_speed_10m"
            )

            response = requests.get(url, timeout=10, verify=False)
            response.raise_for_status()

            data = response.json()

            wind_speed = data.get("current", {}).get("wind_speed_10m", 0)

            elevation_url = (
            f"https://api.opentopodata.org/v1/srtm90m"
            f"?locations={latitude},{longitude}"
            )

            elevation_response = requests.get(
                elevation_url,
                timeout=10,
                verify=False   # Remove this later after fixing SSL certificates
            )

            elevation_response.raise_for_status()

            elevation_data = elevation_response.json()

            elevation = elevation_data["results"][0]["elevation"]

            if elevation is None:
                elevation = 0

            score = 0

            if wind_speed >= 7:
                score += 60
            elif wind_speed >= 5:
                score += 40
            else:
                score += 20

            if elevation >= 200:
                score += 40
            else:
                score += 20

            if score >= 90:
                suitability = "Excellent"
                recommendation = "Highly Recommended"
            elif score >= 70:
                suitability = "Good"
                recommendation = "Recommended"
            else:
                suitability = "Poor"
                recommendation = "Not Recommended"

            return {
                "wind_speed": wind_speed,
                "elevation": elevation,
                "wind_score": score,
                "suitability": suitability,
                "recommendation": recommendation,
            }
        except Exception as e:
            import traceback

            traceback.print_exc()

            return {
        "wind_speed": 0,
        "elevation": 0,
        "wind_score": 0,
        "suitability": "Unavailable",
        "recommendation": "Unable to fetch weather data."
    }