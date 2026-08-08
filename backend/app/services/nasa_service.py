import requests

BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"


def get_solar_data(latitude: float, longitude: float):
    """
    Fetch solar irradiance from NASA POWER API
    """

    params = {
        "parameters": "ALLSKY_SFC_SW_DWN",
        "community": "RE",
        "longitude": longitude,
        "latitude": latitude,
        "start": "20250101",
        "end": "20250101",
        "format": "JSON"
    }

    response = requests.get(
        BASE_URL,
        params=params,
        timeout=20
    )

    response.raise_for_status()

    data = response.json()

    values = data["properties"]["parameter"]["ALLSKY_SFC_SW_DWN"]

    solar = list(values.values())[0]

    return {
        "solar_irradiance": solar
    }