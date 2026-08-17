// Canonical role names exactly as returned by the backend
// (app/auth/permissions.py -> require_roles(...)).
export const ROLES = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  GIS_ANALYST: "GIS Analyst",
  RENEWABLE_ENERGY_PLANNER: "Renewable Energy Planner",
};

export const ALL_ROLES = Object.values(ROLES);

export function hasRole(user, ...allowed) {
  if (!user?.role?.name) return false;
  return allowed.includes(user.role.name);
}

export const roleBadgeTone = {
  [ROLES.ADMIN]: "navy",
  [ROLES.PROJECT_MANAGER]: "info",
  [ROLES.GIS_ANALYST]: "brand",
  [ROLES.RENEWABLE_ENERGY_PLANNER]: "warning",
};

// Roles selectable via public self-registration (POST /auth/register).
// Admin is intentionally excluded from public registration.

export const REGISTERABLE_ROLES = [
  { role_id: 2, name: ROLES.GIS_ANALYST },
  { role_id: 3, name: ROLES.PROJECT_MANAGER },
  { role_id: 4, name: ROLES.RENEWABLE_ENERGY_PLANNER },
];
