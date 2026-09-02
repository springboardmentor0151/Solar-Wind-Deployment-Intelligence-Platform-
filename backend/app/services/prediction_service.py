def calculate_solar_score(
    solar_irradiance,
    temperature,
    humidity
):
    """
    Calculate Solar Energy Score out of 100.

    Weight:
    - Solar Irradiance: 60%
    - Temperature: 25%
    - Humidity: 15%
    """

    # -----------------------------
    # Solar Irradiance - 60 points
    # -----------------------------

    irradiance_score = min(
        (solar_irradiance / 7) * 60,
        60
    )

    # -----------------------------
    # Temperature - 25 points
    # -----------------------------

    if 20 <= temperature <= 35:
        temperature_score = 25

    elif 15 <= temperature < 20:
        temperature_score = 20

    elif 35 < temperature <= 40:
        temperature_score = 20

    elif 10 <= temperature < 15:
        temperature_score = 12

    elif 40 < temperature <= 45:
        temperature_score = 12

    else:
        temperature_score = 7

    # -----------------------------
    # Humidity - 15 points
    # -----------------------------

    if humidity <= 40:
        humidity_score = 15

    elif humidity <= 60:
        humidity_score = 13

    elif humidity <= 75:
        humidity_score = 10

    elif humidity <= 85:
        humidity_score = 7

    else:
        humidity_score = 4

    # -----------------------------
    # Final Solar Score
    # -----------------------------

    score = (
        irradiance_score
        + temperature_score
        + humidity_score
    )

    return round(
        min(score, 100),
        2
    )


def calculate_wind_score(
    wind_speed,
    elevation
):
    """
    Calculate Wind Energy Score out of 100.

    Weight:
    - Wind Speed: 80%
    - Elevation: 20%
    """

    # -----------------------------
    # Wind Speed - 80 points
    # -----------------------------

    if wind_speed >= 8:

        wind_score = 80

    elif wind_speed >= 6:

        wind_score = 65 + (
            (wind_speed - 6) / 2
        ) * 15

    elif wind_speed >= 4:

        wind_score = 50 + (
            (wind_speed - 4) / 2
        ) * 15

    elif wind_speed >= 2:

        wind_score = 30 + (
            (wind_speed - 2) / 2
        ) * 20

    else:

        wind_score = 15

    # -----------------------------
    # Elevation - 20 points
    # -----------------------------

    if elevation >= 1000:

        elevation_score = 20

    elif elevation >= 500:

        elevation_score = 15 + (
            (elevation - 500) / 500
        ) * 5

    elif elevation >= 100:

        elevation_score = 10 + (
            (elevation - 100) / 400
        ) * 5

    else:

        elevation_score = 5

    # -----------------------------
    # Final Wind Score
    # -----------------------------

    score = (
        wind_score
        + elevation_score
    )

    return round(
        min(score, 100),
        2
    )