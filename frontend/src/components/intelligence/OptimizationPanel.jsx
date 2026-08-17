import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card.jsx";
import Spinner from "../ui/Spinner.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import Badge from "../ui/Badge.jsx";
import ScoreBar from "./ScoreBar.jsx";
import { optimizeSiteDeployment } from "../../api/deploymentOptimizationApi.js";
import { formatNumber } from "../../utils/formatters.js";

export default function OptimizationPanel({ siteId }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["optimization", siteId],
    queryFn: () => optimizeSiteDeployment(siteId),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (isError) return <ErrorState error={error} onRetry={refetch} title="Optimization failed" />;
  if (!data) return null;

  const { capacity_plan, location_recommendation, expansion_plan } = data;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Deployment Optimization</CardTitle>
          <Badge tone={data.recommended_location ? "brand" : "danger"}>
            {data.recommended_location ? "Recommended location" : "Not recommended"}
          </Badge>
        </CardHeader>
        <CardBody>
          <ScoreBar label="Optimization score" score={data.optimization_score} />
          <p className="mt-3 text-sm text-ink-subtle">{data.optimization_reason}</p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <MetricBox label="Recommended capacity" value={capacity_plan?.recommended_capacity_mw} unit="MW" />
            <MetricBox label="Solar capacity" value={capacity_plan?.solar_capacity_mw} unit="MW" />
            <MetricBox label="Wind capacity" value={capacity_plan?.wind_capacity_mw} unit="MW" />
          </div>
          <p className="mt-3 text-xs text-ink-faint">
            Strategy: {capacity_plan?.capacity_strategy}
          </p>
        </CardBody>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Location Recommendation</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <ScoreBar label="Deployment score" score={location_recommendation?.deployment_score} />
            <p className="text-xs text-ink-faint">{location_recommendation?.technology}</p>
            <p className="text-sm text-ink-subtle">{location_recommendation?.recommendation_reason}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Expansion Plan</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Badge tone={expansion_plan?.expansion_recommended ? "brand" : "neutral"}>
              {expansion_plan?.expansion_recommended ? "Expansion recommended" : "No expansion"}
            </Badge>
            <p className="text-xs text-ink-faint">Priority: {expansion_plan?.expansion_priority}</p>
            <p className="text-sm text-ink-subtle">{expansion_plan?.expansion_reason}</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function MetricBox({ label, value, unit }) {
  return (
    <div className="rounded-lg bg-surface-subtle p-3 text-center">
      <p className="text-[11px] text-ink-faint">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">
        {value != null ? formatNumber(value, { maximumFractionDigits: 2 }) : "\u2014"}
        <span className="ml-1 text-xs font-normal text-ink-faint">{unit}</span>
      </p>
    </div>
  );
}
