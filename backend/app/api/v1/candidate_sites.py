from fastapi import APIRouter, Depends

from app.api.deps import (
    get_db,
    get_environmental_service,
    get_prediction_service,
    get_investment_recommendation_service,
    get_notification_trigger_service,
)
from app.auth.permissions import require_roles
from app.schemas.candidate_site import (
    AssignCandidateToProjectRequest,
    CandidateReviewRequest,
    CandidateReviewResponse,
    CandidateSiteCreateResponse,
    ProjectFromCandidateRequest,
)
from app.services.candidate_site_service import CandidateSiteService
from app.services.notification_trigger_service import NotificationTriggerService

router = APIRouter(
    prefix="/candidate-sites",
    tags=["Candidate Sites"],
)


@router.post(
    "/sites/{site_id}",
    response_model=CandidateSiteCreateResponse,
)
def create_candidate_site(
    site_id: int,
    db=Depends(get_db),
    environmental_service=Depends(get_environmental_service),
    prediction_service=Depends(get_prediction_service),
    investment_recommendation_service=Depends(
        get_investment_recommendation_service
    ),
    notification_trigger_service: NotificationTriggerService = Depends(
        get_notification_trigger_service
    ),
    current_user=Depends(
        require_roles("Renewable Energy Planner")
    ),
):
    """Evaluate a site and submit it as a candidate for PM review."""

    service = CandidateSiteService(
        db=db,
        environmental_service=environmental_service,
        prediction_service=prediction_service,
        notification_trigger_service=notification_trigger_service,
        investment_recommendation_service=investment_recommendation_service,
    )

    candidate = service.create_from_site(
        site_id=site_id,
        created_by=current_user.id,
    )

    created_candidate = service.repository.create(candidate)

    notification_trigger_service.candidate_created(
        candidate=created_candidate,
    )

    return created_candidate


@router.get("")
def list_pending_candidates(
    db=Depends(get_db),
    current_user=Depends(
        require_roles(
            "Renewable Energy Planner",
            "Project Manager",
        )
    ),
):
    """Read-only candidate list for planner/PM."""

    from app.repositories.candidate_site_repository import (
        CandidateSiteRepository,
    )

    return CandidateSiteRepository(db).get_pending()


@router.post(
    "/{candidate_id}/intelligence",
)
def refresh_candidate_intelligence(
    candidate_id: int,
    db=Depends(get_db),
    investment_recommendation_service=Depends(
        get_investment_recommendation_service
    ),
    current_user=Depends(
        require_roles("Renewable Energy Planner", "Project Manager")
    ),
):
    """Explicitly generate and persist missing planner intelligence."""
    from fastapi import HTTPException, status
    from app.repositories.candidate_site_repository import CandidateSiteRepository

    repository = CandidateSiteRepository(db)
    candidate = repository.get_by_id(candidate_id)

    if candidate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate site not found",
        )

    investment = investment_recommendation_service.evaluate_investment(
        site_id=candidate.site_id
    )

    snapshot = dict(candidate.analysis_snapshot or {})
    snapshot["investment"] = investment.model_dump(mode="json")
    snapshot["forecast"] = {
        "annual_generation_mwh": investment.expected_generation_mwh,
        "expected_generation_mwh": investment.expected_generation_mwh,
    }
    candidate.analysis_snapshot = snapshot

    updated = repository.update(candidate)

    return {
        "candidate_id": updated.id,
        "site_id": updated.site_id,
        "stored": True,
        "expected_generation_mwh": investment.expected_generation_mwh,
        "investment_score": investment.investment_score,
        "recommendation": investment.recommendation.value,
    }


@router.put(
    "/{candidate_id}/review",
    response_model=CandidateReviewResponse,
)
def review_candidate(
    candidate_id: int,
    review: CandidateReviewRequest,
    db=Depends(get_db),
    notification_trigger_service: NotificationTriggerService = Depends(
        get_notification_trigger_service
    ),
    current_user=Depends(
        require_roles("Project Manager")
    ),
):
    """Approve or reject a candidate site."""

    service = CandidateSiteService(
        db=db,
        environmental_service=None,
        prediction_service=None,
        notification_trigger_service=notification_trigger_service,
    )

    return service.review_candidate(
        candidate_id=candidate_id,
        decision=review.decision,
        rejection_reason=review.rejection_reason,
        reviewer_id=current_user.id,
    )


@router.post(
    "/{candidate_id}/project",
)
def create_project_from_candidate(
    candidate_id: int,
    project_data: ProjectFromCandidateRequest,
    db=Depends(get_db),
    notification_trigger_service: NotificationTriggerService = Depends(
        get_notification_trigger_service
    ),
    current_user=Depends(
        require_roles("Project Manager")
    ),
):
    """
    Create a NEW project from an approved candidate.

    Use this when the candidate should become the first
    site of a new project.
    """

    service = CandidateSiteService(
        db=db,
        environmental_service=None,
        prediction_service=None,
        notification_trigger_service=notification_trigger_service,
    )

    project, candidate = (
        service.create_project_from_approved_candidate(
            candidate_id=candidate_id,
            name=project_data.name,
            description=project_data.description,
            region=project_data.region,
            project_manager_id=current_user.id,
        )
    )

    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "region": project.region,
            "created_by": project.created_by,
        },
        "candidate_site_id": candidate.id,
        "site_id": candidate.site_id,
        "candidate_status": candidate.status,
    }


@router.post(
    "/{candidate_id}/assign-project",
)
def assign_candidate_to_existing_project(
    candidate_id: int,
    project_data: AssignCandidateToProjectRequest,
    db=Depends(get_db),
    notification_trigger_service: NotificationTriggerService = Depends(
        get_notification_trigger_service
    ),
    current_user=Depends(
        require_roles("Project Manager")
    ),
):
    """
    Assign an approved candidate site to an existing project.

    This does NOT create a new project.
    """

    service = CandidateSiteService(
        db=db,
        environmental_service=None,
        prediction_service=None,
        notification_trigger_service=notification_trigger_service,
    )

    project, candidate = (
        service.assign_approved_candidate_to_project(
            candidate_id=candidate_id,
            project_id=project_data.project_id,
            project_manager_id=current_user.id,
        )
    )

    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "region": project.region,
            "created_by": project.created_by,
        },
        "candidate_site_id": candidate.id,
        "site_id": candidate.site_id,
        "candidate_status": candidate.status,
    }