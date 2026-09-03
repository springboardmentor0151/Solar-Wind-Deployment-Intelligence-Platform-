import math

from app.schemas.environment import EnvironmentalDataRead


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return round(max(minimum, min(maximum, value)), 2)


def fetch_environmental_data(latitude: float, longitude: float) -> EnvironmentalDataRead:
    lat_abs = abs(latitude)
    lon_wave = math.sin(math.radians(longitude * 2))
    lat_wave = math.cos(math.radians(latitude * 3))

    solar = _clamp(6.2 - lat_abs * 0.045 + max(0, lat_wave) * 1.1, 2.2, 7.8)
    wind = _clamp(4.4 + abs(lon_wave) * 3.6 + (lat_abs / 90) * 1.4, 2.0, 11.5)
    temperature = _clamp(29 - lat_abs * 0.18 + lon_wave * 4, -5, 42)
    humidity = _clamp(62 + math.cos(math.radians(longitude)) * 18 - lat_abs * 0.08, 25, 95)
    rainfall = _clamp(90 + humidity * 2.8 - solar * 18, 10, 420)
    cloud = _clamp(humidity * 0.68 + rainfall * 0.035, 5, 92)
    elevation = _clamp(120 + abs(math.sin(math.radians(latitude + longitude))) * 1300, 0, 2600)
    slope = _clamp(1.5 + abs(math.sin(math.radians(latitude * longitude))) * 16, 0, 28)
    vegetation = _clamp(0.18 + humidity / 260 + rainfall / 1500 - solar / 60, 0.05, 0.86)
    roads = _clamp(0.8 + abs(math.sin(math.radians(longitude))) * 12, 0.2, 18)
    substations = _clamp(2.5 + abs(math.cos(math.radians(latitude))) * 28, 1, 42)
    transmission = _clamp(1.7 + abs(math.sin(math.radians(latitude - longitude))) * 22, 0.8, 34)

    return EnvironmentalDataRead(
        latitude=latitude,
        longitude=longitude,
        solar_irradiance=solar,
        wind_speed=wind,
        wind_direction=_clamp((longitude * 7 + latitude * 3) % 360, 0, 360),
        temperature=temperature,
        humidity=humidity,
        rainfall=rainfall,
        cloud_cover=cloud,
        elevation=elevation,
        land_slope=slope,
        vegetation_index=vegetation,
        nearby_roads_km=roads,
        nearby_substations_km=substations,
        nearby_transmission_lines_km=transmission,
    )
