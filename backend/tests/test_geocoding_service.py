import builtins
import importlib
import sys


def test_geocoding_service_falls_back_when_geopy_is_unavailable(monkeypatch) -> None:
    sys.modules.pop("app.services.geocoding_service", None)
    real_import = builtins.__import__

    def fake_import(name, *args, **kwargs):
        if name == "geopy.geocoders" or name.startswith("geopy"):
            raise ModuleNotFoundError("No module named 'geopy'")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", fake_import)

    module = importlib.import_module("app.services.geocoding_service")

    assert module.reverse_geocode(12.97, 77.59) == "Lat 12.97000, Lon 77.59000"
