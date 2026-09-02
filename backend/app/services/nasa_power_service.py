import requests
from functools import lru_cache


@lru_cache(maxsize=100)
def get_nasa_power_data(latitude, longitude):

    url = (
        "https://power.larc.nasa.gov/api/temporal/daily/point"
        f"?parameters=ALLSKY_SFC_SW_DWN,T2M"
        f"&community=RE"
        f"&longitude={longitude}"
        f"&latitude={latitude}"
        f"&start=20250101"
        f"&end=20250101"
        f"&format=JSON"
    )

    try:

        response = requests.get(
            url,
            timeout=5
        )

        response.raise_for_status()

        data = response.json()

        parameters = data["properties"]["parameter"]

        solar_irradiance = list(
            parameters["ALLSKY_SFC_SW_DWN"].values()
        )[0]

        temperature = list(
            parameters["T2M"].values()
        )[0]

        return {
            "solar_irradiance": solar_irradiance,
            "temperature": temperature,
        }

    except Exception as e:

        print("NASA POWER Error:", e)

        return {
            "solar_irradiance": 0,
            "temperature": 0,
        }