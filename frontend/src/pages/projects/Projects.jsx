import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FolderKanban, ArrowRight } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Table, THead, Th, TBody, Tr, Td } from "../../components/ui/Table.jsx";
import { getProjects } from "../../api/projectApi.js";
import { formatDate } from "../../utils/formatters.js";
import { useAuth } from "../../hooks/useAuth.js";
import { hasRole, ROLES } from "../../utils/roles.js";

export default function Projects() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.region?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const canCreate = hasRole(user, ROLES.ADMIN, ROLES.PROJECT_MANAGER);

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Renewable deployment projects and their site portfolios."
        actions={
          canCreate && (
            <Link to="/projects/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                New project
              </Button>
            </Link>
          )
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Search by name or region"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={refetch} />}

      {data && filtered.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={
            search
              ? "Try a different search term."
              : "Create your first project to start deploying sites."
          }
        />
      )}

      {data && filtered.length > 0 && (
        <Table>
          <THead>
            <Th>Name</Th>
            <Th>Region</Th>
            <Th>Created</Th>
            <Th />
          </THead>
          <TBody>
            {filtered.map((project) => (
              <Tr key={project.id}>
                <Td>
                  <Link
                    to={`/projects/${project.id}`}
                    className="font-medium text-ink hover:text-brand-700"
                  >
                    {project.name}
                  </Link>
                  {project.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-ink-faint">
                      {project.description}
                    </p>
                  )}
                </Td>
                <Td className="text-ink-subtle">{project.region}</Td>
                <Td className="text-ink-subtle">{formatDate(project.created_at)}</Td>
                <Td>
                  <Link
                    to={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                  >
                    View <ArrowRight className="h-3 w-3" />
                  </Link>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
