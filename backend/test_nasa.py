from app.services.nasa_service import get_solar_data

result = get_solar_data(
    17.3850,
    78.4867
)

print(result)