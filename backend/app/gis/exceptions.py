"""
Custom GIS exceptions.
"""


class GISException(Exception):
    """
    Base class for GIS-related exceptions.
    """

    pass


class InvalidCoordinatesError(GISException):
    """
    Raised when latitude/longitude are invalid.
    """

    pass


class OSMServiceError(GISException):
    """
    Raised when OpenStreetMap service fails.
    """

    pass


class ElevationServiceError(GISException):
    """
    Raised when elevation provider fails.
    """

    pass


class GISProviderTimeoutError(GISException):
    """
    Raised when an external GIS provider times out.
    """

    pass

class GISException(Exception):
    """Base exception for GIS services."""


class SentinelServiceError(GISException):
    """Raised when Sentinel Hub service fails."""