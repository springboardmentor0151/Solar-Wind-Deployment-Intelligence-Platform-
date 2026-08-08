import math

def search_location_by_query(query: str) -> dict:
    """
    Simulates searching by city name.
    """
    cities = {
        "bhadla": {"city": "Bhadla", "state": "Rajasthan", "country": "India", "latitude": 27.539, "longitude": 71.918, "elevation": 180.0, "land_type": "Desert Sand"},
        "muppandal": {"city": "Muppandal", "state": "Tamil Nadu", "country": "India", "latitude": 8.258, "longitude": 77.535, "elevation": 60.0, "land_type": "Coastal Plains"},
        "jaisalmer": {"city": "Jaisalmer", "state": "Rajasthan", "country": "India", "latitude": 26.915, "longitude": 70.908, "elevation": 220.0, "land_type": "Arid Grassland"},
        "kurnool": {"city": "Kurnool", "state": "Andhra Pradesh", "country": "India", "latitude": 15.828, "longitude": 78.037, "elevation": 270.0, "land_type": "Deccan Shrubland"}
    }
    
    q_clean = query.lower().strip()
    for name, data in cities.items():
        if name in q_clean:
            return data
            
    # Fallback default location if not matched
    return {
        "city": query.title(),
        "state": "Global Region",
        "country": "International Coordinates",
        "latitude": 20.0,
        "longitude": 75.0,
        "elevation": 150.0,
        "land_type": "Undulated Plains"
    }

def get_reverse_geocoding(lat: float, lon: float) -> dict:
    """
    Returns administrative boundary information based on coordinates.
    """
    # Deterministic mapping for testing coordinates
    if 25.0 <= lat <= 29.0 and 70.0 <= lon <= 74.0:
        return {"city": "Phalodi", "state": "Rajasthan", "country": "India", "land_type": "Desert Sand"}
    if 7.0 <= lat <= 9.0 and 76.0 <= lon <= 78.0:
        return {"city": "Muppandal", "state": "Tamil Nadu", "country": "India", "land_type": "Coastal Plains"}
    if 14.0 <= lat <= 17.0 and 77.0 <= lon <= 79.0:
        return {"city": "Kurnool", "state": "Andhra Pradesh", "country": "India", "land_type": "Deccan Shrubland"}
        
    return {"city": "Global Node", "state": "Coordinates Border", "country": "Global Coordinate Sphere", "land_type": "Unclassified Grassland"}

def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates great-circle distance between two points using Haversine formula.
    """
    R = 6371.0 # Earth radius
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 3)

def calculate_polygon_area_ha(coordinates: list) -> float:
    """
    Calculates area of a polygon in hectares using shoelace formula (approximate local projection).
    """
    if len(coordinates) < 3:
        return 0.0
        
    # Shoelace formula on local cartesian coordinates (rough approximation)
    # 1 degree lat is ~111km, 1 degree lon is ~111km * cos(lat)
    lat_ref = coordinates[0][0]
    lat_scale = 111320.0 # meters per degree
    lon_scale = 111320.0 * math.cos(math.radians(lat_ref))
    
    x = []
    y = []
    for lat, lon in coordinates:
        x.append((lon - coordinates[0][1]) * lon_scale)
        y.append((lat - coordinates[0][0]) * lat_scale)
        
    # Close the polygon
    x.append(x[0])
    y.append(y[0])
    
    area_m2 = 0.0
    for i in range(len(coordinates)):
        area_m2 += (x[i] * y[i+1] - x[i+1] * y[i])
        
    area_m2 = abs(area_m2) / 2.0
    # Convert square meters to hectares (1 hectare = 10,000 m2)
    return round(area_m2 / 10000.0, 2)
