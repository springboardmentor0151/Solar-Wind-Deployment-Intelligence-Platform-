import requests
from functools import lru_cache


@lru_cache(maxsize=100)
def get_elevation(latitude, longitude):

    url = (
        "https://api.open-elevation.com/api/v1/lookup"
        f"?locations={latitude},{longitude}"
    )

    try:

        response = requests.get(
            url,
            timeout=5
        )

        response.raise_for_status()

        data = response.json()

        return data["results"][0]["elevation"]

    except Exception as e:

        print("Elevation Error:", e)

        return 0