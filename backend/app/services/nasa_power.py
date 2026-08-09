import requests

BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"


def get_nasa_power_data(latitude: float, longitude: float):

    params = {
        "parameters": "ALLSKY_SFC_SW_DWN,T2M,WS2M",
        "community": "RE",
        "longitude": longitude,
        "latitude": latitude,
        "start": "20250101",
        "end": "20250107",
        "format": "JSON"
    }

    response = requests.get(BASE_URL, params=params)

    if response.status_code != 200:
        return {
            "error": "Unable to fetch NASA POWER data"
        }

    data = response.json()["properties"]["parameter"]

    ghi = list(data["ALLSKY_SFC_SW_DWN"].values())
    temperature = list(data["T2M"].values())
    wind_speed = list(data["WS2M"].values())

    return {
        "solar": {
            "ghi": round(sum(ghi) / len(ghi), 2),
            "temperature": round(sum(temperature) / len(temperature), 2)
        },
        "wind": {
            "speed": round(sum(wind_speed) / len(wind_speed), 2)
        }
    }