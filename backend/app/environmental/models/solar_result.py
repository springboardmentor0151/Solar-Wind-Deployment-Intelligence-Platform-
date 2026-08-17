from pydantic import BaseModel


class SolarResult(BaseModel):
    """
    Solar resource information obtained
    from NASA POWER.
    """

    ghi: float | None = None
    dni: float | None = None
    dhi: float | None = None
    solar_irradiance: float | None = None