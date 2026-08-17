import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardBody } from "../ui/Card.jsx";
import Spinner from "../ui/Spinner.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import { getGisAnalystDashboard } from "../../api/dashboardApi.js";
import { formatNumber } from "../../utils/formatters.js";

export default function GisAnalystPanel() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard-gis-analyst"],
    queryFn: getGisAnalystDashboard,
  });

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;
  if (isError) return <ErrorState error={error} onRetry={refetch} title="Couldn't load GIS analytics" />;
  if (!data) return null;

  const { summary, environmental_analytics, site_comparison } = data;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-ink">GIS Analyst Overview</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Terrain Summary</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="Enriched sites" value={`${summary.enriched_sites} / ${summary.total_sites}`} />
            <Row label="Avg. slope" value={formatNumber(summary.average_slope, { maximumFractionDigits: 2 })} />
            <Row label="Avg. vegetation index" value={formatNumber(summary.average_vegetation_index, { maximumFractionDigits: 2 })} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Environmental Analytics</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="Water body distance (avg)" value={`${formatNumber(environmental_analytics.average_water_body_distance)} m`} />
            <Row label="Protected area distance (avg)" value={`${formatNumber(environmental_analytics.average_protected_area_distance)} m`} />
            <Row label="Road distance (avg)" value={`${formatNumber(environmental_analytics.average_road_distance)} m`} />
            <Row label="Substation distance (avg)" value={`${formatNumber(environmental_analytics.average_substation_distance)} m`} />
            <Row label="Transmission line distance (avg)" value={`${formatNumber(environmental_analytics.average_transmission_line_distance)} m`} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Sites by Suitability</CardTitle></CardHeader>
          <CardBody className="p-0">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-border">
                  {site_comparison
                    ?.slice()
                    .sort((a, b) => b.suitability_score - a.suitability_score)
                    .slice(0, 8)
                    .map((s) => (
                      <tr key={s.site_id}>
                        <td className="px-4 py-2 font-medium text-ink">{s.site_name}</td>
                        <td className="px-4 py-2 text-right text-ink-subtle">
                          {formatNumber(s.suitability_score, { maximumFractionDigits: 1 })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-faint">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
