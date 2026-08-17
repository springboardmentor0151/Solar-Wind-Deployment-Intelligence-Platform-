import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card.jsx";
import Spinner from "../ui/Spinner.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import Badge from "../ui/Badge.jsx";
import ScoreBar from "./ScoreBar.jsx";
import { recommendSiteTechnology } from "../../api/renewableRecommendationApi.js";

const confidenceTone = { High: "brand", Medium: "warning", Low: "danger" };

export default function RecommendationPanel({ siteId }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["recommendation", siteId],
    queryFn: () => recommendSiteTechnology(siteId),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (isError) return <ErrorState error={error} onRetry={refetch} title="Recommendation failed" />;
  if (!data) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recommended Technology</CardTitle>
          <Badge tone={confidenceTone[data.confidence] || "neutral"}>
            {data.confidence} confidence
          </Badge>
        </CardHeader>
        <CardBody>
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-lg bg-navy-900 px-3 py-1.5 text-sm font-semibold text-white">
              {data.recommended_technology}
            </span>
            {data.recommended_capacity_type && (
              <Badge tone="neutral">{data.recommended_capacity_type}</Badge>
            )}
            <Badge tone={data.deployment_feasible ? "brand" : "danger"}>
              {data.deployment_feasible ? "Feasible" : "Not feasible"}
            </Badge>
          </div>
          <p className="mb-4 text-sm text-ink-subtle">{data.recommendation_reason}</p>
          <div className="grid grid-cols-3 gap-4">
            <ScoreBar label="Solar" score={data.solar?.score} />
            <ScoreBar label="Wind" score={data.wind?.score} />
            <ScoreBar label="Hybrid" score={data.hybrid_score} />
          </div>
          <div className="mt-4">
            <ScoreBar label="Overall site score" score={data.overall_site_score} />
          </div>
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
