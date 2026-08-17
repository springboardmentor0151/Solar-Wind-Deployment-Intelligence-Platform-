import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { Card, CardBody } from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import {
  createProject,
  getProject,
  updateProject,
} from "../../api/projectApi.js";
import { extractErrorMessage } from "../../api/axiosClient.js";

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  region: z.string().min(1, "Region is required"),
  description: z.string().optional(),
});

export default function ProjectForm() {
  const { projectId } = useParams();
  const isEdit = Boolean(projectId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing, isLoading: isLoadingExisting } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        region: existing.region,
        description: existing.description || "",
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (values) =>
      isEdit ? updateProject(projectId, values) : createProject(values),
    onSuccess: (project) => {
      toast.success(isEdit ? "Project updated" : "Project created");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate(`/projects/${project.id}`);
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
        to={isEdit ? `/projects/${projectId}` : "/projects"}
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-ink-faint hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>
      <PageHeader
        title={isEdit ? "Edit project" : "New project"}
        description="Projects group sites that share a deployment goal or region."
      />

      <Card>
        <CardBody>
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <Input
              label="Project name"
              placeholder="e.g. Rajasthan Solar Corridor"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Region"
              placeholder="e.g. Rajasthan, India"
              error={errors.region?.message}
              {...register("region")}
            />
            <Textarea
              label="Description"
              placeholder="Optional context about this project"
              error={errors.description?.message}
              {...register("description")}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSubmitting || mutation.isPending}>
                {isEdit ? "Save changes" : "Create project"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
