import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, Pencil, Trash2, Plus, MapPinned, Leaf, Rocket, Play, CheckCircle2 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card.jsx";
import { Table, THead, Th, TBody, Tr, Td } from "../../components/ui/Table.jsx";
import { deleteProject, getProject } from "../../api/projectApi.js";
import { getSitesByProject } from "../../api/siteApi.js";
import { formatDate } from "../../utils/formatters.js";
import { useAuth } from "../../hooks/useAuth.js";
import { hasRole, ROLES } from "../../utils/roles.js";
import { extractErrorMessage } from "../../api/axiosClient.js";
import { getProjectDeployments, createDeployment, updateDeploymentStatus } from "../../api/deploymentHistoryApi.js";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deploymentForm, setDeploymentForm] = useState({
    site_id: "",
    technology: "Hybrid Solar-Wind",
    capacity_mw: "",
    planned_start: "",
    notes: "",
  });

  const {
    data: project,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
  });

  const { data: sites, isLoading: sitesLoading } = useQuery({
    queryKey: ["project-sites", projectId],
    queryFn: () => getSitesByProject(projectId),
    enabled: Boolean(project),
  });

  const { data: deployments, isLoading: deploymentsLoading } = useQuery({
    queryKey: ["project-deployments", projectId],
    queryFn: () => getProjectDeployments(projectId),
    enabled: Boolean(project),
  });

  const createDeploymentMutation = useMutation({
    mutationFn: () => createDeployment(projectId, {
      site_id: Number(deploymentForm.site_id),
      technology: deploymentForm.technology,
      capacity_mw: deploymentForm.capacity_mw ? Number(deploymentForm.capacity_mw) : null,
      planned_start: deploymentForm.planned_start ? `${deploymentForm.planned_start}T00:00:00Z` : null,
      notes: deploymentForm.notes || null,
    }),
    onSuccess: () => {
      toast.success("Deployment planned");
      setDeploymentForm({ site_id: "", technology: "Hybrid Solar-Wind", capacity_mw: "", planned_start: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["project-deployments", projectId] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const updateDeploymentMutation = useMutation({
    mutationFn: ({ id, status }) => updateDeploymentStatus(id, { status }),
    onSuccess: () => {
      toast.success("Deployment status updated");
      queryClient.invalidateQueries({ queryKey: ["project-deployments", projectId] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const canEdit = hasRole(user, ROLES.ADMIN, ROLES.PROJECT_MANAGER);
  const canDelete = hasRole(user, ROLES.ADMIN);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!project) return null;

  return (
    <div>
      <Link
        to="/projects"
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-ink-faint hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
      </Link>

      <PageHeader
        title={project.name}
        description={project.description || "No description provided."}
        actions={
          <>
            <Link to={`/environment?project_id=${projectId}`}>
              <Button variant="secondary" size="sm">
                <Leaf className="h-4 w-4" /> Environmental analysis
              </Button>
            </Link>
            {canEdit && (
              <Link to={`/projects/${projectId}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <InfoCard label="Region" value={project.region} />
        <InfoCard label="Sites" value={sites?.length ?? "\u2014"} />
        <InfoCard label="Created" value={formatDate(project.created_at)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sites in this project</CardTitle>
          {canEdit && (
            <Link to={`/sites/new?project_id=${projectId}`}>
              <Button variant="secondary" size="sm">
                <Plus className="h-4 w-4" /> Add site
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardBody className="p-0">
          {sitesLoading && (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          )}
          {sites && sites.length === 0 && (
            <div className="p-5">
              <EmptyState
                icon={MapPinned}
                title="No sites yet"
                description="Add a site to this project to begin GIS enrichment and analysis."
              />
            </div>
          )}
          {sites && sites.length > 0 && (
            <Table>
              <THead>
                <Th>Site</Th>
                <Th>Region</Th>
                <Th>Land use</Th>
                <Th>Elevation</Th>
                <Th />
              </THead>
              <TBody>
                {sites.map((site) => (
                  <Tr key={site.id}>
                    <Td>
                      <Link
                        to={`/sites/${site.id}`}
                        className="font-medium text-ink hover:text-brand-700"
                      >
                        {site.name}
                      </Link>
                    </Td>
                    <Td className="text-ink-subtle">{site.region || "\u2014"}</Td>
                    <Td>
                      {site.land_use ? (
                        <Badge tone="info">{site.land_use}</Badge>
                      ) : (
                        <span className="text-ink-faint">Not enriched</span>
                      )}
                    </Td>
                    <Td className="text-ink-subtle">
                      {site.elevation ?? "\u2014"}
                    </Td>
                    <Td>
                      <Link
                        to={`/sites/${site.id}`}
                        className="text-xs font-medium text-brand-700 hover:underline"
                      >
                        View
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Deployment history</CardTitle>
            <p className="mt-1 text-xs text-ink-faint">Track the PM-controlled deployment lifecycle for project sites.</p>
          </div>
          {canEdit && <Rocket className="h-5 w-5 text-brand-700" />}
        </CardHeader>
        <CardBody>
          {canEdit && (
            <div className="mb-6 grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
              <select className="rounded-md border border-border bg-white px-3 py-2 text-sm" value={deploymentForm.site_id} onChange={(e) => setDeploymentForm((v) => ({ ...v, site_id: e.target.value }))}>
                <option value="">Select site</option>
                {(sites || []).map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
              </select>
              <select className="rounded-md border border-border bg-white px-3 py-2 text-sm" value={deploymentForm.technology} onChange={(e) => setDeploymentForm((v) => ({ ...v, technology: e.target.value }))}>
                <option>Hybrid Solar-Wind</option><option>Solar</option><option>Wind</option>
              </select>
              <input type="number" min="0.01" step="0.01" placeholder="Capacity MW" className="rounded-md border border-border bg-white px-3 py-2 text-sm" value={deploymentForm.capacity_mw} onChange={(e) => setDeploymentForm((v) => ({ ...v, capacity_mw: e.target.value }))} />
              <input type="date" className="rounded-md border border-border bg-white px-3 py-2 text-sm" value={deploymentForm.planned_start} onChange={(e) => setDeploymentForm((v) => ({ ...v, planned_start: e.target.value || "" }))} />
              <Button size="sm" disabled={!deploymentForm.site_id || createDeploymentMutation.isPending} onClick={() => createDeploymentMutation.mutate()}><Rocket className="h-4 w-4" /> Plan deployment</Button>
            </div>
          )}

          {deploymentsLoading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!deploymentsLoading && deployments?.length === 0 && <EmptyState icon={Rocket} title="No deployment records" description="Approved project sites can be added to the deployment plan by the Project Manager." />}
          {!deploymentsLoading && deployments?.length > 0 && (
            <Table>
              <THead><Th>Site</Th><Th>Technology</Th><Th>Capacity</Th><Th>Status</Th><Th>Planned</Th><Th>Actions</Th></THead>
              <TBody>
                {deployments.map((deployment) => {
                  const site = (sites || []).find((item) => item.id === deployment.site_id);
                  return <Tr key={deployment.id}>
                    <Td className="font-medium">{site?.name || `Site #${deployment.site_id}`}</Td>
                    <Td>{deployment.technology}</Td>
                    <Td>{deployment.capacity_mw != null ? `${deployment.capacity_mw} MW` : "—"}</Td>
                    <Td><Badge tone={deployment.status === "COMPLETE" ? "success" : deployment.status === "ACTIVE" ? "warning" : "info"}>{deployment.status.replaceAll("_", " ")}</Badge></Td>
                    <Td>{deployment.planned_start ? formatDate(deployment.planned_start) : "—"}</Td>
                    <Td>
                      {canEdit && deployment.status === "DEPLOYMENT_PLANNED" && <Button variant="secondary" size="sm" onClick={() => updateDeploymentMutation.mutate({ id: deployment.id, status: "ACTIVE" })}><Play className="h-3.5 w-3.5" /> Start</Button>}
                      {canEdit && deployment.status === "ACTIVE" && <Button variant="secondary" size="sm" onClick={() => updateDeploymentMutation.mutate({ id: deployment.id, status: "COMPLETE" })}><CheckCircle2 className="h-3.5 w-3.5" /> Complete</Button>}
                    </Td>
                  </Tr>;
                })}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete this project?"
        description="This permanently removes the project. This action cannot be undone."
        confirmLabel="Delete project"
        danger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-card">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}