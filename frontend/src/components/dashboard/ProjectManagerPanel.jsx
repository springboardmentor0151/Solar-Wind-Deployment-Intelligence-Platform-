import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardHeader, CardTitle, CardBody } from "../ui/Card.jsx";
import Spinner from "../ui/Spinner.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import Badge from "../ui/Badge.jsx";
import { getProjectManagerDashboard } from "../../api/dashboardApi.js";
import { formatNumber } from "../../utils/formatters.js";

const riskTone = { LOW: "brand", MEDIUM: "warning", HIGH: "danger" };

export default function ProjectManagerPanel() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard-project-manager"],
    queryFn: getProjectManagerDashboard,
  });

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;
  if (isError) return <ErrorState error={error} onRetry={refetch} title="Couldn't load project manager insights" />;
  if (!data) return null;

  const { project_overview, financial_analytics, risk_assessment, executive_summary } = data;

  const chartData = [
    { name: "Capacity (MW)", value: project_overview.total_capacity_mw },
    { name: "Generation (MWh)", value: project_overview.total_generation_mwh },
  ];

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-ink">Project Manager Overview</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Capacity &amp; Generation</CardTitle>
            <Badge tone={riskTone[risk_assessment.overall_risk?.toUpperCase()] || "neutral"}>
              {risk_assessment.overall_risk} risk
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#12B76A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat label="Active Projects" value={project_overview.active_projects} />
              <Stat label="Total Sites" value={project_overview.total_sites} />
              <Stat label="Recommended Sites" value={project_overview.recommended_sites} />
              <Stat label="Avg ROI" value={`${formatNumber(financial_analytics.average_roi_percentage, { maximumFractionDigits: 1 })}%`} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
          <CardBody className="space-y-3 text-sm">
            <p className="text-ink-subtle">{executive_summary.headline}</p>
            <SummaryList label="Strengths" items={executive_summary.key_strengths} tone="brand" />
            <SummaryList label="Concerns" items={executive_summary.key_concerns} tone="danger" />
            <SummaryList label="Recommended Actions" items={executive_summary.recommended_actions} tone="info" />
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-surface-subtle px-3 py-2">
      <p className="text-[11px] text-ink-faint">{label}</p>
      <p className="text-sm font-semibold text-ink">{value ?? "\u2014"}</p>
    </div>
  );
}

function SummaryList({ label, items, tone }) {
  if (!items?.length) return null;
  const dot = { brand: "bg-brand-500", danger: "bg-danger-500", info: "bg-info-500" }[tone];
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-ink-subtle">
            <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
