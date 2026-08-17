import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Leaf,
  CloudSun,
  Sun,
  Mountain,
  MapPinned,
  Eye,
  Wind,
  Gauge,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import Select from "../../components/ui/Select.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card.jsx";
import { Table, THead, Th, TBody, Tr, Td } from "../../components/ui/Table.jsx";
import Button from "../../components/ui/Button.jsx";
import { getAllSites } from "../../api/siteApi.js";
import { getProjects } from "../../api/projectApi.js";
import { getSiteEnvironment, getProjectEnvironment } from "../../api/environmentApi.js";
import { getSiteResourceAssessment } from "../../api/resourceAssessmentApi.js";
import { formatCoordinate, formatNumber } from "../../utils/formatters.js";

const WEATHER_FIELDS = [
  { key: "temperature", label: "Temperature", unit: "\u00b0C" },
  { key: "humidity", label: "Humidity", unit: "%" },
  { key: "rainfall", label: "Rainfall", unit: "mm" },
  { key: "wind_speed", label: "Wind speed", unit: "m/s" },
  { key: "wind_direction", label: "Wind direction", unit: "\u00b0" },
  { key: "pressure", label: "Pressure", unit: "hPa" },
  { key: "cloud_cover", label: "Cloud cover", unit: "%" },
];

const SOLAR_FIELDS = [
  { key: "ghi", label: "GHI \u2014 Global Horizontal Irradiance", unit: "kWh/m\u00b2/day" },
  { key: "dni", label: "DNI \u2014 Direct Normal Irradiance", unit: "kWh/m\u00b2/day" },
  { key: "dhi", label: "DHI \u2014 Diffuse Horizontal Irradiance", unit: "kWh/m\u00b2/day" },
  { key: "solar_irradiance", label: "Solar irradiance", unit: "kWh/m\u00b2/day" },
];

const GIS_FIELDS = [
  { key: "land_use", label: "Land use" },
  { key: "elevation", label: "Elevation", unit: "m" },
  { key: "land_slope", label: "Land slope", unit: "\u00b0" },
  { key: "vegetation_index", label: "Vegetation index (NDVI)" },
  { key: "existing_infrastructure", label: "Existing infrastructure" },
  { key: "road_distance", label: "Road distance", unit: "m" },
  { key: "nearest_substation_distance", label: "Nearest substation distance", unit: "m" },
  { key: "nearest_transmission_line_distance", label: "Nearest transmission line distance", unit: "m" },
  { key: "water_body_distance", label: "Water body distance", unit: "m" },
  { key: "protected_area_distance", label: "Protected area distance", unit: "m" },
];

export default function Environment() {
  const [searchParams, setSearchParams] = useSearchParams();

  const siteId = searchParams.get("site_id") || "";
  const projectId = searchParams.get("project_id") || "";

  // Which tab is active. Once a site_id/project_id is present in the URL it
  // always wins (so links from Site Details / Project Details work even if
  // this page is already mounted); otherwise fall back to the last tab the
  // user clicked.
  const [uiMode, setUiMode] = useState(projectId ? "project" : "site");
  const mode = siteId ? "site" : projectId ? "project" : uiMode;

  const { data: sites } = useQuery({ queryKey: ["sites"], queryFn: getAllSites });
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: getProjects });

  const resourceQuery = useQuery({
    queryKey: ["site-resource-assessment", siteId],
    queryFn: () => getSiteResourceAssessment(siteId),
    enabled: mode === "site" && Boolean(siteId),
  });

  const siteQuery = useQuery({
    queryKey: ["site-environment", siteId],
    queryFn: () => getSiteEnvironment(siteId),
    enabled: mode === "site" && Boolean(siteId),
  });

  const projectQuery = useQuery({
    queryKey: ["project-environment", projectId],
    queryFn: () => getProjectEnvironment(projectId),
    enabled: mode === "project" && Boolean(projectId),
  });

  const handleModeChange = (nextMode) => {
    setUiMode(nextMode);
    setSearchParams({});
  };

  const handleSiteSelect = (id) => {
    setUiMode("site");
    setSearchParams(id ? { site_id: id } : {});
  };

  const handleProjectSelect = (id) => {
    setUiMode("project");
    setSearchParams(id ? { project_id: id } : {});
  };

  const viewSite = (id) => {
    setUiMode("site");
    setSearchParams({ site_id: String(id) });
  };

  return (
    <div>
      <PageHeader
        title="Environmental Analysis"
        description="Climate, solar resource, and land/GIS characteristics for a site or project."
      />

      <div className="mb-4">
        <Tabs
          tabs={[
            { value: "site", label: "Site level" },
            { value: "project", label: "Project level" },
          ]}
          active={mode}
          onChange={handleModeChange}
        />
      </div>

      <div className="mb-6 max-w-sm">
        {mode === "site" ? (
          <Select
            label="Site"
            value={siteId}
            onChange={(e) => handleSiteSelect(e.target.value)}
          >
            <option value="">Select a site</option>
            {sites?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        ) : (
          <Select
            label="Project"
            value={projectId}
            onChange={(e) => handleProjectSelect(e.target.value)}
          >
            <option value="">Select a project</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {mode === "site" && (
        <SiteMode
          siteId={siteId}
          query={siteQuery}
          resourceQuery={resourceQuery}
        />
      )}

      {mode === "project" && (
        <ProjectMode
          projectId={projectId}
          query={projectQuery}
          onViewSite={viewSite}
        />
      )}
    </div>
  );
}

function SiteMode({ siteId, query, resourceQuery }) {
  if (!siteId) {
    return (
      <EmptyState
        icon={Leaf}
        title="Select a site to view environmental analysis"
        description="Climate, solar resource, and land characteristics will appear here."
      />
    );
  }

  const { data, isLoading, isError, error, refetch } = query;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!data) return null;

  return <SiteEnvironmentReport report={data} resourceQuery={resourceQuery} />;
}

function ProjectMode({ projectId, query, onViewSite }) {
  if (!projectId) {
    return (
      <EmptyState
        icon={Leaf}
        title="Select a project to view environmental analysis"
        description="Environmental data for every site in the project will appear here."
      />
    );
  }

  const { data, isLoading, isError, error, refetch } = query;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!data) return null;

  const sites = data.sites || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{data.project_name}</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Info label="Project ID" value={data.project_id} />
          <Info label="Sites analyzed" value={sites.length} />
        </CardBody>
      </Card>

      {sites.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="No sites in this project yet"
          description="Add sites to this project to see environmental analysis."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sites in this project</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <THead>
                <Th>Site</Th>
                <Th>Temperature</Th>
                <Th>GHI</Th>
                <Th>Land use</Th>
                <Th>Elevation</Th>
                <Th />
              </THead>
              <TBody>
                {sites.map((report) => (
                  <Tr key={report.site_id}>
                    <Td className="font-medium">{report.site_name}</Td>
                    <Td>{fmtMetric(report.weather?.temperature, "\u00b0C")}</Td>
                    <Td>{fmtMetric(report.solar?.ghi, "kWh/m\u00b2/day")}</Td>
                    <Td>{report.gis?.land_use || "\u2014"}</Td>
                    <Td>{fmtMetric(report.gis?.elevation, "m")}</Td>
                    <Td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewSite(report.site_id)}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function SiteEnvironmentReport({ report, resourceQuery }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{report.site_name}</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Info label="Site ID" value={report.site_id ?? "\u2014"} />
          <Info
            label="Coordinates"
            value={`${formatCoordinate(report.latitude)}, ${formatCoordinate(report.longitude)}`}
          />
        </CardBody>
      </Card>

      <ResourceAssessmentSection query={resourceQuery} />

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricSection
          icon={CloudSun}
          title="Environmental / Climate Indicators"
          fields={WEATHER_FIELDS}
          data={report.weather}
        />
        <MetricSection
          icon={Sun}
          title="Solar Resource"
          fields={SOLAR_FIELDS}
          data={report.solar}
        />
        <MetricSection
          icon={Mountain}
          title="Land & GIS Characteristics"
          fields={GIS_FIELDS}
          data={report.gis}
          className="lg:col-span-2"
        />
      </div>
    </div>
  );
}

function ResourceAssessmentSection({ query }) {
  const { data, isLoading, isError, refetch } = query;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Renewable Resource Assessment</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="py-4 text-sm text-ink-faint">Building resource assessment...</div>
        </CardBody>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Renewable Resource Assessment</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-ink-subtle">Resource assessment is temporarily unavailable.</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Renewable Resource Assessment</CardTitle>
        <div className="flex items-center gap-2 text-ink-faint">
          <Sun className="h-4 w-4" />
          <Wind className="h-4 w-4" />
          <Gauge className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <ResourceColumn title="Solar" metrics={data.solar} />
          <ResourceColumn title="Wind" metrics={data.wind} />
        </div>
        {data.assessment_notes?.length > 0 && (
          <div className="rounded-md border border-border bg-surface-muted p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Assessment notes</p>
            <ul className="list-disc space-y-1 pl-4 text-xs text-ink-subtle">
              {data.assessment_notes.map((note, index) => <li key={index}>{note}</li>)}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ResourceColumn({ title, metrics }) {
  const entries = Object.entries(metrics || {});
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-ink">{title}</h4>
      <div className="divide-y divide-border rounded-md border border-border">
        {entries.map(([key, metric]) => (
          <div key={key} className="flex items-start justify-between gap-4 px-3 py-2 text-sm">
            <span className="text-ink-faint">{labelize(key)}</span>
            <div className="text-right">
              <div className={`font-medium ${metric?.status === "unavailable" ? "text-ink-faint" : "text-ink"}`}>
                {metric?.status === "unavailable" || metric?.value === null || metric?.value === undefined
                  ? "Unavailable"
                  : `${formatNumber(metric.value, { maximumFractionDigits: 3 })} ${metric.unit}`}
              </div>
              <div className="text-[11px] text-ink-faint">{metric?.source || "—"}</div>
              {metric?.note && <div className="mt-0.5 max-w-xs text-[11px] text-ink-faint">{metric.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function labelize(key) {
  return key.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function MetricSection({ icon: Icon, title, fields, data, className }) {
  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-ink-faint" />}
        </CardHeader>
        <CardBody>
          <EmptyState
            title="No data available"
            description="This information has not been collected for this site yet."
          />
        </CardBody>
      </Card>
    );
  }

  const available = fields.filter(
    (f) => data[f.key] !== null && data[f.key] !== undefined
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-ink-faint" />}
      </CardHeader>
      <CardBody>
        {available.length === 0 ? (
          <EmptyState
            title="No data available"
            description="This information has not been collected for this site yet."
          />
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {available.map((f) => (
              <div
                key={f.key}
                className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0"
              >
                <span className="text-ink-faint">{f.label}</span>
                <span className="font-medium text-ink">
                  {typeof data[f.key] === "number"
                    ? `${formatNumber(data[f.key], { maximumFractionDigits: 2 })}${f.unit ? ` ${f.unit}` : ""}`
                    : String(data[f.key])}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function fmtMetric(value, unit) {
  if (value === null || value === undefined) return "\u2014";
  return `${formatNumber(value, { maximumFractionDigits: 1 })} ${unit}`;
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="font-medium text-ink">{value}</p>
    </div>
  );
}