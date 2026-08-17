import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card, CardBody } from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { createSite, getSite, updateSite } from "../../api/siteApi.js";
import { getProjects } from "../../api/projectApi.js";
import { extractErrorMessage } from "../../api/axiosClient.js";

const schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  region: z.string().optional(),
  land_area: z.coerce.number().optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? undefined : v)),
  existing_infrastructure: z.string().optional(),
  project_id: z.coerce.number().nullable().optional(),
});

export default function SiteForm() {
  const { siteId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(siteId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: getProjects });
  const { data: existing, isLoading: isLoadingExisting } = useQuery({
    queryKey: ["site", siteId],
    queryFn: () => getSite(siteId),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      project_id: searchParams.get("project_id") ? Number(searchParams.get("project_id")) : null,
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        description: existing.description || "",
        latitude: existing.latitude,
        longitude: existing.longitude,
        region: existing.region || "",
        land_area: existing.land_area ?? undefined,
        existing_infrastructure: existing.existing_infrastructure || "",
        project_id: existing.project_id ?? null,
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (values) =>
      isEdit ? updateSite(siteId, values) : createSite(values),
    onSuccess: (site) => {
      toast.success(
        isEdit
          ? "Site updated"
          : "Site created \u2014 GIS enrichment complete"
      );
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["project-sites", String(site.project_id)] });
      navigate(`/sites/${site.id}`);
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  if (isEdit && isLoadingExisting) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        to={isEdit ? `/sites/${siteId}` : "/sites"}
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-ink-faint hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>
      <PageHeader
        title={isEdit ? "Edit site" : "New site"}
        description="Create a project-linked site or a pre-project site. GIS enrichment populates elevation, land use, and proximity metrics from the coordinates."
      />

      <Card>
        <CardBody>
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <Select
              label="Project"
              error={errors.project_id?.message}
              {...register("project_id", { setValueAs: (value) => value === "" ? null : Number(value) })}
            >
              <option value="">Pre-project site (no project yet)</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>

            <Input
              label="Site name"
              placeholder="e.g. Jaisalmer Ridge Plot 4"
              error={errors.name?.message}
              {...register("name")}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                step="any"
                placeholder="26.9157"
                error={errors.latitude?.message}
                {...register("latitude")}
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                placeholder="70.9083"
                error={errors.longitude?.message}
                {...register("longitude")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Region"
                placeholder="e.g. Jaisalmer, Rajasthan"
                error={errors.region?.message}
                {...register("region")}
              />
              <Input
                label="Land area (hectares)"
                type="number"
                step="any"
                placeholder="Optional"
                error={errors.land_area?.message}
                {...register("land_area")}
              />
            </div>

            <Textarea
              label="Existing infrastructure"
              placeholder="Optional notes on infrastructure already present on site"
              error={errors.existing_infrastructure?.message}
              {...register("existing_infrastructure")}
            />

            <Textarea
              label="Description"
              placeholder="Optional context about this site"
              error={errors.description?.message}
              {...register("description")}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSubmitting || mutation.isPending}>
                {isEdit ? "Save changes" : "Create site"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
