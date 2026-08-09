def generate_forecast(overall_score: int):
    """
    Generate renewable energy forecast
    based on the overall suitability score.
    """

    if overall_score >= 90:
        return {
            "future_potential": "Excellent",
            "growth_trend": "Rapid Growth",
            "confidence": "95%",
            "prediction": "Very High Renewable Energy Production"
        }

    elif overall_score >= 75:
        return {
            "future_potential": "High",
            "growth_trend": "Strong Growth",
            "confidence": "90%",
            "prediction": "High Renewable Energy Production"
        }

    elif overall_score >= 60:
        return {
            "future_potential": "Good",
            "growth_trend": "Steady Growth",
            "confidence": "85%",
            "prediction": "Moderate Renewable Energy Production"
        }

    elif overall_score >= 45:
        return {
            "future_potential": "Moderate",
            "growth_trend": "Slow Growth",
            "confidence": "75%",
            "prediction": "Limited Renewable Energy Production"
        }

    else:
        return {
            "future_potential": "Low",
            "growth_trend": "Minimal Growth",
            "confidence": "60%",
            "prediction": "Low Renewable Energy Production"
        }