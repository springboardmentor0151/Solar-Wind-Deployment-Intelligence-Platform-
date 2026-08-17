import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card.jsx";
import Spinner from "../ui/Spinner.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import Badge from "../ui/Badge.jsx";
import { forecastSiteEnergy } from "../../api/energyForecastingApi.js";
import { formatNumber } from "../../utils/formatters.js";

export default function ForecastPanel({ siteId }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["forecast", siteId],
    queryFn: () => forecastSiteEnergy(siteId),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (isError) return <ErrorState error={error} onRetry={refetch} title="Forecast failed" />;
  if (!data) return null;

  const { monthly_forecast, revenue_forecast, grid_contribution } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricBox label="Technology" value={data.technology} />
        <MetricBox label="Capacity" value={`${formatNumber(data.capacity_mw)} MW`} />
        <MetricBox
          label="Capacity factor"
          value={`${formatNumber(data.capacity_factor * 100, { maximumFractionDigits: 1 })}%`}
        />
        <MetricBox
          label="Annual generation"
          value={`${formatNumber(data.annual_generation_mwh, { maximumFractionDigits: 0 })} MWh`}
        />
      </div>

      <Card>
        <CardHeader><CardTitle>Monthly Generation Forecast</CardTitle></CardHeader>
        <CardBody>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly_forecast}>
                <defs>
                  <linearGradient id="genGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#12B76A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#12B76A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month_name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="total_generation_mwh"
                  stroke="#12B76A"
                  fill="url(#genGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue Forecast</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row
              label="Estimated annual revenue"
              value={`${formatNumber(revenue_forecast?.estimated_annual_revenue, { maximumFractionDigits: 0 })} ${revenue_forecast?.currency}`}
            />
            <Row
              label="Price per MWh"
              value={`${formatNumber(revenue_forecast?.electricity_price_per_mwh)} ${revenue_forecast?.currency}`}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Grid Contribution</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row
              label="Grid contribution"
              value={`${formatNumber(grid_contribution?.estimated_grid_contribution_mwh, { maximumFractionDigits: 0 })} MWh`}
            />
            <Badge tone="brand">
              {formatNumber(grid_contribution?.grid_contribution_percentage, { maximumFractionDigits: 1 })}% of annual generation
            </Badge>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function MetricBox({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3 shadow-card">
      <p className="text-[11px] text-ink-faint">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value ?? "\u2014"}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-ink-faint">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
