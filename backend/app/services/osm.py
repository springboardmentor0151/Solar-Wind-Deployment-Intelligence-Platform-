import requests

BASE_URL = "https://nominatim.openstreetmap.org/reverse"


def get_location_details(latitude: float, longitude: float):
    """
    Reverse geocode coordinates using OpenStreetMap (Nominatim).
    """

    try:
        response = requests.get(
            BASE_URL,
            params={
                "lat": latitude,
                "lon": longitude,
                "format": "jsonv2"
            },
            headers={
                "User-Agent": "Solar-Wind-Deployment-Intelligence-Platform"
            }
        )

        if response.status_code != 200:
            return {
                "error": "Unable to fetch location details"
            }

        data = response.json()
        address = data.get("address", {})

        return {
            "location": {
                "country": address.get("country"),
                "state": address.get("state"),
                "district": address.get("state_district")
                or address.get("county")
                or address.get("city_district"),
                "city": address.get("city")
                or address.get("town")
                or address.get("village"),
                "display_name": data.get("display_name")
            }
        }

    except Exception as e:
        return {
            "error": str(e)
        }