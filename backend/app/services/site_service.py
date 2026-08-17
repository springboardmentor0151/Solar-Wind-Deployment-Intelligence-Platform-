from fastapi import HTTPException, status

from app.models.site import Site
from app.models.user import User

from app.repositories.project_repository import ProjectRepository
from app.repositories.site_repository import SiteRepository

from app.schemas.site import SiteCreate, SiteUpdate

from app.services.base_service import BaseService
from app.services.gis_enrichment_service import GISEnrichmentService

from app.services.notification_trigger_service import (
    NotificationTriggerService,
)


class SiteService(BaseService[SiteRepository]):

    def __init__(
        self,
        site_repository: SiteRepository,
        project_repository: ProjectRepository,
        gis_enrichment_service: GISEnrichmentService,
        notification_trigger_service: NotificationTriggerService,
    ):
        super().__init__(site_repository)

        self.project_repository = project_repository
        self.gis_enrichment_service = gis_enrichment_service
        self.notification_trigger_service = (
            notification_trigger_service
        )

    # =========================================================
    # GET ALL SITES
    # =========================================================

    def get_all_sites(
        self,
        current_user: User,
    ):
        role = current_user.role.name

        # Admin can see everything.
        if role == "Admin":
            return self.repository.get_all()

        # GIS Analysts and Renewable Energy Planners need access
        # to pre-project sites.
        if role in {
            "GIS Analyst",
            "Renewable Energy Planner",
        }:
            return self.repository.get_all()

        # Project Manager sees sites belonging to projects
        # created by that PM.
        if role == "Project Manager":
            projects = self.project_repository.get_by_owner(
                current_user.id
            )

            project_ids = [
                project.id
                for project in projects
            ]

            return [
                site
                for project_id in project_ids
                for site in self.repository.get_by_project(
                    project_id
                )
            ]

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access sites.",
        )

    # =========================================================
    # GET SITE BY ID
    # =========================================================

    def get_site_by_id(
        self,
        site_id: int,
        current_user: User,
    ):
        site = self.repository.get_by_id(site_id)

        if site is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Site not found",
            )

        self._check_access(
            site,
            current_user,
        )

        return site

    # =========================================================
    # GET SITES BY PROJECT
    # =========================================================

    def get_sites_by_project(
        self,
        project_id: int,
        current_user: User,
    ):
        """
        Return sites belonging to a specific project.

        Access:
        - GIS Analyst: can view project sites through the existing
        project-access rules.
        - Project Manager: can view sites for projects they own.
        - Admin: can view any project's sites.

        Pre-project sites (project_id=None) are intentionally not
        returned by this method because they do not belong to a project yet.
        """

        project = self.project_repository.get_by_id(project_id)

        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        # Admin can access any project.
        if current_user.role.name == "Admin":
            return self.repository.get_by_project(project_id)

        # Non-admin users can access only projects they created/own.
        if project.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this project",
            )

        return self.repository.get_by_project(project_id)

    
    # =========================================================
    # CREATE SITE
    # =========================================================

    def create_site(
        self,
        site_data: SiteCreate,
        current_user: User,
    ):
        role = current_user.role.name

        # -----------------------------------------------------
        # GIS ANALYST
        # -----------------------------------------------------
        # GIS Analyst creates a pre-project site.
        # project_id MUST remain NULL.
        if role == "GIS Analyst":

            if site_data.project_id is not None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "GIS Analysts create pre-project sites; "
                        "project assignment happens after PM approval."
                    ),
                )

        # -----------------------------------------------------
        # PROJECT MANAGER / ADMIN
        # -----------------------------------------------------
        elif role in {
            "Admin",
            "Project Manager",
        }:

            if site_data.project_id is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=(
                        "Project Manager/Admin site creation "
                        "requires a project_id."
                    ),
                )

            project = self.project_repository.get_by_id(
                site_data.project_id
            )

            if project is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Project not found",
                )

            # PM can only create sites inside their own projects.
            if (
                role == "Project Manager"
                and project.created_by != current_user.id
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have access to this project",
                )

        # -----------------------------------------------------
        # OTHER ROLES
        # -----------------------------------------------------
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to create sites.",
            )

        # -----------------------------------------------------
        # CREATE SITE
        # -----------------------------------------------------

        site = Site(
            name=site_data.name,
            description=site_data.description,
            latitude=site_data.latitude,
            longitude=site_data.longitude,
            region=site_data.region,
            land_area=site_data.land_area,

            # NULL for GIS Analyst-created pre-project sites.
            project_id=site_data.project_id,

            # GIS/environmental fields are populated by enrichment.
            elevation=None,
            land_use=None,
            road_distance=None,
            nearest_substation_distance=None,
            nearest_transmission_line_distance=None,
            water_body_distance=None,
            protected_area_distance=None,
            land_slope=None,
            vegetation_index=None,
            existing_infrastructure=None,
        )

        created_site = self.repository.create(site)

        # Automatically enrich the site after creation.
        created_site = self._enrich_site(
            created_site
        )

        self.notification_trigger_service.site_created(
            site=created_site,
            user_id=current_user.id,
        )

        return created_site

    # =========================================================
    # UPDATE SITE
    # =========================================================

    def update_site(
        self,
        site_id: int,
        site_data: SiteUpdate,
        current_user: User,
    ):
        site = self.get_site_by_id(
            site_id,
            current_user,
        )

        role = current_user.role.name

        # -----------------------------------------------------
        # GIS ANALYST
        # -----------------------------------------------------
        if role == "GIS Analyst":

            # GIS Analyst can only modify pre-project sites.
            if site.project_id is not None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "GIS Analysts cannot modify "
                        "project-linked sites."
                    ),
                )

            # GIS Analyst cannot assign a project.
            if site_data.project_id is not None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "GIS Analysts cannot assign a project "
                        "to a site."
                    ),
                )

        # -----------------------------------------------------
        # OTHER ALLOWED ROLES
        # -----------------------------------------------------
        elif role not in {
            "Admin",
            "Project Manager",
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update sites.",
            )

        # -----------------------------------------------------
        # COORDINATE CHANGE
        # -----------------------------------------------------

        coordinates_changed = (
            site_data.latitude is not None
            and site_data.latitude != site.latitude
        ) or (
            site_data.longitude is not None
            and site_data.longitude != site.longitude
        )

        # -----------------------------------------------------
        # PROJECT ASSIGNMENT
        # -----------------------------------------------------

        if site_data.project_id is not None:

            # Only Admin / PM can reach this because GIS Analyst
            # is rejected above.
            if site_data.project_id != site.project_id:

                project = self.project_repository.get_by_id(
                    site_data.project_id
                )

                if project is None:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Project not found",
                    )

                if (
                    role == "Project Manager"
                    and project.created_by != current_user.id
                ):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have access to this project",
                    )

                site.project_id = site_data.project_id

        # -----------------------------------------------------
        # BASIC SITE FIELDS
        # -----------------------------------------------------

        if site_data.name is not None:
            site.name = site_data.name

        if site_data.description is not None:
            site.description = site_data.description

        if site_data.latitude is not None:
            site.latitude = site_data.latitude

        if site_data.longitude is not None:
            site.longitude = site_data.longitude

        if site_data.region is not None:
            site.region = site_data.region

        if site_data.land_area is not None:
            site.land_area = site_data.land_area

        site = self.repository.update(site)

        # Re-run enrichment if coordinates changed.
        if coordinates_changed:
            site = self._enrich_site(site)

        # -----------------------------------------------------
        # NOTIFICATION OWNER
        # -----------------------------------------------------

        if site.project is not None:
            notification_user_id = (
                site.project.created_by
            )
        else:
            notification_user_id = current_user.id

        self.notification_trigger_service.site_updated(
            site=site,
            user_id=notification_user_id,
        )

        return site

    # =========================================================
    # DELETE SITE
    # =========================================================

    def delete_site(
        self,
        site_id: int,
        current_user: User,
    ):
        site = self.get_site_by_id(
            site_id,
            current_user,
        )

        # Pre-project site:
        # notify the current user.
        if site.project is None:
            notification_user_id = current_user.id

        # Project-linked site:
        # notify the project owner.
        else:
            notification_user_id = (
                site.project.created_by
            )

        self.repository.delete(site)

        self.notification_trigger_service.site_deleted(
            site=site,
            user_id=notification_user_id,
        )

        return {
            "message": "Site deleted successfully"
        }

    # =========================================================
    # GIS / ENVIRONMENTAL ENRICHMENT
    # =========================================================

    def _enrich_site(
        self,
        site: Site,
    ):
        try:

            # -------------------------------------------------
            # Latitude + longitude are the only inputs required
            # from Site for GIS enrichment.
            # -------------------------------------------------

            gis_data = (
                self.gis_enrichment_service.enrich_site(
                    site.latitude,
                    site.longitude,
                )
            )

            # -------------------------------------------------
            # GIS FIELDS
            # -------------------------------------------------

            site.elevation = (
                gis_data.elevation
            )

            site.land_use = (
                gis_data.land_use
            )

            site.road_distance = (
                gis_data.road_distance
            )

            site.nearest_substation_distance = (
                gis_data.nearest_substation_distance
            )

            site.nearest_transmission_line_distance = (
                gis_data.nearest_transmission_line_distance
            )

            # -------------------------------------------------
            # ENVIRONMENTAL FIELDS
            # -------------------------------------------------

            site.water_body_distance = (
                gis_data.water_body_distance
            )

            site.protected_area_distance = (
                gis_data.protected_area_distance
            )

            site.land_slope = (
                gis_data.land_slope
            )

            site.vegetation_index = (
                gis_data.vegetation_index
            )

            # -------------------------------------------------
            # INFRASTRUCTURE
            # -------------------------------------------------

            site.existing_infrastructure = (
                gis_data.existing_infrastructure
            )

            # -------------------------------------------------
            # PERSIST
            # -------------------------------------------------

            return self.repository.update(
                site
            )

        except HTTPException:
            raise

        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=(
                    "GIS/environmental enrichment "
                    "failed for this site."
                ),
            ) from exc

    # =========================================================
    # ACCESS CONTROL
    # =========================================================

    @staticmethod
    def _check_access(
        site: Site,
        current_user: User,
    ):
        role = current_user.role.name

        # Admin can access everything.
        if role == "Admin":
            return

        # GIS Analyst can access pre-project sites.
        if role == "GIS Analyst":
            if site.project_id is None:
                return

            # Once the site is linked to a project,
            # GIS Analyst can still view it.
            return

        # Renewable Energy Planner needs access to site
        # intelligence, including pre-project sites.
        if role == "Renewable Energy Planner":
            return

        # Project Manager can access only sites belonging
        # to projects they own.
        if role == "Project Manager":
            if site.project_id is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "This site has not been assigned "
                        "to a project yet."
                    ),
                )

            if (
                site.project is None
                or site.project.created_by
                != current_user.id
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "You do not have access to this site"
                    ),
                )

            return

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this site.",
        )