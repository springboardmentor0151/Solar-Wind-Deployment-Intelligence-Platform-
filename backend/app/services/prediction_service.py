def calculate_solar_score(environment):
    """
    Calculate Solar Suitability Score (0-100)
    """

    score = 0

    # Solar Irradiance (40 Points)
    if environment.solar_irradiance >= 7:
        score += 40
    elif environment.solar_irradiance >= 5:
        score += 30
    elif environment.solar_irradiance >= 3:
        score += 20
    else:
        score += 10

    # Temperature (20 Points)
    if 20 <= environment.temperature <= 35:
        score += 20
    elif 15 <= environment.temperature < 20:
        score += 15
    elif 35 < environment.temperature <= 40:
        score += 10
    else:
        score += 5

    # Humidity (15 Points)
    if environment.humidity <= 50:
        score += 15
    elif environment.humidity <= 70:
        score += 10
    else:
        score += 5

    # Rainfall (10 Points)
    if environment.rainfall == 0:
        score += 10
    elif environment.rainfall < 5:
        score += 7
    else:
        score += 3

    # Air Pressure (5 Points)
    if environment.air_pressure >= 1000:
        score += 5

    # Wind Speed (10 Points)
    if 10 <= environment.wind_speed <= 20:
        score += 10
    elif environment.wind_speed < 10:
        score += 7
    else:
        score += 5

    return min(score, 100)

def calculate_wind_score(environment):
    """
    Calculate Wind Suitability Score (0-100)
    """

    score = 0

    # Wind Speed (50 Points)
    if 12 <= environment.wind_speed <= 25:
        score += 50
    elif 8 <= environment.wind_speed < 12:
        score += 35
    elif 25 < environment.wind_speed <= 35:
        score += 30
    else:
        score += 15

    # Air Pressure (15 Points)
    if environment.air_pressure >= 1000:
        score += 15
    else:
        score += 10

    # Temperature (10 Points)
    if 15 <= environment.temperature <= 30:
        score += 10
    else:
        score += 5

    # Humidity (10 Points)
    if environment.humidity <= 70:
        score += 10
    else:
        score += 5

    # Rainfall (15 Points)
    if environment.rainfall == 0:
        score += 15
    elif environment.rainfall < 5:
        score += 10
    else:
        score += 5

    return min(score, 100)