import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card.jsx";
import Spinner from "../ui/Spinner.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import { predictForSite } from "../../api/predictionApi.js";
import { formatNumber } from "../../utils/formatters.js";

export default function PredictionPanel({ siteId }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["predict-site", siteId],
    queryFn: () => predictForSite(siteId),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (isError) return <ErrorState error={error} onRetry={refetch} title="Prediction failed" />;
  if (!data) return null;

  const { predictions, environment } = data;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>ML Generation Prediction</CardTitle></CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Solar" value={predictions?.solar_generation_mw} unit="MW" tone="warning" />
            <Metric label="Wind" value={predictions?.wind_generation_mw} unit="MW" tone="info" />
            <Metric label="Total" value={predictions?.total_generation_mw} unit="MW" tone="brand" />
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-faint">
            <span>Model: {predictions?.model_version || "\u2014"}</span>
            <span>Data source: {predictions?.data_source || "\u2014"}</span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Environmental Inputs</CardTitle></CardHeader>
        <CardBody className="space-y-2 text-sm">
          {environment?.weather && (
            <>
              <Row label="Temperature" value={fmt(environment.weather.temperature_c, "\u00b0C")} />
              <Row label="Humidity" value={fmt(environment.weather.humidity_pct, "%")} />
              <Row label="Wind speed" value={fmt(environment.weather.wind_speed_m_s, "m/s")} />
              <Row label="Cloud cover" value={fmt(environment.weather.cloud_cover_pct, "%")} />
            </>
          )}
          {environment?.solar && (
            <>
              <Row label="GHI" value={fmt(environment.solar.ghi)} />
              <Row label="DNI" value={fmt(environment.solar.dni)} />
              <Row label="DHI" value={fmt(environment.solar.dhi)} />
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function fmt(v, unit = "") {
  if (v === null || v === undefined) return "\u2014";
  return `${formatNumber(v, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-ink-faint">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

function Metric({ label, value, unit, tone }) {
  const toneClasses = {
    warning: "text-warning-700 bg-warning-50",
    info: "text-info-700 bg-info-50",
    brand: "text-brand-700 bg-brand-50",
  };
  return (
    <div className={`rounded-lg p-4 ${toneClasses[tone]}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-semibold">
        {value != null ? formatNumber(value, { maximumFractionDigits: 2 }) : "\u2014"}
        <span className="ml-1 text-sm font-normal">{unit}</span>
      </p>
    </div>
  );
}
