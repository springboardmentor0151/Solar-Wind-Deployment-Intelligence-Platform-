import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CheckCircle2, ClipboardCheck, XCircle } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card.jsx";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { hasRole, ROLES } from "../../utils/roles.js";
import {
  getPendingCandidateSites,
  reviewCandidateSite,
  createProjectFromCandidate,
} from "../../api/candidateSiteApi.js";
import { getSite } from "../../api/siteApi.js";
import { extractErrorMessage } from "../../api/axiosClient.js";
import { formatDateTime, formatNumber } from "../../utils/formatters.js";

export default function CandidateSites() {
  const { user } = useAuth();
  const isPM = hasRole(user, ROLES.PROJECT_MANAGER, ROLES.ADMIN);
  const isPlanner = hasRole(user, ROLES.RENEWABLE_ENERGY_PLANNER, ROLES.ADMIN);

  const { data: candidates, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["candidate-sites", "pending"],
    queryFn: getPendingCandidateSites,
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const pending = candidates || [];

  return (
    <div>
      <PageHeader
        title={isPM ? "Candidate Site Reviews" : "Candidate Sites"}
        description={
          isPM
            ? "Review renewable candidate sites submitted by planners before creating projects."
            : "Track sites currently waiting for Project Manager review."
        }
      />

      {pending.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No candidate sites pending review"
          description={
            isPlanner
              ? "Run intelligence on a pre-project site and submit it as a candidate when you are ready."
              : "New planner submissions will appear here automatically."
          }
        />
      ) : (
        <div className="space-y-4">
          {pending.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              isPM={isPM}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateCard({ candidate, isPM }) {
  const [decision, setDecision] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [candidateStatus, setCandidateStatus] = useState(candidate.status);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectRegion, setProjectRegion] = useState("");
  const queryClient = useQueryClient();

  const { data: site } = useQuery({
    queryKey: ["site", candidate.site_id],
    queryFn: () => getSite(candidate.site_id),
    enabled: Boolean(candidate.site_id),
  });

  const reviewMutation = useMutation({
    mutationFn: (payload) => reviewCandidateSite(candidate.id, payload),
    onSuccess: (result) => {
      setCandidateStatus(result.status);
      toast.success(result.status === "APPROVED" ? "Candidate approved" : "Candidate rejected");
      setDecision(null);
      setRejectionReason("");
      if (result.status === "REJECTED") {
        queryClient.invalidateQueries({ queryKey: ["candidate-sites", "pending"] });
      }
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const projectMutation = useMutation({
    mutationFn: (payload) => createProjectFromCandidate(candidate.id, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["candidate-sites", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast.success(`Project "${result.project?.name}" created successfully`);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const review = () => {
    if (decision === "REJECTED" && !rejectionReason.trim()) {
      toast.error("Enter a rejection reason.");
      return;
    }
    reviewMutation.mutate({
      decision,
      rejection_reason: decision === "REJECTED" ? rejectionReason.trim() : null,
    });
  };

  const createProject = () => {
    const region = projectRegion.trim() || site?.region?.trim() || "";
    if (!projectName.trim() || !region) {
      toast.error("Project name and region are required.");
      return;
    }
    projectMutation.mutate({
      name: projectName.trim(),
      description: projectDescription.trim() || null,
      region,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{site?.name || `Site ${candidate.site_id}`}</CardTitle>
            <p className="mt-1 text-xs text-ink-faint">
              Candidate #{candidate.id} · Site #{candidate.site_id}
              {site?.region ? ` · ${site.region}` : ""}
            </p>
          </div>
          <Badge tone="warning">{candidateStatus || "PENDING_REVIEW"}</Badge>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Technology" value={candidate.recommended_technology} />
          <Metric label="Suitability" value={formatNumber(candidate.suitability_score, { maximumFractionDigits: 1 })} />
          <Metric label="Solar" value={formatNumber(candidate.solar_score, { maximumFractionDigits: 1 })} />
          <Metric label="Wind" value={formatNumber(candidate.wind_score, { maximumFractionDigits: 1 })} />
          <Metric label="Hybrid" value={formatNumber(candidate.hybrid_score, { maximumFractionDigits: 1 })} />
        </div>

        <div className="rounded-lg border border-border bg-surface-subtle p-3 text-sm">
          <p className="font-medium text-ink">Recommendation</p>
          <p className="mt-1 text-ink-subtle">{candidate.recommendation_reason}</p>
          <p className="mt-2 text-xs text-ink-faint">
            Confidence: {candidate.confidence || "—"} · Submitted {candidate.created_at ? formatDateTime(candidate.created_at) : "—"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`/sites/${candidate.site_id}`}>
            <Button variant="secondary" size="sm">View site</Button>
          </Link>
          <Link to={`/intelligence?site_id=${candidate.site_id}`}>
            <Button variant="secondary" size="sm">View intelligence</Button>
          </Link>
        </div>

        {isPM && candidateStatus === "PENDING_REVIEW" && (
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-sm font-semibold text-ink">PM Decision</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setDecision("APPROVED")}
                variant={decision === "APPROVED" ? "brand" : "secondary"}
              >
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
              <Button
                size="sm"
                onClick={() => setDecision("REJECTED")}
                variant={decision === "REJECTED" ? "danger" : "secondary"}
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </div>

            {decision === "REJECTED" && (
              <Textarea
                className="mt-3"
                label="Rejection reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this candidate is not approved."
              />
            )}

            {decision && (
              <Button
                className="mt-3"
                size="sm"
                onClick={review}
                isLoading={reviewMutation.isPending}
              >
                Confirm {decision === "APPROVED" ? "approval" : "rejection"}
              </Button>
            )}
          </div>
        )}

        {isPM && candidateStatus === "APPROVED" && (
          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm font-semibold text-ink">Create Project</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Jabalpur Renewable Energy Project" />
              <Input label="Region" value={projectRegion || site?.region || ""} onChange={(e) => setProjectRegion(e.target.value)} placeholder="Jabalpur, Madhya Pradesh" />
            </div>
            <Textarea className="mt-3" label="Description" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Project description" />
            <Button className="mt-3" onClick={createProject} isLoading={projectMutation.isPending}>
              Create project from approved candidate
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-white px-3 py-2">
      <p className="text-[11px] text-ink-faint">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value ?? "—"}</p>
    </div>
  );
}
