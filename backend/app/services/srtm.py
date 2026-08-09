import requests

BASE_URL = "https://api.opentopodata.org/v1/srtm90m"


def get_elevation_data(latitude: float, longitude: float):
    """
    Fetch elevation data using the SRTM 90m dataset.
    """

    try:
        response = requests.get(
            BASE_URL,
            params={
                "locations": f"{latitude},{longitude}"
            }
        )

        if response.status_code != 200:
            return {
                "error": "Unable to fetch elevation data"
            }

        data = response.json()

        elevation = data["results"][0]["elevation"]

        return {
            "terrain": {
                "elevation": elevation,
                "source": "SRTM 90m"
            }
        }

    except Exception as e:
        return {
            "error": str(e)
        }