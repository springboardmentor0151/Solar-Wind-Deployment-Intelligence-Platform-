"""Role ownership for the Milestone-4 target workflow.

Phase 2 scope: GIS Analyst workflow only.
This module is additive and does not replace existing GIS/environment services.
"""

GIS_ANALYST = "GIS Analyst"
ENERGY_PLANNER = "Renewable Energy Planner"
PROJECT_MANAGER = "Project Manager"

GIS_WORKFLOW_ROLES = {
    "location_exploration": {GIS_ANALYST, ENERGY_PLANNER, PROJECT_MANAGER},
    "gis_enrichment": {GIS_ANALYST, ENERGY_PLANNER, PROJECT_MANAGER},
    "environmental_enrichment": {GIS_ANALYST, ENERGY_PLANNER, PROJECT_MANAGER},
    "site_intelligence_view": {GIS_ANALYST, ENERGY_PLANNER, PROJECT_MANAGER},
}

def role_can_access(step: str, role: str) -> bool:
    return role in GIS_WORKFLOW_ROLES.get(step, set())
