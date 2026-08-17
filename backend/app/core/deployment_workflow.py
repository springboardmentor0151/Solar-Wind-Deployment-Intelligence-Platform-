"""Phase 6 deployment/project-plan workflow.

This is an additive workflow contract around the existing Milestone-4
deployment/optimization services. It does not replace them.
"""

PROJECT_MANAGER_ROLE = "Project Manager"

PROJECT_PLANNING = "PROJECT_PLANNING"
DEPLOYMENT_PLANNED = "DEPLOYMENT_PLANNED"
DEPLOYMENT_ACTIVE = "ACTIVE"
DEPLOYMENT_COMPLETE = "COMPLETE"

VALID_TRANSITIONS = {
    PROJECT_PLANNING: {DEPLOYMENT_PLANNED},
    DEPLOYMENT_PLANNED: {DEPLOYMENT_ACTIVE},
    DEPLOYMENT_ACTIVE: {DEPLOYMENT_COMPLETE},
    DEPLOYMENT_COMPLETE: set(),
}

def can_manage_deployment(role: str) -> bool:
    return role == PROJECT_MANAGER_ROLE

def validate_transition(current_status: str, new_status: str) -> None:
    if new_status not in VALID_TRANSITIONS.get(current_status, set()):
        raise ValueError(
            f"Invalid project/deployment transition: "
            f"{current_status} -> {new_status}"
        )
