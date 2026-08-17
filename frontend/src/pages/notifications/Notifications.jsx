import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Bell, Check, CheckCheck, Trash2, RefreshCw } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { Card } from "../../components/ui/Card.jsx";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../api/notificationApi.js";
import { formatDateTime } from "../../utils/formatters.js";
import { extractErrorMessage } from "../../api/axiosClient.js";
import { getAllSites } from "../../api/siteApi.js";
import { evaluateSiteAlerts } from "../../api/alertApi.js";

export default function Notifications() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const queryClient = useQueryClient();

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ["sites", "alert-evaluation"],
    queryFn: getAllSites,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: () => getMyNotifications(unreadOnly),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const readMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: invalidate,
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      toast.success("All notifications marked as read");
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const alertMutation = useMutation({
    mutationFn: evaluateSiteAlerts,
    onSuccess: (result) => {
      toast.success(
        result.alerts_created > 0
          ? `${result.alerts_created} alert notification${result.alerts_created === 1 ? "" : "s"} created`
          : result.alerts.length > 0
            ? "Alerts found; existing recent notifications were reused"
            : "No active alerts found for this site"
      );
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const unreadCount = data?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
            : "You're all caught up."
        }
        actions={
          <>
            <div className="flex items-center gap-2">
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                disabled={sitesLoading || alertMutation.isPending}
                className="h-9 rounded-md border border-surface-border bg-surface px-3 text-sm text-ink"
                aria-label="Site for alert evaluation"
              >
                <option value="">Select site for alerts</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} · #{site.id}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="sm"
                disabled={!selectedSiteId}
                isLoading={alertMutation.isPending}
                onClick={() => alertMutation.mutate(Number(selectedSiteId))}
              >
                <RefreshCw className="h-4 w-4" /> Check alerts
              </Button>
            </div>
            <Button
              variant={unreadOnly ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setUnreadOnly((v) => !v)}
            >
              {unreadOnly ? "Showing unread" : "Show unread only"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => readAllMutation.mutate()}
              isLoading={readAllMutation.isPending}
            >
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          </>
        }
      />

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {data && data.length === 0 && (
        <EmptyState icon={Bell} title="No notifications" description="You have no notifications right now." />
      )}

      {data && data.length > 0 && (
        <div className="space-y-2">
          {data.map((n) => (
            <Card
              key={n.id}
              className={`flex items-start justify-between gap-3 p-4 ${
                !n.is_read ? "border-l-4 border-l-brand-500" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{n.title}</p>
                  <StatusBadge severity={n.severity}>{n.severity}</StatusBadge>
                  <span className="text-xs text-ink-faint">{n.notification_type}</span>
                </div>
                <p className="text-sm text-ink-subtle">{n.message}</p>
                <p className="mt-1 text-xs text-ink-faint">{formatDateTime(n.created_at)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!n.is_read && (
                  <button
                    onClick={() => readMutation.mutate(n.id)}
                    className="rounded-md p-1.5 text-ink-faint hover:bg-surface-muted hover:text-brand-700"
                    aria-label="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(n.id)}
                  className="rounded-md p-1.5 text-ink-faint hover:bg-danger-50 hover:text-danger-700"
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
