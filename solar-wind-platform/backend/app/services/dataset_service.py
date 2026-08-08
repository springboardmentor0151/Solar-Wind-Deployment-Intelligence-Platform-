import math

def fetch_environmental_data(lat: float, lon: float) -> dict:
    """
    Simulates fetching clean datasets from NASA POWER API, OpenWeather API,
    OpenStreetMap, and Open-Elevation API, and returns structured data.
    """
    # Deterministic calculations based on latitude and longitude to simulate public API parity
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    
    # Atmospheric pressure (barometric pressure formula)
    elevation = round(abs(math.sin(lat_rad * 2) * math.cos(lon_rad)) * 800.0 + 50.0, 1)
    pressure = round(1013.25 * ((1.0 - (0.0065 * elevation) / 288.15) ** 5.255), 1)
    
    # Temperature based on latitude and elevation
    temperature = round(32.0 - abs(lat) * 0.45 - (elevation / 100.0) * 0.65, 1)
    # Wind speed
    wind_speed = round(3.5 + abs(math.cos(lat_rad * 3) * 5.0) + abs(math.sin(lon_rad) * 2.0), 1)
    wind_direction = int(abs(math.sin(lat_rad + lon_rad) * 360.0) % 360)
    
    # Solar parameters
    cloud_cover = round(abs(math.sin(lon_rad * 3) * 60.0) + 15.0, 1)
    solar_irradiance = round(max(1.5, 7.5 - (cloud_cover / 100.0) * 4.0 - abs(lat) * 0.05), 2)
    
    # Direct and Diffuse split
    kt = max(0.2, min(0.8, solar_irradiance / 8.0))
    dhi = round(solar_irradiance * (1.00 - 1.13 * kt if kt < 0.8 else 0.15), 2)
    dni = round(max(0.0, (solar_irradiance - dhi) / max(0.1, math.cos(lat_rad))), 2)
    peak_sun_hours = round(solar_irradiance * 1.05, 1)
    
    # Geographic terrain details
    land_slope = round(abs(math.sin(lat_rad * 5) * 15.0), 1)
    vegetation_index = round(max(0.05, min(0.95, 0.75 - (cloud_cover / 100.0) * 0.2 - land_slope * 0.02)), 2)
    
    # Terrain and Land classification
    if land_slope < 2.0:
        terrain_type = "Flat Plains"
        land_use = "Barren Grassland"
    elif land_slope < 8.0:
        terrain_type = "Rolling Hills"
        land_use = "Shrubland"
    else:
        terrain_type = "Steep Slope"
        land_use = "Rocky Highlands"
        
    humidity = round(max(20.0, min(100.0, 85.0 - temperature * 1.2 - wind_speed * 0.8)), 1)
    rainfall = round(cloud_cover * 25.0, 0)
    
    return {
        "latitude": lat,
        "longitude": lon,
        "temperature": temperature,
        "humidity": humidity,
        "wind_speed": wind_speed,
        "wind_direction": wind_direction,
        "pressure": pressure,
        "rainfall": rainfall,
        "cloud_cover": cloud_cover,
        "solar_irradiance": solar_irradiance,
        "dni": dni,
        "dhi": dhi,
        "peak_sun_hours": peak_sun_hours,
        "elevation": elevation,
        "terrain_type": terrain_type,
        "land_use": land_use,
        "land_slope": land_slope,
        "vegetation_index": vegetation_index
    }
