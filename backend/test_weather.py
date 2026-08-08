from app.services.weather_service import get_live_weather

weather = get_live_weather(
    17.3850,
    78.4867
)

print(weather)