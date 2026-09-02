import requests
import time
from concurrent.futures import ThreadPoolExecutor

from app.services.weather_service import get_weather
from app.services.nasa_power_service import get_nasa_power_data
from app.services.terrain_service import get_elevation

from app.services.prediction_service import (
    calculate_solar_score,
    calculate_wind_score,
)


def get_location_name(latitude, longitude):
    url = "https://nominatim.openstreetmap.org/reverse"

    params = {
        "lat": latitude,
        "lon": longitude,
        "format": "json",
        "zoom": 10,
        "addressdetails": 1,
    }

    headers = {
        "User-Agent": "SolarWindDeploymentPlatform/1.0"
    }

    try:
        response = requests.get(
            url,
            params=params,
            headers=headers,
            timeout=3,
        )

        response.raise_for_status()

        data = response.json()

        address = data.get("address", {})

        city = (
            address.get("city")
            or address.get("town")
            or address.get("village")
            or address.get("municipality")
            or address.get("county")
        )

        state = address.get("state")
        country = address.get("country")

        parts = [
            city,
            state,
            country,
        ]

        location_name = ", ".join(
            part for part in parts if part
        )

        return location_name or "Unknown Location"

    except Exception as error:

        print("Location name error:", error)

        return "Unknown Location"


def analyze_location(latitude, longitude):

    start = time.perf_counter()

    print(
        f"Analyzing location: "
        f"{latitude}, {longitude}"
    )

    # =================================
    # RUN MAIN ANALYSIS APIs
    # =================================

    try:

        with ThreadPoolExecutor(max_workers=3) as executor:

            weather_future = executor.submit(
                get_weather,
                latitude,
                longitude,
            )

            nasa_future = executor.submit(
                get_nasa_power_data,
                latitude,
                longitude,
            )

            elevation_future = executor.submit(
                get_elevation,
                latitude,
                longitude,
            )

            weather = weather_future.result()

            nasa_data = nasa_future.result()

            elevation = elevation_future.result()

        print("Weather received")
        print("NASA data received")
        print("Elevation received")

        # =================================
        # WEATHER
        # =================================

        temperature = float(
            weather["main"]["temp"]
        )

        humidity = float(
            weather["main"]["humidity"]
        )

        wind_speed = float(
            weather["wind"]["speed"]
        )

        # =================================
        # SOLAR
        # =================================

        solar_irradiance = float(
            nasa_data["solar_irradiance"]
        )

        # =================================
        # SCORES
        # =================================

        solar_score = calculate_solar_score(
            solar_irradiance,
            temperature,
            humidity,
        )

        wind_score = calculate_wind_score(
            wind_speed,
            elevation,
        )

        # =================================
        # WIND POTENTIAL
        # =================================

        wind_potential = round(
            wind_speed * 12.5,
            2,
        )

        # =================================
        # RECOMMENDATION
        # =================================

        if solar_score >= 90 and wind_score >= 90:

            recommendation = (
                "Excellent for Solar & Wind"
            )

        elif solar_score >= 85:

            recommendation = (
                "Excellent for Solar"
            )

        elif wind_score >= 85:

            recommendation = (
                "Excellent for Wind"
            )

        elif solar_score >= 70 and wind_score >= 70:

            recommendation = (
                "Good Renewable Energy Potential"
            )

        else:

            recommendation = (
                "Moderate Renewable Potential"
            )

        # =================================
        # LOCATION NAME
        # =================================

        location_name = get_location_name(
            latitude,
            longitude,
        )

        # =================================
        # TIME
        # =================================

        elapsed = time.perf_counter() - start

        print(
            f"Analysis completed in "
            f"{elapsed:.2f} seconds"
        )

        # =================================
        # RESPONSE
        # =================================

        return {

            "location_name": location_name,

            "latitude": latitude,

            "longitude": longitude,

            "temperature": temperature,

            "humidity": humidity,

            "wind_speed": wind_speed,

            "solar_irradiance": solar_irradiance,

            "elevation": elevation,

            "solar_score": solar_score,

            "wind_score": wind_score,

            "wind_potential": wind_potential,

            "recommendation": recommendation,
        }

    except Exception as error:

        print(
            "Location analysis failed:",
            error,
        )

        raise