try:
    from geopy.exc import GeocoderServiceError, GeocoderTimedOut
    from geopy.geocoders import Nominatim
except ModuleNotFoundError:  # pragma: no cover - exercised in tests via monkeypatch
    GeocoderServiceError = GeocoderTimedOut = Exception
    Nominatim = None


def reverse_geocode(latitude: float, longitude: float) -> str:
    if Nominatim is None:
        return f"Lat {latitude:.5f}, Lon {longitude:.5f}"

    geocoder = Nominatim(user_agent="solar-wind-deployment-platform")
    try:
        result = geocoder.reverse((latitude, longitude), language="en", timeout=6)
        if result and result.address:
            return result.address
    except (GeocoderServiceError, GeocoderTimedOut, ValueError):
        pass
    return f"Lat {latitude:.5f}, Lon {longitude:.5f}"
