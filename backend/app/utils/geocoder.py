import requests


def get_location_name(latitude, longitude):
    try:
        url = "https://nominatim.openstreetmap.org/reverse"

        params = {
            "lat": latitude,
            "lon": longitude,
            "format": "jsonv2"
        }

        headers = {
            "User-Agent": "SolarWindDeploymentPlatform/1.0"
        }

        response = requests.get(
            url,
            params=params,
            headers=headers,
            timeout=10
        )

        response.raise_for_status()

        data = response.json()

        return data.get("display_name", "Unknown Location")

    except Exception as e:
        print("Geocoder Error:", e)
        return "Unknown Location"