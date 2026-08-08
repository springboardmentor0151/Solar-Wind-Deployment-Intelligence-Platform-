from app.utils.geocoder import get_location_name
class SolarService:

    @staticmethod
    def predict(latitude: float, longitude: float):
        location = get_location_name(latitude, longitude)

        # Demo values (later you can replace these with real API data)
        solar_radiation = 6.4
        temperature = 31.8
        humidity = 65.4

        score = 0

        # Solar Radiation
        if solar_radiation >= 6:
            score += 50
        elif solar_radiation >= 5:
            score += 35
        else:
            score += 20

        # Temperature
        if 20 <= temperature <= 35:
            score += 30
        else:
            score += 15

        # Humidity
        if humidity < 70:
            score += 20
        else:
            score += 10

        if score >= 90:
            suitability = "Excellent"
            recommendation = "Highly Recommended"
        elif score >= 70:
            suitability = "Good"
            recommendation = "Recommended"
        else:
            suitability = "Poor"
            recommendation = "Not Recommended"

        return {
    "location": location,
    "solar_radiation": solar_radiation,
    "temperature": temperature,
    "humidity": humidity,
    "solar_score": score,
    "suitability": suitability,
    "recommendation": recommendation
}