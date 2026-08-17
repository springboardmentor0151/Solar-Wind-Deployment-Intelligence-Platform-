import axiosClient from "./axiosClient";

// GET /dashboard/summary -> DashboardSummaryResponse
export const getDashboardSummary = () =>
  axiosClient.get("/dashboard/summary").then((r) => r.data);

// GET /dashboard/project-manager  (ProjectManager, Admin)
export const getProjectManagerDashboard = () =>
  axiosClient.get("/dashboard/project-manager").then((r) => r.data);

// GET /dashboard/gis-analyst  (GISAnalyst, ProjectManager, Admin)
export const getGisAnalystDashboard = () =>
  axiosClient.get("/dashboard/gis-analyst").then((r) => r.data);

// GET /dashboard/planner  (RenewableEnergyPlanner, ProjectManager, Admin)
export const getPlannerDashboard = () =>
  axiosClient.get("/dashboard/planner").then((r) => r.data);
