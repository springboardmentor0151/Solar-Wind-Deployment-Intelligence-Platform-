from __future__ import annotations

from typing import Any

from app.schemas.ml_prediction import (
    SolarPredictionRequest,
    WindPredictionRequest,
)


class PredictionFeatureBuilder:
    """
    Builds ML prediction requests from authoritative
    environmental, GIS, and site data.

    No heuristic generation logic is performed here.
    """

    @classmethod
    def build_solar(
        cls,
        site: Any,
        environment: dict[str, Any],
    ) -> SolarPredictionRequest:

        weather = cls._require_section(
            environment,
            "weather",
        )

        solar = cls._require_section(
            environment,
            "solar",
        )

        gis = cls._require_section(
            environment,
            "gis",
        )

        return SolarPredictionRequest(
            latitude=cls._required(
                site.latitude,
                "latitude",
            ),

            longitude=cls._required(
                site.longitude,
                "longitude",
            ),

            ghi=cls._required(
                solar.get("ghi"),
                "solar.ghi",
            ),

            dni=cls._required(
                solar.get("dni"),
                "solar.dni",
            ),

            dhi=cls._required(
                solar.get("dhi"),
                "solar.dhi",
            ),

            temperature_c=cls._required(
                weather.get("temperature"),
                "weather.temperature",
            ),

            humidity_pct=cls._required(
                weather.get("humidity"),
                "weather.humidity",
            ),

            cloud_cover_pct=cls._required(
                weather.get("cloud_cover"),
                "weather.cloud_cover",
            ),

            pressure_hpa=cls._required(
                weather.get("pressure"),
                "weather.pressure",
            ),

            wind_speed_m_s=cls._required(
                weather.get("wind_speed"),
                "weather.wind_speed",
            ),

            elevation_m=cls._required(
                gis.get("elevation"),
                "gis.elevation",
            ),
        )

    @classmethod
    def build_wind(
        cls,
        site: Any,
        environment: dict[str, Any],
    ) -> WindPredictionRequest:

        weather = cls._require_section(
            environment,
            "weather",
        )

        gis = cls._require_section(
            environment,
            "gis",
        )

        temperature_c = cls._required(
            weather.get("temperature"),
            "weather.temperature",
        )

        pressure_hpa = cls._required(
            weather.get("pressure"),
            "weather.pressure",
        )

        air_density = weather.get(
            "air_density_kg_m3"
        )

        if air_density is None:
            air_density = cls.calculate_air_density(
                temperature_c=temperature_c,
                pressure_hpa=pressure_hpa,
            )

        return WindPredictionRequest(
            latitude=cls._required(
                site.latitude,
                "latitude",
            ),

            longitude=cls._required(
                site.longitude,
                "longitude",
            ),

            wind_speed_m_s=cls._required(
                weather.get("wind_speed"),
                "weather.wind_speed",
            ),

            air_density_kg_m3=cls._required(
                air_density,
                "air_density_kg_m3",
            ),

            temperature_c=temperature_c,

            humidity_pct=cls._required(
                weather.get("humidity"),
                "weather.humidity",
            ),

            pressure_hpa=pressure_hpa,

            elevation_m=cls._required(
                gis.get("elevation"),
                "gis.elevation",
            ),
        )

    @staticmethod
    def calculate_air_density(
        *,
        temperature_c: float,
        pressure_hpa: float,
    ) -> float:

        temperature_k = (
            float(temperature_c) + 273.15
        )

        pressure_pa = (
            float(pressure_hpa) * 100.0
        )

        if temperature_k <= 0:
            raise ValueError(
                "Invalid temperature for air-density calculation."
            )

        if pressure_pa <= 0:
            raise ValueError(
                "Invalid pressure for air-density calculation."
            )

        return float(
            pressure_pa
            / (
                287.05
                * temperature_k
            )
        )

    @staticmethod
    def _require_section(
        environment: dict[str, Any],
        name: str,
    ) -> dict[str, Any]:

        section = environment.get(name)

        if not isinstance(section, dict):
            raise ValueError(
                f"Required environmental section "
                f"'{name}' is missing or invalid."
            )

        return section

    @staticmethod
    def _required(
        value: Any,
        field_name: str,
    ) -> float:

        if value is None:
            raise ValueError(
                f"Required prediction feature "
                f"'{field_name}' is missing."
            )

        try:
            return float(value)

        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"Prediction feature '{field_name}' "
                f"must be numeric. Got: {value!r}"
            ) from exc