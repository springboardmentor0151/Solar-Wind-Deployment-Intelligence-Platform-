from __future__ import annotations

from datetime import datetime, timezone, timedelta

from fastapi import HTTPException, status

from app.models.notification import Notification
from app.models.site import Site
from app.models.user import User
from app.repositories.notification_repository import NotificationRepository
from app.services.environmental_service import EnvironmentalService
from app.services.energy_forecasting_service import EnergyForecastingService
from app.schemas.alert import AlertEvaluationResponse, SiteAlert


class AlertService:
    """Evaluate live site intelligence and create actionable in-app alerts.

    Alerts are derived from existing authoritative environmental, GIS and
    forecasting services. No new scoring model or database table is created.
    """

    def __init__(
        self,
        db,
        environmental_service: EnvironmentalService,
        energy_forecasting_service: EnergyForecastingService,
        notification_repository: NotificationRepository,
    ):
        self.db = db
        self.environmental_service = environmental_service
        self.energy_forecasting_service = energy_forecasting_service
        self.notification_repository = notification_repository

    def evaluate_site(self, site_id: int, current_user: User) -> AlertEvaluationResponse:
        site = self.db.query(Site).filter(Site.id == site_id).first()
        if site is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

        # The existing site access rules are enforced here rather than exposing
        # provider data to a user who cannot access the site.
        if current_user.role.name != "Admin":
            if site.project_id is not None and site.project is not None:
                if site.project.created_by != current_user.id and current_user.role.name not in {
                    "Project Manager", "Renewable Energy Planner"
                }:
                    raise HTTPException(status_code=403, detail="You do not have access to this site")

        evaluated_at = datetime.now(timezone.utc)
        alerts: list[SiteAlert] = []

        try:
            environment = self.environmental_service.get_site_environment(site_id)
            weather = environment.weather
            gis = environment.gis

            self._weather_alerts(site, weather, alerts)
            self._gis_alerts(site, gis, alerts)
            self._solar_alerts(site, environment.solar, alerts)
        except Exception as exc:
            # Provider failures are themselves actionable; never turn missing
            # provider data into zero-valued measurements.
            alerts.append(SiteAlert(
                site_id=site.id,
                alert_type="provider_unavailable",
                severity="critical",
                title="Environmental Data Unavailable",
                message=f"Live environmental data could not be refreshed for '{site.name}'. Recheck the provider connection before relying on current alerts.",
                source="Environmental providers",
            ))

        # Forecast-derived alert: uses the existing forecasting service and its
        # authoritative capacity factor rather than inventing a second forecast.
        try:
            forecast = self.energy_forecasting_service.forecast(site_id=site_id)
            if forecast.capacity_factor < 0.15:
                alerts.append(SiteAlert(
                    site_id=site.id,
                    alert_type="forecast_low_capacity_factor",
                    severity="warning",
                    title="Low Forecast Capacity Factor",
                    message=f"Forecast capacity factor for '{site.name}' is {forecast.capacity_factor * 100:.1f}%, below the 15% planning threshold.",
                    source="Energy forecasting",
                ))
        except Exception:
            # Forecasting is optional for GIS-only/pre-project alert checks.
            pass

        created = 0
        for alert in alerts:
            created += self._notify_relevant_users(site, alert, evaluated_at)

        return AlertEvaluationResponse(
            site_id=site.id,
            evaluated_at=evaluated_at,
            alerts_created=created,
            alerts=alerts,
            status="ALERTS_FOUND" if alerts else "NO_ALERTS",
        )

    @staticmethod
    def _weather_alerts(site: Site, weather, alerts: list[SiteAlert]) -> None:
        wind = getattr(weather, "wind_speed", None)
        rainfall = getattr(weather, "rainfall", None)
        cloud = getattr(weather, "cloud_cover", None)

        if wind is not None and wind >= 15:
            alerts.append(SiteAlert(
                site_id=site.id, alert_type="high_wind", severity="critical",
                title="High Wind Alert",
                message=f"Current wind speed at '{site.name}' is {wind:.1f} m/s. Review operational and deployment safety conditions.",
                source="OpenWeather",
            ))
        elif wind is not None and wind >= 10:
            alerts.append(SiteAlert(
                site_id=site.id, alert_type="elevated_wind", severity="warning",
                title="Elevated Wind Conditions",
                message=f"Current wind speed at '{site.name}' is {wind:.1f} m/s. Review site conditions before field activity.",
                source="OpenWeather",
            ))

        if rainfall is not None and rainfall >= 20:
            alerts.append(SiteAlert(
                site_id=site.id, alert_type="heavy_rainfall", severity="critical",
                title="Heavy Rainfall Alert",
                message=f"Recent rainfall at '{site.name}' is {rainfall:.1f} mm. Field/deployment activity should be reviewed.",
                source="OpenWeather",
            ))
        elif rainfall is not None and rainfall >= 5:
            alerts.append(SiteAlert(
                site_id=site.id, alert_type="rainfall", severity="warning",
                title="Rainfall Alert",
                message=f"Recent rainfall at '{site.name}' is {rainfall:.1f} mm. Consider current access and field conditions.",
                source="OpenWeather",
            ))

        if cloud is not None and cloud >= 90:
            alerts.append(SiteAlert(
                site_id=site.id, alert_type="high_cloud_cover", severity="info",
                title="High Cloud Cover",
                message=f"Cloud cover at '{site.name}' is {cloud:.0f}%. Current solar conditions may be reduced.",
                source="OpenWeather",
            ))

    @staticmethod
    def _gis_alerts(site: Site, gis, alerts: list[SiteAlert]) -> None:
        if gis is None:
            return
        protected = getattr(gis, "protected_area_distance", None)
        water = getattr(gis, "water_body_distance", None)
        slope = getattr(gis, "land_slope", None)

        if protected is not None and protected <= 1:
            alerts.append(SiteAlert(
                site_id=site.id, alert_type="protected_area_proximity", severity="critical",
                title="Protected Area Proximity",
                message=f"'{site.name}' is approximately {protected:.2f} km from a protected area. Environmental clearance should be reviewed.",
                source="GIS enrichment",
            ))
        if water is not None and water <= 0.5:
            alerts.append(SiteAlert(
                site_id=site.id, alert_type="water_body_proximity", severity="warning",
                title="Water Body Proximity",
                message=f"'{site.name}' is approximately {water:.2f} km from a water body. Review environmental and construction constraints.",
                source="GIS enrichment",
            ))
        if slope is not None and slope >= 10:
            alerts.append(SiteAlert(
                site_id=site.id, alert_type="high_slope", severity="warning",
                title="High Terrain Slope",
                message=f"Land slope at '{site.name}' is {slope:.1f}°. Review grading, foundation and access requirements.",
                source="GIS enrichment",
            ))

    @staticmethod
    def _solar_alerts(site: Site, solar, alerts: list[SiteAlert]) -> None:
        ghi = getattr(solar, "ghi", None)
        if ghi is not None and ghi < 2:
            alerts.append(SiteAlert(
                site_id=site.id, alert_type="low_solar_resource", severity="warning",
                title="Low Solar Resource",
                message=f"Solar irradiance indicator for '{site.name}' is {ghi:.2f}. Recheck resource suitability before deployment decisions.",
                source="NASA POWER",
            ))

    def _notify_relevant_users(self, site: Site, alert: SiteAlert, evaluated_at: datetime) -> int:
        # Avoid generating the same alert repeatedly when the user clicks
        # "Check alerts" or the endpoint is scheduled later.
        since = evaluated_at - timedelta(hours=6)
        recipient_ids: set[int] = set()

        if site.project_id is None:
            recipient_ids.update(self.notification_repository.get_active_user_ids_by_role("Renewable Energy Planner"))
            recipient_ids.update(self.notification_repository.get_active_user_ids_by_role("GIS Analyst"))
        else:
            recipient_ids.update(self.notification_repository.get_active_user_ids_by_role("Project Manager"))
            recipient_ids.update(self.notification_repository.get_active_user_ids_by_role("Renewable Energy Planner"))

        recipient_ids.update(self.notification_repository.get_active_user_ids_by_role("Admin"))

        existing = (
            self.db.query(Notification)
            .filter(
                Notification.site_id == site.id,
                Notification.notification_type == f"alert:{alert.alert_type}",
                Notification.created_at >= since,
            )
            .all()
        )
        existing_users = {n.user_id for n in existing}
        created = 0
        for user_id in recipient_ids - existing_users:
            notification = Notification(
                title=alert.title,
                message=alert.message,
                notification_type=f"alert:{alert.alert_type}",
                severity=alert.severity,
                user_id=user_id,
                site_id=site.id,
                project_id=site.project_id,
                is_read=False,
            )
            self.db.add(notification)
            created += 1
        if created:
            self.db.commit()
        return created
