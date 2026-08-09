import { useAuth } from "../context/AuthContext";
import PlannerDashboard from "./dashboards/PlannerDashboard";
import GisAnalystDashboard from "./dashboards/GisAnalystDashboard";
import ProjectManagerDashboard from "./dashboards/ProjectManagerDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  switch (user?.role) {
    case "gis_analyst":
      return <GisAnalystDashboard />;
    case "project_manager":
      return <ProjectManagerDashboard />;
    case "administrator":
      return <AdminDashboard />;
    case "renewable_energy_planner":
    default:
      return <PlannerDashboard />;
  }
}
