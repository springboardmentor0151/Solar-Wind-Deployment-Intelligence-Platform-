from app.services.nasa_power import get_nasa_power_data


def calculate_solar_score(ghi: float):
    """
    Calculate a solar suitability score from
    average Global Horizontal Irradiance.
    """

    if ghi >= 6:
        return 95, "Excellent"

    elif ghi >= 5:
        return 85, "Very Good"

    elif ghi >= 4:
        return 70, "Good"

    elif ghi >= 3:
        return 55, "Moderate"

    else:
        return 35, "Poor"


def predict_solar(latitude: float, longitude: float):

    data = get_nasa_power_data(latitude, longitude)

    if "error" in data:
        return data

    ghi = data["solar"]["ghi"]
    temperature = data["solar"]["temperature"]

    score, category = calculate_solar_score(ghi)

    return {
        "ghi": ghi,
        "temperature": temperature,
        "score": score,
        "category": category
    }