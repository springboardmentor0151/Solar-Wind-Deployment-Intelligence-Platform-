import requests


def get_global_wind_data(latitude: float, longitude: float):
    """
    Placeholder service for Global Wind Atlas integration.

    Returns a standardized structure that can later be replaced
    with a real API or raster dataset without changing the rest
    of the application.
    """

    try:
        # Future API integration goes here.

        return {
            "wind": {
                "speed": 6.2,
                "power_density": 280,
                "source": "Global Wind Atlas (placeholder)"
            }
        }

    except Exception as e:
        return {
            "error": str(e)
        }