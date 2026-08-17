import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card.jsx";
import Spinner from "../ui/Spinner.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import Badge from "../ui/Badge.jsx";
import ScoreBar from "./ScoreBar.jsx";
import { evaluateSiteSuitability } from "../../api/suitabilityApi.js";

const categoryTone = {
  Excellent: "brand",
  "Highly Suitable": "brand",
  "Moderately Suitable": "warning",
  "Low Suitability": "danger",
  Unsuitable: "danger",
};

export default function SuitabilityPanel({ siteId }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["suitability", siteId],
    queryFn: () => evaluateSiteSuitability(siteId),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (isError) return <ErrorState error={error} onRetry={refetch} title="Suitability evaluation failed" />;
  if (!data) return null;

  const factors = [
    ["Renewable resource", data.renewable_resource],
    ["Geographic suitability", data.geographic_suitability],
    ["Infrastructure accessibility", data.infrastructure_accessibility],
    ["Environmental impact", data.environmental_impact],
    ["Economic feasibility", data.economic_feasibility],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Suitability Factors</CardTitle>
          <Badge tone={categoryTone[data.category] || "neutral"}>{data.category}</Badge>
        </CardHeader>
        <CardBody className="space-y-4">
          <ScoreBar label="Overall score" score={data.overall_score} />
          <div className="my-2 h-px bg-border" />
          {factors.map(([label, factor]) => (
            <ScoreBar
              key={label}
              label={label}
              score={factor?.score}
              sub={factor?.status}
            />
          ))}
        </CardBody>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Recommendation</CardTitle></CardHeader>
          <CardBody className="space-y-3 text-sm">
            <p className="text-ink-subtle">{data.recommendation}</p>
            <Badge tone={data.deployment_feasible ? "brand" : "danger"}>
              {data.deployment_feasible ? "Deployment feasible" : "Not feasible"}
            </Badge>
            {(data.solar_score != null || data.wind_score != null) && (
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                {data.solar_score != null && (
                  <div className="rounded-md bg-warning-50 px-2 py-1.5 text-warning-700">
                    Solar: {data.solar_score.toFixed(0)}
                  </div>
                )}
                {data.wind_score != null && (
                  <div className="rounded-md bg-info-50 px-2 py-1.5 text-info-700">
                    Wind: {data.wind_score.toFixed(0)}
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Strengths &amp; Constraints</CardTitle></CardHeader>
          <CardBody className="space-y-3 text-xs">
            <List label="Strengths" items={data.strengths} dot="bg-brand-500" />
            <List label="Constraints" items={data.constraints} dot="bg-danger-500" />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function List({ label, items, dot }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-1 font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-ink-subtle">
            <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
