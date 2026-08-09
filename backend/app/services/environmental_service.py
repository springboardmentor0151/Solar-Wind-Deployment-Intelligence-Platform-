import os
import httpx
from fastapi import HTTPException

NASA_POWER_BASE_URL = os.getenv(
    "NASA_POWER_BASE_URL", "https://power.larc.nasa.gov/api/temporal/daily/point"
)

def fetch_nasa_power_data(latitude: float, longitude: float, start_date: str, end_date: str) -> dict:
    
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN,T2M,WS10M,PRECTOTCORR,CLOUD_AMT",
        "community": "RE",
        "longitude": longitude,
        "latitude": latitude,
        "start": start_date,
        "end": end_date,
        "format": "JSON",
    }

    try:
        response = httpx.get(NASA_POWER_BASE_URL, params=params, timeout=30.0)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch NASA POWER data: {exc}")


def calculate_averages(payload: dict) -> dict:
    
    params_data = payload.get("properties", {}).get("parameter", {})

    def avg(param_key: str):
        series = params_data.get(param_key, {})
       
        values = [v for v in series.values() if v not in (None, -999.0)]
        return sum(values) / len(values) if values else None

    return {
        "solar_irradiance": avg("ALLSKY_SFC_SW_DWN"),
        "wind_speed": avg("WS10M"),
        "temperature": avg("T2M"),
        "rainfall": avg("PRECTOTCORR"),
        "cloud_cover": avg("CLOUD_AMT"),
    }