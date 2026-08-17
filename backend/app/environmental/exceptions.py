class EnvironmentalException(Exception):
    """Base environmental exception."""


class WeatherServiceError(EnvironmentalException):
    """Raised when Weather API fails."""


class NASAPowerServiceError(EnvironmentalException):
    """Raised when NASA POWER API fails."""
