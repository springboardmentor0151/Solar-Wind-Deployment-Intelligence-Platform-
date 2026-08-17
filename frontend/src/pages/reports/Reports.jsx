import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FileText, FileSpreadsheet, GitCompareArrows } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card.jsx";
import { getAllSites } from "../../api/siteApi.js";
import {
  getSiteReport,
  compareSites,
  downloadSiteReportPdf,
  downloadSiteReportExcel,
  triggerBlobDownload,
} from "../../api/reportApi.js";
import { extractErrorMessage } from "../../api/axiosClient.js";
import { formatCoordinate, formatNumber } from "../../utils/formatters.js";

export default function Reports() {
  const [siteId, setSiteId] = useState("");
  const [downloading, setDownloading] = useState(null); // 'pdf' | 'excel' | null
  const [comparisonIds, setComparisonIds] = useState([]);

  const { data: sites } = useQuery({ queryKey: ["sites"], queryFn: getAllSites });

  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["site-report", siteId],
    queryFn: () => getSiteReport(siteId),
    enabled: Boolean(siteId),
  });

  const comparisonQuery = useQuery({
    queryKey: ["site-comparison", comparisonIds],
    queryFn: () => compareSites(comparisonIds),
    enabled: comparisonIds.length >= 2,
  });

  const toggleComparisonSite = (id) => {
    setComparisonIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length < 5
          ? [...current, id]
          : current
    );
  };

  const handleDownload = async (type) => {
    setDownloading(type);
    try {
      const blob =
        type === "pdf"
          ? await downloadSiteReportPdf(siteId)
          : await downloadSiteReportExcel(siteId);
      const ext = type === "pdf" ? "pdf" : "xlsx";
      triggerBlobDownload(blob, `site_report_${siteId}.${ext}`);
      toast.success(`${type.toUpperCase()} report downloaded`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and download a complete intelligence report for any site."
      />

      <div className="mb-6 max-w-sm">
        <Select
          label="Site"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
        >
          <option value="">Select a site</option>
          {sites?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div>
            <CardTitle>Compare Sites</CardTitle>
            <p className="mt-1 text-xs text-ink-faint">
              Compare 2–5 sites using the same suitability and renewable recommendation pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-faint">
            <GitCompareArrows className="h-4 w-4" />
            {comparisonIds.length}/5 selected
          </div>
        </CardHeader>
        <CardBody>
          {sites?.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => (
                <label
                  key={site.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition ${
                    comparisonIds.includes(site.id)
                      ? "border-brand-500 bg-brand-50"
                      : "border-border bg-white hover:border-brand-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={comparisonIds.includes(site.id)}
                    onChange={() => toggleComparisonSite(site.id)}
                    disabled={!comparisonIds.includes(site.id) && comparisonIds.length >= 5}
                    className="h-4 w-4 accent-brand-500"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{site.name}</span>
                    <span className="block truncate text-xs text-ink-faint">{site.region || "No region"}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-faint">No sites available for comparison.</p>
          )}

          {comparisonIds.length >= 2 && (
            <div className="mt-5">
              {comparisonQuery.isLoading && <Spinner />}
              {comparisonQuery.isError && (
                <ErrorState error={comparisonQuery.error} onRetry={comparisonQuery.refetch} title="Couldn't compare sites" />
              )}
              {comparisonQuery.data?.sites?.length > 0 && (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full min-w-[850px] text-left text-xs">
                    <thead className="bg-surface-subtle text-ink-faint">
                      <tr>
                        <th className="px-3 py-2 font-medium">Metric</th>
                        {comparisonQuery.data.sites.map((site) => (
                          <th key={site.site_id} className="px-3 py-2 font-medium">{site.site_name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        ["Region", (s) => s.region || "—"],
                        ["Land use", (s) => s.land_use || "—"],
                        ["Elevation (m)", (s) => formatNumber(s.elevation)],
                        ["Slope", (s) => formatNumber(s.land_slope)],
                        ["Road distance", (s) => formatNumber(s.road_distance)],
                        ["Substation distance", (s) => formatNumber(s.nearest_substation_distance)],
                        ["Suitability", (s) => formatNumber(s.suitability_score, { maximumFractionDigits: 2 })],
                        ["Solar score", (s) => formatNumber(s.solar_score, { maximumFractionDigits: 2 })],
                        ["Wind score", (s) => formatNumber(s.wind_score, { maximumFractionDigits: 2 })],
                        ["Hybrid score", (s) => formatNumber(s.hybrid_score, { maximumFractionDigits: 2 })],
                        ["Technology", (s) => s.recommended_technology || "—"],
                        ["Deployment feasible", (s) => s.deployment_feasible == null ? "—" : s.deployment_feasible ? "Yes" : "No"],
                      ].map(([label, getValue]) => (
                        <tr key={label}>
                          <td className="whitespace-nowrap px-3 py-2 font-medium text-ink-faint">{label}</td>
                          {comparisonQuery.data.sites.map((site) => (
                            <td key={site.site_id} className="px-3 py-2 text-ink">{getValue(site)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {!siteId && (
        <EmptyState
          icon={FileText}
          title="Select a site to generate a report"
          description="Reports combine GIS, environmental, and renewable intelligence data for a single site."
        />
      )}

      {siteId && isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}
      {siteId && isError && <ErrorState error={error} onRetry={refetch} />}

      {report && (
        <>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>{report.site?.site_name}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={downloading === "pdf"}
                  onClick={() => handleDownload("pdf")}
                >
                  <FileText className="h-4 w-4" /> PDF
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={downloading === "excel"}
                  onClick={() => handleDownload("excel")}
                >
                  <FileSpreadsheet className="h-4 w-4" /> Excel
                </Button>
              </div>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Info label="Region" value={report.site?.region || "\u2014"} />
              <Info
                label="Coordinates"
                value={`${formatCoordinate(report.site?.latitude)}, ${formatCoordinate(report.site?.longitude)}`}
              />
              <Info
                label="Elevation"
                value={report.site?.elevation != null ? `${formatNumber(report.site.elevation)} m` : "\u2014"}
              />
              <Info
                label="Land area"
                value={report.site?.land_area != null ? `${formatNumber(report.site.land_area)} ha` : "\u2014"}
              />
            </CardBody>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <ReportSection title="GIS" data={report.gis} />
            <ReportSection title="Environmental" data={report.environmental} />
            <ReportSection title="Solar Prediction" data={report.solar_prediction} />
            <ReportSection title="Wind Prediction" data={report.wind_prediction} />
            <ReportSection title="Suitability" data={report.suitability} />
            <ReportSection title="Renewable Recommendation" data={report.renewable_recommendation} />
            <ReportSection title="Deployment Optimization" data={report.deployment_optimization} />
            <ReportSection title="Energy Forecast" data={report.energy_forecast} />
            <ReportSection title="Investment Recommendation" data={report.investment_recommendation} />
          </div>
        </>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="font-medium text-ink">{value}</p>
    </div>
  );
}

// Renders any backend dict section generically (key -> value), since these
// are typed as `dict` on the backend and aggregate several service outputs.
function ReportSection({ title, data }) {
  if (!data) return null;
  const entries = Object.entries(data).filter(
    ([, v]) => v !== null && typeof v !== "object"
  );
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardBody className="space-y-1.5 text-sm">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between border-b border-border/60 py-1 last:border-0"
          >
            <span className="text-ink-faint">{key.replace(/_/g, " ")}</span>
            <span className="font-medium text-ink">
              {typeof value === "number"
                ? formatNumber(value, { maximumFractionDigits: 2 })
                : String(value)}
            </span>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
