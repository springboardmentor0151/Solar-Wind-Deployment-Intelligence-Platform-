import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  ShieldCheck,
  UserCog,
  Users,
  UserX,
  Database,
  Radio,
  Server,
  ClipboardList,
  Rocket,
} from "lucide-react";
import toast from "react-hot-toast";

import PageHeader from "../../components/ui/PageHeader.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { Table, TBody, Td, Th, THead, Tr } from "../../components/ui/Table.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import * as adminApi from "../../api/adminApi.js";
import { extractErrorMessage } from "../../api/axiosClient.js";


export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [savingUserId, setSavingUserId] = useState(null);

  const overviewQuery = useQuery({
    queryKey: ["admin-overview"],
    queryFn: adminApi.getAdminOverview,
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.getAdminUsers,
  });

  const dataSourcesQuery = useQuery({
    queryKey: ["admin-data-sources"],
    queryFn: adminApi.getAdminDataSources,
    refetchInterval: 60000,
  });

  const healthQuery = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: adminApi.getAdminSystemHealth,
    refetchInterval: 30000,
  });

  const rolesQuery = useQuery({
    queryKey: ["admin-roles"],
    queryFn: adminApi.getAdminRoles,
  });

  const roleOptions = useMemo(
    () => rolesQuery.data || [],
    [rolesQuery.data]
  );

  const refreshAdminData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    ]);
  };

  const handleRoleChange = async (targetUser, event) => {
    const roleId = Number(event.target.value);
    if (!roleId || roleId === targetUser.role_id) return;

    setSavingUserId(targetUser.id);
    try {
      await adminApi.updateUserRole(targetUser.id, roleId);
      toast.success(`Role updated for ${targetUser.full_name}`);
      await refreshAdminData();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSavingUserId(null);
    }
  };

  const handleStatusChange = async (targetUser) => {
    setSavingUserId(targetUser.id);
    try {
      await adminApi.updateUserStatus(
        targetUser.id,
        !targetUser.is_active
      );
      toast.success(
        targetUser.is_active
          ? `${targetUser.full_name} deactivated`
          : `${targetUser.full_name} activated`
      );
      await refreshAdminData();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSavingUserId(null);
    }
  };

  const isLoading =
    overviewQuery.isLoading ||
    usersQuery.isLoading ||
    rolesQuery.isLoading ||
    dataSourcesQuery.isLoading ||
    healthQuery.isLoading;

  const firstError =
    overviewQuery.error || usersQuery.error || rolesQuery.error ||
    dataSourcesQuery.error || healthQuery.error;

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Admin Dashboard"
          description="Control who can access the deployment intelligence workflow."
        />
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (firstError) {
    return (
      <div>
        <PageHeader
          title="Admin Dashboard"
          description="Control who can access the deployment intelligence workflow."
        />
        <ErrorState
          error={firstError}
          onRetry={() => {
            overviewQuery.refetch();
            usersQuery.refetch();
            rolesQuery.refetch();
            dataSourcesQuery.refetch();
            healthQuery.refetch();
          }}
        />
      </div>
    );
  }

  const overview = overviewQuery.data;
  const users = usersQuery.data || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Control who can access the deployment intelligence workflow."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Users" value={overview.total_users} icon={Users} tone="navy" />
        <StatCard label="Active Users" value={overview.active_users} icon={CheckCircle2} tone="brand" />
        <StatCard label="Inactive Users" value={overview.inactive_users} icon={UserX} tone="neutral" />
        <StatCard label="Projects" value={overview.total_projects} icon={Activity} tone="info" />
        <StatCard label="Sites" value={overview.total_sites} icon={ShieldCheck} tone="warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deployment Workflow Overview</CardTitle>
          <Badge tone="info"><ClipboardList className="h-3 w-3" /> Read-only monitoring</Badge>
        </CardHeader>
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <WorkflowMetric label="Pending Candidates" value={overview.pending_candidates} />
            <WorkflowMetric label="Approved Candidates" value={overview.approved_candidates} />
            <WorkflowMetric label="Rejected Candidates" value={overview.rejected_candidates} />
            <WorkflowMetric label="Total Candidates" value={overview.total_candidates} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <WorkflowMetric label="Projects with Deployment History" value={overview.projects_with_deployment_history} />
            <WorkflowMetric label="Active Deployments" value={overview.active_deployments} icon={Rocket} />
            <WorkflowMetric label="Completed Deployments" value={overview.completed_deployments} icon={CheckCircle2} />
          </div>
          <p className="mt-4 text-xs text-ink-faint">
            Admin monitors the workflow but does not replace GIS Analyst, Planner, or Project Manager decisions.
          </p>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Monitoring</CardTitle>
            <Badge tone={healthQuery.data?.overall_status === "Healthy" ? "brand" : "warning"}>
              <Server className="h-3 w-3" /> {healthQuery.data?.overall_status || "Unknown"}
            </Badge>
          </CardHeader>
          <CardBody className="space-y-3">
            <MonitorRow label="Application" status={healthQuery.data?.application} />
            <MonitorRow label="Database" status={healthQuery.data?.database} />
            <MonitorRow label="ML Prediction" status={healthQuery.data?.ml_prediction} />
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Provider checks</p>
              <div className="space-y-2">
                {(healthQuery.data?.checks || []).map((check) => (
                  <div key={check.component} className="flex items-center justify-between text-xs">
                    <span className="text-ink-subtle">{check.component}</span>
                    <Badge tone={check.status === "Healthy" || check.status === "Enabled" || check.status === "Configured" ? "brand" : "warning"}>
                      {check.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Sources</CardTitle>
            <Badge tone="info"><Radio className="h-3 w-3" /> Configuration</Badge>
          </CardHeader>
          <CardBody className="space-y-2">
            {(dataSourcesQuery.data || []).map((source) => (
              <div key={source.name} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{source.name}</p>
                    <p className="text-xs text-ink-faint">{source.category} · {source.provider}</p>
                  </div>
                  <Badge tone={source.configured ? "brand" : "warning"}>
                    {source.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ink-subtle">{source.description}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
          <Badge tone="navy">
            <ShieldCheck className="h-3 w-3" /> {overview.system_status}
          </Badge>
        </CardHeader>
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {overview.roles.map((role) => (
              <div
                key={role.id}
                className="rounded-md border border-border bg-surface-subtle p-4"
              >
                <p className="text-xs text-ink-faint">{role.name}</p>
                <p className="mt-1 text-xl font-semibold text-ink">
                  {role.count}
                </p>
                <p className="mt-1 text-xs text-ink-subtle">
                  user{role.count === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              User &amp; Role Management
            </span>
          </CardTitle>
          <p className="text-xs text-ink-faint">
            Admin controls the role and account status. Users cannot assign
            themselves the Admin role through public registration.
          </p>
        </CardHeader>
        <CardBody>
          <Table>
            <THead>
              <tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </THead>
            <TBody>
              {users.map((targetUser) => {
                const isCurrentUser = targetUser.id === user?.id;
                const isSaving = savingUserId === targetUser.id;

                return (
                  <Tr key={targetUser.id}>
                    <Td>
                      <div>
                        <p className="font-medium">{targetUser.full_name}</p>
                        {isCurrentUser && (
                          <p className="text-xs text-ink-faint">You</p>
                        )}
                      </div>
                    </Td>
                    <Td className="text-ink-subtle">{targetUser.email}</Td>
                    <Td>
                      <Select
                        value={targetUser.role_id}
                        onChange={(event) =>
                          handleRoleChange(targetUser, event)
                        }
                        disabled={isSaving || isCurrentUser}
                        className="min-w-[190px]"
                        aria-label={`Role for ${targetUser.full_name}`}
                      >
                        {roleOptions.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </Select>
                    </Td>
                    <Td>
                      <Badge tone={targetUser.is_active ? "brand" : "danger"}>
                        {targetUser.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <Button
                        variant={targetUser.is_active ? "danger" : "secondary"}
                        size="sm"
                        isLoading={isSaving}
                        disabled={isCurrentUser}
                        onClick={() => handleStatusChange(targetUser)}
                      >
                        {targetUser.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}


function MonitorRow({ label, status }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface-subtle px-3 py-2 text-sm">
      <span className="flex items-center gap-2 text-ink-subtle"><Database className="h-4 w-4" />{label}</span>
      <Badge tone={status === "Healthy" || status === "Online" || status === "Enabled" ? "brand" : "warning"}>{status || "Unknown"}</Badge>
    </div>
  );
}


function WorkflowMetric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-md border border-border bg-surface-subtle p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-ink-faint">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-ink-faint" /> : null}
      </div>
      <p className="mt-1 text-2xl font-semibold text-ink">{value ?? 0}</p>
    </div>
  );
}
