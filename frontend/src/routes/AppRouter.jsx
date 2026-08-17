import { Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleGuard from "./RoleGuard.jsx";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import Dashboard from "../pages/dashboard/Dashboard.jsx";
import Profile from "../pages/profile/Profile.jsx";
import AdminDashboard from "../pages/admin/AdminDashboard.jsx";

import Projects from "../pages/projects/Projects.jsx";
import ProjectDetails from "../pages/projects/ProjectDetails.jsx";
import ProjectForm from "../pages/projects/ProjectForm.jsx";

import Sites from "../pages/sites/Sites.jsx";
import SiteDetails from "../pages/sites/SiteDetails.jsx";
import SiteForm from "../pages/sites/SiteForm.jsx";

import GISAnalyst from "../pages/gis/GISAnalyst.jsx";
import RenewableIntelligence from "../pages/intelligence/RenewableIntelligence.jsx";
import Environment from "../pages/environment/Environment.jsx";
import Reports from "../pages/reports/Reports.jsx";
import Notifications from "../pages/notifications/Notifications.jsx";
import CandidateSites from "../pages/candidate-sites/CandidateSites.jsx";

import NotFound from "../pages/errors/NotFound.jsx";
import Unauthorized from "../pages/errors/Unauthorized.jsx";

import { ROLES } from "../utils/roles.js";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />

          {/* Projects: Admin, Project Manager */}
          <Route
            element={<RoleGuard allow={[ROLES.ADMIN, ROLES.PROJECT_MANAGER]} />}
          >
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/new" element={<ProjectForm />} />
            <Route path="/projects/:projectId/edit" element={<ProjectForm />} />
          </Route>
          {/* Project details viewable by any authenticated role that can see Projects nav */}
          <Route
            element={<RoleGuard allow={[ROLES.ADMIN, ROLES.PROJECT_MANAGER]} />}
          >
            <Route path="/projects/:projectId" element={<ProjectDetails />} />
          </Route>

          {/* Sites: all four roles */}
          <Route
            element={
              <RoleGuard
                allow={[
                  ROLES.ADMIN,
                  ROLES.PROJECT_MANAGER,
                  ROLES.GIS_ANALYST,
                  ROLES.RENEWABLE_ENERGY_PLANNER,
                ]}
              />
            }
          >
            <Route path="/sites" element={<Sites />} />
            <Route path="/sites/:siteId" element={<SiteDetails />} />
          </Route>
          <Route
            element={<RoleGuard allow={[ROLES.ADMIN, ROLES.PROJECT_MANAGER]} />}
          >
            <Route path="/sites/new" element={<SiteForm />} />
            <Route path="/sites/:siteId/edit" element={<SiteForm />} />
          </Route>

          {/* GIS: Admin, GIS Analyst, Project Manager, Planner */}
          <Route
            element={
              <RoleGuard
                allow={[
                  ROLES.ADMIN,
                  ROLES.GIS_ANALYST,
                  ROLES.PROJECT_MANAGER,
                  ROLES.RENEWABLE_ENERGY_PLANNER,
                ]}
              />
            }
          >
            <Route path="/gis" element={<GISAnalyst />} />
            <Route path="/intelligence" element={<RenewableIntelligence />} />
          </Route>

          {/* Environmental Analysis: Admin, GIS Analyst, Project Manager, Planner
              (matches backend require_roles on /environment/sites and /environment/projects) */}
          <Route
            element={
              <RoleGuard
                allow={[
                  ROLES.ADMIN,
                  ROLES.GIS_ANALYST,
                  ROLES.PROJECT_MANAGER,
                  ROLES.RENEWABLE_ENERGY_PLANNER,
                ]}
              />
            }
          >
            <Route path="/environment" element={<Environment />} />
          </Route>

          {/* Admin: Admin only (matches backend require_roles on /auth/admin) */}
          <Route element={<RoleGuard allow={[ROLES.ADMIN]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Reports: Admin, Planner, Project Manager, GIS Analyst */}
          <Route
            element={
              <RoleGuard
                allow={[
                  ROLES.ADMIN,
                  ROLES.RENEWABLE_ENERGY_PLANNER,
                  ROLES.PROJECT_MANAGER,
                  ROLES.GIS_ANALYST,
                ]}
              />
            }
          >
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* Candidate workflow: Planner can monitor submissions; PM/Admin can review. */}
          <Route
            element={
              <RoleGuard
                allow={[
                  ROLES.ADMIN,
                  ROLES.PROJECT_MANAGER,
                  ROLES.RENEWABLE_ENERGY_PLANNER,
                ]}
              />
            }
          >
            <Route path="/candidate-sites" element={<CandidateSites />} />
          </Route>

          {/* Notifications: any authenticated user */}
          <Route path="/notifications" element={<Notifications />} />

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}