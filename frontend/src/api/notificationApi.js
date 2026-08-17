import axiosClient from "./axiosClient";

// GET /notifications?unread_only=bool -> NotificationResponse[]
export const getMyNotifications = (unreadOnly = false) =>
  axiosClient
    .get("/notifications", { params: { unread_only: unreadOnly } })
    .then((r) => r.data);

// PATCH /notifications/{id}/read -> NotificationResponse
export const markNotificationAsRead = (id) =>
  axiosClient.patch(`/notifications/${id}/read`).then((r) => r.data);

// PATCH /notifications/read-all
export const markAllNotificationsAsRead = () =>
  axiosClient.patch("/notifications/read-all").then((r) => r.data);

// DELETE /notifications/{id}
export const deleteNotification = (id) =>
  axiosClient.delete(`/notifications/${id}`).then((r) => r.data);
