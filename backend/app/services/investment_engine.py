def generate_investment_recommendation(overall_score: int):
    """
    Generate investment recommendation
    based on site suitability score.
    """

    if overall_score >= 90:
        return {
            "decision": "Strongly Recommended",
            "estimated_roi": "25%",
            "investment_level": "High",
            "payback_period": "4 Years"
        }

    elif overall_score >= 75:
        return {
            "decision": "Recommended",
            "estimated_roi": "20%",
            "investment_level": "High",
            "payback_period": "5 Years"
        }

    elif overall_score >= 60:
        return {
            "decision": "Worth Considering",
            "estimated_roi": "15%",
            "investment_level": "Medium",
            "payback_period": "8 Years"
        }

    elif overall_score >= 45:
        return {
            "decision": "Proceed with Caution",
            "estimated_roi": "10%",
            "investment_level": "Low",
            "payback_period": "12 Years"
        }

    else:
        return {
            "decision": "Not Recommended",
            "estimated_roi": "4%",
            "investment_level": "Very Low",
            "payback_period": "18 Years"
        }