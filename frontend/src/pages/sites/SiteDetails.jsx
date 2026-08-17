import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, Pencil, Trash2, Sparkles, Leaf } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card.jsx";
import { deleteSite, getSite } from "../../api/siteApi.js";
import { formatCoordinate, formatNumber } from "../../utils/formatters.js";
import { useAuth } from "../../hooks/useAuth.js";
import { hasRole, ROLES } from "../../utils/roles.js";
import { extractErrorMessage } from "../../api/axiosClient.js";

export default function SiteDetails() {
  const { siteId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: site, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["site", siteId],
    queryFn: () => getSite(siteId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSite(siteId),
    onSuccess: () => {
      toast.success("Site deleted");
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      navigate("/sites");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const canEdit = hasRole(user, ROLES.ADMIN, ROLES.PROJECT_MANAGER);
  const canDelete = hasRole(user, ROLES.ADMIN);
  const canAnalyze = hasRole(
    user,
    ROLES.RENEWABLE_ENERGY_PLANNER,
    ROLES.PROJECT_MANAGER
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!site) return null;

  return (
    <div>
      <Link
        to="/sites"
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-ink-faint hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sites
      </Link>

      <PageHeader
        title={site.name}
        description={site.description || "No description provided."}
        actions={
          <>
            {canAnalyze && (
              <Link to={`/intelligence?site_id=${siteId}`}>
                <Button variant="brand" size="sm">
                  <Sparkles className="h-4 w-4" /> Run intelligence
                </Button>
              </Link>
            )}
            <Link to={`/environment?site_id=${siteId}`}>
              <Button variant="secondary" size="sm">
                <Leaf className="h-4 w-4" /> Environmental analysis
              </Button>
            </Link>
            {canEdit && (
              <Link to={`/sites/${siteId}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Site Information</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="Region" value={site.region || "\u2014"} />
            <Row
              label="Coordinates"
              value={`${formatCoordinate(site.latitude)}, ${formatCoordinate(site.longitude)}`}
              mono
            />
            <Row
              label="Land area"
              value={site.land_area != null ? `${formatNumber(site.land_area)} ha` : "\u2014"}
            />
            <Row
              label="Existing infrastructure"
              value={site.existing_infrastructure || "None recorded"}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GIS Information</CardTitle>
            {site.land_use ? (
              <Badge tone="brand">Enriched</Badge>
            ) : (
              <Badge tone="neutral">Not yet enriched</Badge>
            )}
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="Elevation" value={fmtM(site.elevation)} />
            <Row label="Land use" value={site.land_use || "\u2014"} />
            <Row label="Land slope" value={fmtRaw(site.land_slope)} />
            <Row label="Vegetation index" value={fmtRaw(site.vegetation_index)} />
            <Row label="Road distance" value={fmtM(site.road_distance)} />
            <Row
              label="Nearest substation distance"
              value={fmtM(site.nearest_substation_distance)}
            />
            <Row
              label="Nearest transmission line distance"
              value={fmtM(site.nearest_transmission_line_distance)}
            />
            <Row label="Water body distance" value={fmtM(site.water_body_distance)} />
            <Row
              label="Protected area distance"
              value={fmtM(site.protected_area_distance)}
            />
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete this site?"
        description="This permanently removes the site and its GIS data. This action cannot be undone."
        confirmLabel="Delete site"
        danger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function fmtM(v) {
  return v != null ? `${formatNumber(v)} m` : "\u2014";
}
function fmtRaw(v) {
  return v != null ? formatNumber(v, { maximumFractionDigits: 2 }) : "\u2014";
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-ink-faint">{label}</span>
      <span className={`font-medium text-ink ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}