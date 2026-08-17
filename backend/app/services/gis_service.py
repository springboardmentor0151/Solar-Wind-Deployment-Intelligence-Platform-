from fastapi import HTTPException

from app.gis.constants import DEFAULT_CRS
from app.gis.coordinates import bounding_box, center_point
from app.gis.geojson import (
    project_sites_to_feature_collection,
    site_to_feature,
    sites_to_feature_collection,
)
from app.models.site import Site
from app.repositories.project_repository import ProjectRepository
from app.repositories.site_repository import SiteRepository
from app.schemas.geojson import Feature, FeatureCollection
from app.services.base_service import BaseService


class GISService(BaseService[SiteRepository]):
    """
    Service responsible for generating GIS outputs
    and map-related summaries.
    """

    def __init__(
        self,
        site_repository: SiteRepository,
        project_repository: ProjectRepository,
    ):
        super().__init__(site_repository)
        self.project_repository = project_repository

    def get_all_sites_geojson(
        self,
    ) -> FeatureCollection:
        """
        Return all sites as a GeoJSON FeatureCollection.
        """

        sites = self.repository.get_all()

        return sites_to_feature_collection(
            sites,
        )

    def get_site_geojson(
        self,
        site_id: int,
    ) -> Feature:
        """
        Return a single site as GeoJSON.
        """

        site = self.repository.get_by_id(
            site_id,
        )

        if site is None:
            raise HTTPException(
                status_code=404,
                detail="Site not found.",
            )

        return site_to_feature(
            site,
        )

    def get_project_geojson(
        self,
        project_id: int,
    ) -> FeatureCollection:
        """
        Return all project sites as GeoJSON.
        """

        project = self.project_repository.get_by_id(
            project_id,
        )

        if project is None:
            raise HTTPException(
                status_code=404,
                detail="Project not found.",
            )

        return project_sites_to_feature_collection(
            project,
        )

    def get_bounding_box(
        self,
    ) -> dict | None:
        """
        Calculate the bounding box
        for all available sites.
        """

        sites = self.repository.get_all()

        if not sites:
            return None

        coordinates = [
            (
                site.latitude,
                site.longitude,
            )
            for site in sites
        ]

        (
            min_lat,
            min_lon,
            max_lat,
            max_lon,
        ) = bounding_box(
            coordinates,
        )

        return {
            "min_latitude": min_lat,
            "min_longitude": min_lon,
            "max_latitude": max_lat,
            "max_longitude": max_lon,
        }

    def get_map_summary(
        self,
    ) -> dict:
        """
        Return a summary of the
        current map contents.
        """

        sites = self.repository.get_all()

        if not sites:
            return {
                "total_sites": 0,
                "center": None,
                "bounding_box": None,
            }

        coordinates = [
            (
                site.latitude,
                site.longitude,
            )
            for site in sites
        ]

        center = center_point(
            coordinates,
        )

        bbox = bounding_box(
            coordinates,
        )

        return {
            "total_sites": len(sites),
            "center": {
                "latitude": center[0],
                "longitude": center[1],
            },
            "bounding_box": {
                "min_latitude": bbox[0],
                "min_longitude": bbox[1],
                "max_latitude": bbox[2],
                "max_longitude": bbox[3],
            },
        }

    def get_map_config(
        self,
    ) -> dict:
        """
        Default configuration
        for frontend map clients.
        """

        return {
            "default_center": [
                20.5937,
                78.9629,
            ],
            "default_zoom": 5,
            "min_zoom": 3,
            "max_zoom": 18,
            "tile_provider": "OpenStreetMap",
            "crs": DEFAULT_CRS,
        }