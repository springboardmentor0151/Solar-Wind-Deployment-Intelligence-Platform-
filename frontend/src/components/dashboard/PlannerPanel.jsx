import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardBody } from "../ui/Card.jsx";
import Spinner from "../ui/Spinner.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import Badge from "../ui/Badge.jsx";
import { getPlannerDashboard } from "../../api/dashboardApi.js";
import { formatNumber } from "../../utils/formatters.js";

export default function PlannerPanel() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard-planner"],
    queryFn: getPlannerDashboard,
    // The backend dashboard is read-only/cached intelligence. Avoid
    // unnecessary refetches while navigating around the dashboard.
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;
  if (isError) return <ErrorState error={error} onRetry={refetch} title="Couldn't load planning insights" />;
  if (!data) return null;

  const { summary, recommended_sites, generation_forecast, investment_recommendations } = data;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">Renewable Energy Planner Overview</h2>
        <span className="text-[11px] text-ink-faint">Based on stored site intelligence</span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Recommended Sites" value={summary.recommendedSites} />
        <MiniStat
          label="Total Forecast (MWh)"
          value={formatNumber(summary.totalForecastMwh, { maximumFractionDigits: 0 })}
        />
        <MiniStat
          label="Avg. Suitability"
          value={formatNumber(summary.averageSuitability, { maximumFractionDigits: 1 })}
        />
        <MiniStat label="Investment Opportunities" value={summary.investmentOpportunities} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Generation Forecast</CardTitle></CardHeader>
          <CardBody>
            <div className="h-56">
              {generation_forecast?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generation_forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="generation_mwh" stroke="#12B76A" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-ink-faint">
                  No stored energy forecast is available yet.
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Investment Recommendations</CardTitle></CardHeader>
          <CardBody className="max-h-56 space-y-2 overflow-y-auto">
            {investment_recommendations?.length ? investment_recommendations.slice(0, 6).map((item) => (
              <div key={item.site_id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs">
                <div>
                  <p className="font-medium text-ink">{item.site_name}</p>
                  <p className="text-ink-faint">{item.technology}</p>
                </div>
                <Badge tone={item.feasibility_status === "Feasible" ? "brand" : "warning"}>
                  {item.recommendation}
                </Badge>
              </div>
            )) : (
              <p className="py-6 text-center text-xs text-ink-faint">
                No stored investment recommendation is available yet.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {recommended_sites?.length > 0 && (
        <Card className="mt-4">
          <CardHeader><CardTitle>Recommended Sites</CardTitle></CardHeader>
          <CardBody className="p-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-ink-faint">
                <tr>
                  <th className="px-4 py-2 font-medium">Site</th>
                  <th className="px-4 py-2 font-medium">Technology</th>
                  <th className="px-4 py-2 font-medium">Suitability</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recommended_sites.map((s) => (
                  <tr key={s.site_id}>
                    <td className="px-4 py-2 font-medium text-ink">{s.site_name}</td>
                    <td className="px-4 py-2 text-ink-subtle">{s.technology}</td>
                    <td className="px-4 py-2 text-ink-subtle">
                      {s.suitability_category} ({formatNumber(s.suitability_score, { maximumFractionDigits: 1 })})
                    </td>
                    <td className="px-4 py-2 text-ink-subtle">{s.deployment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </section>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3 shadow-card">
      <p className="text-[11px] text-ink-faint">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value ?? "\u2014"}</p>
    </div>
  );
}
