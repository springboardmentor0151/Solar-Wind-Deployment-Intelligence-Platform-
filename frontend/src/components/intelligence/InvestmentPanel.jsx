import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card.jsx";
import Spinner from "../ui/Spinner.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import Badge from "../ui/Badge.jsx";
import ScoreBar from "./ScoreBar.jsx";
import { evaluateSiteInvestment } from "../../api/investmentRecommendationApi.js";
import { formatNumber } from "../../utils/formatters.js";

const recommendationTone = {
  Invest: "brand",
  "Invest with Conditions": "warning",
  "Further Evaluation Required": "info",
  "Do Not Invest": "danger",
};

const riskTone = { Low: "brand", Medium: "warning", High: "danger" };

export default function InvestmentPanel({ siteId }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["investment", siteId],
    queryFn: () => evaluateSiteInvestment(siteId),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (isError) return <ErrorState error={error} onRetry={refetch} title="Investment evaluation failed" />;
  if (!data) return null;

  const { financial_metrics, risk_assessment } = data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={recommendationTone[data.recommendation] || "neutral"} className="text-sm">
          {data.recommendation}
        </Badge>
        <Badge tone={riskTone[risk_assessment?.overall_risk] || "neutral"}>
          {risk_assessment?.overall_risk} risk
        </Badge>
        <Badge tone="neutral">{data.feasibility_status}</Badge>
        <Badge tone="neutral">Priority: {data.investment_priority}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Financial Metrics</CardTitle></CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MetricBox label="CAPEX" value={financial_metrics?.capex} currency />
              <MetricBox label="Annual OPEX" value={financial_metrics?.annual_opex} currency />
              <MetricBox label="Annual revenue" value={financial_metrics?.annual_revenue} currency />
              <MetricBox label="Net cash flow" value={financial_metrics?.annual_net_cash_flow} currency />
              <MetricBox
                label="ROI"
                value={financial_metrics?.roi_percentage}
                suffix="%"
              />
              <MetricBox
                label="Payback period"
                value={financial_metrics?.payback_period_years}
                suffix=" yrs"
              />
            </div>
            <p className="mt-4 text-sm text-ink-subtle">{data.recommendation_reason}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Risk Breakdown</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <ScoreBar label="Financial risk" score={risk_assessment?.financial_risk_score} />
            <ScoreBar label="Site risk" score={risk_assessment?.site_risk_score} />
            <ScoreBar label="Resource risk" score={risk_assessment?.resource_risk_score} />
            <p className="text-xs text-ink-faint">{risk_assessment?.explanation}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <List label="Strengths" items={data.strengths} dot="bg-brand-500" />
        <List label="Concerns" items={data.concerns} dot="bg-danger-500" />
        <List label="Assumptions" items={data.assumptions} dot="bg-info-500" />
      </div>
    </div>
  );
}

function MetricBox({ label, value, currency, suffix }) {
  return (
    <div className="rounded-lg bg-surface-subtle p-3">
      <p className="text-[11px] text-ink-faint">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">
        {value != null
          ? `${currency ? "\u20b9" : ""}${formatNumber(value, { maximumFractionDigits: 2 })}${suffix || ""}`
          : "\u2014"}
      </p>
    </div>
  );
}

function List({ label, items, dot }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-card">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      {items?.length ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-ink-subtle">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-ink-faint">None reported</p>
      )}
    </div>
  );
}
