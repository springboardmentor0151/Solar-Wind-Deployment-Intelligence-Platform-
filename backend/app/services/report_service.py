from app.services.solar_service import SolarService
from app.services.wind_service import WindService
from app.services.environmental_service import EnvironmentalService
from app.services.forecast_service import ForecastService
from app.services.investment_service import InvestmentService


class ReportService:

    @staticmethod
    def generate(latitude: float, longitude: float):

        print("Solar")
        solar = SolarService.predict(latitude, longitude)

        print("Wind")
        wind = WindService.predict(latitude, longitude)

        print("Environment")
        environment = EnvironmentalService.analyze_location(
            latitude,
            longitude
        )

        print("Forecast")
        forecast = ForecastService.predict(
            latitude,
            longitude
        )

        print("Investment")
        investment = InvestmentService.analyze(
            latitude,
            longitude
        )

        return {
            "site_name": "Selected Site",
            "solar": solar,
            "wind": wind,
            "environment": environment,
            "forecast": forecast,
            "investment": investment,
        }