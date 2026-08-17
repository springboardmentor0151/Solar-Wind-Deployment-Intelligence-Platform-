"""
NASA POWER API endpoints and parameters.
"""

NASA_POWER_ENDPOINT = "/temporal/climatology/point"

NASA_PARAMETERS = [
    "ALLSKY_SFC_SW_DWN",   # Global Horizontal Irradiance (GHI)
    "ALLSKY_SFC_SW_DNI",   # Direct Normal Irradiance (DNI)
    "ALLSKY_SFC_SW_DIFF",  # Diffuse Horizontal Irradiance (DHI)
]

NASA_COMMUNITY = "RE"

NASA_FORMAT = "JSON"