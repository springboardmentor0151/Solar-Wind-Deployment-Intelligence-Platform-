import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ClipboardPlus } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Select from "../../components/ui/Select.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { getAllSites } from "../../api/siteApi.js";
import { createCandidateSite } from "../../api/candidateSiteApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { hasRole, ROLES } from "../../utils/roles.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button.jsx";
import { extractErrorMessage } from "../../api/axiosClient.js";

import PredictionPanel from "../../components/intelligence/PredictionPanel.jsx";
import SuitabilityPanel from "../../components/intelligence/SuitabilityPanel.jsx";
import RecommendationPanel from "../../components/intelligence/RecommendationPanel.jsx";
import OptimizationPanel from "../../components/intelligence/OptimizationPanel.jsx";
import ForecastPanel from "../../components/intelligence/ForecastPanel.jsx";
import InvestmentPanel from "../../components/intelligence/InvestmentPanel.jsx";

const INTELLIGENCE_TABS = [
  { value: "prediction", label: "ML Prediction" },
  { value: "suitability", label: "Suitability" },
  { value: "recommendation", label: "Recommendation" },
  { value: "optimization", label: "Deployment Optimization" },
  { value: "forecast", label: "Energy Forecast" },
  { value: "investment", label: "Investment" },
];

export default function RenewableIntelligence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const siteId = searchParams.get("site_id") || "";
  const [tab, setTab] = useState("prediction");

  const isPlanner = hasRole(user, ROLES.RENEWABLE_ENERGY_PLANNER);
  const isProjectManager = hasRole(user, ROLES.PROJECT_MANAGER);
  const canUseIntelligence = isPlanner || isProjectManager;
  const tabs = isPlanner
    ? INTELLIGENCE_TABS
    : INTELLIGENCE_TABS.filter((item) =>
        ["prediction", "suitability", "recommendation", "optimization", "investment"].includes(item.value)
      );

  const { data: sites, isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: getAllSites,
  });

  const onSelectSite = (value) => {
    if (value) setSearchParams({ site_id: value });
    else setSearchParams({});
  };

  const candidateMutation = useMutation({
    mutationFn: () => createCandidateSite(siteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-sites", "pending"] });
      toast.success("Candidate site submitted for Project Manager review.");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const canSubmitCandidate = isPlanner;

  return (
    <div>
      <PageHeader
        title="Renewable Intelligence"
        description="ML-driven predictions, suitability, deployment, forecasting, and investment insight for a selected site."
      />

      {!canUseIntelligence && (
        <div className="mb-6 rounded-lg border border-warning-200 bg-warning-50 p-4 text-sm text-ink">
          Renewable Intelligence is available to the Renewable Energy Planner and Project Manager. GIS Analysts work through GIS and Environmental Analysis.
        </div>
      )}

      {canUseIntelligence && <div className="mb-6 max-w-sm">
        <Select
          label="Site"
          value={siteId}
          onChange={(e) => onSelectSite(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Select a site to analyze</option>
          {sites?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>}

      {canUseIntelligence && siteId && canSubmitCandidate && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-brand-200 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Ready to submit this site?</p>
            <p className="text-xs text-ink-subtle">
              The backend will re-run the site's intelligence snapshot and create a PENDING_REVIEW candidate for the Project Manager.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => candidateMutation.mutate()}
            isLoading={candidateMutation.isPending}
          >
            <ClipboardPlus className="h-4 w-4" /> Submit as candidate
          </Button>
        </div>
      )}

      {canUseIntelligence && !siteId && (
        <EmptyState
          icon={Sparkles}
          title="Select a site to run intelligence"
          description="Choose a site above to generate ML predictions, suitability scoring, technology recommendations, deployment optimization, energy forecasts, and investment analysis."
        />
      )}

      {canUseIntelligence && siteId && (
        <>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
          <div className="mt-5">
            {tab === "prediction" && <PredictionPanel siteId={siteId} />}
            {tab === "suitability" && <SuitabilityPanel siteId={siteId} />}
            {tab === "recommendation" && <RecommendationPanel siteId={siteId} />}
            {tab === "optimization" && <OptimizationPanel siteId={siteId} />}
            {tab === "forecast" && <ForecastPanel siteId={siteId} />}
            {tab === "investment" && <InvestmentPanel siteId={siteId} />}
          </div>
        </>
      )}
    </div>
  );
}
