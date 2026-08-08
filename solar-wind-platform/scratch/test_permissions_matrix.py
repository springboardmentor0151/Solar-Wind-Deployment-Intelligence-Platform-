import sys
import os

# Set python path to backend directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.permissions import (
    PERMISSIONS,
    has_permission,
    can_create_project,
    can_run_predictions,
    can_submit_project,
    can_review_gis,
    can_approve_gis,
    can_approve_workflow,
    can_update_milestones,
    can_approve_project
)
from app.models import UserModel

def test_permission_matrix():
    print("--- STARTING CENTRALIZED PERMISSIONS MATRIX UNIT TESTS ---")

    # Mock user objects
    admin_user = UserModel(role="admin")
    planner_user = UserModel(role="planner")
    analyst_user = UserModel(role="analyst")
    manager_user = UserModel(role="manager")

    # 1. Administrator: Full Access
    print("[TEST] Administrator permission matrix...")
    assert can_create_project(admin_user) is True
    assert can_run_predictions(admin_user) is True
    assert can_submit_project(admin_user) is True
    assert can_review_gis(admin_user) is True
    assert can_approve_gis(admin_user) is True
    assert can_approve_workflow(admin_user) is True
    assert can_update_milestones(admin_user) is True
    assert can_approve_project(admin_user) is True
    print("[SUCCESS] Administrator has Full Access.")

    # 2. Planner: Create Project, Run Predictions, Submit Project
    print("[TEST] Planner permission matrix...")
    assert can_create_project(planner_user) is True
    assert can_run_predictions(planner_user) is True
    assert can_submit_project(planner_user) is True
    assert can_review_gis(planner_user) is False
    assert can_approve_gis(planner_user) is False
    assert can_approve_workflow(planner_user) is False
    assert can_update_milestones(planner_user) is False
    assert can_approve_project(planner_user) is False
    print("[SUCCESS] Planner permissions verified.")

    # 3. GIS Analyst: Review GIS, Approve GIS
    print("[TEST] GIS Analyst permission matrix...")
    assert can_create_project(analyst_user) is False
    assert can_run_predictions(analyst_user) is False
    assert can_submit_project(analyst_user) is False
    assert can_review_gis(analyst_user) is True
    assert can_approve_gis(analyst_user) is True
    assert can_approve_workflow(analyst_user) is False
    assert can_update_milestones(analyst_user) is False
    assert can_approve_project(analyst_user) is False
    print("[SUCCESS] GIS Analyst permissions verified.")

    # 4. Project Manager: Workflow Review, Update Milestones
    print("[TEST] Project Manager permission matrix...")
    assert can_create_project(manager_user) is False
    assert can_run_predictions(manager_user) is False
    assert can_submit_project(manager_user) is False
    assert can_review_gis(manager_user) is False
    assert can_approve_gis(manager_user) is False
    assert can_approve_workflow(manager_user) is True
    assert can_update_milestones(manager_user) is True
    assert can_approve_project(manager_user) is False
    print("[SUCCESS] Project Manager permissions verified.")

    print("\n--- ALL CENTRALIZED PERMISSIONS MATRIX UNIT TESTS PASSED SUCCESSFULLY! ---")

if __name__ == "__main__":
    test_permission_matrix()
