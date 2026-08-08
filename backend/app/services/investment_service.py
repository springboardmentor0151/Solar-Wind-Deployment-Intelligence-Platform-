import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class InvestmentService:

    @staticmethod
    def analyze(latitude: float, longitude: float):

        # Weather API
        weather_url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={latitude}"
            f"&longitude={longitude}"
            f"&current="
            f"shortwave_radiation,"
            f"wind_speed_10m"
        )

        weather = requests.get(
            weather_url,
            timeout=10,
            verify=False
        ).json()

        current = weather["current"]

        solar_radiation = current.get("shortwave_radiation", 500)
        wind_speed = current.get("wind_speed_10m", 4)

        # -----------------------------
        # Solar Score (0-100)
        # -----------------------------
        if solar_radiation >= 800:
            solar_score = 100
        elif solar_radiation >= 600:
            solar_score = 80
        elif solar_radiation >= 400:
            solar_score = 60
        else:
            solar_score = 40

        # -----------------------------
        # Wind Score (0-100)
        # -----------------------------
        if wind_speed >= 8:
            wind_score = 100
        elif wind_speed >= 6:
            wind_score = 80
        elif wind_speed >= 4:
            wind_score = 60
        else:
            wind_score = 40

        # -----------------------------
        # Environmental Score
        # -----------------------------
        environmental_score = 80

        # -----------------------------
        # Final Investment Score
        # -----------------------------
        investment_score = int(
            (
                solar_score +
                wind_score +
                environmental_score
            ) / 3
        )

        # -----------------------------
        # ROI (%)
        # -----------------------------
        roi = round(15 + (investment_score * 0.25), 2)

        # -----------------------------
        # Payback Period (Years)
        # -----------------------------
        payback_period = round(
            max(5, 18 - investment_score * 0.10),
            1
        )

        # -----------------------------
        # Risk Level
        # -----------------------------
        if investment_score >= 85:
            risk = "Low"
            recommendation = (
                "Excellent investment opportunity with strong renewable energy potential."
            )

        elif investment_score >= 70:
            risk = "Medium"
            recommendation = (
                "Good investment opportunity with acceptable financial returns."
            )

        elif investment_score >= 50:
            risk = "Medium-High"
            recommendation = (
                "Investment is possible, but site conditions should be reviewed carefully."
            )

        else:
            risk = "High"
            recommendation = (
                "Investment is not recommended because renewable energy potential is limited."
            )

        return {
            "investment_score": investment_score,
            "roi": roi,
            "payback_period": payback_period,
            "risk": risk,
            "recommendation": recommendation,
        }