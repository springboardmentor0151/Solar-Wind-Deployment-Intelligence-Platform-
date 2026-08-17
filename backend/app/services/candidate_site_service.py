from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.candidate_site import CandidateSite
from app.models.project import Project
from app.repositories.candidate_site_repository import CandidateSiteRepository
from app.services.renewable_recommendation_service import (
    RenewableRecommendationService,
)
from app.services.site_suitability_service import SiteSuitabilityService
from app.services.notification_trigger_service import NotificationTriggerService


class CandidateSiteService:
    """Turns a planner's technical recommendation into a reviewable candidate."""

    def __init__(
        self,
        db,
        environmental_service,
        prediction_service,
        notification_trigger_service: NotificationTriggerService | None = None,
        investment_recommendation_service=None,
    ):
        self.db = db
        self.environmental_service = environmental_service
        self.prediction_service = prediction_service
        self.repository = CandidateSiteRepository(db)
        self.notification_trigger_service = notification_trigger_service
        self.investment_recommendation_service = investment_recommendation_service

    def create_from_site(self, site_id: int, created_by: int):
        suitability = SiteSuitabilityService(
            db=self.db,
            environmental_service=self.environmental_service,
            prediction_service=self.prediction_service,
        ).evaluate_site(site_id=site_id)

        recommendation = RenewableRecommendationService(
            self.db
        ).recommend(
            site_id=site_id,
            suitability_data=suitability.model_dump(),
        )

        existing = self.repository.get_by_site_id(site_id)

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Site {site_id} already has a candidate site.",
            )

        if recommendation.recommended_technology.value == "Unsuitable":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Site is not suitable for renewable deployment "
                    "and cannot be submitted as a candidate."
                ),
            )

        snapshot = {
            "suitability": suitability.model_dump(mode="json"),
            "recommendation": recommendation.model_dump(mode="json"),
        }

        # Expensive downstream intelligence is generated once during
        # candidate creation and persisted. The Planner dashboard only
        # reads this stored intelligence.
        if self.investment_recommendation_service is not None:
            investment = self.investment_recommendation_service.evaluate_investment(
                site_id=site_id
            )
            snapshot["investment"] = investment.model_dump(mode="json")
            snapshot["forecast"] = {
                "annual_generation_mwh": investment.expected_generation_mwh,
                "expected_generation_mwh": investment.expected_generation_mwh,
            }

        candidate = CandidateSite(
            site_id=site_id,
            created_by=created_by,
            status="PENDING_REVIEW",
            recommended_technology=recommendation.recommended_technology.value,
            suitability_score=recommendation.overall_site_score,
            solar_score=recommendation.solar.score,
            wind_score=recommendation.wind.score,
            hybrid_score=recommendation.hybrid_score,
            confidence=recommendation.confidence.value,
            recommendation_reason=recommendation.recommendation_reason,
            analysis_snapshot=snapshot,
        )

        return candidate

    def review_candidate(
        self,
        candidate_id: int,
        decision: str,
        rejection_reason: str | None,
        reviewer_id: int,
    ):
        candidate = self.repository.get_by_id(candidate_id)

        if candidate is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate site not found",
            )

        if candidate.status != "PENDING_REVIEW":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Candidate has already been reviewed",
            )

        if decision == "REJECTED" and not rejection_reason:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Rejection reason is required",
            )

        candidate.status = decision
        candidate.reviewed_by = reviewer_id
        candidate.reviewed_at = datetime.now(timezone.utc)
        candidate.rejection_reason = (
            rejection_reason if decision == "REJECTED" else None
        )

        updated_candidate = self.repository.update(candidate)

        if self.notification_trigger_service is not None:
            self.notification_trigger_service.candidate_reviewed(
                candidate=updated_candidate,
                reviewer_id=reviewer_id,
            )

        return updated_candidate

    def create_project_from_approved_candidate(
        self,
        candidate_id: int,
        name: str,
        description: str | None,
        region: str,
        project_manager_id: int,
    ):
        """
        Create a NEW project from an approved candidate.

        This remains available for the first-project workflow.
        """

        candidate = self.repository.get_by_id(candidate_id)

        if candidate is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate site not found",
            )

        if candidate.status != "APPROVED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only an approved candidate can become a project",
            )

        if candidate.project_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A project already exists for this candidate",
            )

        existing_project = (
            self.db.query(Project)
            .filter(Project.name == name)
            .first()
        )

        if existing_project:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Project name already exists",
            )

        site = candidate.site

        if site is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate site record not found",
            )

        project = Project(
            name=name,
            description=description,
            region=region,
            created_by=project_manager_id,
        )

        self.db.add(project)
        self.db.flush()

        site.project_id = project.id
        candidate.project_id = project.id

        self.db.commit()

        self.db.refresh(project)
        self.db.refresh(candidate)

        if self.notification_trigger_service is not None:
            self.notification_trigger_service.project_created_from_candidate(
                project=project,
                candidate=candidate,
            )

        return project, candidate

    def assign_approved_candidate_to_project(
        self,
        candidate_id: int,
        project_id: int,
        project_manager_id: int,
    ):
        """
        Assign an approved candidate site to an EXISTING project.

        This does not create a new project.

        Result:
            Project
              ├── existing sites
              └── candidate site
        """

        candidate = self.repository.get_by_id(candidate_id)

        if candidate is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate site not found",
            )

        if candidate.status != "APPROVED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only approved candidate sites can be assigned to a project",
            )

        if candidate.project_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Candidate site is already assigned to a project",
            )

        project = (
            self.db.query(Project)
            .filter(Project.id == project_id)
            .first()
        )

        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        if project.created_by != project_manager_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this project",
            )

        site = candidate.site

        if site is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate site record not found",
            )

        if site.project_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Site is already assigned to a project",
            )

        # Assign both records to the EXISTING project.
        site.project_id = project.id
        candidate.project_id = project.id

        self.db.add(site)
        self.db.add(candidate)

        self.db.commit()

        self.db.refresh(project)
        self.db.refresh(candidate)

        if self.notification_trigger_service is not None:
            self.notification_trigger_service.candidate_assigned_to_project(
                candidate=candidate,
                project=project,
            )

        return project, candidate