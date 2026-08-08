class SuitabilityService:

    @staticmethod
    def analyze(latitude: float, longitude: float):

        if abs(latitude - 26.9124) < 0.001 and abs(longitude - 75.7873) < 0.001:
            location = "Jaipur"
            solar_score = 92
            wind_score = 84

        elif abs(latitude - 28.6139) < 0.001 and abs(longitude - 77.2090) < 0.001:
            location = "New Delhi"
            solar_score = 88
            wind_score = 78

        elif abs(latitude - 12.9716) < 0.001 and abs(longitude - 77.5946) < 0.001:
            location = "Bengaluru"
            solar_score = 87
            wind_score = 82

        else:
            location = "Unknown"
            solar_score = 75
            wind_score = 70

        overall_score = int((solar_score + wind_score) / 2)

        if overall_score >= 85:
            suitability = "Excellent"
            recommendation = "Suitable for Renewable Deployment"

        elif overall_score >= 70:
            suitability = "Good"
            recommendation = "Recommended"

        else:
            suitability = "Average"
            recommendation = "Further Analysis Required"

        return {
            "location": location,
            "overall_score": overall_score,
            "suitability": suitability,
            "recommendation": recommendation,
            "solar_score": solar_score,
            "wind_score": wind_score,
        }