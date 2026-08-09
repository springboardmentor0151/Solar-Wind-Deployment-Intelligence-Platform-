import geopandas as gpd
from shapely.geometry import Point
import numpy as np

def calculate_infrastructure_proximities(site_lat: float, site_lon: float) -> dict:
    
    site_point = Point(site_lon, site_lat)
    
    
    
    simulated_metrics = {
        "elevation_m": round(float(np.random.uniform(50, 800)), 2), 
        "slope_degrees": round(float(np.random.uniform(1, 15)), 2), 
        "distance_to_road_km": round(float(np.random.uniform(0.5, 12.0)), 2), 
        "distance_to_transmission_line_km": round(float(np.random.uniform(1.0, 25.0)), 2), 
        "distance_to_substation_km": round(float(np.random.uniform(2.0, 30.0)), 2),
        "land_cover_type": "Barren/Open Land" 
    }
    
    return simulated_metrics