import math
import random
import urllib.request
import urllib.parse
import json
from typing import Dict, Any

_gis_cache = {}

def fetch_nominatim_reverse(lat: float, lon: float) -> Dict[str, Any]:
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&accept-language=en"
    req = urllib.request.Request(
        url, 
        headers={"User-Agent": "SolarWindPlatform/1.0 (contact: admin@solarwindplatform.com)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=1.5) as res:
            data = json.loads(res.read().decode('utf-8'))
            addr = data.get("address", {})
            return {
                "country": addr.get("country", ""),
                "state": addr.get("state", addr.get("region", "")),
                "district": addr.get("state_district", addr.get("county", addr.get("district", ""))),
                "city": addr.get("city", addr.get("town", addr.get("village", addr.get("suburb", addr.get("municipality", ""))))),
                "postcode": addr.get("postcode", ""),
                "display_name": data.get("display_name", f"{lat:.4f}, {lon:.4f}")
            }
    except Exception:
        return {}

def fetch_open_meteo_elevation(lat: float, lon: float) -> Any:
    url = f"https://api.open-meteo.com/v1/elevation?latitude={lat}&longitude={lon}"
    req = urllib.request.Request(url, headers={"User-Agent": "SolarWindPlatform/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=1.5) as res:
            data = json.loads(res.read().decode('utf-8'))
            elevations = data.get("elevation", [])
            if elevations:
                return float(elevations[0])
    except Exception:
        pass
    return None

def fetch_open_meteo_weather(lat: float, lon: float) -> Dict[str, Any]:
    url = (
        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,pressure_msl,cloud_cover,visibility,wind_speed_10m,wind_direction_10m"
        f"&daily=sunrise,sunset,uv_index_max&timezone=auto"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "SolarWindPlatform/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=1.5) as res:
            data = json.loads(res.read().decode('utf-8'))
            curr = data.get("current", {})
            daily = data.get("daily", {})
            
            sunrise = daily.get("sunrise", [None])[0]
            sunset = daily.get("sunset", [None])[0]
            uv_arr = daily.get("uv_index_max", [None])
            
            return {
                "temperature": curr.get("temperature_2m"),
                "apparent_temperature": curr.get("apparent_temperature"),
                "humidity": curr.get("relative_humidity_2m"),
                "pressure": curr.get("pressure_msl"),
                "rainfall": curr.get("rain"),
                "cloud_cover": curr.get("cloud_cover"),
                "visibility": curr.get("visibility"),
                "wind_speed": curr.get("wind_speed_10m"),
                "wind_direction": curr.get("wind_direction_10m"),
                "sunrise": sunrise.split("T")[1] if sunrise else None,
                "sunset": sunset.split("T")[1] if sunset else None,
                "uv_index": uv_arr[0] if uv_arr else None
            }
    except Exception:
        return {}

def fetch_nasa_power_data(lat: float, lon: float) -> Dict[str, Any]:
    url = f"https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,WS50M,T2M&community=RE&longitude={lon}&latitude={lat}&format=JSON"
    req = urllib.request.Request(url, headers={"User-Agent": "SolarWindPlatform/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=1.5) as res:
            data = json.loads(res.read().decode('utf-8'))
            params = data.get("properties", {}).get("parameter", {})
            
            solar_ann = params.get("ALLSKY_SFC_SW_DWN", {}).get("ANN")
            wind_ann = params.get("WS50M", {}).get("ANN")
            temp_ann = params.get("T2M", {}).get("ANN")
            
            return {
                "nasa_solar_irradiance": float(solar_ann) if solar_ann is not None else None,
                "nasa_wind_speed": float(wind_ann) if wind_ann is not None else None,
                "nasa_temperature": float(temp_ann) if temp_ann is not None else None
            }
    except Exception as e:
        print(f"NASA POWER API error: {e}")
        return {}

def simulate_location_details(lat: float, lon: float) -> Dict[str, Any]:
    coord_hash = int(abs(lat * 1000) + abs(lon * 1000))
    random.seed(coord_hash)
    
    # India Coordinates
    if 8.0 <= lat <= 38.0 and 68.0 <= lon <= 98.0:
        country = "India"
        states = ["Rajasthan", "Gujarat", "Tamil Nadu", "Ladakh", "Karnataka", "Andhra Pradesh", "Maharashtra", "Madhya Pradesh"]
        state = states[coord_hash % len(states)]
        district = f"{state} District {coord_hash % 7 + 1}"
        city = f"{state} City {coord_hash % 5 + 1}"
    # US Coordinates
    elif 24.0 <= lat <= 49.0 and -125.0 <= lon <= -66.0:
        country = "United States"
        states = ["California", "Texas", "Nevada", "Arizona", "Colorado", "New Mexico", "Oregon", "Washington"]
        state = states[coord_hash % len(states)]
        district = f"{state} County {coord_hash % 9 + 1}"
        city = f"{state} City {coord_hash % 4 + 1}"
    # Europe/Australia/etc.
    elif 35.0 <= lat <= 60.0 and -10.0 <= lon <= 30.0:
        country = "Germany"
        state = "Bavaria"
        district = "Oberbayern"
        city = "Munich"
    elif -40.0 <= lat <= -10.0 and 110.0 <= lon <= 155.0:
        country = "Australia"
        state = "New South Wales"
        district = "West Sydney"
        city = "Sydney"
    else:
        country = "Global Grid"
        state = f"Zone {int(lat // 10)}"
        district = f"Sector {int(lon // 10)}"
        city = f"Node {coord_hash % 100}"
        
    postcode = f"{coord_hash % 90000 + 10000}"
    display_name = f"{city}, {district}, {state}, {country}, {postcode}"
    
    return {
        "country": country,
        "state": state,
        "district": district,
        "city": city,
        "postcode": postcode,
        "display_name": display_name
    }

def simulate_weather_details(lat: float, lon: float) -> Dict[str, Any]:
    coord_hash = int(abs(lat * 1000) + abs(lon * 1000))
    random.seed(coord_hash)
    
    lat_rad = math.radians(lat)
    base_temp = 32.0 * math.cos(lat_rad) - (abs(lat) * 0.15)
    temp = round(base_temp + random.uniform(-5.0, 5.0), 1)
    apparent_temp = round(temp + random.uniform(-2.0, 3.0), 1)
    
    humidity = int(50 + 30 * math.sin(lat_rad * 3.0) + random.randint(-10, 10))
    humidity = max(10, min(100, humidity))
    
    pressure = round(1013.25 - (100 * math.sin(lat_rad)) + random.uniform(-5.0, 5.0), 1)
    rainfall = round(max(0.0, (humidity - 50.0) * 0.3 + random.uniform(-1.0, 5.0)), 1)
    cloud_cover = round(max(0.0, min(100.0, humidity * 0.8 + random.uniform(-15.0, 15.0))), 1)
    visibility = int(max(1000, 15000 - (cloud_cover * 100) - (rainfall * 500)))
    
    wind_speed = round(3.5 + 4.0 * abs(math.sin(lat * 0.25) * math.cos(lon * 0.25)) + random.uniform(0.0, 3.0), 2)
    wind_direction = int((180 + 45 * math.sin(lat * 4.0)) % 360)
    
    sunrise = "05:45"
    sunset = "18:30"
    uv_index = round(max(1.0, 12.0 * math.cos(lat_rad) - (cloud_cover * 0.05)), 1)
    
    return {
        "temperature": temp,
        "apparent_temperature": apparent_temp,
        "humidity": humidity,
        "pressure": pressure,
        "rainfall": rainfall,
        "cloud_cover": cloud_cover,
        "visibility": visibility,
        "wind_speed": wind_speed,
        "wind_direction": wind_direction,
        "sunrise": sunrise,
        "sunset": sunset,
        "uv_index": uv_index
    }

def get_environmental_and_gis_data(lat: float, lon: float) -> Dict[str, Any]:
    # Check cache rounds to approx 110m (3 decimal places)
    cache_key = (round(lat, 3), round(lon, 3))
    if cache_key in _gis_cache:
        return _gis_cache[cache_key]

    # 1. Deterministic pseudo-random seed based on coordinate hash to ensure consistency
    coord_hash = int(abs(lat * 10000) + abs(lon * 10000))
    random.seed(coord_hash)
    
    # 2. Call live APIs (Nominatim, Open-Meteo elevation and weather)
    loc_details = fetch_nominatim_reverse(lat, lon)
    sim_loc = None
    for key in ["country", "state", "district", "city", "postcode", "display_name"]:
        if not loc_details.get(key):
            if sim_loc is None:
                sim_loc = simulate_location_details(lat, lon)
            loc_details[key] = sim_loc[key]
        
    elevation = fetch_open_meteo_elevation(lat, lon)
    if elevation is None:
        elevation = round(150.0 + (coord_hash % 900) + random.uniform(-50.0, 50.0), 1)
        
    weather = fetch_open_meteo_weather(lat, lon)
    sim_weather = None
    for key in ["temperature", "apparent_temperature", "humidity", "pressure", "rainfall", "cloud_cover", "visibility", "wind_speed", "wind_direction", "sunrise", "sunset", "uv_index"]:
        if weather.get(key) is None:
            if sim_weather is None:
                sim_weather = simulate_weather_details(lat, lon)
            weather[key] = sim_weather[key]
        
    # Extract weather variables
    temp = weather["temperature"]
    apparent_temp = weather["apparent_temperature"]
    humidity = weather["humidity"]
    pressure = weather["pressure"]
    rainfall = weather["rainfall"]
    cloud_cover = weather["cloud_cover"]
    visibility = weather["visibility"]
    wind_speed = weather["wind_speed"]
    wind_direction = weather["wind_direction"]
    sunrise = weather["sunrise"]
    sunset = weather["sunset"]
    uv_index = weather["uv_index"]
    
    # NASA POWER API integration
    nasa = fetch_nasa_power_data(lat, lon)
    if nasa.get("nasa_solar_irradiance") is not None:
        solar_irradiance = round(nasa["nasa_solar_irradiance"], 2)
    else:
        lat_rad = math.radians(lat)
        base_ghi = 1.8 + 5.2 * math.cos(lat_rad)
        solar_irradiance = base_ghi * (1.0 - 0.7 * (cloud_cover / 100.0) ** 1.5)
        solar_irradiance = round(max(1.0, min(8.0, solar_irradiance)), 2)
        
    if nasa.get("nasa_wind_speed") is not None:
        wind_speed = round(nasa["nasa_wind_speed"], 2)
        
    if nasa.get("nasa_temperature") is not None:
        temp = round(nasa["nasa_temperature"], 2)
        
    # 3. Simulate high-fidelity solar/wind resources globally
    # Peak Sun Hours matches GHI numerically
    peak_sun_hours = solar_irradiance
    
    # Aspect (degrees): direction slope faces (0 = North, 90 = East, 180 = South, 270 = West)
    aspect = round((coord_hash % 8) * 45.0, 1)
    
    # Solar Radiation sub-models (DNI & DHI)
    # Clearness Index (kt) derived from cloud cover
    kt = round(0.85 - 0.65 * (cloud_cover / 100.0) ** 1.5, 3)
    kt = max(0.1, min(0.85, kt))
    
    # Diffuse Fraction (df) - Orgill and Hollands model
    if kt < 0.35:
        df = 1.0 - 0.249 * kt
    elif kt < 0.75:
        df = 1.557 - 1.84 * kt
    else:
        df = 0.177
        
    df = max(0.15, min(0.95, df))
    
    # Diffuse Horizontal Irradiance (DHI) in kWh/m2/day
    dhi = round(solar_irradiance * df, 2)
    
    # Direct Horizontal Irradiance (I_b)
    direct_horizontal = max(0.0, solar_irradiance - dhi)
    
    # Zenith Cosine for solar noon on average. Zenith ~ latitude.
    cos_zenith = math.cos(math.radians(lat))
    if cos_zenith < 0.15: # prevent division by zero or extreme spikes near poles
        cos_zenith = 0.15
        
    # Direct Normal Irradiance (DNI) in kWh/m2/day
    dni = round(direct_horizontal / cos_zenith, 2)
    
    # Air Density (kg/m3)
    air_density = round(1.225 * math.exp(-0.000115 * elevation) * (288.15 / (273.15 + temp)), 3)
    
    # Slope (degrees)
    is_mountainous = elevation > 1000.0
    if is_mountainous:
        land_slope = round(6.0 + (elevation / 500.0) + random.uniform(-2.0, 6.0), 2)
    else:
        land_slope = round(0.4 + (elevation / 1000.0) * 2.5 + random.uniform(-0.2, 0.8), 2)
    land_slope = max(0.1, land_slope)
    
    # NDVI vegetation index (0.0 to 1.0)
    base_ndvi = 0.75 - (abs(lat) * 0.01)
    rainfall_factor = min(1.0, rainfall / 100.0)
    ndvi = base_ndvi * 0.5 + rainfall_factor * 0.4 + random.uniform(-0.1, 0.1)
    ndvi = round(max(0.01, min(0.99, ndvi)), 2)
    
    # Land Cover classification
    if ndvi > 0.6:
        land_cover = "Dense Forest"
    elif ndvi > 0.35:
        land_cover = "Grassland / Agricultural"
    elif ndvi > 0.15:
        land_cover = "Scrub / Shrubland"
    elif elevation > 3000.0 and temp < 10.0:
        land_cover = "Alpine Tundra / Rocky"
    else:
        land_cover = "Barren Desert / Sandy"
        
    # Terrain Type
    if land_slope > 15.0:
        terrain_type = "Steep Mountainous"
    elif land_slope > 8.0:
        terrain_type = "Hilly Terrain"
    elif elevation > 2000.0 and land_slope < 5.0:
        terrain_type = "High Altitude Plateau"
    elif land_cover == "Barren Desert / Sandy":
        terrain_type = "Sandy Desert Plain"
    else:
        terrain_type = "Flat Plains"
        
    # Land areas percentage
    if land_cover == "Dense Forest":
        forest_area_pct = round(60.0 + ndvi * 30.0, 1)
        agricultural_area_pct = round(random.uniform(0.0, 5.0), 1)
        rocky_area_pct = round(land_slope * 1.5, 1)
    elif land_cover == "Grassland / Agricultural":
        forest_area_pct = round(random.uniform(5.0, 15.0), 1)
        agricultural_area_pct = round(40.0 + ndvi * 40.0, 1)
        rocky_area_pct = round(land_slope * 0.8, 1)
    elif land_cover == "Barren Desert / Sandy":
        forest_area_pct = 0.0
        agricultural_area_pct = 0.0
        rocky_area_pct = round(20.0 + land_slope * 2.0, 1)
    else: # Alpine/Scrub
        forest_area_pct = round(random.uniform(0.0, 10.0), 1)
        agricultural_area_pct = round(random.uniform(0.0, 10.0), 1)
        rocky_area_pct = round(30.0 + land_slope * 3.0, 1)
        
    water_bodies_pct = round(0.5 + 4.0 * abs(math.sin(lat * 0.15) * math.cos(lon * 0.15)) + random.uniform(0.1, 1.2), 1)
    
    # Normalize percentages to not exceed 95%
    total_pct = forest_area_pct + agricultural_area_pct + rocky_area_pct + water_bodies_pct
    if total_pct > 95.0:
        scale = 95.0 / total_pct
        forest_area_pct = round(forest_area_pct * scale, 1)
        agricultural_area_pct = round(agricultural_area_pct * scale, 1)
        rocky_area_pct = round(rocky_area_pct * scale, 1)
        water_bodies_pct = round(water_bodies_pct * scale, 1)
        
    # Infrastructure grid distance simulations
    distance_to_road = max(0.05, abs(math.sin(lat * 6.5) * math.cos(lon * 6.5)) * 8.0 + random.uniform(-0.02, 0.02))
    distance_to_highway = distance_to_road + max(0.5, abs(math.sin(lat * 3.1)) * 22.0)
    distance_to_railway = max(0.8, abs(math.sin(lat * 1.8) * math.sin(lon * 1.8)) * 45.0)
    
    # Coastal detection
    is_coastal = (water_bodies_pct > 3.0) or (abs(lon) > 175.0)
    if is_coastal:
        distance_to_port = max(5.0, 15.0 + random.uniform(0.0, 20.0))
    else:
        distance_to_port = 80.0 + abs(math.sin(lat * 0.5)) * 300.0
        
    distance_to_airport = 12.0 + abs(math.sin(lat + lon)) * 95.0
    distance_to_transmission = max(0.05, abs(math.sin(lat * 8.2) * math.cos(lon * 8.2)) * 12.0)
    distance_to_substation = distance_to_transmission * 1.6 + distance_to_road * 0.7 + random.uniform(0.2, 1.2)
    distance_to_water = max(0.05, abs(math.sin(lat * 12.0) * math.sin(lon * 12.0)) * 10.0)
    
    # Protected centers global list
    protected_centers = [
        (26.8, 70.9, "Desert National Park (India)"),
        (21.1, 70.8, "Gir Forest National Park (India)"),
        (11.5, 76.6, "Mudumalai Biosphere Reserve (India)"),
        (33.9, 77.3, "Hemis National Park (Ladakh)"),
        (44.4, -110.5, "Yellowstone National Park (USA)"),
        (-3.0, -60.0, "Amazon Rainforest Reserve (Brazil)"),
        (-2.1, 34.8, "Serengeti National Park (Tanzania)"),
        (-18.2, 147.7, "Great Barrier Reef Marine Park (Australia)"),
        (35.8, 137.6, "Chubu-Sangaku National Park (Japan)"),
        (46.8, 9.8, "Swiss National Park (Switzerland)")
    ]
    in_protected_zone = False
    protected_park_name = ""
    for p_lat, p_lon, park_name in protected_centers:
        dist = math.sqrt((lat - p_lat)**2 + (lon - p_lon)**2) * 111.0
        if dist < 40.0:
            in_protected_zone = True
            protected_park_name = park_name
            break
            
    on_agricultural_land = (land_cover == "Grassland / Agricultural" and land_slope < 4.0)
    near_water_bodies = (distance_to_water < 0.6)
    
    # Qualitative categorizations
    power_grid_availability = "Yes" if distance_to_transmission < 10.0 else "No"
    
    if land_slope < 3.0 and distance_to_road < 1.0:
        construction_accessibility = "Easy"
    elif land_slope < 10.0 and distance_to_road < 5.0:
        construction_accessibility = "Moderate"
    else:
        construction_accessibility = "Challenging"
        
    # Risks
    flood_risk = "Low"
    if near_water_bodies and elevation < 80.0:
        flood_risk = "High"
    elif elevation < 120.0 or distance_to_water < 1.5:
        flood_risk = "Medium"
        
    earthquake_risk = "Low"
    if land_slope > 14.0 or (25.0 <= lat <= 38.0 and 70.0 <= lon <= 96.0):
        earthquake_risk = "High"
    elif land_slope > 6.0:
        earthquake_risk = "Medium"
        
    environmental_sensitivity = "Low"
    if in_protected_zone or forest_area_pct > 35.0:
        environmental_sensitivity = "High"
    elif on_agricultural_land or near_water_bodies:
        environmental_sensitivity = "Medium"
        
    construction_difficulty = "Low"
    if land_slope > 14.0 or elevation > 2200.0:
        construction_difficulty = "High"
    elif land_slope > 6.0 or rocky_area_pct > 25.0:
        construction_difficulty = "Medium"
        
    # Assemble simulated metrics
    if land_cover == "Barren Desert / Sandy" or elevation > 3000.0:
        pop_density = round(random.uniform(0.1, 5.0), 1)
    elif land_cover == "Dense Forest":
        pop_density = round(random.uniform(1.0, 15.0), 1)
    else:
        pop_density = round(random.uniform(10.0, 120.0), 1)

    result = {
        "environmental": {
            "solar_irradiance": round(solar_irradiance, 2),
            "wind_speed": round(wind_speed, 2),
            "wind_direction": wind_direction,
            "temperature": round(temp, 1),
            "apparent_temperature": round(apparent_temp, 1),
            "humidity": humidity,
            "pressure": round(pressure, 1),
            "rainfall": round(rainfall, 0),
            "cloud_cover": round(cloud_cover, 1),
            "visibility": visibility,
            "elevation": round(elevation, 1),
            "land_slope": round(land_slope, 2),
            "vegetation_index": round(ndvi, 2),
            "region": loc_details["state"] or "Global Coordinates",
            "terrain_type": terrain_type,
            "land_cover": land_cover,
            "rocky_area_pct": rocky_area_pct,
            "forest_area_pct": forest_area_pct,
            "agricultural_area_pct": agricultural_area_pct,
            "water_bodies_pct": water_bodies_pct,
            "flood_risk": flood_risk,
            "earthquake_risk": earthquake_risk,
            "environmental_sensitivity": environmental_sensitivity,
            "construction_difficulty": construction_difficulty,
            "sunrise": sunrise,
            "sunset": sunset,
            "uv_index": round(uv_index, 1),
            "aspect": aspect,
            "dhi": dhi,
            "dni": dni,
            "peak_sun_hours": round(peak_sun_hours, 2),
            "population_density": pop_density
        },
        "infrastructure": {
            "distance_to_road": round(distance_to_road, 2),
            "distance_to_highway": round(distance_to_highway, 2),
            "distance_to_railway": round(distance_to_railway, 2),
            "distance_to_port": round(distance_to_port, 2),
            "distance_to_airport": round(distance_to_airport, 2),
            "distance_to_transmission": round(distance_to_transmission, 2),
            "distance_to_substation": round(distance_to_substation, 2),
            "distance_to_water": round(distance_to_water, 2),
            "in_protected_zone": in_protected_zone,
            "on_agricultural_land": on_agricultural_land,
            "near_water_bodies": near_water_bodies,
            "power_grid_availability": power_grid_availability,
            "construction_accessibility": construction_accessibility,
            "nearest_substation": f"Substation ({round(distance_to_substation, 1)} km)",
            "nearest_highway": f"Highway Connection ({round(distance_to_highway, 1)} km)",
            "nearest_road": f"Access Road ({round(distance_to_road, 1)} km)",
            "nearest_railway": f"Railway Link ({round(distance_to_railway, 1)} km)",
            "nearest_port": f"Maritime Port ({round(distance_to_port, 1)} km)",
            "nearest_airport": f"Regional Airport ({round(distance_to_airport, 1)} km)",
            "nearest_transmission_line": f"Transmission Corridor ({round(distance_to_transmission, 1)} km)",
            "nearest_water_source": f"Water Reservoir ({round(distance_to_water, 1)} km)"
        },
        "location": loc_details
    }
    _gis_cache[cache_key] = result
    return result
