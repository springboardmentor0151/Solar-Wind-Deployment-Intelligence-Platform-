class OptimizationService:

    @staticmethod
    def optimize(latitude: float, longitude: float):

        if abs(latitude - 26.9124) < 0.001 and abs(longitude - 75.7873) < 0.001:

            return {
                "location": "Jaipur",
                "recommended_plant": "Solar Farm",
                "capacity_mw": 120,
                "land_required_acres": 550,
                "annual_generation_gwh": 245,
                "infrastructure_units": 220000,
                "recommendation": "Proceed with Solar Deployment",
            }

        elif abs(latitude - 12.9716) < 0.001 and abs(longitude - 77.5946) < 0.001:

            return {
                "location": "Bengaluru",
                "recommended_plant": "Wind Farm",
                "capacity_mw": 80,
                "land_required_acres": 420,
                "annual_generation_gwh": 280,
                "infrastructure_units": 40,
                "recommendation": "Proceed with Wind Deployment",
            }

        return {
            "location": "Unknown",
            "recommended_plant": "Hybrid Plant",
            "capacity_mw": 60,
            "land_required_acres": 300,
            "annual_generation_gwh": 140,
            "infrastructure_units": 100000,
            "recommendation": "Detailed Site Survey Recommended",
        }