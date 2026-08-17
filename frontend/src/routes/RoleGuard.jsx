import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { hasRole } from "../utils/roles.js";

// Frontend-only UX guard. The backend (require_roles) is always the
// authoritative check — this only prevents rendering pages a role
// cannot use so the UI doesn't dead-end into a 403.
export default function RoleGuard({ allow }) {
  const { user } = useAuth();

  if (!hasRole(user, ...allow)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
