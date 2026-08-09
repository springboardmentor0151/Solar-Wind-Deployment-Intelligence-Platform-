
import math
from dataclasses import dataclass, asdict, field

import requests

NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point"
OPEN_METEO_ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"


_profile_cache: dict = {}


@dataclass
class EnvironmentalProfile:
    solar_irradiance_kwh_m2_day: float   
    peak_sun_hours: float
    cloud_cover_pct: float               
    avg_temperature_c: float            
    annual_rainfall_mm: float           
    avg_wind_speed_ms: float           
    wind_direction_deg: float           
    wind_direction_compass: str          
    wind_power_density_w_m2: float
    monthly_solar_irradiance_kwh_m2_day: list   
    monthly_wind_speed_hub_ms: list             
    turbulence_intensity_pct: float
    elevation_m: float                   
    land_slope_deg: float                
    land_cover_type: str                
    distance_to_road_km: float           
    distance_to_transmission_km: float  
    distance_to_substation_km: float     
    in_protected_zone: bool              
    in_urban_area: bool                  
    land_ownership: str                  
    data_sources: dict = field(default_factory=dict)



def _fetch_nasa_power(lat: float, lon: float) -> dict:
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN,T2M,PRECTOTCORR,WS10M,CLOUD_AMT,WD10M",
        "community": "RE",
        "longitude": lon,
        "latitude": lat,
        "format": "JSON",
    }
    resp = requests.get(NASA_POWER_URL, params=params, timeout=15)
    resp.raise_for_status()
    param_data = resp.json()["properties"]["parameter"]

    def annual(name, fallback):
        values = param_data.get(name, {})
        if "ANN" in values and values["ANN"] not in (-999, None):
            return values["ANN"]
        months = [v for k, v in values.items() if k != "ANN" and v not in (-999, None)]
        return (sum(months) / len(months)) if months else fallback

    def monthly(name):
        values = param_data.get(name, {})

        numeric_keys = [f"{m:02d}" for m in range(1, 13)]
        numeric_result = [values.get(k) if values.get(k) not in (-999, None) else None for k in numeric_keys]
        if any(v is not None for v in numeric_result):
            return numeric_result

        abbr_keys = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
        abbr_result = [values.get(k) if values.get(k) not in (-999, None) else None for k in abbr_keys]
        return abbr_result

    wd_values = param_data.get("WD10M", {})
    wind_direction = wd_values.get("ANN") if wd_values.get("ANN") not in (-999, None) else None

    return {
        "solar_irradiance": annual("ALLSKY_SFC_SW_DWN", 4.5),
        "temperature": annual("T2M", 20.0),
        "rainfall_mm_day": annual("PRECTOTCORR", 2.0),
        "wind_speed_10m": annual("WS10M", 4.0),
        "cloud_amt": annual("CLOUD_AMT", 40.0),
        "wind_direction_deg": wind_direction,
        "solar_irradiance_monthly": monthly("ALLSKY_SFC_SW_DWN"),
        "wind_speed_10m_monthly": monthly("WS10M"),
    }


def _degrees_to_compass(deg) -> str:
    if deg is None:
        return "Unknown"
    directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    index = round(deg / 22.5) % 16
    return directions[index]



def _fetch_elevation_and_slope(lat: float, lon: float):
    delta = 0.0045 
    points = [(lat, lon), (lat + delta, lon), (lat - delta, lon), (lat, lon + delta), (lat, lon - delta)]
    lat_str = ",".join(str(p[0]) for p in points)
    lon_str = ",".join(str(p[1]) for p in points)

    resp = requests.get(
        OPEN_METEO_ELEVATION_URL, params={"latitude": lat_str, "longitude": lon_str}, timeout=10
    )
    resp.raise_for_status()
    elevations = resp.json()["elevation"]
    center, north, south, east, west = elevations

    run_m = 2 * delta * 111_320  # real distance between the two opposite sample points
    slope_ns = math.degrees(math.atan(abs(north - south) / run_m)) if run_m else 0.0
    slope_ew = math.degrees(math.atan(abs(east - west) / run_m)) if run_m else 0.0
    return center, max(slope_ns, slope_ew)

_LAND_COVER_MAP = {
    ("landuse", "forest"): "Forest/Woodland",
    ("natural", "wood"): "Forest/Woodland",
    ("natural", "water"): "Wetland/Water",
    ("natural", "wetland"): "Wetland/Water",
    ("landuse", "reservoir"): "Wetland/Water",
    ("landuse", "basin"): "Wetland/Water",
    ("landuse", "farmland"): "Farmland",
    ("landuse", "orchard"): "Farmland",
    ("landuse", "vineyard"): "Farmland",
    ("landuse", "meadow"): "Farmland",
    ("natural", "grassland"): "Grassland",
    ("natural", "heath"): "Grassland",
    ("natural", "scrub"): "Scrubland/Barren",
    ("natural", "bare_rock"): "Scrubland/Barren",
    ("natural", "sand"): "Scrubland/Barren",
    ("landuse", "quarry"): "Scrubland/Barren",
    ("landuse", "residential"): "Urban/Developed",
    ("landuse", "commercial"): "Urban/Developed",
    ("landuse", "industrial"): "Urban/Developed",
    ("landuse", "retail"): "Urban/Developed",
}


def _overpass_query(lat: float, lon: float) -> list:
    query = f"""
    [out:json][timeout:25];
    (
      way["highway"](around:15000,{lat},{lon});
      way["power"="line"](around:15000,{lat},{lon});
      node["power"="substation"](around:15000,{lat},{lon});
      way["power"="substation"](around:15000,{lat},{lon});
      nwr["boundary"="protected_area"](around:15000,{lat},{lon});
      nwr["leisure"="nature_reserve"](around:15000,{lat},{lon});
      nwr["landuse"="residential"](around:5000,{lat},{lon});
      nwr["natural"](around:600,{lat},{lon});
      nwr["landuse"](around:600,{lat},{lon});
    );
    out center;
    """
    resp = requests.post(OVERPASS_URL, data={"data": query}, timeout=30)
    resp.raise_for_status()
    return resp.json().get("elements", [])


def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _element_latlon(el: dict):
    lat = el.get("lat")
    lon = el.get("lon")
    if lat is None or lon is None:
        center = el.get("center") or {}
        lat, lon = center.get("lat"), center.get("lon")
    return lat, lon


def _nearest_km(lat, lon, elements, predicate):
    best = None
    for el in elements:
        if not predicate(el):
            continue
        elat, elon = _element_latlon(el)
        if elat is None or elon is None:
            continue
        d = _haversine_km(lat, lon, elat, elon)
        if best is None or d < best:
            best = d
    return best


def _classify_land_cover(lat, lon, elements) -> str:
    best_dist, best_label = None, None
    for el in elements:
        tags = el.get("tags", {})
        for (key, value), label in _LAND_COVER_MAP.items():
            if tags.get(key) == value:
                elat, elon = _element_latlon(el)
                if elat is None or elon is None:
                    continue
                d = _haversine_km(lat, lon, elat, elon)
                if best_dist is None or d < best_dist:
                    best_dist, best_label = d, label
    return best_label or "Unclassified/Open Land"


def get_environmental_profile(lat: float, lon: float, land_ownership: str = "Private") -> EnvironmentalProfile:
    cache_key = (round(lat, 3), round(lon, 3))
    if cache_key in _profile_cache:
        cached = _profile_cache[cache_key]
        cached.land_ownership = land_ownership or "Private"
        return cached

    sources = {}


    try:
        power = _fetch_nasa_power(lat, lon)
        sources["Solar / Wind / Climate / Wind Direction / Seasonal"] = "NASA POWER API (live)"
    except Exception:
        power = {
            "solar_irradiance": 3.0 + math.cos(math.radians(lat)) * 3.5,
            "temperature": 27 - abs(lat) * 0.4,
            "rainfall_mm_day": 3.0,
            "wind_speed_10m": 5.0,
            "cloud_amt": 40.0,
            "wind_direction_deg": None,
            "solar_irradiance_monthly": [None] * 12,
            "wind_speed_10m_monthly": [None] * 12,
        }
        sources["Solar / Wind / Climate / Wind Direction / Seasonal"] = "NASA POWER API unavailable - latitude-based fallback estimate used"

 
    hub_wind_speed = power["wind_speed_10m"] * (80 / 10) ** 0.14

   
    try:
        elevation, slope = _fetch_elevation_and_slope(lat, lon)
        sources["Elevation / Slope"] = "Open-Meteo Elevation API (live, Copernicus DEM)"
    except Exception:
        elevation, slope = 300.0, 3.0
        sources["Elevation / Slope"] = "Elevation API unavailable - default estimate used"

    try:
        elements = _overpass_query(lat, lon)
        sources["Infrastructure / Land Cover"] = "OpenStreetMap Overpass API (live)"

        road_km = _nearest_km(lat, lon, elements, lambda e: e.get("tags", {}).get("highway"))
        line_km = _nearest_km(lat, lon, elements, lambda e: e.get("tags", {}).get("power") == "line")
        sub_km = _nearest_km(lat, lon, elements, lambda e: e.get("tags", {}).get("power") == "substation")

        protected = any(
            e.get("tags", {}).get("boundary") == "protected_area"
            or e.get("tags", {}).get("leisure") == "nature_reserve"
            for e in elements
        )
        urban = any(e.get("tags", {}).get("landuse") == "residential" for e in elements)
        land_cover = _classify_land_cover(lat, lon, elements)

        road_km = road_km if road_km is not None else 15.0
        line_km = line_km if line_km is not None else 20.0
        sub_km = sub_km if sub_km is not None else 25.0
    except Exception:
        sources["Infrastructure / Land Cover"] = "Overpass API unavailable - default estimates used"
        road_km, line_km, sub_km = 10.0, 15.0, 20.0
        protected, urban, land_cover = False, False, "Unclassified/Open Land"

    sources["Land Ownership"] = "User-provided on site registration form (no public API exists for this)"

    air_density = 1.225
    wind_power_density = 0.5 * air_density * (hub_wind_speed ** 3)

    wind_dir_deg = power.get("wind_direction_deg")

    monthly_hub_wind = [
        (v * (80 / 10) ** 0.14) if v is not None else None
        for v in power.get("wind_speed_10m_monthly", [None] * 12)
    ]

    profile = EnvironmentalProfile(
        solar_irradiance_kwh_m2_day=round(power["solar_irradiance"], 2),
        peak_sun_hours=round(power["solar_irradiance"] * 0.92, 2),
        cloud_cover_pct=round(power["cloud_amt"], 1),
        avg_temperature_c=round(power["temperature"], 1),
        annual_rainfall_mm=round(power["rainfall_mm_day"] * 365, 0),
        avg_wind_speed_ms=round(hub_wind_speed, 2),
        wind_direction_deg=round(wind_dir_deg, 1) if wind_dir_deg is not None else None,
        wind_direction_compass=_degrees_to_compass(wind_dir_deg),
        wind_power_density_w_m2=round(wind_power_density, 1),
        monthly_solar_irradiance_kwh_m2_day=power.get("solar_irradiance_monthly", [None] * 12),
        monthly_wind_speed_hub_ms=[round(v, 2) if v is not None else None for v in monthly_hub_wind],
        turbulence_intensity_pct=12.0,  
        elevation_m=round(elevation, 1),
        land_slope_deg=round(slope, 2),
        land_cover_type=land_cover,
        distance_to_road_km=round(road_km, 2),
        distance_to_transmission_km=round(line_km, 2),
        distance_to_substation_km=round(sub_km, 2),
        in_protected_zone=protected,
        in_urban_area=urban,
        land_ownership=land_ownership or "Private",
        data_sources=sources,
    )

    _profile_cache[cache_key] = profile
    return profile


def profile_to_dict(profile: EnvironmentalProfile) -> dict:
    return asdict(profile)