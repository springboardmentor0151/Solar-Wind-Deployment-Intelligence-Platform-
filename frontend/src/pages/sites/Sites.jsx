import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, MapPinned } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { Table, THead, Th, TBody, Tr, Td } from "../../components/ui/Table.jsx";
import { getAllSites } from "../../api/siteApi.js";
import { formatCoordinate, formatNumber } from "../../utils/formatters.js";
import { useAuth } from "../../hooks/useAuth.js";
import { hasRole, ROLES } from "../../utils/roles.js";

export default function Sites() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [landUseFilter, setLandUseFilter] = useState("all");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["sites"],
    queryFn: getAllSites,
  });

  const landUseOptions = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((s) => s.land_use).filter(Boolean))];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((s) => {
      const matchesSearch =
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.region?.toLowerCase().includes(q);
      const matchesLandUse =
        landUseFilter === "all" || s.land_use === landUseFilter;
      return matchesSearch && matchesLandUse;
    });
  }, [data, search, landUseFilter]);

  const canCreate = hasRole(user, ROLES.ADMIN, ROLES.PROJECT_MANAGER);

  return (
    <div>
      <PageHeader
        title="Sites"
        description="All candidate and deployed sites with GIS enrichment data."
        actions={
          canCreate && (
            <Link to="/sites/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                New site
              </Button>
            </Link>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Search by name or region"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {landUseOptions.length > 0 && (
          <select
            value={landUseFilter}
            onChange={(e) => setLandUseFilter(e.target.value)}
            className="h-9 rounded-md border border-border bg-white px-3 text-sm text-ink"
          >
            <option value="all">All land use types</option>
            {landUseOptions.map((lu) => (
              <option key={lu} value={lu}>
                {lu}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {data && filtered.length === 0 && (
        <EmptyState
          icon={MapPinned}
          title="No sites found"
          description={
            search || landUseFilter !== "all"
              ? "Try adjusting your filters."
              : "Create a site to trigger automatic GIS enrichment."
          }
        />
      )}

      {data && filtered.length > 0 && (
        <Table>
          <THead>
            <Th>Site</Th>
            <Th>Region</Th>
            <Th>Coordinates</Th>
            <Th>Land use</Th>
            <Th>Elevation</Th>
            <Th>Land area</Th>
          </THead>
          <TBody>
            {filtered.map((site) => (
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
                <Td className="whitespace-nowrap font-mono text-xs text-ink-subtle">
                  {formatCoordinate(site.latitude)}, {formatCoordinate(site.longitude)}
                </Td>
                <Td>
                  {site.land_use ? (
                    <Badge tone="info">{site.land_use}</Badge>
                  ) : (
                    <span className="text-xs text-ink-faint">Pending</span>
                  )}
                </Td>
                <Td className="text-ink-subtle">
                  {site.elevation != null ? `${formatNumber(site.elevation)} m` : "\u2014"}
                </Td>
                <Td className="text-ink-subtle">
                  {site.land_area != null ? `${formatNumber(site.land_area)} ha` : "\u2014"}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
