class EnvironmentalService:

    @staticmethod
    def analyze_location(latitude: float, longitude: float):

        # Simple GIS Logic
        if latitude > 25:
            terrain = "Flat"
            land_type = "Agricultural"
        else:
            terrain = "Hilly"
            land_type = "Forest"

        if longitude > 75:
            road_access = "Available"
            grid_connection = "Nearby"
        else:
            road_access = "Limited"
            grid_connection = "Far"

        # Environmental Score
        score = 90

        # Suitability
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
            "latitude": latitude,
            "longitude": longitude,

            "temperature": 31.8,
            "humidity": 65.4,

            "solar_radiation": 6.4,
            "wind_speed": 5.9,

            "elevation": 210,

            "air_quality": "Good",

            "terrain": terrain,
            "land_type": land_type,
            "road_access": road_access,
            "grid_connection": grid_connection,

            "score": score,
            "suitability": suitability,
            "recommendation": recommendation,
        }