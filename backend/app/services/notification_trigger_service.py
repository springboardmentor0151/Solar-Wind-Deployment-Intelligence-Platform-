from __future__ import annotations

from app.models.project import Project
from app.models.site import Site
from app.models.candidate_site import CandidateSite
from app.repositories.notification_repository import NotificationRepository


class NotificationTriggerService:
    """Create automatic in-app notifications for important workflow events."""

    def __init__(self, repository: NotificationRepository):
        self.repository = repository

    # =========================================================
    # SITE EVENTS
    # =========================================================

    def site_created(self, site: Site, user_id: int):
        # Keep the creator confirmation.
        self._create(
            user_id=user_id,
            title="Site Created",
            message=f"Site '{site.name}' was created successfully and GIS data was processed.",
            notification_type="site_created",
            severity="info",
            site_id=site.id,
            project_id=site.project_id,
        )

        # A GIS-created pre-project site becomes work for the Planner.
        if site.project_id is None:
            self._notify_role(
                role_name="Renewable Energy Planner",
                exclude_user_id=user_id,
                title="New Site Available for Analysis",
                message=(
                    f"GIS Analyst created pre-project site '{site.name}'. "
                    "Review its GIS/environmental data and perform renewable analysis."
                ),
                notification_type="site_ready_for_planning",
                severity="info",
                site_id=site.id,
            )

    def site_updated(self, site: Site, user_id: int):
        self._create(
            user_id=user_id,
            title="Site Updated",
            message=f"Site '{site.name}' was updated successfully.",
            notification_type="site_updated",
            severity="info",
            site_id=site.id,
            project_id=site.project_id,
        )

        # Pre-project GIS changes should be visible to Planners.
        if site.project_id is None:
            self._notify_role(
                role_name="Renewable Energy Planner",
                exclude_user_id=user_id,
                title="Pre-Project Site Updated",
                message=(
                    f"Pre-project site '{site.name}' was updated by GIS. "
                    "Re-check the site before planning."
                ),
                notification_type="site_ready_for_planning",
                severity="info",
                site_id=site.id,
            )

    def site_deleted(self, site: Site, user_id: int):
        # Preserve existing creator/owner notification behaviour.
        target_user_id = (
            site.project.created_by
            if site.project is not None
            else user_id
        )
        self._create(
            user_id=target_user_id,
            title="Site Deleted",
            message=f"Site '{site.name}' was deleted successfully.",
            notification_type="site_deleted",
            severity="warning",
            site_id=None,
            project_id=site.project_id,
        )

    def site_enrichment_failed(self, site: Site | None, user_id: int):
        site_name = site.name if site is not None else "Site"
        site_id = site.id if site is not None else None
        project_id = site.project_id if site is not None else None
        self._create(
            user_id=user_id,
            title="GIS Enrichment Failed",
            message=f"GIS/environmental enrichment failed for '{site_name}'.",
            notification_type="gis_enrichment_failed",
            severity="critical",
            site_id=site_id,
            project_id=project_id,
        )

    # =========================================================
    # CANDIDATE WORKFLOW
    # =========================================================

    def candidate_created(self, candidate: CandidateSite):
        self._notify_role(
            role_name="Project Manager",
            title="Candidate Site Pending Review",
            message=(
                f"Candidate site #{candidate.id} for site #{candidate.site_id} "
                "is ready for Project Manager review."
            ),
            notification_type="candidate_pending_review",
            severity="info",
            site_id=candidate.site_id,
        )

    def candidate_reviewed(
        self,
        candidate: CandidateSite,
        reviewer_id: int,
    ):
        approved = candidate.status == "APPROVED"
        title = "Candidate Site Approved" if approved else "Candidate Site Rejected"
        if approved:
            message = (
                f"Candidate site #{candidate.id} was approved by the Project Manager. "
                "You can continue with project/deployment planning."
            )
            severity = "info"
        else:
            reason = candidate.rejection_reason or "No reason provided."
            message = (
                f"Candidate site #{candidate.id} was rejected by the Project Manager. "
                f"Reason: {reason}"
            )
            severity = "warning"

        self._create(
            user_id=candidate.created_by,
            title=title,
            message=message,
            notification_type="candidate_reviewed",
            severity=severity,
            site_id=candidate.site_id,
            project_id=candidate.project_id,
        )

    def candidate_assigned_to_project(
        self,
        candidate: CandidateSite,
        project: Project,
    ):
        self._create(
            user_id=candidate.created_by,
            title="Candidate Added to Project",
            message=(
                f"Candidate site #{candidate.id} has been assigned to project "
                f"'{project.name}'."
            ),
            notification_type="candidate_assigned_to_project",
            severity="info",
            site_id=candidate.site_id,
            project_id=project.id,
        )

    # =========================================================
    # PROJECT EVENTS
    # =========================================================

    def project_created(self, project: Project, user_id: int):
        self._create(
            user_id=user_id,
            title="Project Created",
            message=f"Project '{project.name}' was created successfully.",
            notification_type="project_created",
            severity="info",
            project_id=project.id,
        )

    def project_created_from_candidate(
        self,
        project: Project,
        candidate: CandidateSite,
    ):
        self._create(
            user_id=candidate.created_by,
            title="Candidate Became a Project",
            message=(
                f"Approved candidate #{candidate.id} is now part of project "
                f"'{project.name}'."
            ),
            notification_type="candidate_project_created",
            severity="info",
            site_id=candidate.site_id,
            project_id=project.id,
        )

    def project_updated(self, project: Project, user_id: int):
        self._create(
            user_id=user_id,
            title="Project Updated",
            message=f"Project '{project.name}' was updated successfully.",
            notification_type="project_updated",
            severity="info",
            project_id=project.id,
        )

    def project_deleted(self, project: Project, user_id: int):
        self._create(
            user_id=project.created_by,
            title="Project Deleted",
            message=f"Project '{project.name}' was deleted successfully.",
            notification_type="project_deleted",
            severity="warning",
            project_id=None,
        )

    # =========================================================
    # ADMIN EVENTS
    # =========================================================

    def user_role_changed(self, user_id: int, role_name: str):
        self._create(
            user_id=user_id,
            title="Role Updated",
            message=f"Your platform role has been changed to '{role_name}'.",
            notification_type="user_role_changed",
            severity="info",
        )

    def user_status_changed(self, user_id: int, is_active: bool):
        self._create(
            user_id=user_id,
            title="Account Status Updated",
            message=(
                "Your account has been activated."
                if is_active
                else "Your account has been deactivated."
            ),
            notification_type="user_status_changed",
            severity="info" if is_active else "warning",
        )

    # =========================================================
    # INTERNAL HELPERS
    # =========================================================

    def _notify_role(
        self,
        *,
        role_name: str,
        title: str,
        message: str,
        notification_type: str,
        severity: str,
        user_id: int | None = None,
        exclude_user_id: int | None = None,
        site_id: int | None = None,
        project_id: int | None = None,
    ):
        target_ids = self.repository.get_active_user_ids_by_role(
            role_name=role_name,
            exclude_user_id=exclude_user_id,
        )
        for target_id in target_ids:
            self._create(
                user_id=target_id,
                title=title,
                message=message,
                notification_type=notification_type,
                severity=severity,
                site_id=site_id,
                project_id=project_id,
            )

    def _create(
        self,
        *,
        user_id: int,
        title: str,
        message: str,
        notification_type: str,
        severity: str,
        site_id: int | None = None,
        project_id: int | None = None,
    ):
        from app.models.notification import Notification

        notification = Notification(
            title=title,
            message=message,
            notification_type=notification_type,
            severity=severity,
            user_id=user_id,
            site_id=site_id,
            project_id=project_id,
            is_read=False,
        )
        return self.repository.create(notification)
