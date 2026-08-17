from app.repositories.dashboard_repository import (
    DashboardRepository,
)


class DashboardService:
    """
    Main platform dashboard service.

    Responsibility:
        - Aggregate platform-level statistics.
        - Read site information.
        - Provide dashboard-ready data.

    This service does NOT:
        - calculate GIS data
        - calculate suitability
        - calculate solar predictions
        - calculate wind predictions
        - calculate investment recommendations
        - duplicate module business logic
    """

    def __init__(
        self,
        repository: DashboardRepository,
    ):
        self.repository = repository

    # =========================================================
    # MAIN DASHBOARD
    # =========================================================

    def get_summary(self):

        total_projects = (
            self.repository.count_projects()
        )

        total_sites = (
            self.repository.count_sites()
        )

        total_users = (
            self.repository.count_users()
        )

        enriched_sites = (
            self.repository.count_enriched_sites()
        )

        sites = (
            self.repository.get_sites()
        )

        solar_sites = 0
        wind_sites = 0
        hybrid_sites = 0

        for site in sites:

            infrastructure = (
                site.existing_infrastructure
                or ""
            ).lower()

            name = (
                site.name
                or ""
            ).lower()

            text = (
                f"{name} {infrastructure}"
            )

            has_solar = (
                "solar" in text
            )

            has_wind = (
                "wind" in text
            )

            if has_solar and has_wind:
                hybrid_sites += 1

            elif has_solar:
                solar_sites += 1

            elif has_wind:
                wind_sites += 1

        return {
            "total_projects": total_projects,
            "total_sites": total_sites,
            "total_users": total_users,

            "enriched_sites": enriched_sites,

            "solar_sites": solar_sites,
            "wind_sites": wind_sites,
            "hybrid_sites": hybrid_sites,

            "system_status": "Online",
        }