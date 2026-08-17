from pydantic import BaseModel, ConfigDict


class DashboardSummaryResponse(BaseModel):
    """
    Main dashboard summary.

    Provides high-level platform statistics.
    """

    model_config = ConfigDict(from_attributes=True)

    total_projects: int
    total_sites: int
    total_users: int

    enriched_sites: int

    solar_sites: int
    wind_sites: int
    hybrid_sites: int

    system_status: str