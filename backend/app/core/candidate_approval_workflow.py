"""Phase 4 candidate-site review workflow.

This module defines the target PM review state machine without replacing
existing project/site services.
"""

PENDING_REVIEW = "PENDING_REVIEW"
APPROVED = "APPROVED"
REJECTED = "REJECTED"

VALID_TRANSITIONS = {
    PENDING_REVIEW: {APPROVED, REJECTED},
    APPROVED: set(),
    REJECTED: set(),
}

PROJECT_MANAGER_ROLE = "Project Manager"

def can_review_candidate(role: str) -> bool:
    return role == PROJECT_MANAGER_ROLE

def validate_transition(current_status: str, new_status: str) -> None:
    allowed = VALID_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise ValueError(
            f"Invalid candidate status transition: {current_status} -> {new_status}"
        )
