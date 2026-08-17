from __future__ import annotations


# =========================================================
# SOLAR CONTRACT
# =========================================================

SOLAR_FEATURES = [
    "latitude",
    "longitude",
    "ghi",
    "dni",
    "dhi",
    "temperature_c",
    "humidity_pct",
    "cloud_cover_pct",
    "pressure_hpa",
    "wind_speed_m_s",
    "elevation_m",
]

SOLAR_TARGET = "solar_generation_mw"

SOLAR_SCHEMA_VERSION = "1.1"


# =========================================================
# WIND CONTRACT
# =========================================================

WIND_FEATURES = [
    "latitude",
    "longitude",
    "wind_speed_m_s",
    "air_density_kg_m3",
    "temperature_c",
    "humidity_pct",
    "pressure_hpa",
    "elevation_m",
]

WIND_TARGET = "wind_generation_mw"

WIND_SCHEMA_VERSION = "1.0"


# =========================================================
# DOMAIN MAPS
# =========================================================

FEATURES_BY_DOMAIN = {
    "solar": SOLAR_FEATURES,
    "wind": WIND_FEATURES,
}

TARGETS_BY_DOMAIN = {
    "solar": SOLAR_TARGET,
    "wind": WIND_TARGET,
}

SCHEMA_VERSIONS_BY_DOMAIN = {
    "solar": SOLAR_SCHEMA_VERSION,
    "wind": WIND_SCHEMA_VERSION,
}


# =========================================================
# FEATURE RANGES
# =========================================================

FEATURE_RANGES = {
    "latitude": (-90.0, 90.0),
    "longitude": (-180.0, 180.0),

    "ghi": (0.0, float("inf")),
    "dni": (0.0, float("inf")),
    "dhi": (0.0, float("inf")),

    "temperature_c": (-100.0, 100.0),
    "humidity_pct": (0.0, 100.0),
    "cloud_cover_pct": (0.0, 100.0),
    "pressure_hpa": (0.0, float("inf")),
    "wind_speed_m_s": (0.0, float("inf")),
    "air_density_kg_m3": (0.0, float("inf")),
    "elevation_m": (-500.0, 10000.0),
}


# =========================================================
# TARGET RANGES
# =========================================================

TARGET_RANGES = {
    "solar_generation_mw": (0.0, float("inf")),
    "wind_generation_mw": (0.0, float("inf")),
}


# =========================================================
# HELPERS
# =========================================================

def validate_domain(domain: str) -> str:
    """
    Validate and normalize an ML domain.
    """

    normalized = domain.lower().strip()

    if normalized not in FEATURES_BY_DOMAIN:
        raise ValueError(
            f"Unsupported ML domain: {domain!r}. "
            f"Expected one of: "
            f"{list(FEATURES_BY_DOMAIN.keys())}"
        )

    return normalized


def get_features(domain: str) -> list[str]:
    """
    Return the feature contract for a domain.
    """

    domain = validate_domain(domain)

    return FEATURES_BY_DOMAIN[domain].copy()


def get_target(domain: str) -> str:
    """
    Return the target column for a domain.
    """

    domain = validate_domain(domain)

    return TARGETS_BY_DOMAIN[domain]


def get_schema_version(domain: str) -> str:
    """
    Return the schema version for a domain.
    """

    domain = validate_domain(domain)

    return SCHEMA_VERSIONS_BY_DOMAIN[domain]