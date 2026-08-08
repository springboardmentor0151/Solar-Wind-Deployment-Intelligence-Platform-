/**
 * Centralized Permission Matrix Service
 */

export const PERMISSIONS = {
  admin: [
    'create_project',
    'run_predictions',
    'submit_project',
    'review_gis',
    'approve_gis',
    'workflow_review',
    'update_milestones',
    'approve_project',
    'delete_project',
    'manage_users',
    'view_logs',
    'purge_logs',
    'assign_roles'
  ],
  planner: [
    'create_project',
    'run_predictions',
    'submit_project'
  ],
  analyst: [
    'review_gis',
    'approve_gis'
  ],
  manager: [
    'workflow_review',
    'update_milestones'
  ]
};

/**
 * Checks if a user has a specific permission.
 * @param {Object} user 
 * @param {string} permission 
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  const userRole = user.role.toLowerCase();
  const allowed = PERMISSIONS[userRole] || [];
  return allowed.includes(permission);
}

// Centralized wrapper checks matching the requirements:
export function canCreateProject(user) {
  return hasPermission(user, 'create_project');
}

export function canRunPredictions(user) {
  return hasPermission(user, 'run_predictions');
}

export function canSubmitProject(user) {
  return hasPermission(user, 'submit_project');
}

export function canReviewGIS(user) {
  return hasPermission(user, 'review_gis');
}

export function canApproveGIS(user) {
  return hasPermission(user, 'approve_gis');
}

export function canApproveWorkflow(user) {
  return hasPermission(user, 'workflow_review');
}

export function canUpdateMilestones(user) {
  return hasPermission(user, 'update_milestones');
}

export function canApproveProject(user) {
  return hasPermission(user, 'approve_project');
}
