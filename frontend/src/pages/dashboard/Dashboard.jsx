import { useQuery } from "@tanstack/react-query";
import {
  FolderKanban,
  MapPinned,
  Users,
  Sun,
  Wind,
  Layers,
  Activity,
  Sprout,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { getDashboardSummary } from "../../api/dashboardApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { hasRole, ROLES } from "../../utils/roles.js";
import ProjectManagerPanel from "../../components/dashboard/ProjectManagerPanel.jsx";
import GisAnalystPanel from "../../components/dashboard/GisAnalystPanel.jsx";
import PlannerPanel from "../../components/dashboard/PlannerPanel.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(" ")[0] || ""}`}
        description="Platform-wide status for renewable deployment across all active projects."
      />

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={refetch} />}

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard
              label="Total Projects"
              value={summary.total_projects}
              icon={FolderKanban}
              tone="navy"
            />
            <StatCard
              label="Total Sites"
              value={summary.total_sites}
              icon={MapPinned}
              tone="brand"
            />
            <StatCard
              label="Enriched Sites"
              value={summary.enriched_sites}
              icon={Layers}
              tone="info"
            />
            <StatCard
              label="Total Users"
              value={summary.total_users}
              icon={Users}
              tone="neutral"
            />
            <StatCard
              label="Solar Sites"
              value={summary.solar_sites}
              icon={Sun}
              tone="warning"
            />
            <StatCard
              label="Wind Sites"
              value={summary.wind_sites}
              icon={Wind}
              tone="info"
            />
            <StatCard
              label="Hybrid Sites"
              value={summary.hybrid_sites}
              icon={Sprout}
              tone="brand"
            />
            <StatCard
              label="System Status"
              value={summary.system_status}
              icon={Activity}
              tone="navy"
            />
          </div>

          <div className="mt-8 space-y-8">
            {hasRole(user, ROLES.PROJECT_MANAGER, ROLES.ADMIN) && (
              <ProjectManagerPanel />
            )}
            {hasRole(user, ROLES.GIS_ANALYST, ROLES.ADMIN) && (
              <GisAnalystPanel />
            )}
            {hasRole(user, ROLES.RENEWABLE_ENERGY_PLANNER, ROLES.ADMIN) && (
              <PlannerPanel />
            )}
          </div>
        </>
      )}
    </div>
  );
}
